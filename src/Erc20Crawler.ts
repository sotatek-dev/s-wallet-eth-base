import { BaseGateway, getLogger, CCEnv, CustomAssetCrawler, IErc20Token, ICrawlerOptions } from 'sota-common';
import Erc20Gateway from './Erc20Gateway';
import EthGateway from './EthGateway';

const logger = getLogger('Erc20Crawler');

export class Erc20Crawler extends CustomAssetCrawler {
  constructor(options: ICrawlerOptions) {
    const erc20Tokens: IErc20Token[] = CCEnv.getAllErc20Tokens();
    super(erc20Tokens, options);
  }

  public getPlatformGateway(): BaseGateway {
    return EthGateway.getInstance();
  }

  public getGateway(currency: IErc20Token): Erc20Gateway {
    return Erc20Gateway.getCustomInstance(currency);
  }
}

export default Erc20Crawler;
