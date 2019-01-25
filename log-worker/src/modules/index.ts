import logger from '../utils/logger';
import { getRabbitMqChannel } from '../utils/rabbitmq';
import { createHttpClient } from '../utils/httpClient';
import { AxiosResponse } from 'axios';

const LOG_WORKER_QUEUE = process.env.LOG_WORKER_QUEUE;
const log = logger.createLogger();
const API_BASE = process.env.CORE_API;
if (!LOG_WORKER_QUEUE) {
  throw new Error('invalid settings');
}

interface ReportRequestTask {
  reportId: string;
}

const processPaymentRequests = async () => {
  log.debug('At processing payment requests');
  const channel = await getRabbitMqChannel();
  process.once('SIGINT', async () => {
    await channel.close();
  });

  channel.consume(
    LOG_WORKER_QUEUE,
    async (message) => {
      if (!message) {
        log.debug('empty message:', message);
        throw new Error('empty message');
      }

      const body = message.content.toString();
      log.debug(" [x] Received '%s'", body);
      const logTask: ReportRequestTask = JSON.parse(body);

      try {
        //todo
      } catch (error) {
        log.error(error);
        log.error(error.message);
        log.error(error.stack);
        log.error(error.trace());
        // @ts-ignore
        channel.nack(message, false, false);
      }
    },
    { noAck: false },
  );
};

export default {
  processPaymentRequests,
};
