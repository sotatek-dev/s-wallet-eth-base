import {
  NativeAssetCrawler,
  GatewayRegistry,
  CurrencyRegistry,
  ICrawlerOptions,
  BlockchainPlatform,
} from 'sota-common';
import EthGateway from './EthGateway';

export class EthCrawler extends NativeAssetCrawler {
  constructor(options: ICrawlerOptions) {
    super(BlockchainPlatform.Ethereum, options);
  }

  public getPlatformGateway(): EthGateway {
    return GatewayRegistry.getGatewayInstance(CurrencyRegistry.Ethereum) as EthGateway;
  }
}
