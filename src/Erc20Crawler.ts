import { EthCrawler } from './EthCrawler';
import {
  getLogger,
  override,
  getListTokenSymbols,
  CrawlerOptions,
  listTokenByType,
  Utils,
  TokenType,
} from 'sota-common';
import Erc20Gateway from './Erc20Gateway';

const logger = getLogger('Erc20Crawler');

export class Erc20Crawler extends EthCrawler {
  private _erc20Gateways: Erc20Gateway[] = [];

  constructor(options: CrawlerOptions) {
    super(options);
    listTokenByType(TokenType.ERC20).forEach(token => {
      const contractAddress = token.contractAddress;
      const gateway = Erc20Gateway.getInstance(contractAddress);
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
