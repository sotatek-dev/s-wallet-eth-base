import EthGateway from './EthGateway';
import Contract from 'web3/eth/contract';
import { web3 } from './web3';
import ERC20ABI from '../config/abi/erc20.json';
import _ from 'lodash';
import EthereumTx from 'ethereumjs-tx';
import { override, Errors, IVOut, IRawTransaction, getTokenByContract, TokenType, getType } from 'sota-common';
import Erc20Transaction from './Erc20Transaction';

const gatewaysMap = new Map<string, Erc20Gateway>();

export class Erc20Gateway extends EthGateway {
  @override
  public static getInstance(contractAddress: string): Erc20Gateway {
    const gw = gatewaysMap.get(contractAddress);
    if (gw) {
      return gw;
    }

    const newGateway = new Erc20Gateway(contractAddress);
    gatewaysMap.set(contractAddress, newGateway);
    return newGateway;
  }

  protected _contractAddress: string;
  protected _contract: Contract;
  protected _tokenSymbol: string;
  protected _tokenName: string;
  protected _tokenDecimal: number;
  protected _tokenTotalSupply: string;

  public constructor(contractAddress: string) {
    super();
    this._contractAddress = contractAddress;
    this._contract = new web3.eth.Contract(ERC20ABI, contractAddress);
    const token = getTokenByContract(getType() as TokenType, this._contractAddress);
    if (!token) {
      throw new Error(`Could not get ERC20 currency config: ${this._contractAddress}`);
    }
    this._tokenSymbol = token.symbol;
  }

  public getContractAddress(): string {
    return this._contractAddress;
  }

  @override
  public async getAddressBalance(address: string): Promise<string> {
    const balance = await this._contract.methods.balanceOf(address).call();
    return balance.toString();
  }

  @override
  public async createRawTransaction(fromAddress: string, vouts: IVOut[]): Promise<IRawTransaction> {
    // TBD: support multiple ERC20 transfers within same transaction in the future?
    if (vouts.length !== 1) {
      throw new Error(`Erc20 only accepts 1 vout`);
    }

    const vout = vouts[0];
    const toAddress = vout.toAddress;
    const amount = web3.utils.toBN(vout.amount); // TODO: revise
    const nonce = await web3.eth.getTransactionCount(fromAddress);
    const gasPrice = web3.utils.toBN(await web3.eth.getGasPrice());
    const _gasLimit = await this._contract.methods
      .transfer(toAddress, amount.toString())
      .estimateGas({ from: fromAddress });
    const gasLimit = web3.utils.toBN(_gasLimit);
    const fee = gasLimit.mul(gasPrice);

    // Check whether the balance of hot wallet is enough to send
    const ethBalance = web3.utils.toBN((await web3.eth.getBalance(fromAddress)).toString());
    const balance = web3.utils.toBN(await this.getAddressBalance(fromAddress));
    if (balance.lt(amount)) {
      throw new Error(
        `Could not construct tx because of insufficient balance: address=${fromAddress}, amount=${amount}, fee=${fee}`
      );
    }

    if (ethBalance.lt(fee)) {
      throw Errors.notEnoughFeeError;
    }

    const chainId = parseInt(this.getConfig().chainId, 10);
    const tx = new EthereumTx({
      chainId,
      data: this._contract.methods.transfer(toAddress, amount.toString()).encodeABI(),
      gasLimit: web3.utils.toHex(gasLimit),
      gasPrice: web3.utils.toHex(gasPrice),
      nonce: web3.utils.toHex(nonce),
      to: this._contractAddress,
      value: web3.utils.toHex(0),
    });

    return {
      txid: `0x${tx.hash().toString('hex')}`,
      unsignedRaw: tx.serialize().toString('hex'),
    };
  }

  @override
  protected async _getOneTransaction(txid: string): Promise<Erc20Transaction> {
    const tx = await this.getRawTransaction(txid);
    const [block, receipt, blockHeight] = await Promise.all([
      this.getOneBlock(tx.blockNumber),
      this.getRawTransactionReceipt(txid),
      this.getBlockCount(),
    ]);

    const log = _.find(
      receipt.logs,
      l =>
        l.address.toLowerCase() === this._contractAddress.toLocaleLowerCase() &&
        l.topics[0] &&
        l.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
    );

    // Cannot find any transfer log event
    // Just treat the transaction as failed
    if (!log) {
      return null;
    }

    const inputs = _.find(ERC20ABI, abi => abi.type === 'event' && abi.name === 'Transfer').inputs;
    let parsedLog;

    try {
      parsedLog = web3.eth.abi.decodeLog(inputs, log.data, log.topics.slice(1)) as any;
    } catch (e) {
      throw new Error(`Cannot decode log for transaction: ${txid} of contract ${this._contractAddress}`);
    }

    const txProps = {
      amount: parsedLog.value,
      contractAddress: this._contractAddress,
      fromAddress: parsedLog.from,
      originalTx: tx,
      toAddress: parsedLog.to,
      tokenSymbol: this._tokenSymbol,
      txid,
      isFailed: false,
    };

    return new Erc20Transaction(txProps, block, receipt, blockHeight);
  }

  protected loadTokenInfo(): void {
    (async () => {
      const [symbol, name, decimal, totalSupply] = await Promise.all([
        this._contract.methods.symbol().call(),
        this._contract.methods.name().call(),
        this._contract.methods.decimal().call(),
        this._contract.methods.totalSupply().call(),
      ]);
      console.log(`Loaded gateway's token <${this._contractAddress}>: ${symbol}|${name}|${decimal}|${totalSupply}`);
      this._tokenSymbol = symbol as string;
      this._tokenName = name as string;
      this._tokenDecimal = parseInt(decimal, 10);
      this._tokenTotalSupply = totalSupply;
    })().catch(err => {
      console.error(`Could not load gatway's token contract: ${this._contractAddress}. Will retry in some seconds`);
      console.error(err);
      setTimeout(() => {
        this.loadTokenInfo();
      }, 1000);
    });
  }
}

export default Erc20Gateway;
