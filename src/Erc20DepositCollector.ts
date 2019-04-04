import { BaseDepositCollector, getAppId, IWithdrawalWorkerOptions, Currency } from 'sota-common';
import { EthAddress } from './entities';
import EthGateway from './EthGateway';

class Erc20DepositCollector extends BaseDepositCollector {
  constructor(options: IWithdrawalWorkerOptions) {
    super(options);
    this._producerQueue = getAppId() + '_' + this.getBaseProducerQueue() + '_' + Currency.Ethereum;
  }

  public getAddressEntity(): any {
    return EthAddress;
  }

  public getNextCheckAtAmount(): number {
    return 60 * 1000; // 60s
  }

  public gatewayClass(): any {
    return EthGateway;
  }
}

export { Erc20DepositCollector };
