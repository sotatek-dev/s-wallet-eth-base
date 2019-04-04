import { BaseDepositCollectorVerifier } from 'sota-common';
import { EthGateway } from './EthGateway';

class EthDepositCollectorVerifier extends BaseDepositCollectorVerifier {
  public gatewayClass(): any {
    return EthGateway;
  }
}

export { EthDepositCollectorVerifier };
