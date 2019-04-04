import { BaseDepositCollector } from 'sota-common';
import { EthGateway } from './EthGateway';
import { EthAddress } from './entities';

class EthDepositCollector extends BaseDepositCollector {
  public gatewayClass(): any {
    return EthGateway;
  }

  public getAddressEntity(): any {
    return EthAddress;
  }

  public getNextCheckAtAmount(): number {
    return 60 * 1000; // 60s
  }
}

export { EthDepositCollector };
