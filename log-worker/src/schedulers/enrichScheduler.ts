import moment, { Moment } from 'moment';
import { getRabbitMqChannel } from '../utils/rabbitmq';
import { EnrichTask, LOGGER_TIME_ZONE, QUEUES, REPORT_TYPE } from '../typings';
import logger from '../utils/logger';
import { CronJob } from 'cron';
import momentTz from 'moment-timezone';

const log = logger.createLogger();
//minutes
const ENRICHMENT_SCOPE = Number(process.env.ENRICHMENT_SCOPE);

export const addEnrichmentTasks = async (reportType: REPORT_TYPE) => {
  try {
    const toDate = momentTz.tz(LOGGER_TIME_ZONE);
    const fromDate = toDate.clone();
    fromDate.subtract({ minute: ENRICHMENT_SCOPE });

    log.debug(
      `Add enrichment scope for : ${REPORT_TYPE} from ${fromDate} to ${toDate}`,
    );
    const channel = await getRabbitMqChannel();

    const durationInBetween = moment.duration(toDate.diff(fromDate));
    const hours = Math.ceil(durationInBetween.asHours());
    const RUN_TASK_EVERY_MINUTES = 5;
    const taskLen: any[] = new Array(hours * (60 / RUN_TASK_EVERY_MINUTES));

    for (const t of taskLen) {
      const start = fromDate.clone();

      fromDate.add({
        minutes: RUN_TASK_EVERY_MINUTES,
      });
      const end = fromDate.clone();
      const enrichTask: EnrichTask = {
        from: start,
        to: end,
        reportType,
      };

      log.debug(
        `add new ${enrichTask.reportType} enrichment task from ${moment(
          enrichTask.from,
        ).format('YYYY.MM.DD hh:mm')} to ${moment(enrichTask.to).format(
          'YYYY.MM.DD hh:mm',
        )}`,
      );

      const addResult = await channel.sendToQueue(
        QUEUES.LOG_ENRICHMENT_WORKER_QUEUE,
        Buffer.from(JSON.stringify(enrichTask)),
      );
      log.debug('enrich task added', addResult);
    }
  } catch (e) {
    log.error(e);
    throw e;
  }
};

export const startEnrichScheduler = () => {
  const job = new CronJob('0 */1 * * *', async () => {
    await addEnrichmentTasks(REPORT_TYPE.NETFLOW);
    await addEnrichmentTasks(REPORT_TYPE.SYSLOG);
  });
  job.start();
};

if (process.env.START_MANUAL_ENRICHMENT === 'true') {
  if (!ENRICHMENT_SCOPE) {
    throw new Error('ENRICHMENT_SCOPE is empty, so why manual enrichment?');
  }
  log.debug('going to add enrichment task..... manually');
  addEnrichmentTasks(REPORT_TYPE.NETFLOW);
  addEnrichmentTasks(REPORT_TYPE.SYSLOG);
}
