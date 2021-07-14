import { IErc20Token, BigNumber, MultiEntriesTransaction, IMultiEntriesTxProps } from 'sota-common';
import * as web3_types from 'web3-core/types';
import * as eth_types from 'web3/eth/types';
import { web3 } from './web3';

interface IERC20TransactionProps extends IMultiEntriesTxProps {
  readonly originalTx: eth_types.Transaction;
}

export class Erc20Transaction extends MultiEntriesTransaction {
  public readonly currency: IErc20Token;
  public readonly receiptStatus: boolean;
  public readonly receipt: web3_types.TransactionReceipt;
  public readonly originalTx: eth_types.Transaction;

  constructor(currency: IErc20Token, txProps: IERC20TransactionProps, receipt: web3_types.TransactionReceipt) {
    if (!web3.utils.isAddress(currency.contractAddress)) {
      throw new Error(`Invalid ERC20 contract address: ${currency.contractAddress}`);
    }

    super(txProps);

    this.receiptStatus = receipt.status;
    this.receipt = receipt;
    this.originalTx = txProps.originalTx;
    this.isFailed = !this.receiptStatus;
  }

  public getExtraDepositData(): any {
    return Object.assign({}, super.getExtraDepositData(), {
      contractAddress: this.currency.contractAddress,
      tokenSymbol: this.currency.symbol,
      txIndex: this.receipt.transactionIndex,
    });
  }

  public getNetworkFee(): BigNumber {
    const gasUsed = web3.utils.toBN(this.receipt.gasUsed);
    const gasPrice = web3.utils.toBN(this.originalTx.gasPrice);
    return new BigNumber(gasPrice.mul(gasUsed).toString());
  }
}

export default Erc20Transaction;
