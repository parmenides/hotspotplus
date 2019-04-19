import logger from '../utils/logger';
import elasticClient from '../utils/elastic';
import momentTz from 'moment-timezone';
import { Moment } from 'moment';
import momentJ from 'moment-jalaali';

import { UpdateDocumentByQueryResponse } from 'elasticsearch';
import {
  LOCAL_TIME_ZONE,
  LOGGER_TIME_ZONE,
  RawSyslogReport,
  SyslogAggregateByIp,
  SyslogReportQueryParams,
  SyslogReportRequestTask,
} from '../typings';
import _ from 'lodash';

const SYSLOG_LOG_INDEX_PREFIX = `syslog-`;
const log = logger.createLogger();

const getIndexNames = (from: Moment, to: Moment) => {
  const fromDateCounter = from.clone();
  const diffBetweenInMs = to.diff(fromDateCounter);
  let days = 0;
  if (diffBetweenInMs > 86400000) {
    days = Math.ceil(diffBetweenInMs / 86400000);
  }
  const indexNames = [createSyslogIndexName(fromDateCounter)];
  for (let i = 0; i < days; i++) {
    fromDateCounter.add(1, 'days');
    indexNames.push(createSyslogIndexName(fromDateCounter));
  }
  return indexNames;
};

const getSyslogReports = async (
  syslogReportRequestTask: SyslogReportRequestTask,
) => {
  const fromDate = syslogReportRequestTask.fromDate;
  const toDate = syslogReportRequestTask.toDate;
  const indexNames = getIndexNames(fromDate, toDate);
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
  const formatted = rawSyslogReports.map((rawReport) => {
    const localDate = momentTz.tz(
      rawReport._source['@timestamp'],
      LOCAL_TIME_ZONE,
    );
    const gregorianDate = momentTz.tz(
      rawReport._source['@timestamp'],
      LOCAL_TIME_ZONE,
    );
    const jalaaliDate = momentJ(localDate);
    return {
      Router: rawReport._source.nasTitle,
      Username: rawReport._source.username,
      IP: rawReport._source.memberIp,
      Mac: rawReport._source.mac,
      Jalali_Date: getJalaaliDate(jalaaliDate),
      Http_Method: rawReport._source.method,
      Domain: rawReport._source.domain,
      Url: rawReport._source.url,
      Gregorian_Date: gregorianDate.format('YYYY/MM/DD HH:mm'),
    };
  });
  return _.sortBy(formatted, ['Router', 'Username', 'Jalali_Date', 'Domain']);
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

  const query = createSyslogQuery(syslogReportQueryParams);
  const countResponse = await elasticClient.count({
    index: syslogIndex,
    body: query,
  });
  log.debug(
    `query from ${syslogIndex} from ${syslogReportQueryParams.fromDate.format()} to ${syslogReportQueryParams.toDate.format()}`,
  );

  const totalLogs = countResponse.count;
  if (totalLogs === 0) {
    return;
  }

  let result: Array<{ _source: any }> = [];
  const scrollTtl = '2m';
  const maxResultSize = 500;
  log.debug(`total logs count ${totalLogs}`);
  const scrollResult = await elasticClient.search({
    scroll: scrollTtl,
    index: syslogIndex,
    size: maxResultSize,
    sort: ['_doc'],
    body: query,
    ignore: [404],
  });

  if (!scrollResult._scroll_id) {
    throw new Error('invalid scrollId ');
  }
  let scrollId = scrollResult._scroll_id;
  const allScrollId = [scrollId];
  if (scrollResult.hits) {
    result = result.concat(scrollResult.hits.hits);
  }

  const partsLen =
    totalLogs > maxResultSize ? Math.ceil(totalLogs / maxResultSize) : 1;
  log.debug(`query parts: ${partsLen}`);
  const parts = new Array(partsLen);
  for (const i of parts) {
    try {
      const queryResult = await elasticClient.scroll({
        scrollId: scrollId,
        scroll: scrollTtl,
      });

      if (queryResult._scroll_id && queryResult._scroll_id !== scrollId) {
        log.debug('new scroll id : ', queryResult._scroll_id);
        scrollId = queryResult._scroll_id;
        allScrollId.push(scrollId);
      }
      if (queryResult.hits) {
        result = result.concat(queryResult.hits.hits);
      } else {
        log.warn(queryResult);
      }
    } catch (error) {
      log.error(error);
      throw error;
    }
  }
  log.debug('ids:', allScrollId);
  const clearanceRes = await elasticClient.clearScroll({
    scrollId: allScrollId,
  });
  log.debug('clear: ', clearanceRes);
  return result;
};

const createSyslogQuery = (
  syslogReportQueryParams: SyslogReportQueryParams,
) => {
  const filter = [];
  if (syslogReportQueryParams.domain) {
    filter.push({
      wildcard: {
        domain: syslogReportQueryParams.domain,
      },
    });
  }

  if (syslogReportQueryParams.username) {
    filter.push({
      wildcard: {
        username: syslogReportQueryParams.username,
      },
    });
  }

  if (syslogReportQueryParams.url) {
    filter.push({
      wildcard: {
        url: syslogReportQueryParams.url,
      },
    });
  }

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
      terms: {
        method: syslogReportQueryParams.method,
      },
    });
  }

  if (syslogReportQueryParams.nasId) {
    filter.push({
      terms: {
        nasId: syslogReportQueryParams.nasId,
      },
    });
  }

  return {
    query: {
      bool: {
        filter,
      },
    },
  };
};

const syslogGroupByIp = async (fromDate: Moment, toDate: Moment) => {
  const indexNames = getIndexNames(fromDate, toDate);

  let data: SyslogAggregateByIp[] = [];
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
  log.debug('syslog group by ip result length: ', data.length);
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
  fromDate: Moment,
  toDate: Moment,
  nasIp: string,
  memberIp: string,
  updates: {
    nasId: string;
    nasTitle: string;
    mac: string;
    businessId: string;
    memberId: string;
    username: string;
  },
) => {
  const indexNames = getIndexNames(fromDate, toDate);
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
    nasTitle: string;
    mac: string;
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
      params: update,
      source: `ctx._source['username']=params.username;
            ctx._source['status']= "enriched";
            ctx._source['nasId']=params.nasId;
            ctx._source['nasTitle']=params.nasTitle;
            ctx._source['mac']=params.mac;
            ctx._source['memberId']=params.memberId;
            ctx._source['businessId']=params.businessId;
            `,
    },
  };
};

const countBusinessReports = async (fromDate: Moment, toDate: Moment) => {
  const indexNames = getIndexNames(fromDate, toDate);
  let reportCounts: Array<{ key: string; doc_count: number }> = [];
  for (const index of indexNames) {
    const exist = await elasticClient.indices.exists({
      index,
    });
    if (exist) {
      const response = await elasticClient.search({
        index,
        body: createSyslogGroupByBusinessIdQuery(),
      });
      if (
        response.aggregations.group_by_business_id &&
        response.aggregations.group_by_business_id.buckets
      ) {
        reportCounts = reportCounts.concat(
          response.aggregations.group_by_business_id.buckets,
        );
      }
    }
  }
  const businessReportCount: { [key: string]: number } = {};
  for (const reportCount of reportCounts) {
    businessReportCount[reportCount.key] =
      businessReportCount[reportCount.key] || 0;
    businessReportCount[reportCount.key] =
      businessReportCount[reportCount.key] + reportCount.doc_count;
  }
  log.error('2783648723647263478627486278634728643');
  log.error(businessReportCount);
  return businessReportCount;
};

const createSyslogGroupByBusinessIdQuery = () => {
  return {
    size: 0,
    aggs: {
      group_by_business_id: {
        terms: {
          field: 'businessId',
        },
      },
    },
  };
};

export default {
  syslogGroupByIp,
  updateSyslogs,
  getSyslogReports,
  countBusinessReports,
};
