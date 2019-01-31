import logger from '../utils/logger';
import { getRabbitMqChannel } from '../utils/rabbitmq';
import elasticClient from '../utils/elastic';

const SESSION_LOG_INDEX = `${process.env.ELASTIC_INDEX_PREFIX}sessions`;

const LOG_WORKER_QUEUE = process.env.LOG_WORKER_QUEUE;
const log = logger.createLogger();
const API_BASE = process.env.CORE_API;
if (!LOG_WORKER_QUEUE) {
  throw new Error('invalid settings');
}

interface SessionQuery {
  fromDate: number;
  toDate: number;
  memberId?: string;
  businessId?: string;
}

interface IP_DATA {
  nasIp: string;
  framedIpAddress: string;
}

const countSessions = async (sessionQuery: SessionQuery) => {
  const result = await elasticClient.count({
    index: SESSION_LOG_INDEX,
    body: createSearchSessionQuery(sessionQuery),
  });
  return result;
};

const findSessions = async (reportRequestTask: SessionQuery) => {
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

const querySessions = async (
  from: number,
  size: number,
  sessionQuery: SessionQuery,
) => {
  log.debug(createSearchSessionQuery(sessionQuery));
  const result = await elasticClient.search({
    index: SESSION_LOG_INDEX,
    from,
    size,
    filterPath: [
      'hits.hits._source.framedIpAddress',
      'hits.hits._source.nasIp',
    ],
    body: createSearchSessionQuery(sessionQuery),
  });

  return result;
};

const createSearchSessionQuery = (sessionQuery: SessionQuery) => {
  return {
    query: {
      bool: {
        must: [
          {
            term: {
              memberId: sessionQuery.memberId,
            },
          },
          {
            term: {
              businessId: sessionQuery.businessId,
            },
          },
          {
            range: {
              creationDate: {
                gte: sessionQuery.fromDate,
                lte: sessionQuery.toDate,
              },
            },
          },
        ],
      },
    },
  };
};

export default {
  findSessions,
};
