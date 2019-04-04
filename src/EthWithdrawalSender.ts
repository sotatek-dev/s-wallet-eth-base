import { BaseWithdrawalSender } from 'sota-common';
import { EthGateway } from './EthGateway';

class EthWithdrawalSender extends BaseWithdrawalSender {
  public gatewayClass(): any {
    return EthGateway;
  }
}

export { EthWithdrawalSender };
