import logger from '../utils/logger';
import elasticClient from '../utils/elastic';
import momentTz from 'moment-timezone';
import { Moment } from 'moment';
import momentJ from 'moment-jalaali';
import { UpdateDocumentByQueryResponse } from 'elasticsearch';
import {
  LOCAL_TIME_ZONE,
  LOGGER_TIME_ZONE,
  NetflowAggregateByIp,
  NetflowReportQueryParams,
  NetflowReportRequestTask,
  RawNetflowReport,
} from '../typings';
import moment = require('moment');
import _ from 'lodash';
import { ancestorWhere } from 'tslint';

const NETFLOW_LOG_INDEX_PREFIX = `netflow-`;

const log = logger.createLogger();

const getIndexNames = (from: Moment, to: Moment) => {
  const fromDateCounter = from.clone();
  const diffBetweenInMs = to.diff(fromDateCounter);
  let days = 0;
  if (diffBetweenInMs > 86400000) {
    days = Math.ceil(diffBetweenInMs / 86400000);
  }

  const indexNames: string[] = [createNetflowIndexName(fromDateCounter)];
  for (let i = 0; i < days; i++) {
    fromDateCounter.add(1, 'days');
    indexNames.push(createNetflowIndexName(fromDateCounter));
  }
  return indexNames;
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
        body: createNetflowGroupByBusinessId(),
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
  return businessReportCount;
};

const getNetflowReports = async (
  reportRequestTask: NetflowReportRequestTask,
) => {
  const fromDate = reportRequestTask.fromDate;
  const toDate = reportRequestTask.toDate;
  const indexNames = getIndexNames(fromDate, toDate);
  let data: RawNetflowReport[] = [];

  for (const indexName of indexNames) {
    try {
      const result = await getNetflowsByIndex(indexName, {
        fromDate,
        toDate,
        srcAddress: reportRequestTask.srcAddress,
        srcPort: reportRequestTask.srcPort,
        username: reportRequestTask.username,
        dstAddress: reportRequestTask.dstAddress,
        dstPort: reportRequestTask.dstPort,
        nasId: reportRequestTask.nasId,
        protocol: reportRequestTask.protocol,
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
  log.debug(data.length);
  //log.debug(formattedResult);
  return formatReports(data);
};

const formatReports = (rawNetflowReports: RawNetflowReport[]) => {
  const formatted = rawNetflowReports.map((rawReport) => {
    const localDate = momentTz.tz(
      rawReport._source['@timestamp'],
      LOCAL_TIME_ZONE,
    );
    const jalaaliDate = momentJ(localDate);
    const gregorianDate = momentTz.tz(
      rawReport._source['@timestamp'],
      LOCAL_TIME_ZONE,
    );

    let protocolString = '';
    if (rawReport._source.netflow.protocol === '6') {
      protocolString = 'tcp';
    }
    if (rawReport._source.netflow.protocol === '17') {
      protocolString = 'udp';
    }
    return {
      nasId: rawReport._source.nasId,
      Router: rawReport._source.nasTitle,
      Username: rawReport._source.username,
      Mac: rawReport._source.mac,
      Jalali_Date: getJalaaliDate(jalaaliDate),
      Src_Addr: rawReport._source.netflow.src_addr,
      Src_Port: rawReport._source.netflow.src_port,
      Dst_Addr: rawReport._source.netflow.dst_addr,
      Dst_Port: rawReport._source.netflow.dst_port,
      Protocol: protocolString,
      Gregorian_Date: gregorianDate.format('YYYY/MM/DD HH:mm'),
    };
  });
  return _.sortBy(formatted, [
    'Router',
    'Username',
    'Jalali_Date',
    'Src_Addr',
    'Src_Port',
  ]);
};

const getJalaaliDate = (date: Moment) => {
  return date.format('jYYYY/jM/jD HH:MM');
};

const createNetflowIndexName = (fromDate: Moment) => {
  return `${NETFLOW_LOG_INDEX_PREFIX}${fromDate.format('YYYY.MM.DD')}`;
};

const getNetflowsByIndex = async (
  netflowIndex: string,
  netflowReportQueryParams: NetflowReportQueryParams,
): Promise<undefined | Array<{ _source: any }>> => {
  const exist = await elasticClient.indices.exists({
    index: netflowIndex,
  });

  if (!exist) {
    return;
  }

  log.debug(
    `query from ${netflowIndex} from ${netflowReportQueryParams.fromDate.format()} to ${netflowReportQueryParams.toDate.format()}`,
  );

  const countResponse = await elasticClient.count({
    index: netflowIndex,
    body: createNetflowQuery(netflowReportQueryParams),
  });

  const totalLogs = countResponse.count;
  if (totalLogs === 0) {
    return;
  }

  const maxResultSize = 500;
  const partsLen =
    totalLogs > maxResultSize ? Math.ceil(totalLogs / maxResultSize) : 1;

  log.debug(`query parts: ${partsLen}`);
  const scrollTtl = '2m';
  let result: Array<{ _source: any }> = [];
  const query = createNetflowQuery(netflowReportQueryParams);
  const scrollResult = await elasticClient.search({
    scroll: scrollTtl,
    index: netflowIndex,
    size: maxResultSize,
    sort: ['_doc'],
    body: query,
    ignore: [404],
  });
  if (scrollResult.hits) {
    result = result.concat(scrollResult.hits.hits);
  }
  log.debug('netflow query: %j', query);

  if (!scrollResult._scroll_id) {
    throw new Error('invalid scrollId ');
  }
  let scrollId = scrollResult._scroll_id;
  const allScrollId = [scrollId];
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
      log.error('error @getNetflowsByIndex');
      log.error(error);
      throw error;
    }
  }
  log.debug('ids', allScrollId);
  const clearanceRes = await elasticClient.clearScroll({
    scrollId: allScrollId,
  });
  log.debug('clear: ', clearanceRes);
  return result;
};

const createNetflowQuery = (
  netflowReportQueryParams: NetflowReportQueryParams,
) => {
  const filter = [];

  filter.push({
    term: {
      status: 'enriched',
    },
  });

  filter.push({
    range: {
      '@timestamp': {
        gte: netflowReportQueryParams.fromDate.format(),
        lte: netflowReportQueryParams.toDate.format(),
      },
    },
  });

  if (netflowReportQueryParams.protocol) {
    const protocol = netflowReportQueryParams.protocol.toLowerCase();
    if (protocol === 'tcp') {
      filter.push({
        term: {
          'netflow.protocol': '6',
        },
      });
    } else if (protocol === 'udp') {
      filter.push({
        term: {
          'netflow.protocol': '17',
        },
      });
    } else if (protocol === 'tcp/udp') {
      filter.push({
        terms: {
          'netflow.protocol': ['17', '6'],
        },
      });
    }
  }

  if (netflowReportQueryParams.srcPort) {
    filter.push({
      terms: {
        'netflow.src_port': netflowReportQueryParams.srcPort,
      },
    });
  }

  if (netflowReportQueryParams.srcAddress) {
    filter.push({
      wildcard: {
        'netflow.src_addr': netflowReportQueryParams.srcAddress,
      },
    });
  }

  if (netflowReportQueryParams.dstPort) {
    filter.push({
      terms: {
        'netflow.dst_port': netflowReportQueryParams.dstPort,
      },
    });
  }

  if (netflowReportQueryParams.dstAddress) {
    filter.push({
      wildcard: {
        'netflow.dst_addr': netflowReportQueryParams.dstAddress,
      },
    });
  }

  if (netflowReportQueryParams.nasId) {
    filter.push({
      terms: {
        nasId: netflowReportQueryParams.nasId,
      },
    });
  }

  if (netflowReportQueryParams.username) {
    filter.push({
      wildcard: {
        username: netflowReportQueryParams.username,
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

const netflowGroupByIp = async (fromDate: Moment, toDate: Moment) => {
  const indexNames = getIndexNames(fromDate, toDate);
  let data: NetflowAggregateByIp[] = [];

  for (const indexName of indexNames) {
    try {
      const result = await aggregateNetflowByIp(indexName, fromDate, toDate);

      if (result) {
        data = data.concat(result);
      }
    } catch (error) {
      if (error.status === 404) {
        log.warn(`${indexName} index not found`);
      } else {
        log.error(error);
        log.error(error.status);
        throw error;
      }
    }
  }
  log.debug('netflow group by ip result length: ', data.length);
  return data;
};

const aggregateNetflowByIp = async (
  netflowIndex: string,
  fromDate: Moment,
  toDate: Moment,
): Promise<undefined | NetflowAggregateByIp> => {
  try {
    await elasticClient.search({});
    const exist = await elasticClient.indices.exists({
      index: netflowIndex,
    });
    if (!exist) {
      return;
    }

    const queryResult = await elasticClient.search({
      index: netflowIndex,
      size: 0,
      body: createNetflowGroupByAggregate(fromDate, toDate),
    });
    return queryResult.aggregations;
  } catch (e) {
    log.error('error @aggregateNetflowByIp');
    log.error(e);
    throw e;
  }
};

const createNetflowGroupByAggregate = (fromDate: Moment, toDate: Moment) => {
  return {
    size: 0,
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
        ],
        must_not: [
          {
            term: { status: 'enriched' },
          },
        ],
      },
    },

    aggs: {
      group_by_nas_ip: {
        terms: {
          field: 'host',
        },
        aggs: {
          group_by_member_ip: {
            terms: {
              field: 'netflow.src_addr',
            },
          },
        },
      },
    },
  };
};

const createNetflowGroupByBusinessId = () => {
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

const updateNetflows = async (
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
  //log.debug('INDEXES:', indexNames);
  for (const indexName of indexNames) {
    try {
      log.debug(
        'update query %j',
        createNetflowUpdateQuery(fromDate, toDate, nasIp, memberIp, updates),
      );
      const result = await elasticClient.updateByQuery({
        index: indexName,
        type: 'doc',
        maxRetries: 5,
        conflicts: 'proceed',
        body: createNetflowUpdateQuery(
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
        log.warn(`${indexName} index not found`);
      } else {
        log.error('error @updateNetflows');
        log.error(error.status);
        throw error;
      }
    }
  }
  log.debug(data);
  return data;
};

const createNetflowUpdateQuery = (
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
          { term: { host: nasIp } },
          {
            range: {
              '@timestamp': {
                gte: fromDate.format(),
                lte: toDate.format(),
              },
            },
          },
        ],
        should: [
          {
            term: {
              'netflow.src_addr': memberIp,
            },
          },
          {
            term: {
              'netflow.dst_addr': memberIp,
            },
          },
        ],
        minimum_should_match: 1,
      },
    },
    script: {
      lang: 'painless',
      params: {
        username: update.username,
        nasId: update.nasId,
        nasTitle: update.nasTitle,
        mac: update.mac,
        memberId: update.memberId,
        businessId: update.businessId,
      },
      source: `
      ctx._source.username=params.username;
      ctx._source.status="enriched";
      ctx._source.nasId=params.nasId;
      ctx._source.nasTitle=params.nasTitle;
      ctx._source.mac=params.mac;
      ctx._source.memberId=params.memberId;
      ctx._source.businessId=params.businessId`,
    },
  };
};

export default {
  updateNetflows,
  netflowGroupByIp,
  getNetflowReports,
  countBusinessReports,
};
