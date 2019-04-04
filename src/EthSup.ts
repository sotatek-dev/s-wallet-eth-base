import EthGateway from './EthGateway';
import Erc20Gateway from './Erc20Gateway';
import { BaseGateway } from 'sota-common';

class Sup extends null {
  public static gatewayClass(): any {
    return EthGateway;
  }

  public static tokenGatewayClass(): any {
    return Erc20Gateway;
  }
}
