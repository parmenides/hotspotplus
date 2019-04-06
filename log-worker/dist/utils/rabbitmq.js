"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const amqplib_1 = __importDefault(require("amqplib"));
if (!process.env.RABBITMQ_USERNAME || !process.env.RABBITMQ_PASSWORD) {
    throw new Error('invalid rabbit credentials');
}
let connection;
exports.getRabbitMqConnection = async () => {
    if (connection !== undefined) {
        return connection;
    }
    connection = await amqplib_1.default.connect(`amqp://${process.env.RABBITMQ_USERNAME}:${process.env.RABBITMQ_PASSWORD}@rabbitmq`);
    return connection;
};
exports.getRabbitMqChannel = async () => {
    const amqpConnection = await exports.getRabbitMqConnection();
    return amqpConnection.createConfirmChannel();
};
//# sourceMappingURL=rabbitmq.js.map