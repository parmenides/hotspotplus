import netflowModule, { NetflowAggregateByIp } from './netflow';
import syslogModule, { SyslogAggregateByIp } from './syslog';
import sessionModule from './session';
import { getRabbitMqChannel } from '../utils/rabbitmq';
import { QUEUES } from '../typings';
import logger from '../utils/logger';

const log = logger.createLogger();

export interface EnrichTask {
  from: number;
  to: number;
  reportType: string;
}

export const enrichLogs = async () => {
  log.debug('At processing enrichment requests');
  const channel = await getRabbitMqChannel();
  process.once('SIGINT', async () => {
    await channel.close();
  });

  channel.consume(
    QUEUES.LOG_ENRICHMENT_WORKER_QUEUE,
    async (message) => {
      if (!message) {
        log.debug('empty message:', message);
        throw new Error('empty message');
      }

      const body = message.content.toString();
      log.debug(" [x] enrichment message received '%s'", body);
      const enrichTask: EnrichTask = JSON.parse(body);

      try {
        const from = enrichTask.from;
        const to = enrichTask.to;
        const reportType = enrichTask.reportType;

        if (reportType === 'syslog') {
          const result = await syslogModule.syslogGroupByIp(from, to);
          const ipData = getIpData(result);
          await searchAndUpdateReport(
            reportType,
            ipData,
            syslogModule.updateSyslogs,
            from,
            to,
          );
        } else if (reportType === 'netflow') {
          const result = await netflowModule.netflowGroupByIp(from, to);
          const ipData = getIpData(result);
          await searchAndUpdateReport(
            reportType,
            ipData,
            netflowModule.updateNetflows,
            from,
            to,
          );
        } else {
          log.warn('unknown enrichment type:', reportType);
          channel.ack(message);
          return;
        }
        channel.ack(message);
      } catch (error) {
        log.error(error);
        channel.nack(message, false, false);
      }
    },
    { noAck: false },
  );
};

const getIpData = (
  groupedReports: Array<NetflowAggregateByIp | SyslogAggregateByIp>,
) => {
  const ips: { [key: string]: string[] } = {};
  for (const aggregateResult of groupedReports) {
    for (const nasIpBucket of aggregateResult.group_by_nas_ip.buckets) {
      const nasIp = nasIpBucket.key;
      ips[nasIp] = [];
      for (const memberIpBucket of nasIpBucket.group_by_member_ip.buckets) {
        const memberIp = memberIpBucket.key;
        ips[nasIp].push(memberIp);
      }
    }
  }

  const ipData = [];
  for (const nasIp in ips) {
    ipData.push({ nasIp: nasIp, memberIpList: ips[nasIp] });
  }
  return ipData;
};

const searchAndUpdateReport = async (
  reportType: string,
  ipData: { nasIp: string; memberIpList: string[] }[],
  updateReportFunction: Function,
  from: number,
  to: number,
) => {
  for (const flowData of ipData) {
    const nasIp = flowData.nasIp;
    for (const memberIp of flowData.memberIpList) {
      const groupedSessions = await sessionModule.querySessionsByIp(
        nasIp,
        memberIp,
        from,
        to,
      );
      if (groupedSessions.group_by_username.buckets.length === 1) {
        const a_session = groupedSessions.group_by_username.buckets[0];
        const username = a_session.key;
        const nasId = a_session.extra.hits.hits[0]._source.nasId;
        const memberId = a_session.extra.hits.hits[0]._source.memberId;
        const businessId = a_session.extra.hits.hits[0]._source.businessId;
        const updateResult = await updateReportFunction(
          from,
          to,
          nasIp,
          memberIp,
          {
            nasId,
            memberId,
            businessId,
            username,
          },
        );
        log.debug(`${reportType} report update result`, updateResult);
      } else if (groupedSessions.group_by_username.buckets.length > 1) {
        const channel = await getRabbitMqChannel();
        //split range in two;
        const newTo = from + (to - from) / 2;

        const re_queue_task_first: EnrichTask = {
          from: from,
          to: newTo,
          reportType,
        };
        await channel.sendToQueue(
          QUEUES.RETRY_LOG_ENRICHMENT_WORKER_QUEUE,
          Buffer.from(JSON.stringify(re_queue_task_first)),
        );

        const re_queue_task_second: EnrichTask = {
          from: newTo,
          to,
          reportType,
        };
        await channel.sendToQueue(
          QUEUES.RETRY_LOG_ENRICHMENT_WORKER_QUEUE,
          Buffer.from(JSON.stringify(re_queue_task_second)),
        );
      }
    }
  }
};
