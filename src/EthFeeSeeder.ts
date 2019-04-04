import { BaseFeeSeeder } from 'sota-common';
import { EthGateway } from './EthGateway';

class EthFeeSeeder extends BaseFeeSeeder {
  public gatewayClass(): any {
    return EthGateway;
  }

  public getFeeReserveAccount(): any {
    return {
      privateKey: process.env.RESERVE_PRIVATE_KEY,
      address: process.env.RESERVE_ADDRESS,
    };
  }
}

export { EthFeeSeeder };
