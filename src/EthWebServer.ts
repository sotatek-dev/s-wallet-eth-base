import util from 'util';
import { BaseWebServer, BlockchainPlatform, override, getLogger, EnvConfigRegistry, WebServiceStatus } from 'sota-common';
import EthGateway from './EthGateway';
import axios from 'axios';

const logger = getLogger('EthWebServer');
const GET_LATEST_BLOCK_EXTERNAL_API = 'https://api.blockcypher.com/v1/eth/main';
const SAFETY_THRESHOLD = 1440 // 6h/eth-average-block-time(15s)

export class EthWebServer extends BaseWebServer {
  public constructor() {
    super(BlockchainPlatform.Ethereum);
  }

  protected async getERC20TokenInfo(req: any, res: any) {
    const contractAddress = req.params.contract_address;
    const gateway = (await this.getGateway(this._currency.symbol)) as EthGateway;
    const tokenInfo = await gateway.getErc20TokenInfo(contractAddress);
    const result = Object.assign({}, tokenInfo, { network: EnvConfigRegistry.getNetwork() });
    res.json(result);
  }

  @override
  protected async checkHealth() {
    const gateway = this.getGateway(this._currency.symbol) as EthGateway;

    try {
      const externalLatestBlockInfo = await axios.get(GET_LATEST_BLOCK_EXTERNAL_API);
      const externalLatestBlockNum = externalLatestBlockInfo.data.height;
      const localLatestBlockNum = await gateway.getBlockCount();

      const differentBlockNum = externalLatestBlockNum - localLatestBlockNum;
      const serviceReliability = (differentBlockNum < SAFETY_THRESHOLD) ? true : false;
      const status = (differentBlockNum < SAFETY_THRESHOLD) ? WebServiceStatus.OK : WebServiceStatus.WARN;

      return { webService: { status, serviceReliability, differentBlockNum } };
    } catch (e) {
      return { webService: { status: WebServiceStatus.WARN, description: e.message, } };
    }
  }

  @override
  protected setup() {
    super.setup();

    this.app.get('/api/currency_config/:contract_address', async (req, res) => {
      try {
        await this.getERC20TokenInfo(req, res);
      } catch (e) {
        logger.error(`err=${util.inspect(e)}`);
        res.status(500).json({ error: e.message || e.toString() });
      }
    });
  }
}
