//
import { Moment } from 'moment';

export enum QUEUES {
  LOG_ENRICHMENT_WORKER_QUEUE = 'log-worker',
  LOG_ENRICHMENT_WORKER_QUEUE_EXCHANGE = 'log-worker-ex',
  RETRY_LOG_ENRICHMENT_WORKER_QUEUE = 'retry-log-worker',
  RETRY_LOG_ENRICHMENT_WORKER_QUEUE_EXCHANGE = 'retry-log-worker-ex',
  LOG_WORKER_QUEUE = 'log-enrichment',
  LOG_WORKER_EXCHANGE = 'log-enrichment-ex',
  RETRY_LOG_WORKER_QUEUE = 'retry-log-enrichment',
  RETRY_LOG_WORKER_EXCHANGE = 'retry-log-enrichment-ex',
}

export interface EnrichTask {
  from: number;
  to: number;
  reportType: REPORT_TYPE;
}

export enum REPORT_TYPE {
  NETFLOW = 'netflow',
  SYSLOG = 'syslog',
}

export interface RawSyslogReport {
  _source: {
    username: string;
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
  dstPort?: number;
  srcAddress?: string;
  srcPort?: number;
  protocol?: string;
  nasId?: string;
}

export interface SyslogReportQueryParams {
  fromDate: Moment;
  toDate: Moment;
  username?: string;
  url?: string;
  domain?: string;
  method?: string;
  nasId?: string;
}

export interface RawNetflowReport {
  _source: {
    username: string;
    nasId: string;
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

export interface GeneralReportRequestTask {
  reportType: REPORT_TYPE;
  businessId: string;
  reportRequestId: string;
  fromDate?: number;
  toDate?: number;
  nasTitle?: string;
  nasId?: string;
}

export interface NetflowReportRequestTask extends GeneralReportRequestTask {
  username?: string;
  dstAddress?: string;
  dstPort?: number;
  srcAddress?: string;
  srcPort?: number;
  protocol?: string;
}

export interface SyslogReportRequestTask extends GeneralReportRequestTask {
  domain?: string;
  username?: string;
  url?: string;
  method?: string;
}
