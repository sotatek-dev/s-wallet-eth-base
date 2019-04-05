import _ from 'lodash';
import * as web3_accounts from 'web3/eth/accounts';
import * as web3_types from 'web3/eth/types';
import * as web3_types2 from 'web3/types';
import {
  BaseGateway,
  Block,
  getLogger,
  IRawTransaction,
  ISignedRawTransaction,
  ISubmittedTransaction,
  IVOut,
  TransactionStatus,
  override,
  Utils,
  Errors,
} from 'sota-common';
import LRU from 'lru-cache';
import { EthTransaction } from './EthTransaction';
import * as EthTypeConverter from './EthTypeConverter';
import { web3 } from './web3';
import EthereumTx from 'ethereumjs-tx';
import Web3 = require('web3');
const logger = getLogger('EthGateway');

const instance: EthGateway = null;
const _cacheBlockNumber = {
  value: 0,
  updatedAt: 0,
  isRequesting: false,
};
const _cacheRawTxByHash: LRU<string, web3_types.Transaction> = new LRU({
  max: 1024 * 1024,
  maxAge: 1000 * 60 * 60,
});
const _cacheRawTxReceipt: LRU<string, web3_types2.TransactionReceipt> = new LRU({
  max: 1024 * 1024,
  maxAge: 1000 * 60 * 60,
});
const _isRequestingTx: Map<string, boolean> = new Map<string, boolean>();
const _isRequestingReceipt: Map<string, boolean> = new Map<string, boolean>();

export class EthGateway extends BaseGateway {
  @override
  public static getInstance(options?: any): EthGateway {
    if (instance) {
      return instance;
    }

    return new EthGateway();
  }

  public constructor() {
    super();

    if (!this.getConfig().apiEndpoint) {
      throw new Error(`Invalid ETH http provider endpoint`);
    }

    web3.setProvider(new Web3.providers.HttpProvider(this.getConfig().apiEndpoint));
  }

  /**
   * Handle more at extended classes
   * @param address
   */
  @override
  public normalizeAddress(address: string) {
    if (!web3.utils.isAddress(address)) {
      throw new Error(`Invalid address: ${address}`);
    }

    return web3.utils.toChecksumAddress(address);
  }

  /**
   * Create a new random account/address
   *
   * @returns {IAccount} the account object
   * TODO: Remove this method. Use createAccountAsync in all cases instead
   */
  public createAccount(): web3_accounts.Account {
    return web3.eth.accounts.create();
  }

  /**
   * Create a new random account/address
   *
   * @returns {IAccount} the account object
   */
  public async createAccountAsync(): Promise<web3_accounts.Account> {
    return web3.eth.accounts.create();
  }

  /**
   * Check whether an address is valid
   * @param address
   */
  public async isValidAddressAsync(address: string): Promise<boolean> {
    return web3.utils.isAddress(address);
  }

  /**
   * Get balance of an address
   *
   * @param {String} address: address that want to query balance
   * @returns {Number}: the current balance of address
   */
  public async getAddressBalance(address: string): Promise<string> {
    const balance = await web3.eth.getBalance(address);
    return balance.toString();
  }

  /**
   * No param
   * Returns the number of blocks in the local best block chain.
   * @returns {number}: the height of latest block on the block chain
   */
  public async getBlockCount(): Promise<number> {
    const now = Utils.nowInMillis();
    const CACHE_TIME = 10000;
    if (_cacheBlockNumber.value > 0 && now - _cacheBlockNumber.updatedAt < CACHE_TIME) {
      return _cacheBlockNumber.value;
    }

    if (_cacheBlockNumber.isRequesting) {
      await Utils.timeout(500);
      return this.getBlockCount();
    }

    _cacheBlockNumber.isRequesting = true;
    const blockNum = await web3.eth.getBlockNumber();
    const newUpdatedAt = Utils.nowInMillis();
    _cacheBlockNumber.value = blockNum;
    _cacheBlockNumber.updatedAt = newUpdatedAt;
    _cacheBlockNumber.isRequesting = false;
    logger.debug(`EthGateway::getBlockCount value=${blockNum} updatedAt=${newUpdatedAt}`);
    return blockNum;
  }

  /**
   * createRawTransaction construct raw transaction data without signature
   */
  public async createRawTransaction(fromAddress: string, vouts: IVOut[]): Promise<IRawTransaction> {
    if (vouts.length !== 1) {
      throw new Error(`Ethereum only accepts 1 vout`);
    }

    const vout = vouts[0];
    const toAddress = vout.toAddress;
    const amount = web3.utils.toBN(vout.amount); // TODO: revise
    const nonce = await web3.eth.getTransactionCount(fromAddress);

    const gasPrice = web3.utils.toBN(await web3.eth.getGasPrice());

    const gasLimit = web3.utils.toBN(21000); // For ETH transaction 21000 gas is fixed
    const fee = gasLimit.mul(gasPrice);

    // Check whether the balance of hot wallet is enough to send
    const balance = web3.utils.toBN((await web3.eth.getBalance(fromAddress)).toString());
    if (balance.lt(amount.add(fee))) {
      throw new Error(
        `Could not construct tx because of insufficient balance: address=${fromAddress}, balance=${balance} amount=${amount}, fee=${fee}`
      );
    }

    const chainId = this.getConfig().chainId;
    const tx = new EthereumTx({
      chainId,
      data: '',
      gasLimit: web3.utils.toHex(21000),
      gasPrice: web3.utils.toHex(gasPrice),
      nonce: web3.utils.toHex(nonce),
      to: toAddress,
      value: web3.utils.toHex(amount),
    });

    return {
      txid: `0x${tx.hash().toString('hex')}`,
      unsignedRaw: tx.serialize().toString('hex'),
    };
  }

  /**
   * Re-construct raw transaction from hex string data
   * @param rawTx
   */
  public reconstructRawTx(rawTx: string): IRawTransaction {
    const tx = new EthereumTx(rawTx);
    return {
      txid: `0x${tx.hash().toString('hex')}`,
      unsignedRaw: tx.serialize().toString('hex'),
    };
  }

  /**
   * sign raw transaction
   * @param rawData
   * @param coinKeys
   */
  public async signRawTxBySinglePrivateKey(unsignedRaw: string, coinKeys: string): Promise<ISignedRawTransaction> {
    if (coinKeys.startsWith('0x')) {
      coinKeys = coinKeys.substr(2);
    }

    const ethTx = new EthereumTx(unsignedRaw);
    const privateKey = Buffer.from(coinKeys, 'hex');
    ethTx.sign(privateKey);

    return {
      txid: `0x${ethTx.hash().toString('hex')}`,
      signedRaw: ethTx.serialize().toString('hex'),
      unsignedRaw,
    };
  }

  /**
   * Validate a transaction and broadcast it to the blockchain network
   *
   * @param {String} rawTx: the hex-encoded transaction data
   * @returns {String}: the transaction hash in hex
   */
  public async sendRawTransaction(rawTx: string): Promise<ISubmittedTransaction> {
    if (!rawTx.startsWith('0x')) {
      rawTx = '0x' + rawTx;
    }

    try {
      const receipt = await web3.eth.sendSignedTransaction(rawTx);
      return {
        txid: receipt.transactionHash,
      };
    } catch (e) {
      if (e.toString().indexOf('known transaction') > -1) {
        logger.warn(e.toString());
        return null;
      }

      if (e.toString().indexOf('Transaction has been reverted by the EVM') > -1) {
        logger.warn(e.toString());
        const ethTx = new EthereumTx(rawTx);
        let txid = ethTx.hash().toString('hex');
        if (!txid.startsWith('0x')) {
          txid = '0x' + txid;
        }
        return {
          txid,
        };
      }

      throw e;
    }
  }

  /**
   * Check whether a transaction is finalized on blockchain network
   *
   * @param {string} txid: the hash/id of transaction need to be checked
   * @returns {string}: the tx status
   */
  public async getTransactionStatus(txid: string): Promise<TransactionStatus> {
    if (!txid.startsWith('0x')) {
      txid = '0x' + txid;
    }

    const tx = (await EthGateway.getInstance().getOneTransaction(txid)) as EthTransaction;
    if (!tx) {
      return TransactionStatus.UNKNOWN;
    }

    if (tx.confirmations < this.getConfig().requiredConfirmations) {
      return TransactionStatus.CONFIRMING;
    }

    if (!tx.receiptStatus) {
      return TransactionStatus.FAILED;
    }

    return TransactionStatus.COMPLETED;
  }

  public async getRawTransaction(txid: string): Promise<web3_types.Transaction> {
    const cachedTx = _cacheRawTxByHash.get(txid);
    if (cachedTx) {
      return cachedTx;
    }

    if (_isRequestingTx.get(txid)) {
      await Utils.timeout(500);
      return this.getRawTransaction(txid);
    }

    _isRequestingTx.set(txid, true);
    const tx = await web3.eth.getTransaction(txid);
    if (!tx) {
      return null;
    }
    if (!tx.blockNumber) {
      throw Errors.apiDataNotUpdated;
    }

    _isRequestingTx.delete(txid);
    _cacheRawTxByHash.set(txid, tx);
    return tx;
  }

  public async getRawTransactionReceipt(txid: string): Promise<web3_types2.TransactionReceipt> {
    const cachedReceipt = _cacheRawTxReceipt.get(txid);
    if (cachedReceipt) {
      return cachedReceipt;
    }

    if (_isRequestingReceipt.get(txid)) {
      await Utils.timeout(500);
      return this.getRawTransactionReceipt(txid);
    }

    _isRequestingReceipt.set(txid, true);
    const receipt = await web3.eth.getTransactionReceipt(txid);
    if (!receipt) {
      throw Errors.apiDataNotUpdated;
    }
    _isRequestingReceipt.delete(txid);

    _cacheRawTxReceipt.set(txid, receipt);
    return receipt;
  }

  /**
   * Get average network fee in wei
   */
  public getAvgFee(): string {
    return Number(2 * 1e15).toString();
  }

  /**
   * Forward transaction with changed amount after subtracting fee
   * @param privateKey
   * @param fromAddress
   * @param toAddress
   * @param amount
   */
  public async forwardTransaction(
    privateKey: string,
    fromAddress: string,
    toAddress: string,
    amount: string
  ): Promise<ISignedRawTransaction> {
    const gasPrice = web3.utils.toBN(await web3.eth.getGasPrice());
    const gasLimit = web3.utils.toBN(21000);
    const fee = gasLimit.mul(gasPrice);
    const forwardAmount = web3.utils
      .toBN(amount.split('.')[0])
      .sub(fee)
      .toString();

    return super._forwardTransaction(privateKey, fromAddress, toAddress, forwardAmount);
  }

  /**
   * Get block details in application-specified format
   *
   * @param {string|number} blockHash: the block hash (or block number in case the parameter is Number)
   * @returns {Block} block: the block detail
   */
  protected async _getOneBlock(blockNumber: string | number): Promise<Block> {
    const block = await web3.eth.getBlock(EthTypeConverter.toBlockType(blockNumber));
    if (!block) {
      return null;
    }

    const txids = block.transactions.map(tx => (tx.hash ? tx.hash : tx.toString()));
    return new Block(Object.assign({}, block), txids);
  }

  /**
   * Get one transaction object
   *
   * @param {String} txid: the transaction hash
   * @returns {EthTransaction}: the transaction details
   */
  protected async _getOneTransaction(txid: string): Promise<EthTransaction> {
    const tx = await this.getRawTransaction(txid);
    if (!tx) {
      return null;
    }

    const [receipt, block, lastNetworkBlockNumber] = await Promise.all([
      this.getRawTransactionReceipt(txid),
      this.getOneBlock(tx.blockNumber),
      this.getBlockCount(),
    ]);

    return new EthTransaction(tx, block, receipt, lastNetworkBlockNumber);
  }
}

export default EthGateway;
