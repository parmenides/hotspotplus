import moment, {Moment} from 'moment';
import {getRabbitMqChannel} from '../utils/rabbitmq';
import {EnrichTask, QUEUES, REPORT_TYPE} from '../typings';
import logger from '../utils/logger';
import {CronJob} from 'cron';

const log = logger.createLogger();
const ENRICHMENT_SCOPE = Number(process.env.ENRICHMENT_SCOPE);
export const addEnrichmentTasks = async (
  reportType: REPORT_TYPE,
) => {
  try {
    log.debug('Add Enrichment Tasks: ',REPORT_TYPE);
    const now = Date.now();
    const toDate: Moment = moment(now);
    const fromDate = toDate.clone().subtract({minute:ENRICHMENT_SCOPE});

    const channel = await getRabbitMqChannel();

    const duration = moment.duration(toDate.diff(fromDate));
    const hours = Math.ceil(duration.asHours());
    const RUN_TASK_EVERY_MINUTES = 5;
    const taskLen: any[] = new Array(hours * (60 / RUN_TASK_EVERY_MINUTES));
    for (const t of taskLen) {
      const start = fromDate.valueOf();
      fromDate.add({
        minutes: RUN_TASK_EVERY_MINUTES,
      });

      const end = fromDate.valueOf();
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
      await channel.sendToQueue(
        QUEUES.LOG_ENRICHMENT_WORKER_QUEUE,
        Buffer.from(JSON.stringify(enrichTask)),
      );
    }
  } catch (e) {
    log.error(e);
    throw e;
  }
};

const job = new CronJob('0 */1 * * *', async ()=> {
  await addEnrichmentTasks(REPORT_TYPE.NETFLOW);
  await addEnrichmentTasks(REPORT_TYPE.SYSLOG);
});

job.start();
