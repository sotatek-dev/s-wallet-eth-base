import { NativeAssetCrawler, GatewayRegistry, CurrencyRegistry } from 'sota-common';
import EthGateway from './EthGateway';

export class EthCrawler extends NativeAssetCrawler {
  public getPlatformGateway(): EthGateway {
    return GatewayRegistry.getGatewayInstance(CurrencyRegistry.Ethereum) as EthGateway;
  }
}
