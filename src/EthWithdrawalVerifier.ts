import { BaseWithdrawalVerifier } from 'sota-common';
import { EthGateway } from './EthGateway';

class EthWithdrawalVerifier extends BaseWithdrawalVerifier {
  public gatewayClass(): any {
    return EthGateway;
  }
}

export { EthWithdrawalVerifier };
