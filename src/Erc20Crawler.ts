import {
  BaseGateway,
  getLogger,
  CustomAssetCrawler,
  IErc20Token,
  ICrawlerOptions,
  CurrencyRegistry,
  GatewayRegistry,
} from 'sota-common';
import Erc20Gateway from './Erc20Gateway';
import EthGateway from './EthGateway';

const logger = getLogger('Erc20Crawler');

export class Erc20Crawler extends CustomAssetCrawler {
  constructor(options: ICrawlerOptions) {
    const erc20Tokens: IErc20Token[] = CurrencyRegistry.getAllErc20Tokens();
    super(options, erc20Tokens);
  }

  public getPlatformGateway(): EthGateway {
    return GatewayRegistry.getGatewayInstance(CurrencyRegistry.Ethereum) as EthGateway;
  }

  public getGateway(token: IErc20Token): Erc20Gateway {
    return GatewayRegistry.getGatewayInstance(token) as Erc20Gateway;
  }
}

export default Erc20Crawler;
