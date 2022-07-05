import {BlockchainPlatform, getLogger} from 'sota-common';
import {EthWebServer} from './EthWebServer';

const logger = getLogger('PolygonWebServer');

export class PolygonWebServer extends EthWebServer {
  constructor() {
    super(BlockchainPlatform.Polygon);
  }
}