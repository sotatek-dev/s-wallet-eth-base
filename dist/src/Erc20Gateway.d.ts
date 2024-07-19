import EthGateway from './EthGateway';
import { IRawTransaction, IErc20Token, Account, Address, BigNumber, AccountBasedGateway, Block, ISignedRawTransaction, TransactionStatus, ISubmittedTransaction } from 'sota-common';
import Erc20Transaction from './Erc20Transaction';
import Common from '@ethereumjs/common';
export declare class Erc20Gateway extends AccountBasedGateway {
    protected _contract: any;
    protected _currency: IErc20Token;
    protected _ethGateway: EthGateway;
    readonly commonOpts: Common;
    constructor(currency: IErc20Token);
    getAverageSeedingFee(): Promise<BigNumber>;
    getAddressBalance(address: string, blockNumber?: number): Promise<BigNumber>;
    constructRawTransaction(fromAddress: Address, toAddress: Address, value: BigNumber, options: {
        useLowerNetworkFee?: boolean;
        explicitGasPrice?: number;
        explicitGasLimit?: number;
    }): Promise<IRawTransaction>;
    signRawTransaction(unsignedRaw: string, secret: string): Promise<ISignedRawTransaction>;
    sendRawTransaction(signedRawTx: string): Promise<ISubmittedTransaction>;
    createAccountAsync(): Promise<Account>;
    getAccountFromPrivateKey(privateKey: string): Promise<Account>;
    getBlockCount(): Promise<number>;
    getTransactionStatus(txid: string): Promise<TransactionStatus>;
    estimateFee(options: {
        isConsolidate: boolean;
        useLowerNetworkFee?: boolean;
    }): Promise<BigNumber>;
    protected _getOneTransaction(txid: string): Promise<Erc20Transaction>;
    protected _getOneBlock(blockNumber: string | number): Promise<Block>;
}
export default Erc20Gateway;
