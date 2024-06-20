import EthGateway from './EthGateway';
import { web3 } from './web3';
import _ from 'lodash';
import * as ethereumjs from 'ethereumjs-tx';
import {
  IRawTransaction,
  IErc20Token,
  Account,
  Address,
  BigNumber,
  CurrencyRegistry,
  GatewayRegistry,
  AccountBasedGateway,
  Block,
  ISignedRawTransaction,
  TransactionStatus,
  ISubmittedTransaction,
  getLogger,
  implement,
  IMultiEntriesTxEntry,
  EnvConfigRegistry,
} from 'sota-common';
import { inspect } from 'util';
import Erc20Transaction from './Erc20Transaction';
import ERC20ABI from '../config/abi/erc20.json';
import Common, { CustomChain } from '@ethereumjs/common';
import { Transaction } from '@ethereumjs/tx';
const logger = getLogger('Erc20Gateway');
const EthereumTx = ethereumjs.Transaction;

CurrencyRegistry.onERC20TokenRegistered((token: IErc20Token) => {
  logger.info(`Register Erc20Gateway to the registry: ${token.symbol}`);
  GatewayRegistry.registerLazyCreateMethod(token, () => new Erc20Gateway(token));
});

const EthereumMainnet = {
  name: 'mainnet',
  chainId: 1,
  networkId: 1,
}
const EthereumTestnetSepolia = {
  name: 'sepolia',
  chainId: 11155111,
  networkId: 11155111,
}
export class Erc20Gateway extends AccountBasedGateway {
  protected _contract: any;
  protected _currency: IErc20Token;
  protected _ethGateway: EthGateway;
  readonly commonOpts: Common;

  public constructor(currency: IErc20Token) {
    super(currency);
    this._contract = new web3.eth.Contract(ERC20ABI, currency.contractAddress);
    this._ethGateway = GatewayRegistry.getGatewayInstance(CurrencyRegistry.Ethereum) as EthGateway;
    this.commonOpts = Common.custom(EnvConfigRegistry.getCustomEnvConfig('NETWORK') !== 'testnet' ? EthereumMainnet : EthereumTestnetSepolia);
  }

  public async getAverageSeedingFee(): Promise<BigNumber> {
    throw new Error('Method not implemented.');
  }

  @implement
  public async getAddressBalance(address: string, blockNumber?: number): Promise<BigNumber> {
    const balance = await this._contract.methods.balanceOf(address).call({}, blockNumber);
    return new BigNumber(balance.toString());
  }

  @implement
  public async constructRawTransaction(
    fromAddress: Address,
    toAddress: Address,
    value: BigNumber,
    options: {
      useLowerNetworkFee?: boolean;
      explicitGasPrice?: number;
      explicitGasLimit?: number;
    }
  ): Promise<IRawTransaction> {
    const amount = web3.utils.toBN(value);
    const nonce = await web3.eth.getTransactionCount(fromAddress);
    let _gasPrice: BigNumber;
    if (options.explicitGasPrice) {
      _gasPrice = new BigNumber(options.explicitGasPrice);
    } else {
      _gasPrice = await this._ethGateway.getGasPrice(options.useLowerNetworkFee);
    }

    /**
     * Workaround for the issue in 2021-06
     * Something went wrong when getting gas price
     * We'll throw error if gas price is not set or zero
     */
    let minGasPrice = new BigNumber(1000000000); // Sometimes gas price is 5wei which is very weird. This set default min gas price is 1 gwei
    const configMinGasPrice = parseInt(EnvConfigRegistry.getCustomEnvConfig('ETH_MIN_GAS_PRICE'), 10);
    if (!isNaN(configMinGasPrice)) {
      minGasPrice = new BigNumber(configMinGasPrice);
    }

    if (!_gasPrice || !_gasPrice.gt(minGasPrice)) {
      throw new Error(
        `Erc20Gateway::constructRawTransaction could not construct tx, invalid gas price: ${_gasPrice || _gasPrice.toString()}`
      );
    } else {
      logger.debug(`Erc20Gateway::constructRawTransaction gasPrice=${_gasPrice.toString()}`);
    }

    const gasPrice = web3.utils.toBN(_gasPrice);

    let _gasLimit: number;
    if (options.explicitGasLimit) {
      _gasLimit = options.explicitGasLimit;
    } else {
      // The error can be thrown while gas is being estimated
      try {
        _gasLimit = await this._contract.methods
          .transfer(toAddress, amount.toString())
          .estimateGas({ from: fromAddress });
      } catch (e) {
        logger.error(`Erc20Gateway::constructRawTransaction cannot estimate gas for transfer method error=${inspect(e)}`);
        throw new Error(`Erc20Gateway::constructRawTransaction cannot estimate gas for transfer method, error=${e.toString()}`);
      }

      if (_gasLimit < 150000) {
        _gasLimit = 150000;
      }

      // Fix maximum gas limit is 300,000 to prevent draining attack
      if (_gasLimit > 300000) {
        _gasLimit = 300000;
      }
    }

    const gasLimit = web3.utils.toBN(_gasLimit);
    const fee = gasLimit.mul(gasPrice);

    // Check whether the balance of hot wallet is enough to send
    const ethBalance = web3.utils.toBN((await web3.eth.getBalance(fromAddress)).toString());
    const balance = web3.utils.toBN(await this.getAddressBalance(fromAddress));
    if (balance.lt(amount)) {
      throw new Error(
        `Erc20Gateway::constructRawTransaction Could not construct tx because of insufficient balance: address=${fromAddress}, amount=${amount}, fee=${fee}`
      );
    }

    if (ethBalance.lt(fee)) {
      throw new Error(
        `Erc20Gateway::constructRawTransaction Could not construct tx because of lacking fee: address=${fromAddress}, fee=${fee}, ethBalance=${ethBalance}`
      );
    }

    const txParams = {
      data: this._contract.methods.transfer(toAddress, amount.toString()).encodeABI(),
      gasLimit: web3.utils.toHex(gasLimit),
      gasPrice: web3.utils.toHex(gasPrice),
      nonce: web3.utils.toHex(nonce),
      to: this._currency.contractAddress,
      value: web3.utils.toHex(0),
    };
    logger.info(`Erc20Gateway::constructRawTransaction txParams=${JSON.stringify(txParams)}`);

    const tx = new Transaction(txParams, { common: this.commonOpts });

    return {
      txid: `0x${tx.hash().toString('hex')}`,
      unsignedRaw: tx.serialize().toString('hex'),
    };
  }

  // Wrap ETH gateway
  public async signRawTransaction(unsignedRaw: string, secret: string): Promise<ISignedRawTransaction> {
    return this._ethGateway.signRawTransaction(unsignedRaw, secret);
  }

  // Wrap ETH gateway
  public async sendRawTransaction(signedRawTx: string): Promise<ISubmittedTransaction> {
    return this._ethGateway.sendRawTransaction(signedRawTx);
  }

  public async createAccountAsync(): Promise<Account> {
    return this._ethGateway.createAccountAsync();
  }

  public async getAccountFromPrivateKey(privateKey: string): Promise<Account> {
    return this._ethGateway.getAccountFromPrivateKey(privateKey);
  }

  public async getBlockCount(): Promise<number> {
    return this._ethGateway.getBlockCount();
  }

  public getTransactionStatus(txid: string): Promise<TransactionStatus> {
    return this._ethGateway.getTransactionStatus(txid);
  }

  public async estimateFee(options: { isConsolidate: boolean; useLowerNetworkFee?: boolean }): Promise<BigNumber> {
    return await this._ethGateway.estimateFee({
      isConsolidate: options.isConsolidate,
      useLowerNetworkFee: options.useLowerNetworkFee,
    });
  }

  protected async _getOneTransaction(txid: string): Promise<Erc20Transaction> {
    const tx = await this._ethGateway.getRawTransaction(txid);
    const [block, receipt, blockHeight] = await Promise.all([
      this.getOneBlock(tx.blockNumber),
      this._ethGateway.getRawTransactionReceipt(txid),
      this.getBlockCount(),
    ]);

    const logs = _.filter(
      receipt.logs,
      l =>
        l.address.toLowerCase() === this._currency.contractAddress.toLocaleLowerCase() &&
        l.topics[0] &&
        l.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
    );

    // Cannot find any transfer log event
    // Just treat the transaction as failed
    if (!logs || !logs.length) {
      return null;
    }

    const inputs = _.find(ERC20ABI, abi => abi.type === 'event' && abi.name === 'Transfer').inputs;

    const vIns: IMultiEntriesTxEntry[] = [];
    const vOuts: IMultiEntriesTxEntry[] = [];
    logs.forEach(log => {
      try {
        const parsedLog = web3.eth.abi.decodeLog(inputs, log.data, log.topics.slice(1)) as any;
        vIns.push({
          address: parsedLog.from,
          currency: this._currency,
          amount: parsedLog.value,
        });
        vOuts.push({
          address: parsedLog.to,
          currency: this._currency,
          amount: parsedLog.value,
        });
      } catch (e) {
        throw new Error(`Cannot decode log for transaction: ${txid} of contract ${this._currency.contractAddress}`);
      }
    });

    return new Erc20Transaction(
      this._currency,
      {
        originalTx: tx,
        txid,
        inputs: vIns,
        outputs: vOuts,
        block,
        lastNetworkBlockNumber: blockHeight,
      },
      receipt
    );
  }

  /**
   * Get block details in application-specified format
   *
   * @param {string|number} blockHash: the block hash (or block number in case the parameter is Number)
   * @returns {Block} block: the block detail
   */
  protected async _getOneBlock(blockNumber: string | number): Promise<Block> {
    return this._ethGateway.getOneBlock(blockNumber);
  }
}

export default Erc20Gateway;
