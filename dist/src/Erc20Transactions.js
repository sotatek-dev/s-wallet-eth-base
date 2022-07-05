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
var Erc20Transactions = (function (_super) {
    __extends(Erc20Transactions, _super);
    function Erc20Transactions() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Erc20Transactions;
}(sota_common_1.GenericTransactions));
exports.Erc20Transactions = Erc20Transactions;
exports.default = Erc20Transactions;
//# sourceMappingURL=Erc20Transactions.js.map