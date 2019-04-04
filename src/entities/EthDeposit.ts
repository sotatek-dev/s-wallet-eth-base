import { entities } from 'wallet-core';
import { Entity, Column } from 'wallet-core/node_modules/typeorm';

@Entity('eth_deposit')
export class EthDeposit extends entities.XDeposit {
  @Column({ name: 'tx_index', nullable: false })
  public txIndex: number;
}
