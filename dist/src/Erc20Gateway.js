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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
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
var web3_1 = require("./web3");
var lodash_1 = __importDefault(require("lodash"));
var ethereumjs_tx_1 = __importDefault(require("ethereumjs-tx"));
var sota_common_1 = require("sota-common");
var Erc20Transaction_1 = __importDefault(require("./Erc20Transaction"));
var erc20_json_1 = __importDefault(require("../config/abi/erc20.json"));
var logger = sota_common_1.getLogger('Erc20Gateway');
sota_common_1.CurrencyRegistry.onERC20TokenRegistered(function (token) {
    logger.info("Register Erc20Gateway to the registry: " + token.symbol);
    sota_common_1.GatewayRegistry.registerLazyCreateMethod(token, function () { return new Erc20Gateway(token); });
});
var Erc20Gateway = (function (_super) {
    __extends(Erc20Gateway, _super);
    function Erc20Gateway(currency) {
        var _this = _super.call(this, currency) || this;
        _this._contract = new web3_1.web3.eth.Contract(erc20_json_1.default, currency.contractAddress);
        _this._ethGateway = sota_common_1.GatewayRegistry.getGatewayInstance(sota_common_1.CurrencyRegistry.Ethereum);
        return _this;
    }
    Erc20Gateway.prototype.getAverageSeedingFee = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error('Method not implemented.');
            });
        });
    };
    Erc20Gateway.prototype.getAddressBalance = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var balance;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this._contract.methods.balanceOf(address).call()];
                    case 1:
                        balance = _a.sent();
                        return [2, new sota_common_1.BigNumber(balance.toString())];
                }
            });
        });
    };
    Erc20Gateway.prototype.constructRawTransaction = function (fromAddress, toAddress, value, options) {
        return __awaiter(this, void 0, void 0, function () {
            var amount, nonce, gasPrice, _a, _b, _gasLimit, gasLimit, fee, ethBalance, _c, _d, balance, _e, _f, tx;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        amount = web3_1.web3.utils.toBN(value);
                        return [4, web3_1.web3.eth.getTransactionCount(fromAddress)];
                    case 1:
                        nonce = _g.sent();
                        _b = (_a = web3_1.web3.utils).toBN;
                        return [4, this._ethGateway.getGasPrice(options.useLowerNetworkFee)];
                    case 2:
                        gasPrice = _b.apply(_a, [_g.sent()]);
                        return [4, this._contract.methods
                                .transfer(toAddress, amount.toString())
                                .estimateGas({ from: fromAddress })];
                    case 3:
                        _gasLimit = _g.sent();
                        if (_gasLimit > 300000) {
                            _gasLimit = 300000;
                        }
                        gasLimit = web3_1.web3.utils.toBN(_gasLimit);
                        fee = gasLimit.mul(gasPrice);
                        _d = (_c = web3_1.web3.utils).toBN;
                        return [4, web3_1.web3.eth.getBalance(fromAddress)];
                    case 4:
                        ethBalance = _d.apply(_c, [(_g.sent()).toString()]);
                        _f = (_e = web3_1.web3.utils).toBN;
                        return [4, this.getAddressBalance(fromAddress)];
                    case 5:
                        balance = _f.apply(_e, [_g.sent()]);
                        if (balance.lt(amount)) {
                            throw new Error("Could not construct tx because of insufficient balance: address=" + fromAddress + ", amount=" + amount + ", fee=" + fee);
                        }
                        if (ethBalance.lt(fee)) {
                            throw new Error("Could not construct tx because of lacking fee: address=" + fromAddress + ", fee=" + fee + ", ethBalance=" + ethBalance);
                        }
                        tx = new ethereumjs_tx_1.default({
                            chainId: this._ethGateway.getChainId(),
                            data: this._contract.methods.transfer(toAddress, amount.toString()).encodeABI(),
                            gasLimit: web3_1.web3.utils.toHex(gasLimit),
                            gasPrice: web3_1.web3.utils.toHex(gasPrice),
                            nonce: web3_1.web3.utils.toHex(nonce),
                            to: this._currency.contractAddress,
                            value: web3_1.web3.utils.toHex(0),
                        });
                        return [2, {
                                txid: "0x" + tx.hash().toString('hex'),
                                unsignedRaw: tx.serialize().toString('hex'),
                            }];
                }
            });
        });
    };
    Erc20Gateway.prototype.signRawTransaction = function (unsignedRaw, secret) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this._ethGateway.signRawTransaction(unsignedRaw, secret)];
            });
        });
    };
    Erc20Gateway.prototype.sendRawTransaction = function (signedRawTx) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this._ethGateway.sendRawTransaction(signedRawTx)];
            });
        });
    };
    Erc20Gateway.prototype.createAccountAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this._ethGateway.createAccountAsync()];
            });
        });
    };
    Erc20Gateway.prototype.getAccountFromPrivateKey = function (privateKey) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this._ethGateway.getAccountFromPrivateKey(privateKey)];
            });
        });
    };
    Erc20Gateway.prototype.getBlockCount = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this._ethGateway.getBlockCount()];
            });
        });
    };
    Erc20Gateway.prototype.getTransactionStatus = function (txid) {
        return this._ethGateway.getTransactionStatus(txid);
    };
    Erc20Gateway.prototype.estimateFee = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this._ethGateway.estimateFee({
                            isConsolidate: options.isConsolidate,
                            useLowerNetworkFee: options.useLowerNetworkFee,
                        })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Erc20Gateway.prototype._getOneTransaction = function (txid) {
        return __awaiter(this, void 0, void 0, function () {
            var tx, _a, block, receipt, blockHeight, logs, inputs, vIns, vOuts;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4, this._ethGateway.getRawTransaction(txid)];
                    case 1:
                        tx = _b.sent();
                        return [4, Promise.all([
                                this.getOneBlock(tx.blockNumber),
                                this._ethGateway.getRawTransactionReceipt(txid),
                                this.getBlockCount(),
                            ])];
                    case 2:
                        _a = _b.sent(), block = _a[0], receipt = _a[1], blockHeight = _a[2];
                        logs = lodash_1.default.filter(receipt.logs, function (l) {
                            return l.address.toLowerCase() === _this._currency.contractAddress.toLocaleLowerCase() &&
                                l.topics[0] &&
                                l.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
                        });
                        if (!logs || !logs.length) {
                            return [2, null];
                        }
                        inputs = lodash_1.default.find(erc20_json_1.default, function (abi) { return abi.type === 'event' && abi.name === 'Transfer'; }).inputs;
                        vIns = [];
                        vOuts = [];
                        logs.forEach(function (log) {
                            try {
                                var parsedLog = web3_1.web3.eth.abi.decodeLog(inputs, log.data, log.topics.slice(1));
                                vIns.push({
                                    address: parsedLog.from,
                                    currency: _this._currency,
                                    amount: parsedLog.value,
                                });
                                vOuts.push({
                                    address: parsedLog.to,
                                    currency: _this._currency,
                                    amount: parsedLog.value,
                                });
                            }
                            catch (e) {
                                throw new Error("Cannot decode log for transaction: " + txid + " of contract " + _this._currency.contractAddress);
                            }
                        });
                        return [2, new Erc20Transaction_1.default(this._currency, {
                                originalTx: tx,
                                txid: txid,
                                inputs: vIns,
                                outputs: vOuts,
                                block: block,
                                lastNetworkBlockNumber: blockHeight,
                            }, receipt)];
                }
            });
        });
    };
    Erc20Gateway.prototype._getOneBlock = function (blockNumber) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this._ethGateway.getOneBlock(blockNumber)];
            });
        });
    };
    __decorate([
        sota_common_1.implement,
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String]),
        __metadata("design:returntype", Promise)
    ], Erc20Gateway.prototype, "getAddressBalance", null);
    __decorate([
        sota_common_1.implement,
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String, String, sota_common_1.BigNumber, Object]),
        __metadata("design:returntype", Promise)
    ], Erc20Gateway.prototype, "constructRawTransaction", null);
    return Erc20Gateway;
}(sota_common_1.AccountBasedGateway));
exports.Erc20Gateway = Erc20Gateway;
exports.default = Erc20Gateway;
//# sourceMappingURL=Erc20Gateway.js.map