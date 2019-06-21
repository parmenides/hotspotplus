//
import { Moment } from 'moment';

export const LOGGER_TIME_ZONE = 'Europe/London';
export const LOCAL_TIME_ZONE = 'Asia/Tehran';

export enum QUEUES {
  LOG_ENRICHMENT_WORKER_QUEUE = 'log-enrichment',
  LOG_ENRICHMENT_WORKER_QUEUE_EXCHANGE = 'log-enrichment-ex',
  RETRY_LOG_ENRICHMENT_WORKER_QUEUE = 'retry-log-enrichment',
  RETRY_LOG_ENRICHMENT_WORKER_QUEUE_EXCHANGE = 'retry-log-enrichment-ex',
  LOG_WORKER_QUEUE = 'log-worker',
  LOG_WORKER_EXCHANGE = 'log-worker-ex',
  RETRY_LOG_WORKER_QUEUE = 'retry-log-worker',
  RETRY_LOG_WORKER_EXCHANGE = 'retry-log-worker-ex',
}

export interface EnrichTask {
  from: Moment;
  to: Moment;
  reportType: REPORT_TYPE;
}

export enum REPORT_TYPE {
  NETFLOW = 'netflow',
  SYSLOG = 'syslog',
}

export interface RawSyslogReport {
  _source: {
    username: string;
    nasId: string;
    mac: string;
    nasTitle: string;
    query: string;
    '@timestamp': string;
    params: string;
    message: string;
    method: string;
    url: string;
    protocol: string;
    path: string;
    domain: string;
    hostGeoIp: any;
    memberIp: string;
    nasIp: string;
  };
}

export interface SyslogAggregateByIp {
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

export interface NetflowReportQueryParams {
  fromDate: Moment;
  toDate: Moment;
  username?: string;
  dstAddress?: string;
  dstPort?: string[];
  srcAddress?: string;
  srcPort?: string[];
  protocol?: string;
  nasId?: string[];
}

export interface SyslogReportQueryParams {
  fromDate: Moment;
  toDate: Moment;
  username?: string;
  url?: string;
  domain?: string;
  method?: string[];
  nasId?: string[];
}

export interface RawNetflowReport {
  _source: {
    username: string;
    mac: string;
    nasId: string;
    nasTitle: string;
    netflow: {
      src_port: string;
      protocol: string;
      dst_addr: string;
      dst_port: string;
      src_addr: string;
      ipv4_next_hop: string;
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

export interface GeneralReportRequestTask {
  type: REPORT_TYPE;
  businessId: string;
  id: string;
  fromDate: Moment;
  toDate: Moment;
  username?: string;
  from?: number;
  to?: number;
  nasTitle?: string;
  nasId?: string[];
}

export interface NetflowReportRequestTask extends GeneralReportRequestTask {
  dstAddress?: string;
  dstPort?: string[];
  srcAddress?: string;
  srcPort?: string[];
  protocol?: string;
}

export interface SyslogReportRequestTask extends GeneralReportRequestTask {
  domain?: string;
  url?: string;
  method?: string[];
}
