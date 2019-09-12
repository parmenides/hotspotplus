//
import { Moment } from 'moment';

export const LOGGER_TIME_ZONE = '';
export const LOCAL_TIME_ZONE = 'Asia/Tehran';
export const DATABASE_DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';
export const REPORT_GREGORIAN_DATE_FORMAT = 'YYYY/MM/DD HH:mm';
export const REPORT_PERSIAN_DATE_FORMAT = 'jYYYY/jM/jD HH:MM';

export enum REPORT_TYPE {
  NETFLOW = 'netflow',
  WEBPROXY = 'webproxy',
  DNS = 'dns',
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
