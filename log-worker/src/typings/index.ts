//
import { Moment } from 'moment';
import { ClickNetflowRow } from '../modules/netflow';
import { ClickWebproxyLogRow } from '../modules/webproxyLog';

export const LOGGER_TIME_ZONE = '';
export const LOCAL_TIME_ZONE = 'Asia/Tehran';
export const DATABASE_DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';
export const REPORT_GREGORIAN_DATE_FORMAT = 'YYYY/MM/DD HH:mm';
export const REPORT_PERSIAN_DATE_FORMAT = 'jYYYY/jM/jD HH:MM';

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
  CONNECTION = 'netflow',
  WEBSITE = 'syslog',
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

export interface GeneralReportRequestTask {
  type: REPORT_TYPE;
  creationDate: string;
  status: string;
  businessId?: string;
  id: string;
  fromDate?: Moment;
  toDate?: Moment;
  username?: string;
  from?: number;
  to?: number;
  nas?: Array<{ id: string; title: string }>;
}

export interface NetflowReportRequestTask extends GeneralReportRequestTask {
  dstAddress?: string;
  dstPort?: string[];
  srcAddress?: string;
  srcPort?: string[];
  protocol?: string;
}

export enum PROTOCOLS {
  TCP = 'TCP',
  UPD = 'UDP',
}

export interface ClickHouseColumnMeta {
  name: string;
  type: string;
}

export interface WebproxyReportRequestTask extends GeneralReportRequestTask {
  domain?: string;
  url?: string;
  method?: string[];
}
export interface DnsReportRequestTask extends GeneralReportRequestTask {
  domain?: string;
}
