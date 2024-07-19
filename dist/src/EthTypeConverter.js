"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toBlockType = void 0;
function toBlockType(blockNumber) {
    if (typeof blockNumber === 'number') {
        return blockNumber;
    }
    switch (blockNumber) {
        case 'latest':
            return 'latest';
        case 'genesis':
            return 'genesis';
        case 'pending':
            return 'pending';
        default:
            throw new Error("Invalid blockType value: " + blockNumber);
    }
}
exports.toBlockType = toBlockType;
//# sourceMappingURL=EthTypeConverter.js.map