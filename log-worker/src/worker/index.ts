import logger from '../utils/logger';
import { getRabbitMqChannel } from '../utils/rabbitmq';
import elasticClient from '../utils/elastic';

const SESSION_LOG_INDEX = `${process.env.ELASTIC_INDEX_PREFIX}sessions`;
const NETFLOW_LOG_INDEX = `netflow-`;

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
  const partsLen =
    totalSessions > maxResultSize
      ? Math.ceil(totalSessions / maxResultSize)
      : 1;
  const parts = new Array(partsLen);
  let from = 0;
  let result: Array<{ _source: any }> = [];
  for (const i of parts) {
    const queryResult = await querySessions(
      from,
      maxResultSize,
      reportRequestTask,
    );
    result = result.concat(queryResult.hits.hits);
    from = from + maxResultSize;
  }

  const localIp = new Set();
  const nasIp = new Set();
  result.map((item) => {
    localIp.add((item._source as IP_DATA).framedIpAddress);
    nasIp.add((item._source as IP_DATA).nasIp);
  });

  log.debug(Array.from(localIp));
  log.debug(Array.from(nasIp));
  return {
    localIpList: Array.from(localIp),
    nasIpList: Array.from(nasIp),
  };
};

const countSessions = async (reportTask: ReportRequestTask) => {
  const result = await elasticClient.count({
    index: [SESSION_LOG_INDEX],
    body: createSearchSessionQuery(reportTask),
  });
  log.debug(result);
  return result;
};

const querySessions = async (
  from: number,
  size: number,
  reportTask: ReportRequestTask,
) => {
  const result = await elasticClient.search({
    scroll: '1m',
    index: SESSION_LOG_INDEX,
    from,
    size,
    filterPath: [
      'hits.hits._source.framedIpAddress',
      'hits.hits._source.nasIp',
    ],
    body: createSearchSessionQuery(reportTask),
  });

  log.debug(result);
  return result;
};

const createNetflowQuery = (
  fromDate: number,
  toDate: number,
  hostIps: string[],
  lanIps: string[],
) => {
  return {
    query: {
      bool: {
        must: [
          {
            terms: {
              host: hostIps || [],
            },
          },
          {
            terms: {
              'netflow.src_addr': lanIps || [],
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
  getSessions,
  processLogRequest,
};
