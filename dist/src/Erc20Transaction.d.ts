import { IErc20Token, BigNumber, MultiEntriesTransaction, IMultiEntriesTxProps } from 'sota-common';
import * as web3_types from 'web3/types';
import * as eth_types from 'web3/eth/types';
interface IERC20TransactionProps extends IMultiEntriesTxProps {
    readonly originalTx: eth_types.Transaction;
}
export declare class Erc20Transaction extends MultiEntriesTransaction {
    readonly currency: IErc20Token;
    readonly receiptStatus: boolean;
    readonly receipt: web3_types.TransactionReceipt;
    readonly originalTx: eth_types.Transaction;
    constructor(currency: IErc20Token, txProps: IERC20TransactionProps, receipt: web3_types.TransactionReceipt);
    getExtraDepositData(): any;
    getNetworkFee(): BigNumber;
}
export default Erc20Transaction;
