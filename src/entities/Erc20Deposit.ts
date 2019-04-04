import { entities } from 'wallet-core';
import { Entity, Column } from 'wallet-core/node_modules/typeorm';

@Entity('erc20_deposit')
export class Erc20Deposit extends entities.XDeposit {
  @Column({ name: 'token_symbol', nullable: false })
  public tokenSymbol: string;

  @Column({ name: 'contract_address', nullable: false })
  public contractAddress: string;

  @Column({ name: 'tx_index', nullable: false })
  public txIndex: number;
}
