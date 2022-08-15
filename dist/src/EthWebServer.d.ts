import { BaseWebServer, BlockchainPlatform } from 'sota-common';
export declare class EthWebServer extends BaseWebServer {
    constructor(platform?: BlockchainPlatform);
    protected getERC20TokenInfo(req: any, res: any): Promise<void>;
    protected setup(): void;
}
