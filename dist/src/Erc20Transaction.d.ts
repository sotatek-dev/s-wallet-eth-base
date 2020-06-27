import { IErc20Token, BigNumber, MultiEntriesTransaction, IMultiEntriesTxProps } from 'sota-common';
import { Transaction, TransactionReceipt } from 'web3-core';
interface IERC20TransactionProps extends IMultiEntriesTxProps {
    readonly originalTx: Transaction;
}
export declare class Erc20Transaction extends MultiEntriesTransaction {
    readonly currency: IErc20Token;
    readonly receiptStatus: boolean;
    readonly receipt: TransactionReceipt;
    readonly originalTx: Transaction;
    constructor(currency: IErc20Token, txProps: IERC20TransactionProps, receipt: TransactionReceipt);
    getExtraDepositData(): any;
    getNetworkFee(): BigNumber;
}
export default Erc20Transaction;
