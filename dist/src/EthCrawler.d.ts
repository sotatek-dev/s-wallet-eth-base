import { BasePlatformCrawler, ICrawlerOptions } from 'sota-common';
export declare class EthCrawler extends BasePlatformCrawler {
    protected _processingTimeout: number;
    constructor(options: ICrawlerOptions);
}
export default EthCrawler;
