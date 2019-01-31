import logger from '../utils/logger';
import elasticClient from '../utils/elastic';
import moment from 'moment-timezone';
import { Moment } from 'moment';

const NETFLOW_LOG_INDEX_PREFIX = `netflow-`;

const LOG_WORKER_QUEUE = process.env.LOG_WORKER_QUEUE;
const log = logger.createLogger();
if (!LOG_WORKER_QUEUE) {
  throw new Error('invalid settings');
}

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

  let data: Array<{ _source: any }> = [];
  log.debug('INDEXES', indexNames);
  for (const indexName of indexNames) {
    try {
      const result = await getNetflowsByIndex(
        indexName,
        from,
        to,
        netflowIpQueryData,
      );
      data = data.concat(result);
    } catch (error) {
      if (error.status === 404) {
        log.warn(`${indexName} index not found`);
      } else {
        log.error(error.status);
        throw error;
      }
    }
  }
  log.debug(data[1]);
  log.debug(data.length);
  return data;
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

export default {
  getNetflowsByIndex,
  getNetflowReports,
};
