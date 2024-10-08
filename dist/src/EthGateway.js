"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
exports.EthGateway = void 0;
var sota_common_1 = require("sota-common");
var lru_cache_1 = __importDefault(require("lru-cache"));
var EthTransaction_1 = require("./EthTransaction");
var EthTypeConverter = __importStar(require("./EthTypeConverter"));
var web3_1 = require("./web3");
var erc20_json_1 = __importDefault(require("../config/abi/erc20.json"));
var ethereumjs = __importStar(require("ethereumjs-tx"));
var common_1 = __importDefault(require("@ethereumjs/common"));
var tx_1 = require("@ethereumjs/tx");
var EthereumTx = ethereumjs.Transaction;
var logger = sota_common_1.getLogger('EthGateway');
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
var EthereumMainnet = {
    name: 'mainnet',
    chainId: 1,
    networkId: 1,
};
var EthereumTestnetSepolia = {
    name: 'sepolia',
    chainId: 11155111,
    networkId: 11155111,
};
sota_common_1.GatewayRegistry.registerLazyCreateMethod(sota_common_1.CurrencyRegistry.Ethereum, function () { return new EthGateway(); });
var EthGateway = (function (_super) {
    __extends(EthGateway, _super);
    function EthGateway(currency) {
        var _this = _super.call(this, currency ? currency : sota_common_1.CurrencyRegistry.Ethereum) || this;
        _this.commonOpts = common_1.default.custom(sota_common_1.EnvConfigRegistry.getCustomEnvConfig('NETWORK') !== 'testnet' ? EthereumMainnet : EthereumTestnetSepolia);
        return _this;
    }
    EthGateway.prototype.getGasPrice = function (useLowerNetworkFee) {
        return __awaiter(this, void 0, void 0, function () {
            var baseGasPrice, _a, finalGasPrice, configMaxGasPrice, multipler, configMultiplerLow, configMultiplerHigh, multiplyGasPrice, plusGas, configPlusGas, plusGasPrice;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = sota_common_1.BigNumber.bind;
                        return [4, web3_1.web3.eth.getGasPrice()];
                    case 1:
                        baseGasPrice = new (_a.apply(sota_common_1.BigNumber, [void 0, _b.sent()]))();
                        finalGasPrice = new sota_common_1.BigNumber(120000000000);
                        configMaxGasPrice = parseInt(sota_common_1.EnvConfigRegistry.getCustomEnvConfig('ETH_MAX_GAS_PRICE'), 10);
                        if (!isNaN(configMaxGasPrice)) {
                            finalGasPrice = new sota_common_1.BigNumber(configMaxGasPrice);
                        }
                        multipler = 5;
                        if (!!useLowerNetworkFee) {
                            multipler = 2;
                            configMultiplerLow = parseFloat(sota_common_1.EnvConfigRegistry.getCustomEnvConfig('ETH_MAX_GAS_MULTIPLER_LOW'));
                            if (!isNaN(configMultiplerLow)) {
                                multipler = configMultiplerLow;
                            }
                        }
                        else {
                            configMultiplerHigh = parseFloat(sota_common_1.EnvConfigRegistry.getCustomEnvConfig('ETH_MAX_GAS_MULTIPLER_HIGH'));
                            if (!isNaN(configMultiplerHigh)) {
                                multipler = configMultiplerHigh;
                            }
                        }
                        multiplyGasPrice = baseGasPrice.multipliedBy(multipler).toFixed(0);
                        if (finalGasPrice.gt(multiplyGasPrice)) {
                            finalGasPrice = new sota_common_1.BigNumber(multiplyGasPrice);
                        }
                        plusGas = 20000000000;
                        configPlusGas = parseInt(sota_common_1.EnvConfigRegistry.getCustomEnvConfig('ETH_MAX_GAS_PLUS'), 10);
                        if (!isNaN(configPlusGas)) {
                            plusGas = configPlusGas;
                        }
                        plusGasPrice = baseGasPrice.plus(plusGas);
                        if (finalGasPrice.gt(plusGasPrice)) {
                            finalGasPrice = plusGasPrice;
                        }
                        if (baseGasPrice.gt(finalGasPrice)) {
                            finalGasPrice = baseGasPrice;
                        }
                        return [2, finalGasPrice];
                }
            });
        });
    };
    EthGateway.prototype.getParallelNetworkRequestLimit = function () {
        return 100;
    };
    EthGateway.prototype.getAverageSeedingFee = function () {
        return __awaiter(this, void 0, void 0, function () {
            var gasPrice, _a, _b, gasLimit, result;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _b = (_a = web3_1.web3.utils).toBN;
                        return [4, this.getGasPrice()];
                    case 1:
                        gasPrice = _b.apply(_a, [_c.sent()]);
                        gasLimit = web3_1.web3.utils.toBN(150000);
                        result = gasPrice.mul(gasLimit);
                        return [2, new sota_common_1.BigNumber(result.toString())];
                }
            });
        });
    };
    EthGateway.prototype.normalizeAddress = function (address) {
        if (!web3_1.web3.utils.isAddress(address)) {
            throw new Error("Invalid address: " + address);
        }
        return web3_1.web3.utils.toChecksumAddress(address);
    };
    EthGateway.prototype.createAccountAsync = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, web3_1.web3.eth.accounts.create()];
            });
        });
    };
    EthGateway.prototype.getAccountFromPrivateKey = function (privateKey) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (privateKey.indexOf('0x') < 0) {
                    privateKey = '0x' + privateKey;
                }
                if (privateKey.length !== 66) {
                    throw new Error("Invalid private key. Should be 64-byte length.");
                }
                return [2, web3_1.web3.eth.accounts.privateKeyToAccount(privateKey)];
            });
        });
    };
    EthGateway.prototype.isValidAddressAsync = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, web3_1.web3.utils.isAddress(address)];
            });
        });
    };
    EthGateway.prototype.getAddressBalance = function (address, blockNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var balance;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, web3_1.web3.eth.getBalance(address, blockNumber)];
                    case 1:
                        balance = _a.sent();
                        return [2, new sota_common_1.BigNumber(balance.toString())];
                }
            });
        });
    };
    EthGateway.prototype.getBlockCount = function () {
        return __awaiter(this, void 0, void 0, function () {
            var now, CACHE_TIME, blockNum, newUpdatedAt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = sota_common_1.Utils.nowInMillis();
                        CACHE_TIME = 10000;
                        if (_cacheBlockNumber.value > 0 && now - _cacheBlockNumber.updatedAt < CACHE_TIME) {
                            return [2, _cacheBlockNumber.value];
                        }
                        if (!_cacheBlockNumber.isRequesting) return [3, 2];
                        return [4, sota_common_1.Utils.timeout(500)];
                    case 1:
                        _a.sent();
                        return [2, this.getBlockCount()];
                    case 2:
                        _cacheBlockNumber.isRequesting = true;
                        return [4, web3_1.web3.eth.getBlockNumber()];
                    case 3:
                        blockNum = (_a.sent()) - 1;
                        newUpdatedAt = sota_common_1.Utils.nowInMillis();
                        _cacheBlockNumber.value = blockNum;
                        _cacheBlockNumber.updatedAt = newUpdatedAt;
                        _cacheBlockNumber.isRequesting = false;
                        logger.debug("EthGateway::getBlockCount value=" + blockNum + " updatedAt=" + newUpdatedAt);
                        return [2, blockNum];
                }
            });
        });
    };
    EthGateway.prototype.constructRawTransaction = function (fromAddress, toAddress, value, options) {
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
    EthGateway.prototype.reconstructRawTx = function (rawTx) {
        var tx = new EthereumTx(rawTx);
        return {
            txid: "0x" + tx.hash().toString('hex'),
            unsignedRaw: tx.serialize().toString('hex'),
        };
    };
    EthGateway.prototype.signRawTransaction = function (unsignedRaw, secret) {
        return __awaiter(this, void 0, void 0, function () {
            var ethTx, privateKey, signedTx;
            return __generator(this, function (_a) {
                if (secret.startsWith('0x')) {
                    secret = secret.substr(2);
                }
                ethTx = new tx_1.Transaction(tx_1.Transaction.fromSerializedTx(Buffer.from(unsignedRaw, 'hex')), { common: this.commonOpts });
                privateKey = Buffer.from(secret, 'hex');
                signedTx = ethTx.sign(privateKey);
                return [2, {
                        txid: "0x" + ethTx.hash().toString('hex'),
                        signedRaw: signedTx.serialize().toString('hex'),
                        unsignedRaw: unsignedRaw,
                    }];
            });
        });
    };
    EthGateway.prototype.sendRawTransaction = function (rawTx, retryCount) {
        return __awaiter(this, void 0, void 0, function () {
            var ethTx, txid, _a, receipt, infuraReceipt, e_1, tx;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        ethTx = new tx_1.Transaction(tx_1.Transaction.fromSerializedTx(Buffer.from(rawTx, 'hex')), { common: this.commonOpts });
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
                                web3_1.web3.eth.sendSignedTransaction("0x" + rawTx),
                                web3_1.infuraWeb3.eth.sendSignedTransaction("0x" + rawTx),
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
    EthGateway.prototype.getTransactionStatus = function (txid) {
        return __awaiter(this, void 0, void 0, function () {
            var tx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!txid.startsWith('0x')) {
                            txid = '0x' + txid;
                        }
                        return [4, this.getOneTransaction(txid)];
                    case 1:
                        tx = (_a.sent());
                        if (!tx || !tx.confirmations) {
                            return [2, sota_common_1.TransactionStatus.UNKNOWN];
                        }
                        if (tx.confirmations < sota_common_1.CurrencyRegistry.getCurrencyConfig(this._currency).requiredConfirmations) {
                            return [2, sota_common_1.TransactionStatus.CONFIRMING];
                        }
                        if (!tx.receiptStatus) {
                            return [2, sota_common_1.TransactionStatus.FAILED];
                        }
                        return [2, sota_common_1.TransactionStatus.COMPLETED];
                }
            });
        });
    };
    EthGateway.prototype.getRawTransaction = function (txid) {
        return __awaiter(this, void 0, void 0, function () {
            var key, redisClient, cachedTx, cachedData, tx, gwName;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = '_cacheRawTxByHash_' + this.getCurrency().symbol + txid;
                        if (!!!sota_common_1.EnvConfigRegistry.isUsingRedis()) return [3, 2];
                        redisClient = sota_common_1.getRedisClient();
                        return [4, redisClient.get(key)];
                    case 1:
                        cachedData = _a.sent();
                        if (!!cachedData) {
                            cachedTx = JSON.parse(cachedData);
                        }
                        return [3, 3];
                    case 2:
                        cachedTx = _cacheRawTxByHash.get(key);
                        _a.label = 3;
                    case 3:
                        if (cachedTx) {
                            return [2, cachedTx];
                        }
                        if (!_isRequestingTx.get(txid)) return [3, 5];
                        return [4, sota_common_1.Utils.timeout(500)];
                    case 4:
                        _a.sent();
                        return [2, this.getRawTransaction(txid)];
                    case 5:
                        _isRequestingTx.set(txid, true);
                        return [4, web3_1.web3.eth.getTransaction(txid)];
                    case 6:
                        tx = _a.sent();
                        _isRequestingTx.delete(txid);
                        if (!tx) {
                            return [2, null];
                        }
                        if (!tx.blockNumber) {
                            gwName = this.constructor.name;
                            throw new Error(gwName + "::getRawTransaction tx doesn't have block number txid=" + txid);
                        }
                        if (redisClient) {
                            redisClient.setex(key, 120, JSON.stringify(tx));
                        }
                        else {
                            _cacheRawTxByHash.set(key, tx);
                        }
                        return [2, tx];
                }
            });
        });
    };
    EthGateway.prototype.getRawTransactionReceipt = function (txid) {
        return __awaiter(this, void 0, void 0, function () {
            var key, redisClient, cachedReceipt, cachedData, receipt, gwName;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = '_cacheRawTxReceipt_' + this.getCurrency().symbol + txid;
                        if (!!!sota_common_1.EnvConfigRegistry.isUsingRedis()) return [3, 2];
                        redisClient = sota_common_1.getRedisClient();
                        return [4, redisClient.get(key)];
                    case 1:
                        cachedData = _a.sent();
                        cachedReceipt = JSON.parse(cachedData);
                        return [3, 3];
                    case 2:
                        cachedReceipt = _cacheRawTxReceipt.get(key);
                        _a.label = 3;
                    case 3:
                        if (cachedReceipt) {
                            return [2, cachedReceipt];
                        }
                        if (!_isRequestingReceipt.get(txid)) return [3, 5];
                        return [4, sota_common_1.Utils.timeout(500)];
                    case 4:
                        _a.sent();
                        return [2, this.getRawTransactionReceipt(txid)];
                    case 5:
                        _isRequestingReceipt.set(txid, true);
                        return [4, web3_1.web3.eth.getTransactionReceipt(txid)];
                    case 6:
                        receipt = _a.sent();
                        _isRequestingReceipt.delete(txid);
                        if (!receipt) {
                            gwName = this.constructor.name;
                            throw new Error(gwName + "::getRawTransactionReceipt could not get receipt txid=" + txid);
                        }
                        if (redisClient) {
                            redisClient.setex(key, 120, JSON.stringify(receipt));
                        }
                        else {
                            _cacheRawTxReceipt.set(key, receipt);
                        }
                        return [2, receipt];
                }
            });
        });
    };
    EthGateway.prototype.getErc20TokenInfo = function (contractAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var contract, _a, networkSymbol, name_1, decimals, symbol, e_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        contractAddress = this.normalizeAddress(contractAddress);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        contract = new web3_1.web3.eth.Contract(erc20_json_1.default, contractAddress);
                        return [4, Promise.all([
                                contract.methods.symbol().call(),
                                contract.methods.name().call(),
                                contract.methods.decimals().call(),
                            ])];
                    case 2:
                        _a = _b.sent(), networkSymbol = _a[0], name_1 = _a[1], decimals = _a[2];
                        symbol = [sota_common_1.TokenType.ERC20, contractAddress].join('.');
                        return [2, {
                                symbol: symbol,
                                networkSymbol: networkSymbol.toLowerCase(),
                                tokenType: sota_common_1.TokenType.ERC20,
                                name: name_1,
                                platform: sota_common_1.BlockchainPlatform.Ethereum,
                                isNative: false,
                                isUTXOBased: false,
                                contractAddress: contractAddress,
                                decimals: decimals,
                                humanReadableScale: decimals,
                                nativeScale: 0,
                                hasMemo: false,
                            }];
                    case 3:
                        e_2 = _b.sent();
                        logger.error("EthGateway::getErc20TokenInfo could not get info contract=" + contractAddress + " due to error:");
                        logger.error(e_2);
                        return [2, null];
                    case 4: return [2];
                }
            });
        });
    };
    EthGateway.prototype.getChainId = function () {
        var config = sota_common_1.CurrencyRegistry.getCurrencyConfig(this._currency);
        return Number(config.chainId);
    };
    EthGateway.prototype.getChainName = function () {
        var config = sota_common_1.CurrencyRegistry.getCurrencyConfig(this._currency);
        return config.chainName;
    };
    EthGateway.prototype.estimateFee = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var gasPrice, _a, _b, gasLimit, fee;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _b = (_a = web3_1.web3.utils).toBN;
                        return [4, this.getGasPrice(options.useLowerNetworkFee)];
                    case 1:
                        gasPrice = _b.apply(_a, [_c.sent()]);
                        gasLimit = web3_1.web3.utils.toBN(options.isConsolidate ? 21000 : 150000);
                        fee = gasLimit.mul(gasPrice);
                        return [2, new sota_common_1.BigNumber(fee.toString())];
                }
            });
        });
    };
    EthGateway.prototype._getOneBlock = function (blockNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var block, txids;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, web3_1.web3.eth.getBlock(EthTypeConverter.toBlockType(blockNumber))];
                    case 1:
                        block = _a.sent();
                        if (!block) {
                            return [2, null];
                        }
                        txids = block.transactions.map(function (tx) { return (tx.hash ? tx.hash : tx.toString()); });
                        return [2, new sota_common_1.Block(Object.assign({}, block), txids)];
                }
            });
        });
    };
    EthGateway.prototype._getOneTransaction = function (txid) {
        return __awaiter(this, void 0, void 0, function () {
            var tx, _a, receipt, block, lastNetworkBlockNumber;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4, this.getRawTransaction(txid)];
                    case 1:
                        tx = _b.sent();
                        if (!tx) {
                            return [2, null];
                        }
                        return [4, Promise.all([
                                this.getRawTransactionReceipt(txid),
                                this.getOneBlock(tx.blockNumber),
                                this.getBlockCount(),
                            ])];
                    case 2:
                        _a = _b.sent(), receipt = _a[0], block = _a[1], lastNetworkBlockNumber = _a[2];
                        return [2, new EthTransaction_1.EthTransaction(tx, block, receipt, lastNetworkBlockNumber)];
                }
            });
        });
    };
    __decorate([
        sota_common_1.override,
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String]),
        __metadata("design:returntype", void 0)
    ], EthGateway.prototype, "normalizeAddress", null);
    __decorate([
        sota_common_1.implement,
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String, String, sota_common_1.BigNumber, Object]),
        __metadata("design:returntype", Promise)
    ], EthGateway.prototype, "constructRawTransaction", null);
    return EthGateway;
}(sota_common_1.AccountBasedGateway));
exports.EthGateway = EthGateway;
exports.default = EthGateway;
//# sourceMappingURL=EthGateway.js.map