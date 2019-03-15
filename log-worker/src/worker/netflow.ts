import logger from '../utils/logger';
import elasticClient from '../utils/elastic';
import momentTz from 'moment-timezone';
import { Moment } from 'moment';
import momentJ from 'moment-jalaali';
import { UpdateDocumentByQueryResponse } from 'elasticsearch';
import {
  NetflowAggregateByIp,
  NetflowReportQueryParams,
  NetflowReportRequestTask,
  RawNetflowReport,
} from '../typings';

const NETFLOW_LOG_INDEX_PREFIX = `netflow-`;

const log = logger.createLogger();

const getNetflowReports = async (
  reportRequestTask: NetflowReportRequestTask,
) => {
  const fromDate = momentTz.tz(reportRequestTask.fromDate, 'Europe/London');
  const fromDateCounter = momentTz.tz(
    reportRequestTask.fromDate,
    'Europe/London',
  );
  const toDate = momentTz.tz(reportRequestTask.toDate, 'Europe/London');

  const daysBetweenInMs = toDate.diff(fromDateCounter);
  const days = Math.ceil(daysBetweenInMs / 86400000);

  const indexNames = [createNetflowIndexName(fromDateCounter)];
  for (let i = 0; i < days; i++) {
    fromDateCounter.add(1, 'days');
    indexNames.push(createNetflowIndexName(fromDateCounter));
  }

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
  return rawNetflowReports.map((rawReport) => {
    const localDate = momentTz.tz(
      rawReport._source['@timestamp'],
      'Asia/Tehran',
    );
    const jalaaliDate = momentJ(localDate);

    return {
      nasId: rawReport._source.nasId,
      username: rawReport._source.username,
      date: getJalaaliDate(jalaaliDate),
      src_addr: rawReport._source.netflow.src_addr,
      src_port: rawReport._source.netflow.src_port,
      src_port_name: rawReport._source.netflow.src_port_name,
      src_mac: rawReport._source.netflow.src_mac,
      dst_addr: rawReport._source.netflow.dst_addr,
      dst_port: rawReport._source.netflow.dst_port,
      dst_port_name: rawReport._source.netflow.dst_port_name,
      dst_mac: rawReport._source.netflow.dst_mac,
      protocol_name: rawReport._source.netflow.protocol_name,
      '@timestamp': rawReport._source['@timestamp'],
    };
  });
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
  const countResponse = await countNetflowReportByIndex(
    netflowIndex,
    netflowReportQueryParams,
  );

  const totalLogs = countResponse.count;
  const maxResultSize = 500;
  const partsLen =
    totalLogs > maxResultSize ? Math.ceil(totalLogs / maxResultSize) : 1;

  const parts = new Array(partsLen);
  let startFrom = 0;
  let result: Array<{ _source: any }> = [];
  for (const i of parts) {
    try {
      const queryResult = await queryNetflowReports(
        netflowIndex,
        startFrom,
        maxResultSize,
        netflowReportQueryParams,
      );
      if (queryResult.hits) {
        result = result.concat(queryResult.hits.hits);
      } else {
        log.warn(queryResult);
      }
      startFrom = startFrom + maxResultSize;
    } catch (error) {
      log.error('error @getNetflowsByIndex');
      log.error(error);
      throw error;
    }
  }
  return result;
};

const countNetflowReportByIndex = async (
  indexName: string,
  netflowReportQueryParams: NetflowReportQueryParams,
) => {
  const result = await elasticClient.count({
    index: indexName,
    body: createNetflowQuery(netflowReportQueryParams),
  });
  return result;
};

const queryNetflowReports = async (
  indexName: string,
  startFrom: number,
  size: number,
  netflowReportQueryParams: NetflowReportQueryParams,
) => {
  const result = await elasticClient.search({
    index: indexName,
    from: startFrom,
    size,
    body: createNetflowQuery(netflowReportQueryParams),
  });
  return result;
};

const createNetflowQuery = (
  netflowReportQueryParams: NetflowReportQueryParams,
) => {
  const filter = [];
  const must = [];

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
    filter.push({
      term: {
        'netflow.protocol_name': netflowReportQueryParams.protocol,
      },
    });
  }

  if (netflowReportQueryParams.srcPort) {
    filter.push({
      term: {
        'netflow.src_port': netflowReportQueryParams.srcPort,
      },
    });
  }

  if (netflowReportQueryParams.srcAddress) {
    filter.push({
      term: {
        'netflow.src_address': netflowReportQueryParams.srcAddress,
      },
    });
  }

  if (netflowReportQueryParams.dstPort) {
    filter.push({
      term: {
        'netflow.dst_port': netflowReportQueryParams.dstPort,
      },
    });
  }

  if (netflowReportQueryParams.dstAddress) {
    filter.push({
      term: {
        'netflow.dst_address': netflowReportQueryParams.dstAddress,
      },
    });
  }

  if (netflowReportQueryParams.nasId) {
    filter.push({
      term: {
        nasId: netflowReportQueryParams.nasId,
      },
    });
  }

  if (netflowReportQueryParams.username) {
    must.push({
      match: {
        username: netflowReportQueryParams.username,
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

const netflowGroupByIp = async (from: number, to: number) => {
  const fromDate = momentTz.tz(from, 'Europe/London');
  const fromDateCounter = momentTz.tz(from, 'Europe/London');
  const toDate = momentTz.tz(to, 'Europe/London');

  const daysBetweenInMs = toDate.diff(fromDateCounter);
  const days = Math.ceil(daysBetweenInMs / 86400000);
  const indexNames = [createNetflowIndexName(fromDateCounter)];
  for (let i = 0; i < days; i++) {
    fromDateCounter.add(1, 'days');
    indexNames.push(createNetflowIndexName(fromDateCounter));
  }

  let data: NetflowAggregateByIp[] = [];

  log.debug('INDEXES for netflowGroupByIp:', indexNames);
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
  //log.debug('NetflowGroupByIp Size ', data.length);
  return data;
};

const aggregateNetflowByIp = async (
  netflowIndex: string,
  fromDate: Moment,
  toDate: Moment,
): Promise<undefined | NetflowAggregateByIp> => {
  try {
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

const updateNetflows = async (
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
  log.debug('************');
  const fromDate = momentTz.tz(from, 'Europe/London');
  const fromDateCounter = momentTz.tz(from, 'Europe/London');
  const toDate = momentTz.tz(to, 'Europe/London');

  const daysBetweenInMs = toDate.diff(fromDateCounter);
  const days = Math.ceil(daysBetweenInMs / 86400000);

  const indexNames = [createNetflowIndexName(fromDateCounter)];
  for (let i = 0; i < days; i++) {
    fromDateCounter.add(1, 'days');
    indexNames.push(createNetflowIndexName(fromDateCounter));
  }
  let data: UpdateDocumentByQueryResponse[] = [];
  //log.debug('INDEXES:', indexNames);
  for (const indexName of indexNames) {
    try {
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
      inline: `
      ctx._source['username']="${update.username}";
      ctx._source['status']="enriched";
      ctx._source['nasId']="${update.nasId}";
      ctx._source['memberId']="${update.memberId}";
      ctx._source['businessId']="${update.businessId}"`,
    },
  };
};

export default {
  updateNetflows,
  netflowGroupByIp,
  getNetflowReports,
};
