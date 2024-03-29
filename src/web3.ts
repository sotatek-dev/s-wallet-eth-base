import Web3 = require('web3');
import { EnvConfigRegistry, NetworkType, CurrencyRegistry, BlockchainPlatform, getLogger } from 'sota-common';

const logger = getLogger('web3');

const web3 = new Web3();
const infuraWeb3 = new Web3();

EnvConfigRegistry.onNetworkChanged(network => {
  logger.info(`web3::onNetworkChanged network=${network}`);
  const infuraEnpoint = process.env.INFURA_ENDPOINT
  if (infuraEnpoint) {
    const provider = new Web3.providers.HttpProvider(infuraEnpoint);
    web3.setProvider(provider);
    infuraWeb3.setProvider(provider);
    return;
  }

  // This implement is for backward compability
  const infuraProjectId = process.env.INFURA_PROJECT_ID;
  if (network === NetworkType.MainNet) {
    const provider = new Web3.providers.HttpProvider(`https://mainnet.infura.io/v3/${infuraProjectId}`);
    web3.setProvider(provider);
    infuraWeb3.setProvider(provider);
    return;
  }

  if (network === NetworkType.TestNet) {
    const provider = new Web3.providers.HttpProvider(`https://rinkeby.infura.io/v3/${infuraProjectId}`);
    web3.setProvider(provider);
    infuraWeb3.setProvider(provider);
    return;
  }
});

CurrencyRegistry.onCurrencyConfigSet((currency, config) => {
  if (currency.symbol !== BlockchainPlatform.Ethereum && currency.symbol !== BlockchainPlatform.Polygon) {
    return;
  }

  logger.info(`web3::onCurrencyConfigSet currency=${currency.symbol} config=${JSON.stringify(config)}`);
  if (!config.restEndpoint) {
    return;
  }

  web3.setProvider(new Web3.providers.HttpProvider(config.restEndpoint));
});

export { web3, infuraWeb3 };
