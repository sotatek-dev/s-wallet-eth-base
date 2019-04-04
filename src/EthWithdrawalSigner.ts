import { BaseWithdrawalSigner, Currency, BaseGateway, getTokenBySymbol } from 'sota-common';
import EthGateway from './EthGateway';

class EthWithdrawalSigner extends BaseWithdrawalSigner {
  public gatewayClass(): any {
    return EthGateway;
  }
}

export { EthWithdrawalSigner };
