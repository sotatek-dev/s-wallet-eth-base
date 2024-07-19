"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolygonErc20Gateway = void 0;
var Erc20Gateway_1 = __importDefault(require("./Erc20Gateway"));
var sota_common_1 = require("sota-common");
var tx_1 = require("@ethereumjs/tx");
var web3_1 = require("./web3");
var util_1 = require("util");
var common_1 = __importStar(require("@ethereumjs/common"));
var logger = (0, sota_common_1.getLogger)('PolygonErc20Gateway');
sota_common_1.CurrencyRegistry.onPolERC20TokenRegistered(function (token) {
    logger.info("Register PolErc20Gateway to registry: " + token.symbol);
    sota_common_1.GatewayRegistry.registerLazyCreateMethod(token, function () { return new PolygonErc20Gateway(token); });
});
var PolygonErc20Gateway = (function (_super) {
    __extends(PolygonErc20Gateway, _super);
    function PolygonErc20Gateway(currency) {
        var _this = _super.call(this, currency) || this;
        _this._ethGateway = sota_common_1.GatewayRegistry.getGatewayInstance(sota_common_1.CurrencyRegistry.Polygon);
        _this.commonOpts = common_1.default.custom(sota_common_1.EnvConfigRegistry.getCustomEnvConfig('NETWORK') !== 'testnet' ? common_1.CustomChain.PolygonMainnet : common_1.CustomChain.PolygonMumbai);
        return _this;
    }
    PolygonErc20Gateway.prototype.constructRawTransaction = function (fromAddress, toAddress, value, options) {
        return __awaiter(this, void 0, void 0, function () {
            var amount, nonce, _gasPrice, minGasPrice, configMinGasPrice, gasPrice, _gasLimit, e_1, gasLimit, fee, ethBalance, _a, _b, balance, _c, _d, txParams, tx;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        amount = web3_1.web3.utils.toBN(value);
                        return [4, web3_1.web3.eth.getTransactionCount(fromAddress)];
                    case 1:
                        nonce = _e.sent();
                        if (!options.explicitGasPrice) return [3, 2];
                        _gasPrice = new sota_common_1.BigNumber(options.explicitGasPrice);
                        return [3, 4];
                    case 2: return [4, this._ethGateway.getGasPrice(options.useLowerNetworkFee)];
                    case 3:
                        _gasPrice = _e.sent();
                        _e.label = 4;
                    case 4:
                        minGasPrice = new sota_common_1.BigNumber(1000000000);
                        configMinGasPrice = parseInt(sota_common_1.EnvConfigRegistry.getCustomEnvConfig('ETH_MIN_GAS_PRICE'), 10);
                        if (!isNaN(configMinGasPrice)) {
                            minGasPrice = new sota_common_1.BigNumber(configMinGasPrice);
                        }
                        if (!_gasPrice || !_gasPrice.gt(minGasPrice)) {
                            throw new Error("Erc20Gateway::constructRawTransaction could not construct tx, invalid gas price: " + (_gasPrice || _gasPrice.toString()));
                        }
                        else {
                            logger.debug("Erc20Gateway::constructRawTransaction gasPrice=" + _gasPrice.toString());
                        }
                        gasPrice = web3_1.web3.utils.toBN(_gasPrice);
                        if (!options.explicitGasLimit) return [3, 5];
                        _gasLimit = options.explicitGasLimit;
                        return [3, 9];
                    case 5:
                        _e.trys.push([5, 7, , 8]);
                        return [4, this._contract.methods
                                .transfer(toAddress, amount.toString())
                                .estimateGas({ from: fromAddress })];
                    case 6:
                        _gasLimit = _e.sent();
                        return [3, 8];
                    case 7:
                        e_1 = _e.sent();
                        logger.error("Erc20Gateway::constructRawTransaction cannot estimate gas for transfer method error=" + (0, util_1.inspect)(e_1));
                        throw new Error("Erc20Gateway::constructRawTransaction cannot estimate gas for transfer method, error=" + e_1.toString());
                    case 8:
                        if (_gasLimit < 150000) {
                            _gasLimit = 150000;
                        }
                        if (_gasLimit > 300000) {
                            _gasLimit = 300000;
                        }
                        _e.label = 9;
                    case 9:
                        gasLimit = web3_1.web3.utils.toBN(_gasLimit);
                        fee = gasLimit.mul(gasPrice);
                        _b = (_a = web3_1.web3.utils).toBN;
                        return [4, web3_1.web3.eth.getBalance(fromAddress)];
                    case 10:
                        ethBalance = _b.apply(_a, [(_e.sent()).toString()]);
                        _d = (_c = web3_1.web3.utils).toBN;
                        return [4, this.getAddressBalance(fromAddress)];
                    case 11:
                        balance = _d.apply(_c, [_e.sent()]);
                        if (balance.lt(amount)) {
                            throw new Error("Erc20Gateway::constructRawTransaction Could not construct tx because of insufficient balance: address=" + fromAddress + ", amount=" + amount + ", fee=" + fee);
                        }
                        if (ethBalance.lt(fee)) {
                            throw new Error("Erc20Gateway::constructRawTransaction Could not construct tx because of lacking fee: address=" + fromAddress + ", fee=" + fee + ", ethBalance=" + ethBalance);
                        }
                        txParams = {
                            data: this._contract.methods.transfer(toAddress, amount.toString()).encodeABI(),
                            gasLimit: web3_1.web3.utils.toHex(gasLimit),
                            gasPrice: web3_1.web3.utils.toHex(gasPrice),
                            nonce: web3_1.web3.utils.toHex(nonce),
                            to: this._currency.contractAddress,
                            value: web3_1.web3.utils.toHex(0),
                        };
                        logger.info("Erc20Gateway::constructRawTransaction txParams=" + JSON.stringify(txParams));
                        tx = new tx_1.Transaction(txParams, { common: this.commonOpts });
                        return [2, {
                                txid: "0x" + tx.hash().toString('hex'),
                                unsignedRaw: tx.serialize().toString('hex'),
                            }];
                }
            });
        });
    };
    return PolygonErc20Gateway;
}(Erc20Gateway_1.default));
exports.PolygonErc20Gateway = PolygonErc20Gateway;
//# sourceMappingURL=PolygonErc20Gateway.js.map