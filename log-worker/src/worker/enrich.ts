import netflowModule from './netflow';
import syslogModule from './syslog';
import sessionModule from './session';
import { getRabbitMqChannel } from '../utils/rabbitmq';
import {
  EnrichTask,
  LOGGER_TIME_ZONE,
  NetflowAggregateByIp,
  QUEUES,
  REPORT_TYPE,
  SyslogAggregateByIp,
} from '../typings';
import logger from '../utils/logger';
import { UpdateDocumentByQueryResponse } from 'elasticsearch';
import moment = require('moment');
import { Moment } from 'moment-jalaali';
import momentTz from 'moment-timezone';

const log = logger.createLogger();

export const enrichLogs = async () => {
  log.debug('At processing enrichment requests');
  const channel = await getRabbitMqChannel();
  channel.prefetch(3, true);

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

      try {
        log.debug(" [x] enrichment message received '%s'", body);
        const enrichTask: EnrichTask = JSON.parse(body);

        const fromDate = moment(enrichTask.from);
        const toDate = moment(enrichTask.to);
        const reportType = enrichTask.reportType;

        if (reportType === REPORT_TYPE.SYSLOG) {
          const result = await syslogModule.syslogGroupByIp(fromDate, toDate);
          const ipData = getIpData(result);
          await searchAndUpdateReport(reportType, ipData, fromDate, toDate);
        } else if (reportType === REPORT_TYPE.NETFLOW) {
          const result = await netflowModule.netflowGroupByIp(fromDate, toDate);
          const ipData = getIpData(result);
          await searchAndUpdateReport(reportType, ipData, fromDate, toDate);
        } else {
          log.warn('unknown enrichment type:', reportType);
          channel.ack(message);
          return;
        }
        log.warn('............... Enrichment Done...............');
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

  const ipData: Array<{ nasIp: string; memberIpList: string[] }> = [];
  Object.keys(ips).forEach((nasIp) => {
    ipData.push({ nasIp, memberIpList: ips[nasIp] });
  });
  return ipData;
};

const searchAndUpdateReport = async (
  reportType: REPORT_TYPE,
  ipData: Array<{ nasIp: string; memberIpList: string[] }>,
  from: Moment,
  to: Moment,
) => {
  if (ipData.length === 0) {
    return;
  }
  log.debug(`going to update reports: `, ipData);
  for (const flowData of ipData) {
    const nasIp = flowData.nasIp;
    for (const memberIp of flowData.memberIpList) {
      try {
        const groupedSessions = await sessionModule.querySessionsByIp(
          nasIp,
          memberIp,
          from,
          to,
        );
        if (groupedSessions.group_by_username.buckets.length > 0) {
          log.warn('sessions: ', groupedSessions);
        }
        if (groupedSessions.group_by_username.buckets.length === 1) {
          const session = groupedSessions.group_by_username.buckets[0];
          const username = session.key;
          const nasId = groupedSessions.extra.hits.hits[0]._source.nasId;
          const nasTitle = groupedSessions.extra.hits.hits[0]._source.nasTitle;
          const mac = groupedSessions.extra.hits.hits[0]._source.mac;
          const memberId = groupedSessions.extra.hits.hits[0]._source.memberId;
          const businessId =
            groupedSessions.extra.hits.hits[0]._source.businessId;
          let updateResult: UpdateDocumentByQueryResponse[];
          if (reportType === REPORT_TYPE.SYSLOG) {
            updateResult = await syslogModule.updateSyslogs(
              from,
              to,
              nasIp,
              memberIp,
              {
                nasId,
                nasTitle,
                mac,
                memberId,
                businessId,
                username,
              },
            );
          } else if (reportType === REPORT_TYPE.NETFLOW) {
            updateResult = await netflowModule.updateNetflows(
              from,
              to,
              nasIp,
              memberIp,
              {
                nasId,
                nasTitle,
                mac,
                memberId,
                businessId,
                username,
              },
            );
          } else {
            throw new Error(`invalid report type: ${reportType}`);
          }

          log.debug(
            `updating ${reportType} report for ${username}  user, from:${moment(
              from,
            ).format('YYYY.MM.DD HH:MM')} to:${moment(to).format(
              'YYYY.MM.DD HH:MM',
            )} router IP:${nasIp} member IP:${memberIp}`,
            {
              nasId,
              memberId,
              businessId,
              username,
            },
          );
          //log.debug(`update result`, updateResult);
        } else if (groupedSessions.group_by_username.buckets.length > 1) {
          log.debug('more than two up found going to split time range');
          const channel = await getRabbitMqChannel();
          //split range in two;
          const newTo = momentTz.tz(
            from.valueOf() + (to.valueOf() - from.valueOf()) / 2,
            LOGGER_TIME_ZONE,
          );

          const reQueueOne: EnrichTask = {
            from,
            to: newTo,
            reportType,
          };
          await channel.sendToQueue(
            QUEUES.RETRY_LOG_ENRICHMENT_WORKER_QUEUE,
            Buffer.from(JSON.stringify(reQueueOne)),
          );

          const reQueueTwo: EnrichTask = {
            from: newTo,
            to,
            reportType,
          };
          await channel.sendToQueue(
            QUEUES.RETRY_LOG_ENRICHMENT_WORKER_QUEUE,
            Buffer.from(JSON.stringify(reQueueTwo)),
          );
        } else if (groupedSessions.group_by_username.buckets.length === 0) {
          log.debug(
            `nothing to update  ${reportType} from:${moment(from)} to:${moment(
              to,
            )} router IP:${nasIp} member IP:${memberIp}`,
          );
        }
      } catch (error) {
        log.error(error);
        log.error(ipData);
        throw error;
      }
    }
  }
};
