import EthGateway from './EthGateway';
import { Address, BigNumber, IRawTransaction, ISignedRawTransaction, ISubmittedTransaction } from 'sota-common';
import Common from '@ethereumjs/common';
export declare class PolygonGateway extends EthGateway {
    readonly commonOpts: Common;
    constructor();
    constructRawTransaction(fromAddress: Address, toAddress: Address, value: BigNumber, options: {
        isConsolidate: false;
        destinationTag?: string;
        useLowerNetworkFee?: boolean;
        explicitGasPrice?: number;
        explicitGasLimit?: number;
    }): Promise<IRawTransaction>;
    signRawTransaction(unsignedRaw: string, secret: string): Promise<ISignedRawTransaction>;
    sendRawTransaction(rawTx: string, retryCount?: number): Promise<ISubmittedTransaction>;
}
