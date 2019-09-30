import { OutputFormat } from './index';
import { REPORT_TYPE } from '../typings';

const netflow: ReportConfig = {
  name: 'Connections',
  helperName: 'netflowReportHelper.txt',
  fileMimeType:
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  fileSuffix: 'xlsx',
  templateName: 'netflowReportTemplate.xlsx',
  type: OutputFormat.EXCEL,
};

const webproxy: ReportConfig = {
  name: 'Web Proxy',
  helperName: 'webproxyReportHelper.txt',
  templateName: 'webproxyReportTemplate.xlsx',
  fileMimeType:
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  fileSuffix: 'xlsx',
  type: OutputFormat.EXCEL,
};

const dns: ReportConfig = {
  name: 'DNS',
  helperName: 'dnsReportHelper.txt',
  templateName: 'dnsReportTemplate.xlsx',
  fileMimeType:
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  fileSuffix: 'xlsx',
  type: OutputFormat.EXCEL,
};

interface ReportConfig {
  name: string;
  helperName: string;
  templateName: string;
  fileMimeType: string;
  fileSuffix: string;
  type: OutputFormat.EXCEL;
}

const getReportConfig = (reportType: REPORT_TYPE): ReportConfig => {
  switch (reportType) {
    case REPORT_TYPE.DNS:
      return dns;
    case REPORT_TYPE.NETFLOW:
      return netflow;
    case REPORT_TYPE.WEBPROXY:
      return webproxy;
    default:
      throw new Error('invalid report type');
  }
};

export { getReportConfig, ReportConfig };
