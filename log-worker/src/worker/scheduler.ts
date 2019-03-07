import moment, { Moment } from 'moment';
import { getRabbitMqChannel } from '../utils/rabbitmq';
import { QUEUES } from '../typings';
import { EnrichTask } from './enrich';
import logger from '../utils/logger';
import { CronJob } from 'cron';

const log = logger.createLogger();

export const addEnrichmentTasks = async (
  from: number,
  to: number,
  reportType: string,
) => {
  try {
    log.debug('addEnrichmentTasks');
    const fromDate: Moment = moment(from);
    const toDate: Moment = moment(to);
    const channel = await getRabbitMqChannel();

    const duration = moment.duration(toDate.diff(fromDate));
    const hours = Math.ceil(duration.asHours());
    const taskLen: Array<any> = new Array(hours);
    for (const t of taskLen) {
      const start = fromDate.valueOf();
      fromDate.add({
        hours: 1,
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

const job = new CronJob('* 10 * * * *', function() {
  log.debug('starting the job');
});

job.start();
