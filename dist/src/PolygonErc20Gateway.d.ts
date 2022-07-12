import Erc20Gateway from './Erc20Gateway';
import { Address, BigNumber, IErc20Token, IRawTransaction } from 'sota-common';
import Common from '@ethereumjs/common';
export declare class PolygonErc20Gateway extends Erc20Gateway {
    readonly commonOpts: Common;
    constructor(currency: IErc20Token);
    constructRawTransaction(fromAddress: Address, toAddress: Address, value: BigNumber, options: {
        useLowerNetworkFee?: boolean;
        explicitGasPrice?: number;
        explicitGasLimit?: number;
    }): Promise<IRawTransaction>;
}
