"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const HTTP_KEEP_ALIVE_TIME = 5 * 60 * 1000;
const HTTP_TIME_OUT = 8000;
exports.createHttpClient = (apiBaseUrl) => {
    return axios_1.default.create({
        baseURL: apiBaseUrl,
        timeout: HTTP_TIME_OUT,
        httpAgent: new http_1.default.Agent({
            keepAlive: true,
            keepAliveMsecs: HTTP_KEEP_ALIVE_TIME,
        }),
        httpsAgent: new https_1.default.Agent({
            keepAlive: true,
            keepAliveMsecs: HTTP_KEEP_ALIVE_TIME,
        }),
    });
};
//# sourceMappingURL=httpClient.js.map