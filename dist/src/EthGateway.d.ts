import * as web3_accounts from 'web3/eth/accounts';
import * as web3_types from 'web3/eth/types';
import * as web3_types2 from 'web3/types';
import { Block, AccountBasedGateway, IRawTransaction, ISignedRawTransaction, ISubmittedTransaction, TransactionStatus, Address, BigNumber, IErc20Token } from 'sota-common';
import { EthTransaction } from './EthTransaction';
export declare class EthGateway extends AccountBasedGateway {
    constructor();
    getGasPrice(useLowerNetworkFee?: boolean): Promise<BigNumber>;
    getParallelNetworkRequestLimit(): number;
    getAverageSeedingFee(): Promise<BigNumber>;
    normalizeAddress(address: string): string;
    createAccountAsync(): Promise<web3_accounts.Account>;
    getAccountFromPrivateKey(privateKey: string): Promise<web3_accounts.Account>;
    isValidAddressAsync(address: string): Promise<boolean>;
    getAddressBalance(address: string): Promise<BigNumber>;
    getBlockCount(): Promise<number>;
    constructRawTransaction(fromAddress: Address, toAddress: Address, value: BigNumber, options: {
        isConsolidate: false;
        destinationTag?: string;
        useLowerNetworkFee?: boolean;
    }): Promise<IRawTransaction>;
    reconstructRawTx(rawTx: string): IRawTransaction;
    signRawTransaction(unsignedRaw: string, secret: string): Promise<ISignedRawTransaction>;
    sendRawTransaction(rawTx: string, retryCount?: number): Promise<ISubmittedTransaction>;
    getTransactionStatus(txid: string): Promise<TransactionStatus>;
    getRawTransaction(txid: string): Promise<web3_types.Transaction>;
    getRawTransactionReceipt(txid: string): Promise<web3_types2.TransactionReceipt>;
    getErc20TokenInfo(contractAddress: string): Promise<IErc20Token>;
    getChainId(): number;
    estimateFee(options: {
        isConsolidate: boolean;
        useLowerNetworkFee?: boolean;
    }): Promise<BigNumber>;
    protected _getOneBlock(blockNumber: string | number): Promise<Block>;
    protected _getOneTransaction(txid: string): Promise<EthTransaction>;
}
export default EthGateway;
