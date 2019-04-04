import { entities } from 'wallet-core';
import { Entity, Column } from 'wallet-core/node_modules/typeorm';

@Entity('nep5_withdrawal_tx')
export class EthWithdrawalTx extends entities.XWithdrawalTx {
  @Column({ name: 'gas', nullable: false })
  public gas: number;
}
