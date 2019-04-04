import { Entity, Column, PrimaryColumn } from 'wallet-core/node_modules/typeorm';

@Entity('eth_address')
export class EthAddress {
  @PrimaryColumn({ name: 'address', nullable: false })
  public address: string;

  @Column({ name: 'private_key' })
  public privateKey: string;

  @Column({ type: 'int', name: 'kms_data_key_id', nullable: false })
  public kmsDataKeyId: number;
}
