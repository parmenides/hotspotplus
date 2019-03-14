import logger from '../utils/logger';
import elasticClient from '../utils/elastic';
import momentTz from 'moment-timezone';
import { Moment } from 'moment';
import momentJ from 'moment-jalaali';
import { UpdateDocumentByQueryResponse } from 'elasticsearch';
import {
  NetflowReportRequestTask,
  RawSyslogReport,
  SyslogAggregateByIp,
  SyslogIpQueryData,
  SyslogReportQueryParams,
  SyslogReportRequestTask,
} from '../typings';

const SYSLOG_LOG_INDEX_PREFIX = `syslog-`;
const log = logger.createLogger();

const getSyslogReports = async (
  syslogReportRequestTask: SyslogReportRequestTask,
) => {
  const fromDateCounter = momentTz.tz(
    syslogReportRequestTask.fromDate,
    'Europe/London',
  );
  const fromDate = momentTz.tz(
    syslogReportRequestTask.fromDate,
    'Europe/London',
  );
  const toDate = momentTz.tz(syslogReportRequestTask.toDate, 'Europe/London');
  const daysBetweenInMs = toDate.diff(fromDateCounter);
  const days = Math.ceil(daysBetweenInMs / 86400000);

  const indexNames = [createSyslogIndexName(fromDateCounter)];
  for (let i = 0; i < days; i++) {
    fromDateCounter.add(1, 'days');
    indexNames.push(createSyslogIndexName(fromDateCounter));
  }
  let data: RawSyslogReport[] = [];
  log.debug('indexes: ', indexNames);
  for (const indexName of indexNames) {
    try {
      const result = await getSyslogByIndex(indexName, {
        fromDate,
        toDate,
        method: syslogReportRequestTask.method,
        domain: syslogReportRequestTask.domain,
        nasId: syslogReportRequestTask.nasId,
        url: syslogReportRequestTask.url,
        username: syslogReportRequestTask.username,
      });
      if (result) {
        data = data.concat(result);
      }
    } catch (error) {
      if (error.status === 404) {
        log.warn(`${indexName} index not found`);
      } else {
        log.error(error.status);
        throw error;
      }
    }
  }
  //log.debug('log', data);
  log.debug('Result size:', data.length);
  //log.debug(formattedResult);
  return formatReports(data);
};

const formatReports = (rawSyslogReports: RawSyslogReport[]) => {
  return rawSyslogReports.map((rawReport) => {
    const localDate = momentTz.tz(
      rawReport._source['@timestamp'],
      'Asia/Tehran',
    );
    const jalaaliDate = momentJ(localDate);
    return {
      username: rawReport._source.username,
      date: getJalaaliDate(jalaaliDate),
      domain: rawReport._source.domain,
      memberIp: rawReport._source.memberIp,
      nasIp: rawReport._source.nasIp,
      method: rawReport._source.method,
      url: rawReport._source.url,
      '@timestamp': rawReport._source['@timestamp'],
    };
  });
};

const getJalaaliDate = (date: Moment) => {
  return date.format('jYYYY/jM/jD HH:MM');
};

export const createSyslogIndexName = (fromDate: Moment) => {
  return `${SYSLOG_LOG_INDEX_PREFIX}${fromDate.format('YYYY.MM.DD')}`;
};

const getSyslogByIndex = async (
  syslogIndex: string,
  syslogReportQueryParams: SyslogReportQueryParams,
): Promise<undefined | Array<{ _source: any }>> => {
  const exist = await elasticClient.indices.exists({
    index: syslogIndex,
  });
  if (!exist) {
    return;
  }
  log.debug(
    `query from ${syslogIndex} from ${syslogReportQueryParams.fromDate.format()} to ${syslogReportQueryParams.toDate.format()}`,
  );
  const countResponse = await countSyslogReportByIndex(
    syslogIndex,
    syslogReportQueryParams,
  );

  const totalLogs = countResponse.count;
  log.debug(`total logs ${totalLogs}`);
  const maxResultSize = 500;
  log.debug(Math.ceil(totalLogs / maxResultSize));
  const partsLen =
    totalLogs > maxResultSize ? Math.ceil(totalLogs / maxResultSize) : 1;

  const parts = new Array(partsLen);
  let from = 0;
  let result: Array<{ _source: any }> = [];
  for (const i of parts) {
    try {
      const queryResult = await querySyslogReports(
        syslogIndex,
        from,
        maxResultSize,
        syslogReportQueryParams,
      );
      if (queryResult.hits) {
        result = result.concat(queryResult.hits.hits);
      } else {
        log.warn(queryResult);
      }
      log.warn(queryResult);
      from = from + maxResultSize;
    } catch (error) {
      log.error(error);
      throw error;
    }
  }
  return result;
};

const countSyslogReportByIndex = async (
  indexName: string,
  syslogReportQueryParams: SyslogReportQueryParams,
) => {
  const result = await elasticClient.count({
    index: indexName,
    body: createSyslogQuery(syslogReportQueryParams),
  });
  return result;
};

const querySyslogReports = async (
  indexName: string,
  startFrom: number,
  size: number,
  syslogReportQueryParams: SyslogReportQueryParams,
) => {
  const result = await elasticClient.search({
    index: indexName,
    from: startFrom,
    size,
    body: createSyslogQuery(syslogReportQueryParams),
  });
  return result;
};

const createSyslogQuery = (
  syslogReportQueryParams: SyslogReportQueryParams,
) => {
  const must = [];
  if (syslogReportQueryParams.domain) {
    must.push({
      match: {
        domain: syslogReportQueryParams.domain,
      },
    });
  }

  if (syslogReportQueryParams.username) {
    must.push({
      match: {
        username: syslogReportQueryParams.username,
      },
    });
  }
  if (syslogReportQueryParams.url) {
    must.push({
      match: {
        url: syslogReportQueryParams.url,
      },
    });
  }

  const filter = [];
  filter.push({
    term: {
      status: 'enriched',
    },
  });

  filter.push({
    range: {
      '@timestamp': {
        gte: syslogReportQueryParams.fromDate.format(),
        lte: syslogReportQueryParams.toDate.format(),
      },
    },
  });

  if (syslogReportQueryParams.method) {
    filter.push({
      term: {
        method: syslogReportQueryParams.method,
      },
    });
  }
  if (syslogReportQueryParams.nasId) {
    filter.push({
      term: {
        nasId: syslogReportQueryParams.nasId,
      },
    });
  }

  return {
    query: {
      bool: {
        must,
        filter,
      },
    },
  };
};
/*
const createCountSyslogQuery = (
    syslogReportQueryParams: SyslogReportQueryParams
) => {
    return {
        query: {
            bool: {
                must: [
                    {
                        terms: {
                            nasIp: syslogIpQueryData.nasIpList,
                        },
                    },
                    {
                        terms: {
                            memberIp: syslogIpQueryData.memberIpList,
                        },
                    },
                    {
                        range: {
                            '@timestamp': {
                                gte: fromDate.format(),
                                lte: toDate.format(),
                            },
                        },
                    },
                ],
            },
        },
    };
};*/

const syslogGroupByIp = async (from: number, to: number) => {
  const fromDate = momentTz.tz(from, 'Europe/London');
  const fromDateCounter = momentTz.tz(from, 'Europe/London');
  const toDate = momentTz.tz(to, 'Europe/London');

  const daysBetweenInMs = toDate.diff(fromDateCounter);
  const days = Math.ceil(daysBetweenInMs / 86400000);

  const indexNames = [createSyslogIndexName(fromDateCounter)];
  for (let i = 0; i < days; i++) {
    fromDateCounter.add(1, 'days');
    indexNames.push(createSyslogIndexName(fromDateCounter));
  }

  let data: SyslogAggregateByIp[] = [];
  log.debug('INDEXES:', indexNames);
  for (const indexName of indexNames) {
    try {
      const result = await aggregateSyslogByIp(indexName, fromDate, toDate);

      if (result) {
        data = data.concat(result);
      }
    } catch (error) {
      if (error.status === 404) {
        log.warn(`${indexName} index not found`);
      } else {
        log.error(error.status);
        throw error;
      }
    }
  }
  log.debug(data.length);
  return data;
};

const aggregateSyslogByIp = async (
  syslogIndex: string,
  fromDate: Moment,
  toDate: Moment,
): Promise<undefined | SyslogAggregateByIp> => {
  const exist = await elasticClient.indices.exists({
    index: syslogIndex,
  });
  if (!exist) {
    return;
  }

  const queryResult = await elasticClient.search({
    index: syslogIndex,
    size: 0,
    body: createSyslogGroupByQuery(fromDate, toDate),
  });
  return queryResult.aggregations;
};

const createSyslogGroupByQuery = (fromDate: Moment, toDate: Moment) => {
  return {
    size: 0,
    query: {
      bool: {
        must_not: [
          {
            term: { status: 'enriched' },
          },
        ],
        filter: [
          {
            range: {
              '@timestamp': {
                gte: fromDate.format(),
                lte: toDate.format(),
              },
            },
          },
        ],
      },
    },
    aggs: {
      group_by_nas_ip: {
        terms: {
          field: 'nasIp',
        },
        aggs: {
          group_by_member_ip: {
            terms: {
              field: 'memberIp',
            },
          },
        },
      },
    },
  };
};

const updateSyslogs = async (
  from: number,
  to: number,
  nasIp: string,
  memberIp: string,
  updates: {
    nasId: string;
    businessId: string;
    memberId: string;
    username: string;
  },
) => {
  const fromDate = momentTz.tz(from, 'Europe/London');
  const fromDateCounter = momentTz.tz(from, 'Europe/London');
  const toDate = momentTz.tz(to, 'Europe/London');

  const daysBetweenInMs = toDate.diff(fromDateCounter);
  const days = Math.ceil(daysBetweenInMs / 86400000);

  const indexNames = [createSyslogIndexName(fromDateCounter)];
  for (let i = 0; i < days; i++) {
    fromDateCounter.add(1, 'days');
    indexNames.push(createSyslogIndexName(fromDateCounter));
  }

  let data: UpdateDocumentByQueryResponse[] = [];
  log.debug('INDEXES:', indexNames);
  for (const index of indexNames) {
    try {
      const result = await elasticClient.updateByQuery({
        index,
        type: 'doc',
        maxRetries: 5,
        conflicts: 'proceed',
        body: createUsernameUpdateQuery(
          fromDate,
          toDate,
          nasIp,
          memberIp,
          updates,
        ),
      });

      data = data.concat(result);
    } catch (error) {
      if (error.status === 404) {
        log.warn(`${index} index not found`);
      } else {
        log.error(error.status);
        throw error;
      }
    }
  }
  log.debug(data);
  return data;
};

const createUsernameUpdateQuery = (
  fromDate: Moment,
  toDate: Moment,
  nasIp: string,
  memberIp: string,
  update: {
    nasId: string;
    businessId: string;
    memberId: string;
    username: string;
  },
) => {
  return {
    query: {
      bool: {
        must_not: [
          {
            term: { status: 'enriched' },
          },
        ],
        filter: [
          {
            range: {
              '@timestamp': {
                gte: fromDate.format(),
                lte: toDate.format(),
              },
            },
          },
          {
            term: {
              nasIp,
            },
          },
          {
            term: {
              memberIp,
            },
          },
        ],
      },
    },
    script: {
      lang: 'painless',
      inline: `
            ctx._source['username'] = "${update.username}";
            ctx._source['status'] = "enriched";
            ctx._source['nasId'] = "${update.nasId}";
            ctx._source['memberId'] = "${update.memberId}";
            ctx._source['businessId'] = "${update.businessId}";
            `,
    },
  };
};

export default {
  syslogGroupByIp,
  updateSyslogs,
  getSyslogByIndex,
  getSyslogReports,
};
