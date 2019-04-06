"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typings_1 = require("../typings");
const rabbitmq_1 = require("../utils/rabbitmq");
const logger_1 = __importDefault(require("../utils/logger"));
const log = logger_1.default.createLogger();
const LOG_REQUEST_RETRY_MS = Number(process.env.LOG_REQUEST_RETRY_MS);
exports.addDefaultQueue = async () => {
    try {
        const channel = await rabbitmq_1.getRabbitMqChannel();
        // Add log worker queue
        await channel.assertExchange(typings_1.QUEUES.LOG_WORKER_EXCHANGE, 'fanout', {
            durable: true,
        });
        await channel.assertQueue(typings_1.QUEUES.LOG_WORKER_QUEUE, {
            deadLetterExchange: typings_1.QUEUES.RETRY_LOG_WORKER_EXCHANGE,
            durable: true,
        });
        await channel.bindQueue(typings_1.QUEUES.LOG_WORKER_QUEUE, typings_1.QUEUES.LOG_WORKER_EXCHANGE, '');
        // Add retry queue
        await channel.assertExchange(typings_1.QUEUES.RETRY_LOG_WORKER_EXCHANGE, 'fanout', {
            durable: true,
        });
        await channel.assertQueue(typings_1.QUEUES.RETRY_LOG_WORKER_QUEUE, {
            deadLetterExchange: typings_1.QUEUES.LOG_WORKER_EXCHANGE,
            durable: true,
            messageTtl: LOG_REQUEST_RETRY_MS,
        });
        await channel.bindQueue(typings_1.QUEUES.RETRY_LOG_WORKER_QUEUE, typings_1.QUEUES.RETRY_LOG_WORKER_EXCHANGE, '');
        log.debug('Default report queues added');
        await channel.assertExchange(typings_1.QUEUES.LOG_ENRICHMENT_WORKER_QUEUE_EXCHANGE, 'fanout', {
            durable: true,
        });
        await channel.assertQueue(typings_1.QUEUES.LOG_ENRICHMENT_WORKER_QUEUE, {
            deadLetterExchange: typings_1.QUEUES.RETRY_LOG_ENRICHMENT_WORKER_QUEUE_EXCHANGE,
            durable: true,
        });
        await channel.bindQueue(typings_1.QUEUES.LOG_ENRICHMENT_WORKER_QUEUE, typings_1.QUEUES.LOG_ENRICHMENT_WORKER_QUEUE_EXCHANGE, '');
        // Add retry queue
        await channel.assertExchange(typings_1.QUEUES.RETRY_LOG_ENRICHMENT_WORKER_QUEUE_EXCHANGE, 'fanout', {
            durable: true,
        });
        await channel.assertQueue(typings_1.QUEUES.RETRY_LOG_ENRICHMENT_WORKER_QUEUE, {
            deadLetterExchange: typings_1.QUEUES.LOG_ENRICHMENT_WORKER_QUEUE_EXCHANGE,
            durable: true,
            messageTtl: LOG_REQUEST_RETRY_MS,
        });
        await channel.bindQueue(typings_1.QUEUES.RETRY_LOG_ENRICHMENT_WORKER_QUEUE, typings_1.QUEUES.RETRY_LOG_ENRICHMENT_WORKER_QUEUE_EXCHANGE, '');
    }
    catch (error) {
        log.error(error);
        log.error('failed to add default queue');
        throw error;
    }
};
//# sourceMappingURL=initRabbitMq.js.map