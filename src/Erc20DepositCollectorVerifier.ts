import { BaseDepositCollectorVerifier } from 'sota-common';
import { EthGateway } from './EthGateway';

class Erc20DepositCollectorVerifier extends BaseDepositCollectorVerifier {
  public gatewayClass(): any {
    return EthGateway;
  }
}

export { Erc20DepositCollectorVerifier };
