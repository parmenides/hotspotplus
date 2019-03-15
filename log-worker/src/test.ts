import { getRabbitMqChannel } from './utils/rabbitmq';
import { ancestorWhere } from 'tslint';
import { QUEUES, REPORT_TYPE } from './typings';
import { addEnrichmentTasks } from './worker/scheduler';
import momentTz from 'moment-timezone';

export const testRunner = async () => {
  const channel = await getRabbitMqChannel();
  const LOG_WORKER_QUEUE = QUEUES.LOG_WORKER_QUEUE;

  const from = new Date('2019-03-01T00:00:00').getTime();
  const to = new Date('2019-03-05T23:59:59').getTime();

  // const message: ReportRequestTask = {
  //     reportType: ReportType.SYSLOG,
  //     username: '2',
  //     fromDate: from,
  //     toDate: to,
  //     businessId: '5c46c8694f9e8400d37c66b4',
  //     reportRequestId: '5c548d57f29d60009dbef67d',
  //     memberId: '5c472bc538a573001cb1ae2d',
  // };
  // console.log('add test task', message);
  // await channel.sendToQueue(
  //     LOG_WORKER_QUEUE,
  //     Buffer.from(JSON.stringify(message)),
  // );
  // await channel.close();
  // await channel.close();
  //await addEnrichmentTasks(from, to, 'syslog' as REPORT_TYPE.SYSLOG);
  await addEnrichmentTasks(from, to, 'netflow' as REPORT_TYPE.NETFLOW);
};
