import _ from 'lodash';
import * as web3_types from 'web3-eth/types';
import * as web3_types2 from 'web3-core/types';
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
  GatewayRegistry,
  IErc20Token,
  TokenType,
  BlockchainPlatform,
  getRedisClient,
  EnvConfigRegistry,
} from 'sota-common';
import LRU from 'lru-cache';
import { EthTransaction } from './EthTransaction';
import * as EthTypeConverter from './EthTypeConverter';
import { web3, infuraWeb3 } from './web3';
import ERC20ABI from '../config/abi/erc20.json';
import * as ethereumjs from '@ethereumjs/tx';
import Common, {Hardfork} from '@ethereumjs/common';
import {v4} from 'uuid';
interface FeeMarketEIP1559 {
  //the maximum amount that a user is willing to pay for their tx
  readonly maxFeePerGas: BigNumber;

  //the part of the tx fee that goes to the miner
  readonly maxPriorityFeePerGas: BigNumber;
}
const EthereumTx = ethereumjs.FeeMarketEIP1559Transaction;
const logger = getLogger('EthGateway');
const _cacheBlockNumber = {
  value: 0,
  updatedAt: 0,
  isRequesting: false,
};

const _cacheRawTxByHash: LRU<string, web3_types.Transaction> = new LRU({
  max: 1024,
  maxAge: 1000 * 60 * 5,
});
const _cacheRawTxReceipt: LRU<string, web3_types2.TransactionReceipt> = new LRU({
  max: 1024,
  maxAge: 1000 * 60 * 5,
});
const _isRequestingTx: Map<string, boolean> = new Map<string, boolean>();
const _isRequestingReceipt: Map<string, boolean> = new Map<string, boolean>();

GatewayRegistry.registerLazyCreateMethod(CurrencyRegistry.Ethereum, () => new EthGateway());

export class EthGateway extends AccountBasedGateway {
  public constructor() {
    super(CurrencyRegistry.Ethereum);
  }

  public static getInstance(){
    return new EthGateway();
  }

  /**
   * We want to set gas price is a bit higher than the network's average
   * Start with base price which is parse from web3 lib, we choose the smallest one among:
   * - basePrice * 5
   * - basePrice + 20 (gwei)
   * - absolute 120 gwei
   * - if basePrice > 120 gwei, just use the base price (it's crazy if going this far though...)
   */
  public async getGasPrice(useLowerNetworkFee?: boolean): Promise<BigNumber> {
    const baseGasPrice = new BigNumber(await web3.eth.getGasPrice());
    // To prevent drain attack, set max gas price as 120 gwei
    // This value can be override via the config ETH_MAX_GAS_PRICE
    let finalGasPrice: BigNumber = new BigNumber(120000000000);
    const configMaxGasPrice = parseInt(EnvConfigRegistry.getCustomEnvConfig('ETH_MAX_GAS_PRICE'), 10);
    if (!isNaN(configMaxGasPrice)) {
      finalGasPrice = new BigNumber(configMaxGasPrice);
    }

    let multipler = 5;
    if (!!useLowerNetworkFee) {
      multipler = 2;
      const configMultiplerLow = parseInt(EnvConfigRegistry.getCustomEnvConfig('ETH_MAX_GAS_MULTIPLER_LOW'), 10);
      if (!isNaN(configMultiplerLow)) {
        multipler = configMultiplerLow;
      }
    } else {
      const configMultiplerHigh = parseInt(EnvConfigRegistry.getCustomEnvConfig('ETH_MAX_GAS_MULTIPLER_HIGH'), 10);
      if (!isNaN(configMultiplerHigh)) {
        multipler = configMultiplerHigh;
      }
    }

    const multiplyGasPrice = baseGasPrice.multipliedBy(multipler);
    if (finalGasPrice.gt(multiplyGasPrice)) {
      finalGasPrice = multiplyGasPrice;
    }

    // Buffer some gas to make sure transaction can be confirmed faster
    // The default value is 20gwei, and can be overrided via config ETH_MAX_GAS_PLUS
    let plusGas = 20000000000; // 20 gwei
    const configPlusGas = parseInt(EnvConfigRegistry.getCustomEnvConfig('ETH_MAX_GAS_PLUS'), 10);
    if (!isNaN(configPlusGas)) {
      plusGas = configPlusGas;
    }

    const plusGasPrice = baseGasPrice.plus(plusGas);
    if (finalGasPrice.gt(plusGasPrice)) {
      finalGasPrice = plusGasPrice;
    }

    if (baseGasPrice.gt(finalGasPrice)) {
      finalGasPrice = baseGasPrice;
    }

    return finalGasPrice;
  }

  /**
   * Currently maxFeePerGas will be calculated using the formula
   * maxFeePerGas = 2 * baseFeePerGas + maxPriorityFeePerGas
   * - absolute 120 gwei
   * - if maxFeePerGas > 120 gwei, just use maxFeePerGas = 120 gwei
   * 
   * TODO: need to implement a fee oracle based on feeHistory API
   */
  public async suggestFeesForEIP1559(): Promise<FeeMarketEIP1559> {
    // To prevent drain attack, set max fee per gas as 120 gwei
    // This value can be override via the config ETH_MAX_FEE_PER_GAS
    let finalMaxFeePerGas: BigNumber = new BigNumber(120000000000);
    const configMaxFeePerGas = parseInt(EnvConfigRegistry.getCustomEnvConfig('ETH_MAX_FEE_PER_GAS'), 10);
    if (!isNaN(configMaxFeePerGas)) {
      finalMaxFeePerGas = new BigNumber(configMaxFeePerGas);
    }

    const block = await web3.eth.getBlock('latest');
    if (!block['baseFeePerGas']) {
        throw new Error('EthGateway::suggestFeesForEIP1559 not support for pre-eip-1559');
    }
    console.debug(`block latest : ${block.hash}`)
    const baseFeePerGas = new BigNumber(block['baseFeePerGas']);

    let maxPriorityFeePerGas = new BigNumber(await (web3.eth as any).getMaxPriorityFeePerGas());
    if (isNaN(maxPriorityFeePerGas.toNumber()) || maxPriorityFeePerGas.isZero()) {
      throw new Error(
        `EthGateway::constructRawTransaction could not construct tx, invalid maxPriorityFeePerGas: ${maxPriorityFeePerGas || maxPriorityFeePerGas.toString()}`
      );
    }
    // This value can be override via the config ETH_MAX_FEE_PER_GAS_MULTIPLER
    let multipler = 2;
    const cfgMaxFeePterGasMultipler = parseInt(EnvConfigRegistry.getCustomEnvConfig('ETH_MAX_FEE_PER_GAS_MULTIPLER'), 10);
    if (!isNaN(cfgMaxFeePterGasMultipler)) {
        multipler = cfgMaxFeePterGasMultipler;
    }
    
    let maxFeePerGas = baseFeePerGas.multipliedBy(multipler).plus(maxPriorityFeePerGas);
    if (maxFeePerGas.gt(finalMaxFeePerGas)){
      maxFeePerGas = finalMaxFeePerGas;
    }
    
    if (maxPriorityFeePerGas.gt(finalMaxFeePerGas)) {
      maxPriorityFeePerGas = finalMaxFeePerGas;
    }

    return {
        maxFeePerGas,
        maxPriorityFeePerGas
    }
  }

  public getParallelNetworkRequestLimit() {
    return 100;
  }

  public async getAverageSeedingFee(): Promise<BigNumber> {
    const feeMarket = await this.suggestFeesForEIP1559();
    const maxFeePerGas = web3.utils.toBN(feeMarket.maxFeePerGas.toString());
    const gasLimit = web3.utils.toBN(21000); // For ETH transaction 21000 gas is fixed
    const result = maxFeePerGas.mul(gasLimit);
    return new BigNumber(result.toString());
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
  public async createAccountAsync(): Promise<web3_types2.Account> {
    return web3.eth.accounts.create();
  }

  public async getAccountFromPrivateKey(privateKey: string): Promise<web3_types2.Account> {
    if (privateKey.indexOf('0x') < 0) {
      privateKey = '0x' + privateKey;
    }

    if (privateKey.length !== 66) {
      throw new Error(`Invalid private key. Should be 64-byte length.`);
    }

    return web3.eth.accounts.privateKeyToAccount(privateKey);
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
    // Since there're some cases that newest block is not fully broadcasted to the network
    // We decrease latest block number by 1 for safety
    const blockNum = (await web3.eth.getBlockNumber()) - 1;
    const newUpdatedAt = Utils.nowInMillis();
    _cacheBlockNumber.value = blockNum;
    _cacheBlockNumber.updatedAt = newUpdatedAt;
    _cacheBlockNumber.isRequesting = false;
    logger.debug(`EthGateway::getBlockCount value=${blockNum} updatedAt=${newUpdatedAt}`);
    return blockNum;
  }

  /**
   * constructRawTransaction construct raw transaction data without signature
   */
  @implement
  public async constructRawTransaction(
    fromAddress: Address,
    toAddress: Address,
    value: BigNumber,
    options: {
      isConsolidate: boolean;
      destinationTag?: string;
      useLowerNetworkFee?: boolean;
      explicitGasPrice?: number,
      explicitGasLimit?: number,
    }
  ): Promise<IRawTransaction> {
    let amount = web3.utils.toBN(value.toString());
    const nonce = await web3.eth.getTransactionCount(fromAddress);
    const feeMarket = await this.suggestFeesForEIP1559();
    let _maxFeePerGas: BigNumber;
    if (options.explicitGasPrice) {
      _maxFeePerGas = new BigNumber(options.explicitGasPrice);
    } else {
      _maxFeePerGas = feeMarket.maxFeePerGas;
    }

    const maxFeePerGas = web3.utils.toBN(_maxFeePerGas.toString());
    const maxPriorityFeePerGas = web3.utils.toBN(feeMarket.maxPriorityFeePerGas.toString());

    let gasLimit = web3.utils.toBN(options.isConsolidate ? 21000 : 150000); // Maximum gas allow for Ethereum transaction
    if (options.explicitGasLimit) {
      gasLimit = web3.utils.toBN(options.explicitGasLimit);
    }

    const fee = gasLimit.mul(maxFeePerGas);

    if (options.isConsolidate) {
      amount = amount.sub(fee);
    }

    const zero = web3.utils.toBN(0);
    if (amount.lt(zero)) {
      amount = zero;
    }

    // Check whether the balance of hot wallet is enough to send
    const balance = web3.utils.toBN((await web3.eth.getBalance(fromAddress)).toString());
    if (balance.lt(amount.add(fee))) {
      throw new Error(
        `EthGateway::constructRawTransaction could not construct tx because of insufficient balance: \
         address=${fromAddress}, balance=${balance}, amount=${amount}, fee=${fee}`
      );
    }

    const txParams = {
      maxFeePerGas: maxFeePerGas,
      maxPriorityFeePerGas: maxPriorityFeePerGas,
      gasLimit: web3.utils.toHex(gasLimit),
      nonce: web3.utils.toHex(nonce),
      to: toAddress,
      value: web3.utils.toHex(amount),
      data: '0x',
      chainId: this.getChainId(),
    };
    logger.info(`EthGateway::constructRawTransaction txParams=${JSON.stringify(txParams)}`);

    const tx = new EthereumTx(txParams, {
      common: new Common({chain: this.getChainName(), hardfork: Hardfork.London})
    });

    return {
      txid: `0x${tx.getMessageToSign().toString('hex')}`,
      unsignedRaw: tx.serialize().toString('hex'),
    };
  }

  /**
   * Re-construct raw transaction from hex string data
   * @param rawTx
   */
  public reconstructRawTx(rawTx: string): IRawTransaction {
    const tx = EthereumTx.fromSerializedTx(Buffer.from(rawTx, 'hex'));
    return {
      txid: `0x${tx.getMessageToSign().toString('hex')}`,
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

    const ethTx = EthereumTx.fromSerializedTx(Buffer.from(unsignedRaw, 'hex'));
    const privateKey = Buffer.from(secret, 'hex');
    const signedTx = ethTx.sign(privateKey);
    return {
      txid: `0x${signedTx.hash().toString('hex')}`,
      signedRaw: signedTx.serialize().toString('hex'),
      unsignedRaw,
    };
  }

  /**
   * Validate a transaction and broadcast it to the blockchain network
   *
   * @param {String} signedTx: the hex-encoded transaction data
   * @returns {String}: the transaction hash in hex
   */
  public async sendRawTransaction(signedTx: string, retryCount?: number): Promise<ISubmittedTransaction> {
    let rawTx = signedTx;
    if (!rawTx.startsWith('0x')) {
      rawTx = '0x' + rawTx;
    }
    const ethTx = EthereumTx.fromSerializedTx(Buffer.from(signedTx, 'hex'));
    let txid = ethTx.hash().toString('hex');
    if (!txid.startsWith('0x')) {
      txid = '0x' + txid;
    }

    if (!retryCount || isNaN(retryCount)) {
      retryCount = 0;
    }

    try {
      const [receipt, infuraReceipt] = await Promise.all([
        web3.eth.sendSignedTransaction(rawTx),
        infuraWeb3.eth.sendSignedTransaction(rawTx),
      ]);
      logger.info(`EthGateway::sendRawTransaction infura_txid=${infuraReceipt.transactionHash}`);
      return { txid: receipt.transactionHash };
    } catch (e) {
      // Former format of error message when sending duplicate transaction
      if (e.toString().indexOf('known transaction') > -1) {
        logger.warn(e.toString());
        return { txid };
      }

      // New format of error message when sending duplicate transaction
      if (e.toString().indexOf('already known') > -1) {
        logger.warn(e.toString());
        return { txid };
      }

      // The receipt status is failed, but transaction is actually submitted to network successfully
      if (e.toString().indexOf('Transaction has been reverted by the EVM') > -1) {
        logger.warn(e.toString());
        return { txid };
      }

      // If `nonce too low` error is returned. Need to double check whether the transaction is confirmed
      if (e.toString().indexOf('nonce too low') > -1) {
        const tx = await this.getOneTransaction(txid);

        // If transaction is confirmed, it means the broadcast was successful before
        if (tx && tx.confirmations) {
          return { txid };
        }

        throw e;
      }

      if (retryCount + 1 > 5) {
        logger.error(`Too many fails sending txid=${txid} tx=${JSON.stringify(ethTx.toJSON())} err=${e.toString()}`);
        throw e;
      }

      return this.sendRawTransaction(signedTx, retryCount + 1);
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

    const tx = (await this.getOneTransaction(txid)) as EthTransaction;
    if (!tx || !tx.confirmations) {
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
    const key = '_cacheRawTxByHash_' + this.getCurrency().symbol + txid;
    let redisClient;
    let cachedTx: web3_types.Transaction;
    if (!!EnvConfigRegistry.isUsingRedis()) {
      redisClient = getRedisClient();
      const cachedData = await redisClient.get(key);
      if (!!cachedData) {
        cachedTx = JSON.parse(cachedData);
      }
    } else {
      cachedTx = _cacheRawTxByHash.get(key);
    }
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
      const gwName = this.constructor.name;
      throw new Error(`${gwName}::getRawTransaction tx doesn't have block number txid=${txid}`);
    }

    if (redisClient) {
      // redis cache tx in 2mins
      redisClient.setex(key, 120, JSON.stringify(tx));
    } else {
      _cacheRawTxByHash.set(key, tx);
    }
    return tx;
  }

  public async getRawTransactionReceipt(txid: string): Promise<web3_types2.TransactionReceipt> {
    const key = '_cacheRawTxReceipt_' + this.getCurrency().symbol + txid;
    let redisClient;
    let cachedReceipt: web3_types2.TransactionReceipt;
    if (!!EnvConfigRegistry.isUsingRedis()) {
      redisClient = getRedisClient();
      const cachedData = await redisClient.get(key);
      cachedReceipt = JSON.parse(cachedData);
    } else {
      cachedReceipt = _cacheRawTxReceipt.get(key);
    }
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
      const gwName = this.constructor.name;
      throw new Error(`${gwName}::getRawTransactionReceipt could not get receipt txid=${txid}`);
    }

    if (redisClient) {
      // redis cache receipt in 2mins
      redisClient.setex(key, 120, JSON.stringify(receipt));
    } else {
      _cacheRawTxReceipt.set(key, receipt);
    }
    return receipt;
  }

  public async getErc20TokenInfo(contractAddress: string): Promise<IErc20Token> {
    contractAddress = this.normalizeAddress(contractAddress);
    try {
      const contract = new web3.eth.Contract(ERC20ABI as any, contractAddress);
      const [networkSymbol, name, decimals] = await Promise.all([
        contract.methods.symbol().call(),
        contract.methods.name().call(),
        contract.methods.decimals().call(),
      ]);

      const symbol = [TokenType.ERC20, contractAddress].join('.');

      return {
        symbol,
        networkSymbol: networkSymbol.toLowerCase(),
        tokenType: TokenType.ERC20,
        name,
        platform: BlockchainPlatform.Ethereum,
        isNative: false,
        isUTXOBased: false,
        contractAddress,
        decimals,
        humanReadableScale: decimals,
        nativeScale: 0,
        hasMemo: false,
      };
    } catch (e) {
      logger.error(`EthGateway::getErc20TokenInfo could not get info contract=${contractAddress} due to error:`);
      logger.error(e);
      return null;
    }
  }

  public getChainId(): number {
    const config = CurrencyRegistry.getCurrencyConfig(this._currency);
    return Number(config.chainId);
  }

  public getChainName(): string {
    const config = CurrencyRegistry.getCurrencyConfig(this._currency);
    return config.chainName;
  }

  public async estimateFee(options: { isConsolidate: boolean; useLowerNetworkFee?: boolean }): Promise<BigNumber> {
    const feeMarket = await this.suggestFeesForEIP1559();
    const maxFeePerGas = web3.utils.toBN(feeMarket.maxFeePerGas.toString());
    const gasLimit = web3.utils.toBN(options.isConsolidate ? 21000 : 150000); // Maximum gas allow for Ethereum transaction
    const fee = gasLimit.mul(maxFeePerGas);
    return new BigNumber(fee.toString());
  }

  /**
   * Get block details in application-specified format
   *
   * @param {string|number} blockHash: the block hash (or block number in case the parameter is Number)
   * @returns {Block} block: the block detail
   */
  protected async _getOneBlock(blockNumber: string | number): Promise<Block> {
    const block = await web3.eth.getBlock(EthTypeConverter.toBlockType(blockNumber), true);
    if (!block) {
      return null;
    }

    const txids = block.transactions.map(tx => (tx.hash ? tx.hash : tx.toString()));
    return new Block({
      hash: block.hash, 
      number: block.number,
      timestamp: _.toNumber(block.timestamp),
    }, txids);
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
