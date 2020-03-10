import { BaseWebServer } from 'sota-common';
export declare class EthWebServer extends BaseWebServer {
    constructor();
    protected getERC20TokenInfo(req: any, res: any): Promise<void>;
    protected setup(): void;
}
