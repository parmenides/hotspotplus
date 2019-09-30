import { createLogger } from './utils/logger';
import render from "./reportEngine";
const log = createLogger();
export const testRunner = async () => {
  //const result = await render();
  log.debug('Done');
  //const from = new Date('2019-03-25T00:00:00').getTime();
  //const to = new Date('2019-03-28T23:59:59').getTime();

  /*
  const message: NetflowReportRequestTask = {
    type: REPORT_TYPE.NETFLOW,
    id: '123',
  };

  await channel.sendToQueue(
    LOG_WORKER_QUEUE,
    Buffer.from(JSON.stringify(message)),
  );
  await channel.close();
*/
  //const res = await countAndUpdateBusinessReports();

  // await channel.close();;;
  //await addEnrichmentTasks(from, to, 'syslog' as REPORT_TYPE.SYSLOG);
  //await addEnrichmentTasks(from, to, 'netflow' as REPORT_TYPE.NETFLOW);
};
