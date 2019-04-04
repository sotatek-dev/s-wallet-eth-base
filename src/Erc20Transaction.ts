import { Block, Transaction, TransferOutput, Currency } from 'sota-common';
import * as web3_types from 'web3/types';
import * as eth_types from 'web3/eth/types';
import { web3 } from './web3';
interface IERC20TransactionProps {
  readonly tokenSymbol: string;
  readonly contractAddress: string;
  readonly fromAddress: string;
  readonly toAddress: string;
  readonly amount: string;
  readonly txid: string;
  readonly originalTx: eth_types.Transaction;
  readonly isFailed: boolean;
}

export class Erc20Transaction extends Transaction {
  public readonly tokenSymbol: string;
  public readonly fromAddress: string;
  public readonly toAddress: string;
  public readonly amount: string;
  public readonly receiptStatus: boolean;
  public readonly block: Block;
  public readonly receipt: web3_types.TransactionReceipt;
  public readonly originalTx: eth_types.Transaction;

  constructor(
    tx: IERC20TransactionProps,
    block: Block,
    receipt: web3_types.TransactionReceipt,
    lastNetworkBlockNumber: number
  ) {
    super(
      {
        confirmations: lastNetworkBlockNumber - block.number + 1,
        height: block.number,
        timestamp: block.timestamp,
        txid: tx.txid,
      },
      block
    );
    if (!web3.utils.isAddress(tx.contractAddress)) {
      throw new Error(`Invalid ERC20 contract address: ${tx.contractAddress}`);
    }

    this.tokenSymbol = tx.tokenSymbol;
    this.contractAddress = web3.utils.toChecksumAddress(tx.contractAddress);
    this.fromAddress = tx.fromAddress;
    this.toAddress = tx.toAddress;
    this.amount = tx.amount;
    this.receiptStatus = receipt.status;
    this.block = block;
    this.receipt = receipt;
    this.originalTx = tx.originalTx;

    if (!this.receiptStatus || tx.isFailed) {
      this.isFailed = true;
    }
  }

  public extractEntries(): TransferOutput[] {
    const amount = web3.utils.toBN(this.amount);
    if (amount.isZero()) {
      return [];
    }

    const senderEntry = new TransferOutput({
      amount: `-${this.amount}`,
      currency: Currency.ERC20,
      subCurrency: this.tokenSymbol,
      toAddress: this.fromAddress,
      tx: this,
      txid: this.txid,
    });

    const receiverEntry = new TransferOutput({
      amount: this.amount,
      currency: Currency.ERC20,
      subCurrency: this.tokenSymbol,
      toAddress: this.toAddress,
      tx: this,
      txid: this.txid,
    });

    return [senderEntry, receiverEntry];
  }

  public getExtraDepositData(): any {
    return Object.assign({}, super.getExtraDepositData(), {
      contractAddress: this.contractAddress,
      tokenSymbol: this.tokenSymbol,
      txIndex: this.receipt.transactionIndex,
    });
  }

  public getNetworkFee(): string {
    const gasUsed = web3.utils.toBN(this.receipt.gasUsed);
    const gasPrice = web3.utils.toBN(this.originalTx.gasPrice);
    return gasPrice.mul(gasUsed).toString();
  }
}

export default Erc20Transaction;
