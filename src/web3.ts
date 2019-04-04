export const httpProviders = new Map<string, string>();
httpProviders.set('rinkeby', 'https://rinkeby.infura.io/v3/cbc0dce4b2174caabf7ed0c4865920ff');
httpProviders.set('mainnet', 'https://mainnet.infura.io/v3/cbc0dce4b2174caabf7ed0c4865920ff');

import Web3 = require('web3');
const web3 = new Web3();

export { web3 };
