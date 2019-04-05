import { EthCrawler } from './EthCrawler';
import {
  BaseGateway,
  getLogger,
  override,
  getListTokenSymbols,
  CrawlerOptions,
  listTokenByType,
  Utils,
  TokenType,
  getType,
  getGateway,
} from 'sota-common';

const logger = getLogger('Erc20Crawler');

export class Erc20Crawler extends EthCrawler {
  public _erc20Gateways: BaseGateway[] = [];

  constructor(options: CrawlerOptions) {
    super(options);
    listTokenByType(getType() as TokenType).forEach(token => {
      const gateway = getGateway(token.symbol);
      this._erc20Gateways.push(gateway);
    });
  }

  /**
   * Process several blocks in one go. Just use single database transaction
   * @param {number} fromBlockNumber - begin of crawling blocks range
   * @param {number} toBlockNumber - end of crawling blocks range
   * @param {number} latestNetworkBlock - recent height of blockchain in the network
   *
   * @returns {number} the highest block that is considered as confirmed
   */
  @override
  public async processBlocks(
    fromBlockNumber: number,
    toBlockNumber: number,
    latestNetworkBlock: number
  ): Promise<void> {
    const symbol = getListTokenSymbols().tokenSymbols;
    logger.info(`${symbol}::processBlocks BEGIN: ${fromBlockNumber}→${toBlockNumber} / ${latestNetworkBlock}`);

    await Utils.PromiseAll(
      this._erc20Gateways.map(async gateway => {
        // Get all transactions in the block
        const allTxs = await gateway.getMultiBlocksTransactions(fromBlockNumber, toBlockNumber);

        // Use callback to process all crawled transactions
        await this._options.onCrawlingTxs(this, allTxs);
      })
    );

    logger.info(`${symbol}::_processBlocks FINISH: ${fromBlockNumber}→${toBlockNumber}`);
  }
}

export default Erc20Crawler;
