import * as _ from 'lodash';
import EthGateway from '../src/EthGateway';
import { expect, assert } from 'chai';
import { BigNumber, CurrencyRegistry, TransactionStatus } from 'sota-common';

CurrencyRegistry.setCurrencyConfig(CurrencyRegistry.Ethereum, {
  currency: "eth",
  chainId: "2",
  chainName: "ropsten",
  network: "eth",
  averageBlockTime: 5000,
  requiredConfirmations: 2, 
  restEndpoint: "https://ropsten.infura.io/v3/32d1bb3a46e54208a4dce21845901247",
} as any )

describe('EthGateway::test-create-account', () => {
  const eth = EthGateway.getInstance();
  it('Create account', async () => {
    const account = await eth.createAccountAsync();
    assert.exists(account);
  });
});

describe('EthGateway::test-get-one-transaction', () => {
  const eth = EthGateway.getInstance();
  it('Return transaction info if txid valid', async () => {
    const tx = await eth.getOneTransaction('0xc251aebdccde8d476d644d867dee5a5032482d735f4d3b738b4ca068d928e22f');
    assert.equal(tx.txid, '0xc251aebdccde8d476d644d867dee5a5032482d735f4d3b738b4ca068d928e22f');
  });

  it('Return null if unknown transaction', async () => {
    const tx = await eth.getOneTransaction('0x1111111111111111111111111111111111111111111111111111111111111111');
    assert.equal(tx, null);
  });

  it('Throw error if txid invalid', async () => {
    let error;
    try {
      const tx = await eth.getOneTransaction('abc');
    } catch (err) {
      error = err;
    }
    expect(error).to.exist.and.be.instanceof(Error);
  });
});

describe('EthGateway::test-get-transaction-by-ids', () => {
  const eth = EthGateway.getInstance();
  it('Return transaction array with txids valid', async () => {
    const txids = [
      '0xca31029d1d22d51af3dd2d7eee407ab81e284745c3cc3ae211c9337e502d95b3',
      '0xe9a7feb06b59b0f648f51b91469ecf5d3d5b50f8969bbc9f21e5c14150f84797',
      '0xc251aebdccde8d476d644d867dee5a5032482d735f4d3b738b4ca068d928e22f',
    ];
    const txs = await eth.getTransactionsByIds(txids);
    assert.equal(txs.length, 3);
  });

  it('If txids have element invalid, txs have element null', async () => {
    const txids = [
      '0xca31029d1d22d51af3dd2d7eee407ab81e284745c3cc3ae211c9337e502d95b3',
      '0x1111111111111111111111111111111111111111111111111111111111111111',
      '0xc251aebdccde8d476d644d867dee5a5032482d735f4d3b738b4ca068d928e22f',
    ];
    const txs = await eth.getTransactionsByIds(txids);
    const filterTxs = _.compact(txs);
    assert.equal(filterTxs.length, 2);
  });

  it('Throw error if txids have element malformed', async () => {
    const txids = [
      '0xd41f6e9d6ee35df9a3a4912fe4890f3f178d27be8881af3abe8ba7c86a0fdda0',
      '111111111111111111111111111111111111111111111111111111111111111111',
      '0xe9a7feb06b59b0f648f51b91469ecf5d3d5b50f8969bbc9f21e5c14150f84797',
    ];
    let error;
    try {
      const txs = await eth.getTransactionsByIds(txids);
    } catch (err) {
      error = err;
    }
    expect(error).to.exist.and.be.instanceof(Error);
  });
});

describe('EthGateway::test-get-one-block', () => {
  const eth = EthGateway.getInstance();
  it('Return block info if block number valid', async () => {
    const block = await eth.getOneBlock(3590100);
    assert.exists(block);
  });

  it('Return null if block number not exist', async () => {
    const block = await eth.getOneBlock(10000000000);
    assert.equal(block, null);
  });

  it('Throw error if block number invalid', async () => {
    let error;
    try {
      const block = await eth.getOneBlock('abc');
    } catch (err) {
      error = err;
    }
    expect(error).to.exist.and.be.instanceof(Error);
  });
});

describe('EthGateway::test-get-block-count', () => {
  const eth = EthGateway.getInstance();
  it('Return block count', async () => {
    const count = await eth.getBlockCount();
    assert(count > 0);
  });
});

describe('EthGateway::test-get-block-transactions', () => {
  const eth = EthGateway.getInstance();
  it('Return txs of block', async () => {
    const txs = await eth.getBlockTransactions(3590100);
    assert(txs.length > 0);
  });

  it('Throw error if block not exist', async () => {
    let error;
    try {
      const txs = await eth.getBlockTransactions(100000000);
    } catch (err) {
      error = err;
    }
    expect(error).to.exist.and.be.instanceof(Error);
  });

  it('Throw error if block number invalid', async () => {
    let error;
    try {
      const txs = await eth.getBlockTransactions('abc');
    } catch (err) {
      error = err;
    }
    expect(error).to.exist.and.be.instanceof(Error);
  });
});

describe('EthGateway::test-get-multi-block-transactions', () => {
  const eth = EthGateway.getInstance();
  it('Return txs from block a to block b', async () => {
    const txs = await eth.getMultiBlocksTransactions(3590100, 3590105);
    assert.exists(txs);
  });

  it('Throw error if block start less than block end', async () => {
    let error;
    try {
      const txs = await eth.getMultiBlocksTransactions(3590105, 3590100);
    } catch (err) {
      error = err;
    }
    expect(error).exist.and.be.instanceof(Error);
  });
});

describe('EthGateway::test-get-address-balance', () => {
  const eth = EthGateway.getInstance();
  it('Return balance of account', async () => {
    const balance = await eth.getAddressBalance('0xE688592F4a97c5a36754Df54d75f91e06BefF379');
    assert.exists(balance);
  });

  it('Throw error if address invalid', async () => {
    let error;
    try {
      const balance = await eth.getAddressBalance('111111111111111111111111111111111111111111');
    } catch (err) {
      error = err;
    }
    expect(error).to.exist.and.be.instanceof(Error);
  });
});

describe('EthGateway::test-get-transaction-status', () => {
  const eth = EthGateway.getInstance();
  it('Return UNKNOWN if txid invalid', async () => {
    const result = await eth.getTransactionStatus('0x1111111111111111111111111111111111111111111111111111111111111111');
    assert.equal(result, TransactionStatus.UNKNOWN);
  });

  it('Return COMPLETED if txid valid and enought confirmation', async () => {
    const result = await eth.getTransactionStatus('0xc251aebdccde8d476d644d867dee5a5032482d735f4d3b738b4ca068d928e22f');
    assert.equal(result, TransactionStatus.COMPLETED);
  });
});

describe('EthGateway::createRawTransaction', () => {
  const gateway = EthGateway.getInstance();
  it('Create valid raw transaction', async () => {
    const fromAddress = '0xE688592F4a97c5a36754Df54d75f91e06BefF379';
    const toAddress = '0x22979347B41C30213f8EC9Be3D9e0252F74464cE';
    const amount = new BigNumber(10000);
    const result = await gateway.constructRawTransaction(fromAddress, toAddress, amount, {isConsolidate: false});
    assert.exists(result);
  });
});

describe('EthGateway::test-sign-raw-tx-by-singer-private-key', () => {
  const gateway = EthGateway.getInstance();
  it('Sign transaction valid', async () => {
    const fromAddress = '0xE688592F4a97c5a36754Df54d75f91e06BefF379';
    const privateKey = '76e4a452fa0e139624713cf714b100fb00de93a3ef1f15f08070ebb6d4be2b93';
    const toAddress = '0x22979347B41C30213f8EC9Be3D9e0252F74464cE';
    const amount = new BigNumber(10000);
    const unsignedRaw = await gateway.constructRawTransaction(fromAddress, toAddress, amount, {isConsolidate: false});
    const signedRaw = await gateway.signRawTransaction(unsignedRaw.unsignedRaw, privateKey);
    assert.exists(signedRaw.txid);
  });
});

describe('EthGateway::test-send-raw-transaction', () => {
  const gateway = EthGateway.getInstance();
  it('Send raw transaction', async () => {
    const fromAddress = '0xE688592F4a97c5a36754Df54d75f91e06BefF379';
    const privateKey = '76e4a452fa0e139624713cf714b100fb00de93a3ef1f15f08070ebb6d4be2b93';
    const toAddress = '0x22979347B41C30213f8EC9Be3D9e0252F74464cE';
    const amount = new BigNumber(10000);
    const unsignedRaw = await gateway.constructRawTransaction(fromAddress, toAddress, amount, {isConsolidate: false});
    const signedRaw = await gateway.signRawTransaction(unsignedRaw.unsignedRaw, privateKey);
    const sendTx = await gateway.sendRawTransaction(signedRaw.signedRaw);
    assert.exists(sendTx.txid);
  });
});



describe('EthGateway::test-get-erc20-info', () => {
  const gateway = EthGateway.getInstance();
  it('get erc20 token info success', async () => {
    const contractAddress = "0xd06c202439356d5bb555a0bf4ce42459930a8d58"
    const token = await gateway.getErc20TokenInfo(contractAddress);
    assert.exists(token);
  });
});
