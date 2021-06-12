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
Object.defineProperty(exports, "__esModule", { value: true });
var sota_common_1 = require("sota-common");
var web3_1 = require("./web3");
var Erc20Transaction = (function (_super) {
    __extends(Erc20Transaction, _super);
    function Erc20Transaction(currency, txProps, receipt) {
        var _this = this;
        if (!web3_1.web3.utils.isAddress(currency.contractAddress)) {
            throw new Error("Invalid ERC20 contract address: " + currency.contractAddress);
        }
        _this = _super.call(this, txProps) || this;
        _this.receiptStatus = receipt.status;
        _this.receipt = receipt;
        _this.originalTx = txProps.originalTx;
        _this.isFailed = !_this.receiptStatus;
        return _this;
    }
    Erc20Transaction.prototype.getExtraDepositData = function () {
        return Object.assign({}, _super.prototype.getExtraDepositData.call(this), {
            contractAddress: this.currency.contractAddress,
            tokenSymbol: this.currency.symbol,
            txIndex: this.receipt.transactionIndex,
        });
    };
    Erc20Transaction.prototype.getNetworkFee = function () {
        var gasUsed = web3_1.web3.utils.toBN(this.receipt.gasUsed);
        var gasPrice = web3_1.web3.utils.toBN(this.originalTx.gasPrice);
        return new sota_common_1.BigNumber(gasPrice.mul(gasUsed).toString());
    };
    return Erc20Transaction;
}(sota_common_1.MultiEntriesTransaction));
exports.Erc20Transaction = Erc20Transaction;
exports.default = Erc20Transaction;
//# sourceMappingURL=Erc20Transaction.js.map