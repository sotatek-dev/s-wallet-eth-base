import { BaseDepositCollectorVerifier } from 'sota-common';
import { EthGateway } from './EthGateway';

class EthInternalTransferVerifier extends BaseDepositCollectorVerifier {
  public gatewayClass(): any {
    return EthGateway;
  }
}

export { EthInternalTransferVerifier };
