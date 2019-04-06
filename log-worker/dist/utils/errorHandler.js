"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("./logger"));
const log = logger_1.default.createLogger();
// tslint:disable-next-line
const isDev = process.env.DEV == 'true';
const errorHandler = (error, req, res, next) => {
    if (isDev) {
        if (!error.status || error.status > 499) {
            // tslint:disable-next-line no-console
            console.log(error.stack);
            log.error('Error:', error);
            //log.error('Main Error Handler:', error.stack);
        }
    }
    res.status(error.status || 500);
    res.send({ message: error.message });
};
exports.default = errorHandler;
//# sourceMappingURL=errorHandler.js.map