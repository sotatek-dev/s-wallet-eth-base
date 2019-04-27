import { NativeAssetCrawler } from 'sota-common';
import EthGateway from './EthGateway';

export class EthCrawler extends NativeAssetCrawler {
  public getPlatformGateway(): EthGateway {
    return EthGateway.getInstance();
  }
}
