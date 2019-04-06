"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const elasticsearch_1 = __importDefault(require("elasticsearch"));
const elastic = new elasticsearch_1.default.Client({
    // @ts-ignore
    hosts: `${process.env.ELASTIC_IP}:${process.env.ELASTIC_PORT}`,
    apiVersion: '6.7',
    log: process.env.ELASTICSEARCH_LOG_LEVEL || 'info',
});
exports.default = elastic;
//# sourceMappingURL=elastic.js.map