export * from './config';
export * from './src/EthGateway';
export * from './src/Erc20Gateway';
export * from './src/EthCrawler';
export * from './src/Erc20Crawler';
export * from './src/EthTransaction';
export * from './src/Erc20Transaction';
export * from './src/EthWithdrawalPicker';
export * from './src/Erc20WithdrawalPicker';
export * from './src/EthWithdrawalSender';
export * from './src/Erc20WithdrawalSender';
export * from './src/EthWithdrawalSigner';
export * from './src/Erc20WithdrawalSigner';
export * from './src/EthWithdrawalVerifier';
export * from './src/Erc20WithdrawalVerifier';
export * from './src/EthDepositCollector';
export * from './src/Erc20DepositCollector';
export * from './src/EthDepositCollectorVerifier';
export * from './src/Erc20DepositCollectorVerifier';
export * from './src/EthInternalTransferVerifier';
export * from './src/EthFeeSeeder';
export * from './src/Erc20InternalTransferVerifier';

import { CurrencyDepositFactory } from 'wallet-core';
import { Currency } from 'sota-common';
import { EthDeposit, Erc20Deposit } from './src/entities';

CurrencyDepositFactory.register(Currency.Ethereum, () => new EthDeposit());
CurrencyDepositFactory.register(Currency.ERC20, () => new Erc20Deposit());
