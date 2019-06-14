import { BasePlatformCrawler, BlockchainPlatform, ICrawlerOptions } from 'sota-common';

export class EthCrawler extends BasePlatformCrawler {
  constructor(options: ICrawlerOptions) {
    super(BlockchainPlatform.Ethereum, options);
  }
}

export default EthCrawler;
