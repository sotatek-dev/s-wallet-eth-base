import { BaseWithdrawalPicker } from 'sota-common';
import { EthGateway } from './EthGateway';

class EthWithdrawalPicker extends BaseWithdrawalPicker {
  public gatewayClass(): any {
    return EthGateway;
  }
}

export { EthWithdrawalPicker };
