import { getRabbitMqChannel } from './utils/rabbitmq';
import netflowModule from './worker/netflow';
import {
  NetflowReportRequestTask,
  QUEUES,
  REPORT_TYPE,
  SyslogReportRequestTask,
} from './typings';
import { addEnrichmentTasks } from './worker/enrichScheduler';
import momentTz from 'moment-timezone';
import { countAndUpdateBusinessReports } from './worker/counterScheduler';

export const testRunner = async () => {
  const channel = await getRabbitMqChannel();
  const LOG_WORKER_QUEUE = QUEUES.LOG_WORKER_QUEUE;

  const from = new Date('2019-03-25T00:00:00').getTime();
  const to = new Date('2019-03-28T23:59:59').getTime();

  /*const message: SyslogReportRequestTask = {
    reportRequestId: '123123123123',
    businessId: '3724627346278346',
    reportType: REPORT_TYPE.SYSLOG,
  };
  console.log('add test task', message);
  await channel.sendToQueue(
    LOG_WORKER_QUEUE,
    Buffer.from(JSON.stringify(message)),
  );
  await channel.close();*/
  const res = await countAndUpdateBusinessReports();

  // await channel.close();;;
  //await addEnrichmentTasks(from, to, 'syslog' as REPORT_TYPE.SYSLOG);
  //await addEnrichmentTasks(from, to, 'netflow' as REPORT_TYPE.NETFLOW);
};
