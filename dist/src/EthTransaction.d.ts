import { BlockHeader, BigNumber, AccountBasedTransaction } from 'sota-common';
import * as web3_types from 'web3/types';
import * as eth_types from 'web3/eth/types';
export declare class EthTransaction extends AccountBasedTransaction {
    readonly receiptStatus: boolean;
    readonly block: BlockHeader;
    readonly receipt: web3_types.TransactionReceipt;
    readonly originalTx: eth_types.Transaction;
    constructor(tx: eth_types.Transaction, block: BlockHeader, receipt: web3_types.TransactionReceipt, lastNetworkBlockNumber: number);
    getExtraDepositData(): any;
    getNetworkFee(): BigNumber;
}
export default EthTransaction;
