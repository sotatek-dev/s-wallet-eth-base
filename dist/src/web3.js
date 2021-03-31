"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.infuraWeb3 = exports.web3 = void 0;
var Web3 = require("web3");
var sota_common_1 = require("sota-common");
var logger = sota_common_1.getLogger('web3');
var web3 = new Web3();
exports.web3 = web3;
var infuraWeb3 = new Web3();
exports.infuraWeb3 = infuraWeb3;
sota_common_1.EnvConfigRegistry.onNetworkChanged(function (network) {
    logger.info("web3::onNetworkChanged network=" + network);
    var infuraProjectId = process.env.INFURA_PROJECT_ID;
    if (network === sota_common_1.NetworkType.MainNet) {
        var provider = new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/" + infuraProjectId);
        web3.setProvider(provider);
        infuraWeb3.setProvider(provider);
        return;
    }
    if (network === sota_common_1.NetworkType.TestNet) {
        var provider = new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/" + infuraProjectId);
        web3.setProvider(provider);
        infuraWeb3.setProvider(provider);
        return;
    }
});
sota_common_1.CurrencyRegistry.onCurrencyConfigSet(function (currency, config) {
    if (currency.symbol !== sota_common_1.BlockchainPlatform.Ethereum) {
        return;
    }
    logger.info("web3::onCurrencyConfigSet currency=" + currency.symbol + " config=" + JSON.stringify(config));
    if (!config.restEndpoint) {
        return;
    }
    web3.setProvider(new Web3.providers.HttpProvider(config.restEndpoint));
});
//# sourceMappingURL=web3.js.map