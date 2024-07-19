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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EthTransaction = void 0;
var sota_common_1 = require("sota-common");
var web3_1 = require("./web3");
var EthTransaction = (function (_super) {
    __extends(EthTransaction, _super);
    function EthTransaction(tx, block, receipt, lastNetworkBlockNumber) {
        var _this = this;
        var currency = sota_common_1.CurrencyRegistry.getOneNativeCurrency(sota_common_1.BlockchainPlatform.Ethereum);
        var txProps = {
            confirmations: lastNetworkBlockNumber - tx.blockNumber + 1,
            height: tx.blockNumber,
            timestamp: block.timestamp,
            txid: tx.hash,
            fromAddress: tx.from,
            toAddress: tx.to,
            amount: new sota_common_1.BigNumber(tx.value),
        };
        _this = _super.call(this, currency, txProps, block) || this;
        _this.receiptStatus = receipt.status;
        _this.block = block;
        _this.receipt = receipt;
        _this.originalTx = tx;
        _this.isFailed = !_this.receiptStatus;
        return _this;
    }
    EthTransaction.prototype.getExtraDepositData = function () {
        return Object.assign({}, _super.prototype.getExtraDepositData.call(this), {
            txIndex: this.receipt.transactionIndex,
        });
    };
    EthTransaction.prototype.getNetworkFee = function () {
        var gasUsed = web3_1.web3.utils.toBN(this.receipt.gasUsed);
        var gasPrice = web3_1.web3.utils.toBN(this.originalTx.gasPrice);
        return new sota_common_1.BigNumber(gasPrice.mul(gasUsed).toString());
    };
    return EthTransaction;
}(sota_common_1.AccountBasedTransaction));
exports.EthTransaction = EthTransaction;
exports.default = EthTransaction;
//# sourceMappingURL=EthTransaction.js.map