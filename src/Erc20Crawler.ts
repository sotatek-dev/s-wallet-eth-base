import {
  BaseGateway,
  getLogger,
  CustomAssetCrawler,
  IErc20Token,
  ICrawlerOptions,
  CurrencyRegistry,
} from 'sota-common';
import Erc20Gateway from './Erc20Gateway';
import EthGateway from './EthGateway';

const logger = getLogger('Erc20Crawler');

export class Erc20Crawler extends CustomAssetCrawler {
  constructor(options: ICrawlerOptions) {
    const erc20Tokens: IErc20Token[] = CurrencyRegistry.getAllErc20Tokens();
    super(options, erc20Tokens);
  }

  public getPlatformGateway(): BaseGateway {
    return EthGateway.getInstance();
  }

  public getGateway(currency: IErc20Token): Erc20Gateway {
    return Erc20Gateway.getCustomInstance(currency);
  }
}

export default Erc20Crawler;
