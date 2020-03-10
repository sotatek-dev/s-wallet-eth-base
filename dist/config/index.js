"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var mainnet_json_1 = __importDefault(require("./network/mainnet.json"));
var rinkeby_json_1 = __importDefault(require("./network/rinkeby.json"));
exports.EthConfig = Object.assign({}, mainnet_json_1.default);
function updateEthConfig(network) {
    switch (network) {
        case 'mainnet':
            Object.assign(exports.EthConfig, mainnet_json_1.default);
            break;
        case 'rinkeby':
            Object.assign(exports.EthConfig, rinkeby_json_1.default);
            break;
        default:
            throw new Error("Invalid environment variable value: NETWORK=" + process.env.NETWORK);
    }
}
exports.updateEthConfig = updateEthConfig;
//# sourceMappingURL=index.js.map