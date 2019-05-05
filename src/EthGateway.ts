import _ from 'lodash';
import * as web3_accounts from 'web3/eth/accounts';
import * as web3_types from 'web3/eth/types';
import * as web3_types2 from 'web3/types';
import {
  Block,
  AccountBasedGateway,
  getLogger,
  IRawTransaction,
  ISignedRawTransaction,
  ISubmittedTransaction,
  TransactionStatus,
  override,
  Utils,
  Address,
  BigNumber,
  implement,
  CurrencyRegistry,
} from 'sota-common';
import LRU from 'lru-cache';
import { EthTransaction } from './EthTransaction';
import * as EthTypeConverter from './EthTypeConverter';
import { web3 } from './web3';
import EthereumTx from 'ethereumjs-tx';

const logger = getLogger('EthGateway');
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

let instance: EthGateway = null;
export class EthGateway extends AccountBasedGateway {
  @override
  public static getInstance(): EthGateway {
    if (!instance) {
      instance = new EthGateway();
    }

    return instance;
  }

  public constructor() {
    const currency = CurrencyRegistry.Ethereum;
    super(currency);
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
  public async getAddressBalance(address: string): Promise<BigNumber> {
    const balance = await web3.eth.getBalance(address);
    return new BigNumber(balance.toString());
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
  @implement
  public async constructRawTransaction(
    fromAddress: Address,
    toAddress: Address,
    value: BigNumber
  ): Promise<IRawTransaction> {
    const amount = web3.utils.toBN(value);
    const nonce = await web3.eth.getTransactionCount(fromAddress);
    const gasPrice = web3.utils.toBN(await web3.eth.getGasPrice());
    const gasLimit = web3.utils.toBN(21000); // For ETH transaction 21000 gas is fixed
    const fee = gasLimit.mul(gasPrice);

    // Check whether the balance of hot wallet is enough to send
    const balance = web3.utils.toBN((await web3.eth.getBalance(fromAddress)).toString());
    if (balance.lt(amount.add(fee))) {
      throw new Error(
        `EthGateway::constructRawTransaction could not construct tx because of insufficient balance: \
         address=${fromAddress}, balance=${balance}, amount=${amount}, fee=${fee}`
      );
    }

    const tx = new EthereumTx({
      chainId: this._getChainId(),
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
  public async signRawTransaction(unsignedRaw: string, secret: string): Promise<ISignedRawTransaction> {
    if (secret.startsWith('0x')) {
      secret = secret.substr(2);
    }

    const ethTx = new EthereumTx(unsignedRaw);
    const privateKey = Buffer.from(secret, 'hex');
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

    if (tx.confirmations < CurrencyRegistry.getCurrencyConfig(this._currency).requiredConfirmations) {
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
    _isRequestingTx.delete(txid);

    if (!tx) {
      return null;
    }
    if (!tx.blockNumber) {
      throw new Error(`getRawTransaction Something went wrong. tx doesn't have block number: ${txid}`);
    }

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
    _isRequestingReceipt.delete(txid);
    if (!receipt) {
      logger.error(`Could not get receipt of tx: txid=${txid}`);
      throw new Error(`getRawTransactionReceipt Something went wrong. tx doesn't have block number: ${txid}`);
    }

    _cacheRawTxReceipt.set(txid, receipt);
    return receipt;
  }

  // TODO: Revive me
  // public async getCurrencyInfo(address: string): Promise<ITokenRemake> {
  //   const handledAddress = this.normalizeAddress(address);
  //   try {
  //     const contract: Contract = new web3.eth.Contract(ERC20ABI, handledAddress);
  //     const decimal = await (contract as any).methods.decimals().call();
  //     const symbol = (await (contract as any).methods.symbol().call()).toLowerCase();
  //     const name = await (contract as any).methods.name().call();
  //     const result = {
  //       family: CCEnv.getCurrency(),
  //       symbol,
  //       networkSymbol: symbol,
  //       minimumDeposit: '0.05',
  //       type: CCEnv.getType(),
  //       name,
  //       decimal,
  //       precision: 0,
  //       contractAddress: handledAddress,
  //       subversionName: '.*',
  //       network: CCEnv.getNetwork(),
  //       hasMemo: 0,
  //     };
  //     return result;
  //   } catch (e) {
  //     logger.error(e);
  //     return null;
  //   }
  // }

  protected _getChainId(): number {
    throw new Error(`TODO: Implement me`);
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
