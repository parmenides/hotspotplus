import logger from '../utils/logger';
import { CronJob } from 'cron';
import { login } from '../utils/auth';
import { createHttpClient } from '../utils/httpClient';
import netflowModule from '../modules/netflow';
import syslogModule from '../modules/syslog';
import momentTz from 'moment-timezone';
import { LOGGER_TIME_ZONE, REPORT_TYPE } from '../typings';

const BUSINESS_API = `${process.env.API_ADDRESS}/api/Businesses`;

const log = logger.createLogger();

export const countAndUpdateBusinessReports = async () => {
  const to = momentTz.tz(Date.now(), LOGGER_TIME_ZONE);
  to.add({ days: 1 });
  to.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
  const from = to.clone().subtract({ days: 30 });

  const netflowBusinessReportCount = await netflowModule.countBusinessReports(
    from,
    to,
  );
  const netflowReportsArray: Array<{ businessId: string; count: number }> = [];
  for (const businessId in netflowBusinessReportCount) {
    netflowReportsArray.push({
      businessId,
      count: netflowBusinessReportCount[businessId],
    });
  }
  for (const report of netflowReportsArray) {
    try {
      await updateBusiness(report.businessId, {
        netflowReportCount: report.count,
      });
    } catch (e) {
      log.error(e);
    }
  }

  const businessReportCount = await syslogModule.countBusinessReports(from, to);
  const reportsArray: Array<{ businessId: string; count: number }> = [];
  for (const businessId in businessReportCount) {
    reportsArray.push({ businessId, count: businessReportCount[businessId] });
  }
  for (const report of reportsArray) {
    try {
      await updateBusiness(report.businessId, {
        syslogReportCount: report.count,
      });
    } catch (e) {
      log.error(e);
    }
  }
};

const updateBusiness = async (businessId: string, update: {}) => {
  const token = await login(
    // @ts-ignore
    process.env.SERVICE_MAN_USERNAME,
    process.env.SERVICE_MAN_PASSWORD,
  );
  const httpClient = createHttpClient(`${BUSINESS_API}`);
  await httpClient.patch(`/${businessId}`, update, {
    headers: {
      authorization: token,
    },
  });
};

export const startCounterScheduler = () => {
  const job = new CronJob('0 */2 * * *', async () => {
    await countAndUpdateBusinessReports();
    log.debug('report count updated as scheduled', new Date());
  });

  job.start();
};

if (process.env.START_MANUAL_COUNTER === 'true') {
  countAndUpdateBusinessReports();
}
