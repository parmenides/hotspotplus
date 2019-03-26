import { getRabbitMqChannel } from './utils/rabbitmq';
import { ancestorWhere } from 'tslint';
import { NetflowReportRequestTask, QUEUES, REPORT_TYPE } from './typings';
import { addEnrichmentTasks } from './worker/scheduler';
import momentTz from 'moment-timezone';

export const testRunner = async () => {
  const channel = await getRabbitMqChannel();
  const LOG_WORKER_QUEUE = QUEUES.LOG_WORKER_QUEUE;

  const from = new Date('2019-03-25T00:00:00').getTime();
  const to = new Date('2019-03-27T23:59:59').getTime();

  /*const message: NetflowReportRequestTask = {
    reportRequestId: '123123123123',
    businessId: '3724627346278346',
    reportType: REPORT_TYPE.NETFLOW,
    dstAddress: '172.217.18.3',
    username: '9',
    dstPort: 443,
  };
  console.log('add test task', message);
  await channel.sendToQueue(
    LOG_WORKER_QUEUE,
    Buffer.from(JSON.stringify(message)),
  );
  await channel.close();*/
  // await channel.close();
  //await addEnrichmentTasks(from, to, 'syslog' as REPORT_TYPE.SYSLOG);
  await addEnrichmentTasks(from, to, 'netflow' as REPORT_TYPE.NETFLOW);
};
