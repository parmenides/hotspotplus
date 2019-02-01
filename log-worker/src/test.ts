import { getRabbitMqChannel } from './utils/rabbitmq';
import { ReportRequestTask } from './worker';
import { ancestorWhere } from 'tslint';

export const testRunner = async () => {
  const channel = await getRabbitMqChannel();
  const LOG_WORKER_QUEUE = 'LOG_WORKER_QUEUE';

  const from = new Date('2019-01-21T00:00:00+03:30').getTime();
  const to = new Date('2019-01-29T23:59:59+03:30').getTime();

  const message: ReportRequestTask = {
    username: 'parmenides',
    fromDate: from,
    toDate: to,
    businessId: '5c46c8694f9e8400d37c66b4',
    reportRequestId: '5c548d57f29d60009dbef67d',
    memberId: '5c472bc538a573001cb1ae2d',
  };
  await channel.sendToQueue(
    LOG_WORKER_QUEUE,
    Buffer.from(JSON.stringify(message)),
  );
  await channel.close();
  console.log('message sent', message);
};
