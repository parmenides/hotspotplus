"use strict";
/**
 * Created by hamidehnouri on 9/21/2016 AD.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("./logger"));
const httpClient_1 = require("./httpClient");
if (!process.env.SERVICE_MAN_USERNAME ||
    !process.env.SERVICE_MAN_PASSWORD ||
    !process.env.API_ADDRESS) {
    throw new Error('invalid auth env variables');
}
const API_ADDRESS = process.env.API_ADDRESS;
const log = logger_1.default.createLogger();
exports.login = async (username, password) => {
    const httpClient = httpClient_1.createHttpClient(API_ADDRESS);
    const response = await httpClient.post('/api/Users/login', {
        username,
        password,
    });
    return response.data.id;
};
//# sourceMappingURL=auth.js.map