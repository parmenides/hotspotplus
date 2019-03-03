import logger from '../utils/logger';
import elasticClient from '../utils/elastic';
import momentTz from 'moment-timezone';
import { Moment } from 'moment';
import momentJ from 'moment-jalaali';
import { UpdateDocumentByQueryResponse } from 'elasticsearch';

const NETFLOW_LOG_INDEX_PREFIX = `netflow-`;

const log = logger.createLogger();

interface NetflowIpQueryData {
  memberIpList: string[];
  nasIpList: string[];
}

const getNetflowReports = async (
  username: string,
  from: number,
  to: number,
  netflowIpQueryData: NetflowIpQueryData,
) => {
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

  let data: RawNetflowReport[] = [];

  log.debug('INDEXES:', indexNames);
  for (const indexName of indexNames) {
    try {
      const result = await getNetflowsByIndex(
        indexName,
        fromDate,
        toDate,
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
  //log.debug('log', data);
  log.debug(data.length);
  //log.debug(formattedResult);
  return formatReports(username, data);
};

const formatReports = (
  username: string,
  rawNetflowReports: RawNetflowReport[],
) => {
  return rawNetflowReports.map((rawReport) => {
    const localDate = momentTz.tz(
      rawReport._source['@timestamp'],
      'Asia/Tehran',
    );
    const jalaaliDate = momentJ(localDate);

    return {
      username,
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
  fromDate: Moment,
  toDate: Moment,
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
  fromDate: Moment,
  toDate: Moment,
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
  fromDate: Moment,
  toDate: Moment,
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
  fromDate: Moment,
  toDate: Moment,
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
              'netflow.src_addr': netflowIpQueryData.memberIpList,
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
};

interface RawNetflowReport {
  _source: {
    netflow: {
      tos: number;
      xlate_dst_port: number;
      src_port: number;
      xlate_dst_addr_ipv4: string;
      src_addr: string;
      dst_mac: string;
      dst_locality: string;
      protocol_name: string;
      tcp_flag_tags: any[];
      flowset_id: number;
      xlate_src_addr_ipv4: string;
      tcp_flags: number;
      packets: 1;
      src_locality: string;
      protocol: number;
      dst_addr: string;
      next_hop: string;
      src_mac: string;
      flow_seq_num: number;
      input_snmp: number;
      src_mask_len: number;
      src_port_name: string;
      output_snmp: number;
      out_src_mac: string;
      last_switched: string;
      xlate_src_port: number;
      dst_port_name: string;
      dst_port: number;
      bytes: number;
      version: string;
      first_switched: string;
      dst_mask_len: number;
      flow_locality: string;
      tcp_flags_label: string;
    };
    '@version': string;
    geoip_dst: {
      autonomous_system: string;
    };
    host: string;
    geoip_src: {
      autonomous_system: string;
    };
    type: string;
    tags: string[];
    '@timestamp': string;
  };
}

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

  log.debug('INDEXES:', indexNames);
  for (const indexName of indexNames) {
    try {
      const result = await aggregateNetflowByIp(indexName, fromDate, toDate);
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
  log.debug(data.length);
  return data;
};

const aggregateNetflowByIp = async (
  netflowIndex: string,
  fromDate: Moment,
  toDate: Moment,
) => {
  const queryResult = await elasticClient.search({
    index: netflowIndex,
    size: 0,
    body: createNetflowGroupByAggregate(fromDate, toDate),
  });
  return queryResult.aggregations;
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
            terms: { enriched: true },
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
              field: 'netflow.src_port',
            },
          },
        },
      },
    },
  };
};

export interface NetflowAggregateByIp {
  group_by_nas_ip: {
    doc_count_error_upper_bound: number;
    sum_other_doc_count: number;
    buckets: [
      {
        key: string;
        doc_count: number;
        group_by_member_ip: {
          doc_count_error_upper_bound: number;
          sum_other_doc_count: number;
          buckets: Array<{ key: string; doc_count: number }>;
        };
      }
    ];
  };
}

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
  log.debug('INDEXES:', indexNames);
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
            terms: { enriched: true },
          },
        ],
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
              memberIp: [memberIp],
            },
          },
        ],
      },
    },
    script: {
      lang: 'painless',
      inline: `
            ctx._source['enrichDate'] = ${Date.now()};
            ctx._source['username'] = ${update.username};
            ctx._source['enriched'] = true;
            ctx._source['nasId'] = ${update.nasId};
            ctx._source['memberId'] = ${update.memberId};
            ctx._source['businessId'] = ${update.businessId};
            `,
    },
  };
};

export default {
  updateNetflows,
  netflowGroupByIp,
  getNetflowReports,
};
