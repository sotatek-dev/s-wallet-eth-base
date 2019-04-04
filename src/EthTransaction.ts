import { Currency, BlockHeader, Transaction, TransferOutput } from 'sota-common';
import { web3 } from './web3';
import * as web3_types from 'web3/types';
import * as eth_types from 'web3/eth/types';

export class EthTransaction extends Transaction {
  public readonly fromAddress: string;
  public readonly toAddress: string;
  public readonly amount: string;
  public readonly receiptStatus: boolean;
  public readonly block: BlockHeader;
  public readonly receipt: web3_types.TransactionReceipt;
  public readonly originalTx: eth_types.Transaction;

  constructor(
    tx: eth_types.Transaction,
    block: BlockHeader,
    receipt: web3_types.TransactionReceipt,
    lastNetworkBlockNumber: number
  ) {
    super(
      {
        confirmations: lastNetworkBlockNumber - tx.blockNumber + 1,
        height: tx.blockNumber,
        timestamp: block.timestamp,
        txid: tx.hash,
      },
      block
    );

    this.fromAddress = tx.from;
    this.toAddress = tx.to;
    this.amount = tx.value;
    this.receiptStatus = receipt.status;
    this.block = block;
    this.receipt = receipt;
    this.originalTx = tx;
    this.isFailed = !this.receiptStatus;
  }

  public extractEntries(): TransferOutput[] {
    const amount = web3.utils.toBN(this.amount);
    if (amount.isZero()) {
      return [];
    }

    const senderEntry = new TransferOutput({
      amount: `-${this.amount}`,
      currency: Currency.Ethereum,
      subCurrency: Currency.Ethereum,
      toAddress: this.fromAddress,
      tx: this,
      txid: this.txid,
    });

    const receiverEntry = new TransferOutput({
      amount: this.amount,
      currency: Currency.Ethereum,
      subCurrency: Currency.Ethereum,
      toAddress: this.toAddress,
      tx: this,
      txid: this.txid,
    });

    return [senderEntry, receiverEntry];
  }

  public getExtraDepositData(): any {
    return Object.assign({}, super.getExtraDepositData(), {
      txIndex: this.receipt.transactionIndex,
    });
  }

  public getNetworkFee(): string {
    const gasUsed = web3.utils.toBN(this.receipt.gasUsed);
    const gasPrice = web3.utils.toBN(this.originalTx.gasPrice);
    return gasPrice.mul(gasUsed).toString();
  }
}

export default EthTransaction;
