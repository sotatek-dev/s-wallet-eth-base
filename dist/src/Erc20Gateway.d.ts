import EthGateway from './EthGateway';
import Contract from 'web3/eth/contract';
import { IRawTransaction, IErc20Token, Account, Address, BigNumber, AccountBasedGateway, Block, ISignedRawTransaction, TransactionStatus, ISubmittedTransaction } from 'sota-common';
import Erc20Transaction from './Erc20Transaction';
export declare class Erc20Gateway extends AccountBasedGateway {
    protected _contract: Contract;
    protected _currency: IErc20Token;
    protected _ethGateway: EthGateway;
    constructor(currency: IErc20Token);
    getAverageSeedingFee(): Promise<BigNumber>;
    getAddressBalance(address: string): Promise<BigNumber>;
    constructRawTransaction(fromAddress: Address, toAddress: Address, value: BigNumber, options: {
        useLowerNetworkFee?: boolean;
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
