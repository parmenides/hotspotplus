"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bunyan_1 = __importDefault(require("bunyan"));
exports.createLogger = () => {
    const level = process.env.LOG_LEVEL;
    let streams;
    if (process.env.LOG_LEVEL && process.env.LOG_PATH) {
        streams = [
            {
                path: process.env.LOG_PATH,
            },
        ];
    }
    return bunyan_1.default.createLogger({
        name: 'log-worker',
        streams,
        level,
    });
};
exports.default = {
    createLogger: exports.createLogger,
};
//# sourceMappingURL=logger.js.map