"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var EthGateway_1 = __importDefault(require("./EthGateway"));
var sota_common_1 = require("sota-common");
var lru_cache_1 = __importDefault(require("lru-cache"));
var common_1 = __importStar(require("@ethereumjs/common"));
var tx_1 = require("@ethereumjs/tx");
var web3_1 = require("./web3");
var buffer_1 = require("buffer");
var logger = sota_common_1.getLogger('PolygonGateway');
var _cacheBlockNumber = {
    value: 0,
    updatedAt: 0,
    isRequesting: false,
};
var _cacheRawTxByHash = new lru_cache_1.default({
    max: 1024,
    maxAge: 1000 * 60 * 5,
});
var _cacheRawTxReceipt = new lru_cache_1.default({
    max: 1024,
    maxAge: 1000 * 60 * 5,
});
var _isRequestingTx = new Map();
var _isRequestingReceipt = new Map();
sota_common_1.GatewayRegistry.registerLazyCreateMethod(sota_common_1.CurrencyRegistry.Polygon, function () { return new PolygonGateway(); });
var PolygonGateway = (function (_super) {
    __extends(PolygonGateway, _super);
    function PolygonGateway() {
        var _this = _super.call(this) || this;
        _this._currency = sota_common_1.CurrencyRegistry.Polygon;
        _this.commonOpts = common_1.default.custom(sota_common_1.EnvConfigRegistry.getCustomEnvConfig('NETWORK') !== 'testnet' ? common_1.CustomChain.PolygonMainnet : common_1.CustomChain.PolygonMumbai);
        return _this;
    }
    PolygonGateway.prototype.constructRawTransaction = function (fromAddress, toAddress, value, options) {
        return __awaiter(this, void 0, void 0, function () {
            var amount, nonce, _gasPrice, gasPrice, gasLimit, fee, balance, _a, _b, txParams, tx;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        amount = web3_1.web3.utils.toBN(value);
                        return [4, web3_1.web3.eth.getTransactionCount(fromAddress)];
                    case 1:
                        nonce = _c.sent();
                        if (!options.explicitGasPrice) return [3, 2];
                        _gasPrice = new sota_common_1.BigNumber(options.explicitGasPrice);
                        return [3, 4];
                    case 2: return [4, this.getGasPrice(options.useLowerNetworkFee)];
                    case 3:
                        _gasPrice = _c.sent();
                        _c.label = 4;
                    case 4:
                        if (!_gasPrice || !_gasPrice.gt(new sota_common_1.BigNumber(0))) {
                            throw new Error("EthGateway::constructRawTransaction could not construct tx, invalid gas price: " + (_gasPrice || _gasPrice.toString()));
                        }
                        else {
                            logger.debug("EthGateway::constructRawTransaction gasPrice=" + _gasPrice.toString());
                        }
                        gasPrice = web3_1.web3.utils.toBN(_gasPrice);
                        gasLimit = web3_1.web3.utils.toBN(options.isConsolidate ? 21000 : 150000);
                        if (options.explicitGasLimit) {
                            gasLimit = web3_1.web3.utils.toBN(options.explicitGasLimit);
                        }
                        fee = gasLimit.mul(gasPrice);
                        if (options.isConsolidate) {
                            amount = amount.sub(fee);
                        }
                        _b = (_a = web3_1.web3.utils).toBN;
                        return [4, web3_1.web3.eth.getBalance(fromAddress)];
                    case 5:
                        balance = _b.apply(_a, [(_c.sent()).toString()]);
                        if (balance.lt(amount.add(fee))) {
                            throw new Error("EthGateway::constructRawTransaction could not construct tx because of insufficient balance:          address=" + fromAddress + ", balance=" + balance + ", amount=" + amount + ", fee=" + fee);
                        }
                        txParams = {
                            gasLimit: web3_1.web3.utils.toHex(options.isConsolidate ? 21000 : 150000),
                            gasPrice: web3_1.web3.utils.toHex(gasPrice),
                            nonce: web3_1.web3.utils.toHex(nonce),
                            to: toAddress,
                            value: web3_1.web3.utils.toHex(amount),
                            data: '0x',
                        };
                        logger.info("EthGateway::constructRawTransaction txParams=" + JSON.stringify(txParams));
                        tx = new tx_1.Transaction(txParams, { common: this.commonOpts });
                        return [2, {
                                txid: "0x" + tx.hash().toString('hex'),
                                unsignedRaw: tx.serialize().toString('hex'),
                            }];
                }
            });
        });
    };
    PolygonGateway.prototype.signRawTransaction = function (unsignedRaw, secret) {
        return __awaiter(this, void 0, void 0, function () {
            var ethTx, privateKey;
            return __generator(this, function (_a) {
                if (secret.startsWith('0x')) {
                    secret = secret.substr(2);
                }
                ethTx = new tx_1.Transaction(tx_1.Transaction.fromSerializedTx(buffer_1.Buffer.from(unsignedRaw, 'hex')), { common: this.commonOpts });
                privateKey = buffer_1.Buffer.from(secret, 'hex');
                ethTx.sign(privateKey);
                return [2, {
                        txid: "0x" + ethTx.hash().toString('hex'),
                        signedRaw: ethTx.serialize().toString('hex'),
                        unsignedRaw: unsignedRaw,
                    }];
            });
        });
    };
    PolygonGateway.prototype.sendRawTransaction = function (rawTx, retryCount) {
        return __awaiter(this, void 0, void 0, function () {
            var ethTx, txid, _a, receipt, infuraReceipt, e_1, tx;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!rawTx.startsWith('0x')) {
                            rawTx = '0x' + rawTx;
                        }
                        ethTx = new tx_1.Transaction(tx_1.Transaction.fromSerializedTx(buffer_1.Buffer.from(rawTx, 'hex')), { common: this.commonOpts });
                        txid = ethTx.hash().toString('hex');
                        if (!txid.startsWith('0x')) {
                            txid = '0x' + txid;
                        }
                        if (!retryCount || isNaN(retryCount)) {
                            retryCount = 0;
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 6]);
                        return [4, Promise.all([
                                web3_1.web3.eth.sendSignedTransaction(rawTx),
                                web3_1.infuraWeb3.eth.sendSignedTransaction(rawTx),
                            ])];
                    case 2:
                        _a = _b.sent(), receipt = _a[0], infuraReceipt = _a[1];
                        logger.info("EthGateway::sendRawTransaction infura_txid=" + infuraReceipt.transactionHash);
                        return [2, { txid: receipt.transactionHash }];
                    case 3:
                        e_1 = _b.sent();
                        if (e_1.toString().indexOf('known transaction') > -1) {
                            logger.warn(e_1.toString());
                            return [2, { txid: txid }];
                        }
                        if (e_1.toString().indexOf('already known') > -1) {
                            logger.warn(e_1.toString());
                            return [2, { txid: txid }];
                        }
                        if (e_1.toString().indexOf('Transaction has been reverted by the EVM') > -1) {
                            logger.warn(e_1.toString());
                            return [2, { txid: txid }];
                        }
                        if (!(e_1.toString().indexOf('nonce too low') > -1)) return [3, 5];
                        return [4, this.getOneTransaction(txid)];
                    case 4:
                        tx = _b.sent();
                        if (tx && tx.confirmations) {
                            return [2, { txid: txid }];
                        }
                        throw e_1;
                    case 5:
                        if (retryCount + 1 > 5) {
                            logger.error("Too many fails sending txid=" + txid + " tx=" + JSON.stringify(ethTx.toJSON()) + " err=" + e_1.toString());
                            throw e_1;
                        }
                        return [2, this.sendRawTransaction(rawTx, retryCount + 1)];
                    case 6: return [2];
                }
            });
        });
    };
    return PolygonGateway;
}(EthGateway_1.default));
exports.PolygonGateway = PolygonGateway;
//# sourceMappingURL=PolygonGateway.js.map