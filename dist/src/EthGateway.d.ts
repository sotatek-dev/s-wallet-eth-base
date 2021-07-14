import * as web3_types from 'web3-eth/types';
import * as web3_types2 from 'web3-core/types';
import { Block, AccountBasedGateway, IRawTransaction, ISignedRawTransaction, ISubmittedTransaction, TransactionStatus, Address, BigNumber, IErc20Token } from 'sota-common';
import { EthTransaction } from './EthTransaction';
export declare class EthGateway extends AccountBasedGateway {
    constructor();
    getGasPrice(useLowerNetworkFee?: boolean): Promise<BigNumber>;
    getParallelNetworkRequestLimit(): number;
    getAverageSeedingFee(): Promise<BigNumber>;
    normalizeAddress(address: string): string;
    createAccountAsync(): Promise<web3_types2.Account>;
    getAccountFromPrivateKey(privateKey: string): Promise<web3_types2.Account>;
    isValidAddressAsync(address: string): Promise<boolean>;
    getAddressBalance(address: string): Promise<BigNumber>;
    getBlockCount(): Promise<number>;
    constructRawTransaction(fromAddress: Address, toAddress: Address, value: BigNumber, options: {
        isConsolidate: boolean;
        destinationTag?: string;
        useLowerNetworkFee?: boolean;
        explicitGasPrice?: number;
        explicitGasLimit?: number;
    }): Promise<IRawTransaction>;
    reconstructRawTx(rawTx: string): IRawTransaction;
    signRawTransaction(unsignedRaw: string, secret: string): Promise<ISignedRawTransaction>;
    sendRawTransaction(rawTx: string, retryCount?: number): Promise<ISubmittedTransaction>;
    getTransactionStatus(txid: string): Promise<TransactionStatus>;
    getRawTransaction(txid: string): Promise<web3_types.Transaction>;
    getRawTransactionReceipt(txid: string): Promise<web3_types2.TransactionReceipt>;
    getErc20TokenInfo(contractAddress: string): Promise<IErc20Token>;
    getChainId(): number;
    getChainName(): string;
    estimateFee(options: {
        isConsolidate: boolean;
        useLowerNetworkFee?: boolean;
    }): Promise<BigNumber>;
    protected _getOneBlock(blockNumber: string | number): Promise<Block>;
    protected _getOneTransaction(txid: string): Promise<EthTransaction>;
}
export default EthGateway;
