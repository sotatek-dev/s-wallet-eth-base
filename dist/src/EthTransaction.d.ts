import { BlockHeader, BigNumber, AccountBasedTransaction } from 'sota-common';
import { Transaction, TransactionReceipt } from 'web3-core';
export declare class EthTransaction extends AccountBasedTransaction {
    readonly receiptStatus: boolean;
    readonly block: BlockHeader;
    readonly receipt: TransactionReceipt;
    readonly originalTx: Transaction;
    constructor(tx: Transaction, block: BlockHeader, receipt: TransactionReceipt, lastNetworkBlockNumber: number);
    getExtraDepositData(): any;
    getNetworkFee(): BigNumber;
}
export default EthTransaction;
