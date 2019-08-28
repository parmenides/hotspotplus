import { QUEUES } from '../typings';
import { getRabbitMqChannel } from '../utils/rabbitmq';
import logger from '../utils/logger';

const log = logger.createLogger();
const LOG_REQUEST_RETRY_MS = Number(process.env.LOG_REQUEST_RETRY_MS);

export const addDefaultQueue = async () => {
  try {
    const channel = await getRabbitMqChannel();
    // Add log worker queue
    await channel.assertExchange(QUEUES.LOG_WORKER_EXCHANGE, 'fanout', {
      durable: true,
    });
    
    await channel.assertQueue(QUEUES.LOG_WORKER_QUEUE, {
      deadLetterExchange: QUEUES.RETRY_LOG_WORKER_EXCHANGE,
      durable: true,
    });
    await channel.bindQueue(
      QUEUES.LOG_WORKER_QUEUE,
      QUEUES.LOG_WORKER_EXCHANGE,
      '',
    );

    // Add retry queue
    await channel.assertExchange(QUEUES.RETRY_LOG_WORKER_EXCHANGE, 'fanout', {
      durable: true,
    });
    await channel.assertQueue(QUEUES.RETRY_LOG_WORKER_QUEUE, {
      deadLetterExchange: QUEUES.LOG_WORKER_EXCHANGE,
      durable: true,
      messageTtl: LOG_REQUEST_RETRY_MS,
    });
    await channel.bindQueue(
      QUEUES.RETRY_LOG_WORKER_QUEUE,
      QUEUES.RETRY_LOG_WORKER_EXCHANGE,
      '',
    );
    log.debug('Default report queues added');

    await channel.assertExchange(
      QUEUES.LOG_ENRICHMENT_WORKER_QUEUE_EXCHANGE,
      'fanout',
      {
        durable: true,
      },
    );
    await channel.assertQueue(QUEUES.LOG_ENRICHMENT_WORKER_QUEUE, {
      deadLetterExchange: QUEUES.RETRY_LOG_ENRICHMENT_WORKER_QUEUE_EXCHANGE,
      durable: true,
    });
    await channel.bindQueue(
      QUEUES.LOG_ENRICHMENT_WORKER_QUEUE,
      QUEUES.LOG_ENRICHMENT_WORKER_QUEUE_EXCHANGE,
      '',
    );

    // Add retry queue
    await channel.assertExchange(
      QUEUES.RETRY_LOG_ENRICHMENT_WORKER_QUEUE_EXCHANGE,
      'fanout',
      {
        durable: true,
      },
    );
    await channel.assertQueue(QUEUES.RETRY_LOG_ENRICHMENT_WORKER_QUEUE, {
      deadLetterExchange: QUEUES.LOG_ENRICHMENT_WORKER_QUEUE_EXCHANGE,
      durable: true,
      messageTtl: LOG_REQUEST_RETRY_MS,
    });
    await channel.bindQueue(
      QUEUES.RETRY_LOG_ENRICHMENT_WORKER_QUEUE,
      QUEUES.RETRY_LOG_ENRICHMENT_WORKER_QUEUE_EXCHANGE,
      '',
    );
  } catch (error) {
    log.error(error);
    log.error('failed to add default queue');
    throw error;
  }
};
