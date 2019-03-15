import logger from '../utils/logger';
import elasticClient from '../utils/elastic';
import momentTz from 'moment-timezone';
import { Moment } from 'moment';

const SESSION_LOG_INDEX = `${process.env.ELASTIC_INDEX_PREFIX}sessions`;

const log = logger.createLogger();

interface SessionQuery {
  fromDate: Moment;
  toDate: Moment;
  memberId?: string;
  businessId?: string;
}
interface IpData {
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
    clientIpList.add((item._source as IpData).framedIpAddress);
    nasIpList.add((item._source as IpData).nasIp);
  });

  log.debug(Array.from(clientIpList));
  log.debug(Array.from(nasIpList));
  return {
    memberIpList: Array.from(clientIpList),
    nasIpList: Array.from(nasIpList),
  };
};

const querySessions = async (
  from: number,
  size: number,
  sessionQuery: SessionQuery,
) => {
  //log.debug(`session query %j`, createSearchSessionQuery(sessionQuery));
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
              '@timestamp': {
                gte: sessionQuery.fromDate.format(),
                lte: sessionQuery.toDate.format(),
              },
            },
          },
        ],
      },
    },
  };
};

const querySessionsByIp = async (
  nasIp: string,
  memberIp: string,
  from: number,
  to: number,
): Promise<SessionGroupByUsername> => {
  const fromDate = momentTz.tz(from, 'Europe/London');
  const toDate = momentTz.tz(to, 'Europe/London');
  /*log.debug(
        `session query %j`,
        createSessionByIpQuery(nasIp, memberIp, fromDate, toDate),
      );*/

  const result = await elasticClient.search({
    index: SESSION_LOG_INDEX,
    size: 0,
    body: createSessionByIpQuery(nasIp, memberIp, fromDate, toDate),
  });
  if (result.aggregations.group_by_username.buckets.length > 0) {
    log.warn(
      'query session: %j  result:',
      createSessionByIpQuery(nasIp, memberIp, fromDate, toDate),
      JSON.stringify(result),
    );
  }
  return result.aggregations as SessionGroupByUsername;
};

interface SessionGroupByUsername {
  group_by_username: {
    doc_count_error_upper_bound: number;
    sum_other_doc_count: number;
    buckets: Array<{
      key: string;
      doc_count: number;
    }>;
  };
  extra: {
    hits: {
      hits: Array<{
        _source: {
          nasIp: string;
          username: string;
          mac: string;
          memberId: string;
          framedIpAddress: string;
          creationDate: number;
          businessId: string;
          '@version': string;
          '@timestamp': string;
          nasId: string;
        };
      }>;
    };
  };
}

const createSessionByIpQuery = (
  nasIp: string,
  memberIp: string,
  fromDate: Moment,
  toDate: Moment,
) => {
  return {
    query: {
      bool: {
        must: [
          {
            range: {
              '@timestamp': {
                gte: fromDate.format(),
                lte: toDate.format(),
              },
            },
          },
          {
            terms: {
              nasIp: [nasIp],
            },
          },
          {
            terms: {
              framedIpAddress: [memberIp],
            },
          },
        ],
      },
    },
    aggs: {
      group_by_username: {
        terms: {
          field: 'username',
        },
      },
      extra: {
        top_hits: {
          size: 1,
        },
      },
    },
  };
};

export default {
  querySessionsByIp,
  findSessions,
};
