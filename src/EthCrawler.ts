import { BaseCrawler } from 'sota-common';
import EthGateway from './EthGateway';

class EthCrawler extends BaseCrawler {
  public getFirstBlockNumberToCrawl(): number {
    return 3460000;
  }

  public getAverageBlockTime(): number {
    return 15000;
  }

  public getRequiredConfirmations(): number {
    return 6;
  }

  public gatewayClass(): any {
    return EthGateway;
  }
}

export { EthCrawler };
