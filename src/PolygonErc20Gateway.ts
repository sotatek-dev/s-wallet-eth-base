import Erc20Gateway from './Erc20Gateway';
import {
  Address,
  BigNumber,
  CurrencyRegistry, EnvConfigRegistry,
  GatewayRegistry,
  getLogger,
  IErc20Token,
  IRawTransaction
} from 'sota-common';
import {PolygonGateway} from './PolygonGateway';
import { Transaction as EthereumTx } from '@ethereumjs/tx';
import {web3} from './web3';
import {inspect} from 'util';
import Common , {CustomChain} from '@ethereumjs/common';

const logger = getLogger('PolygonErc20Gateway');
CurrencyRegistry.onPolERC20TokenRegistered((token) => {
  logger.info(`Register PolErc20Gateway to registry: ${token.symbol}`);
  GatewayRegistry.registerLazyCreateMethod(token, () => new PolygonErc20Gateway(token));
});

export class PolygonErc20Gateway extends Erc20Gateway {
  readonly commonOpts: Common;
  constructor(currency: IErc20Token) {
    super(currency);
    this._ethGateway = GatewayRegistry.getGatewayInstance(CurrencyRegistry.Polygon) as PolygonGateway;
    this.commonOpts = Common.custom(EnvConfigRegistry.getCustomEnvConfig('NETWORK') !== 'testnet' ? CustomChain.PolygonMainnet : CustomChain.PolygonMumbai);
  }

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
    const tx = new EthereumTx(txParams, { common: this.commonOpts });

    return {
      txid: `0x${tx.hash().toString('hex')}`,
      unsignedRaw: tx.serialize().toString('hex'),
    };
  }
}