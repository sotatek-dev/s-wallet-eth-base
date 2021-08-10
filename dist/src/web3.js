"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.infuraWeb3 = exports.web3 = void 0;
var web3_1 = __importDefault(require("web3"));
var web3_core_helpers_1 = require("web3-core-helpers");
var sota_common_1 = require("sota-common");
var logger = sota_common_1.getLogger('web3');
var web3 = new web3_1.default();
exports.web3 = web3;
var infuraWeb3 = new web3_1.default();
exports.infuraWeb3 = infuraWeb3;
web3.extend({
    property: 'eth',
    methods: [
        {
            name: 'getMaxPriorityFeePerGas',
            call: 'eth_maxPriorityFeePerGas',
            params: 0,
            outputFormatter: web3_core_helpers_1.formatters.outputBigNumberFormatter,
        }
    ]
});
sota_common_1.EnvConfigRegistry.onNetworkChanged(function (network) {
    logger.info("web3::onNetworkChanged network=" + network);
    var infuraEnpoint = process.env.INFURA_ENDPOINT;
    if (infuraEnpoint) {
        var provider = new web3_1.default.providers.HttpProvider(infuraEnpoint);
        web3.setProvider(provider);
        infuraWeb3.setProvider(provider);
        return;
    }
    var infuraProjectId = process.env.INFURA_PROJECT_ID;
    if (network === sota_common_1.NetworkType.MainNet) {
        var provider = new web3_1.default.providers.HttpProvider("https://mainnet.infura.io/v3/" + infuraProjectId);
        web3.setProvider(provider);
        infuraWeb3.setProvider(provider);
        return;
    }
    if (network === sota_common_1.NetworkType.TestNet) {
        var provider = new web3_1.default.providers.HttpProvider("https://rinkeby.infura.io/v3/" + infuraProjectId);
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
    web3.setProvider(new web3_1.default.providers.HttpProvider(config.restEndpoint));
});
//# sourceMappingURL=web3.js.map