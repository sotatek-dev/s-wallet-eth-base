import EthGateway from './EthGateway';
import {
  Address,
  BigNumber,
  CurrencyRegistry,
  EnvConfigRegistry,
  GatewayRegistry,
  getLogger,
  IErc20Token,
  IRawTransaction,
  ISignedRawTransaction,
  ISubmittedTransaction,
  TokenType,
  BlockchainPlatform
} from 'sota-common';
import LRU from 'lru-cache';
import * as web3_types from 'web3/eth/types';
import * as web3_types2 from 'web3/types';
import Common, { CustomChain } from '@ethereumjs/common'
import { Transaction as EthereumTx } from '@ethereumjs/tx';
import {infuraWeb3, web3} from './web3';
import ERC20ABI from '../config/abi/erc20.json';
import {Buffer} from 'buffer';

const logger = getLogger('PolygonGateway');

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

GatewayRegistry.registerLazyCreateMethod(CurrencyRegistry.Polygon, () => new PolygonGateway());
export class PolygonGateway extends EthGateway {
  readonly commonOpts: Common;
  constructor() {
    super();
    this._currency = CurrencyRegistry.Polygon;
    this.commonOpts = Common.custom(EnvConfigRegistry.getCustomEnvConfig('NETWORK') !== 'testnet' ? CustomChain.PolygonMainnet : CustomChain.PolygonMumbai);
  }

  public async constructRawTransaction(
    fromAddress: Address,
    toAddress: Address,
    value: BigNumber,
    options: {
      isConsolidate: false;
      destinationTag?: string;
      useLowerNetworkFee?: boolean;
      explicitGasPrice?: number,
      explicitGasLimit?: number,
    }
  ): Promise<IRawTransaction> {
    let amount = web3.utils.toBN(value);
    const nonce = await web3.eth.getTransactionCount(fromAddress);
    let _gasPrice: BigNumber;
    if (options.explicitGasPrice) {
      _gasPrice = new BigNumber(options.explicitGasPrice);
    } else {
      _gasPrice = await this.getGasPrice(options.useLowerNetworkFee);
    }

    /**
     * Workaround for the issue in 2021-06
     * Something went wrong when getting gas price
     * We'll throw error if gas price is not set or zero
     */
    if (!_gasPrice || !_gasPrice.gt(new BigNumber(0))) {
      throw new Error(
        `PolygonGateway::constructRawTransaction could not construct tx, invalid gas price: ${_gasPrice || _gasPrice.toString()}`
      );
    } else {
      logger.debug(`PolygonGateway::constructRawTransaction gasPrice=${_gasPrice.toString()}`);
    }

    const gasPrice = web3.utils.toBN(_gasPrice);

    let gasLimit = web3.utils.toBN(options.isConsolidate ? 21000 : 150000); // Maximum gas allow for Ethereum transaction
    if (options.explicitGasLimit) {
      gasLimit = web3.utils.toBN(options.explicitGasLimit);
    }

    const fee = gasLimit.mul(gasPrice);

    if (options.isConsolidate) {
      amount = amount.sub(fee);
    }

    // Check whether the balance of hot wallet is enough to send
    const balance = web3.utils.toBN((await web3.eth.getBalance(fromAddress)).toString());
    if (balance.lt(amount.add(fee))) {
      throw new Error(
        `PolygonGateway::constructRawTransaction could not construct tx because of insufficient balance: \
         address=${fromAddress}, balance=${balance}, amount=${amount}, fee=${fee}`
      );
    }

    const txParams = {
      gasLimit: web3.utils.toHex(options.isConsolidate ? 21000 : 150000),
      gasPrice: web3.utils.toHex(gasPrice),
      nonce: web3.utils.toHex(nonce),
      to: toAddress,
      value: web3.utils.toHex(amount),
      data: '0x',
    };
    logger.info(`PolygonGateway::constructRawTransaction txParams=${JSON.stringify(txParams)}`);

    const tx = new EthereumTx(txParams, { common: this.commonOpts });

    return {
      txid: `0x${tx.hash().toString('hex')}`,
      unsignedRaw: tx.serialize().toString('hex'),
    };
  }

  public async signRawTransaction(unsignedRaw: string, secret: string): Promise<ISignedRawTransaction> {
    if (secret.startsWith('0x')) {
      secret = secret.substr(2);
    }

    const ethTx = new EthereumTx(EthereumTx.fromSerializedTx(Buffer.from(unsignedRaw, 'hex')), { common: this.commonOpts });
    const privateKey = Buffer.from(secret, 'hex');
    const signedEthTx = ethTx.sign(privateKey);

    return {
      txid: `0x${ethTx.hash().toString('hex')}`,
      signedRaw: signedEthTx.serialize().toString('hex'),
      unsignedRaw,
    };
  }
  public async sendRawTransaction(rawTx: string, retryCount?: number): Promise<ISubmittedTransaction> {
    const ethTx = new EthereumTx(EthereumTx.fromSerializedTx(Buffer.from(rawTx, 'hex')), { common: this.commonOpts });
    let txid = ethTx.hash().toString('hex');
    if (!txid.startsWith('0x')) {
      txid = '0x' + txid;
    }

    if (!retryCount || isNaN(retryCount)) {
      retryCount = 0;
    }

    try {
      const [receipt, infuraReceipt] = await Promise.all([
        web3.eth.sendSignedTransaction(`0x${rawTx}`),
        infuraWeb3.eth.sendSignedTransaction(`0x${rawTx}`),
      ]);
      logger.info(`PolygonGateway::sendRawTransaction infura_txid=${infuraReceipt.transactionHash}`);
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

      return this.sendRawTransaction(rawTx, retryCount + 1);
    }
  }

  public async getErc20TokenInfo(contractAddress: string): Promise<IErc20Token> {
    contractAddress = this.normalizeAddress(contractAddress);
    try {
      const contract = new web3.eth.Contract(ERC20ABI, contractAddress);
      const [networkSymbol, name, decimals] = await Promise.all([
        contract.methods.symbol().call(),
        contract.methods.name().call(),
        contract.methods.decimals().call(),
      ]);

      const symbol = [TokenType.POLERC20, contractAddress].join('.');

      return {
        symbol,
        networkSymbol: networkSymbol.toLowerCase(),
        tokenType: TokenType.POLERC20,
        name,
        platform: BlockchainPlatform.Polygon,
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
}