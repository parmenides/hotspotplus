import logger from '../utils/logger';
import { getRabbitMqChannel } from '../utils/rabbitmq';
import elasticClient from '../utils/elastic';
import moment from 'moment-timezone';
import { Moment } from 'moment';

const SESSION_LOG_INDEX = `${process.env.ELASTIC_INDEX_PREFIX}sessions`;
const NETFLOW_LOG_INDEX_PREFIX = `netflow-`;

const LOG_WORKER_QUEUE = process.env.LOG_WORKER_QUEUE;
const log = logger.createLogger();
const API_BASE = process.env.CORE_API;
if (!LOG_WORKER_QUEUE) {
  throw new Error('invalid settings');
}

interface ReportRequestTask {
  fromDate: number;
  toDate: number;
  memberId?: string;
  businessId?: string;
}

const processLogRequest = async () => {
  log.debug('At processing payment requests');
  const channel = await getRabbitMqChannel();
  process.once('SIGINT', async () => {
    await channel.close();
  });

  channel.consume(
    LOG_WORKER_QUEUE,
    async (message) => {
      if (!message) {
        log.debug('empty message:', message);
        throw new Error('empty message');
      }

      const body = message.content.toString();
      log.debug(" [x] Received '%s'", body);
      const logTask: ReportRequestTask = JSON.parse(body);

      try {
        //todo
      } catch (error) {
        log.error(error);
        log.error(error.message);
        log.error(error.stack);
        log.error(error.trace());
        // @ts-ignore
        channel.nack(message, false, false);
      }
    },
    { noAck: false },
  );
};

interface IP_DATA {
  nasIp: string;
  framedIpAddress: string;
}

const getSessions = async (reportRequestTask: ReportRequestTask) => {
  const countResponse = await countSessions(reportRequestTask);
  const totalSessions = countResponse.count;
  const maxResultSize = 500;
  log.debug(Math.ceil(totalSessions / maxResultSize));
  const partsLen =
    totalSessions > maxResultSize
      ? Math.ceil(totalSessions / maxResultSize)
      : 1;

  const parts = new Array(partsLen);
  let from = 0;
  let result: Array<{ _source: any }> = [];
  for (const i of parts) {
    try {
      const queryResult = await querySessions(
        from,
        maxResultSize,
        reportRequestTask,
      );
      if (queryResult.hits) {
        result = result.concat(queryResult.hits.hits);
      } else {
        log.warn(queryResult);
      }
      from = from + maxResultSize;
    } catch (error) {
      log.error(error);
      throw error;
    }
  }

  const clientIpList = new Set();
  const nasIpList = new Set();
  result.map((item) => {
    clientIpList.add((item._source as IP_DATA).framedIpAddress);
    nasIpList.add((item._source as IP_DATA).nasIp);
  });

  log.debug(Array.from(clientIpList));
  log.debug(Array.from(nasIpList));
  return {
    clientIpList: Array.from(clientIpList),
    nasIpList: Array.from(nasIpList),
  };
};

interface NetflowIpQueryData {
  clientIpList: string[];
  nasIpList: string[];
}

const getNetflowReports = async (
  from: number,
  to: number,
  netflowIpQueryData: NetflowIpQueryData,
) => {
  const fromDate = moment.tz(from, 'Europe/London');
  const toDate = moment.tz(to, 'Europe/London');

  const daysBetweenInMs = toDate.diff(fromDate);
  const days = Math.ceil(daysBetweenInMs / 86400000);

  const indexNames = [createNetflowIndexName(fromDate)];
  for (let i = 0; i < days; i++) {
    fromDate.add(1, 'days');
    indexNames.push(createNetflowIndexName(fromDate));
  }

  const data = [];
  log.debug('INDEXES', indexNames);
  for (const indexName of indexNames) {
    try {
      const result = await getNetflowsByIndex(
        indexName,
        from,
        to,
        netflowIpQueryData,
      );
      data.push(result);
    } catch (error) {
      if (error.status === 404) {
        log.warn(`${indexName} index not found`);
      } else {
        log.error(error.status);
        throw error;
      }
    }
  }
  //log.debug(data);
};

const createNetflowIndexName = (fromDate: Moment) => {
  return `${NETFLOW_LOG_INDEX_PREFIX}${fromDate.format('YYYY.MM.DD')}`;
};

const getNetflowsByIndex = async (
  netflowIndex: string,
  fromDate: number,
  toDate: number,
  netflowIpQueryData: NetflowIpQueryData,
) => {
  const countResponse = await countNetflowReportByIndex(
    netflowIndex,
    fromDate,
    toDate,
    netflowIpQueryData,
  );

  const totalLogs = countResponse.count;
  log.debug(totalLogs);
  const maxResultSize = 500;
  log.debug(Math.ceil(totalLogs / maxResultSize));
  const partsLen =
    totalLogs > maxResultSize ? Math.ceil(totalLogs / maxResultSize) : 1;

  const parts = new Array(partsLen);
  let from = 0;
  let result: Array<{ _source: any }> = [];
  for (const i of parts) {
    try {
      const queryResult = await queryNetflowReports(
        netflowIndex,
        from,
        maxResultSize,
        fromDate,
        toDate,
        netflowIpQueryData,
      );
      log.warn(queryResult);
      if (queryResult.hits) {
        result = result.concat(queryResult.hits.hits);
      } else {
        log.warn(queryResult);
      }
      from = from + maxResultSize;
    } catch (error) {
      log.error(error);
      throw error;
    }
  }
  return result;
};

const countNetflowReportByIndex = async (
  indexName: string,
  fromDate: number,
  toDate: number,
  netflowIpQueryData: NetflowIpQueryData,
) => {
  const result = await elasticClient.count({
    index: indexName,
    body: createNetflowQuery(fromDate, toDate, netflowIpQueryData),
  });
  return result;
};

const countSessions = async (reportTask: ReportRequestTask) => {
  const result = await elasticClient.count({
    index: SESSION_LOG_INDEX,
    body: createSearchSessionQuery(reportTask),
  });
  return result;
};

const querySessions = async (
  from: number,
  size: number,
  reportTask: ReportRequestTask,
) => {
  log.debug(createSearchSessionQuery(reportTask));
  const result = await elasticClient.search({
    index: SESSION_LOG_INDEX,
    from,
    size,
    filterPath: [
      'hits.hits._source.framedIpAddress',
      'hits.hits._source.nasIp',
    ],
    body: createSearchSessionQuery(reportTask),
  });

  return result;
};
const queryNetflowReports = async (
  indexName: string,
  fromIndex: number,
  size: number,
  fromDate: number,
  toDate: number,
  netflowIpQueryData: NetflowIpQueryData,
) => {
  const result = await elasticClient.search({
    index: indexName,
    from: fromIndex,
    size,
    body: createNetflowQuery(fromDate, toDate, netflowIpQueryData),
  });
  return result;
};

const createNetflowQuery = (
  fromDate: number,
  toDate: number,
  netflowIpQueryData: NetflowIpQueryData,
) => {
  return {
    query: {
      bool: {
        must: [
          {
            terms: {
              host: netflowIpQueryData.nasIpList,
            },
          },
          {
            terms: {
              'netflow.src_addr': netflowIpQueryData.clientIpList,
            },
          },
          {
            range: {
              '@timestamp': {
                gte: fromDate,
                lte: toDate,
              },
            },
          },
        ],
      },
    },
  };
};

const createSearchSessionQuery = (reportTask: ReportRequestTask) => {
  return {
    query: {
      bool: {
        must: [
          {
            term: {
              memberId: reportTask.memberId,
            },
          },
          {
            term: {
              businessId: reportTask.businessId,
            },
          },
          {
            range: {
              creationDate: {
                gte: reportTask.fromDate,
                lte: reportTask.toDate,
              },
            },
          },
        ],
      },
    },
  };
};

export default {
  getNetflowsByIndex,
  getSessions,
  processLogRequest,
  getNetflowReports,
};
