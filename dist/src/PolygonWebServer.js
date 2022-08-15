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
var EthWebServer_1 = require("./EthWebServer");
var logger = sota_common_1.getLogger('PolygonWebServer');
var PolygonWebServer = (function (_super) {
    __extends(PolygonWebServer, _super);
    function PolygonWebServer() {
        return _super.call(this, sota_common_1.BlockchainPlatform.Polygon) || this;
    }
    return PolygonWebServer;
}(EthWebServer_1.EthWebServer));
exports.PolygonWebServer = PolygonWebServer;
//# sourceMappingURL=PolygonWebServer.js.map