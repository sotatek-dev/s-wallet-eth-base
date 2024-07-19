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
exports.EthCrawler = void 0;
var sota_common_1 = require("sota-common");
var EthCrawler = (function (_super) {
    __extends(EthCrawler, _super);
    function EthCrawler(options) {
        var _this = _super.call(this, sota_common_1.BlockchainPlatform.Ethereum, options) || this;
        _this._processingTimeout = 300000;
        return _this;
    }
    return EthCrawler;
}(sota_common_1.BasePlatformCrawler));
exports.EthCrawler = EthCrawler;
exports.default = EthCrawler;
//# sourceMappingURL=EthCrawler.js.map