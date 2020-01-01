import { OutputFormat } from './index';
import { REPORT_TYPE } from '../typings';

const excelNetflow: ExcelReportConfig = {
  name: 'Connections',
  helperName: 'netflowReportHelper.txt',
  fileMimeType:
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  fileSuffix: 'xlsx',
  templateName: 'netflowReportTemplate.xlsx',
  output: OutputFormat.EXCEL,
};
const csvNetflow: CsvReportConfig = {
  name: 'Connections',
  fileMimeType: 'text/csv',
  fileSuffix: 'csv',
  headers: [
    {
      label: 'Router IP',
      value: 'routerAddr',
    },
    {
      label: 'Username',
      value: 'username',
    },
    {
      label: 'Src IP',
      value: 'srcIp',
    },
    {
      label: 'Dst IP',
      value: 'dstIp',
    },
    {
      label: 'Dst Port',
      value: 'dstPort',
    },
    {
      label: 'Src Port',
      value: 'srcPort',
    },
    {
      label: 'HTTP Method',
      value: 'method',
    },
    {
      label: 'URL',
      value: 'url',
    },
    {
      label: 'Member IP',
      value: 'memberIp',
    },
    {
      label: 'Jalali Date',
      value: 'jalaliDate',
    },
    {
      label: 'Date',
      value: 'gregorianDate',
    },
  ],
  output: OutputFormat.CSV,
};

const excelWebproxy: ExcelReportConfig = {
  name: 'Web Proxy',
  helperName: 'webproxyReportHelper.txt',
  templateName: 'webproxyReportTemplate.xlsx',
  fileMimeType:
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  fileSuffix: 'xlsx',
  output: OutputFormat.EXCEL,
};

const csvWebproxy: CsvReportConfig = {
  name: 'Web Proxy',
  fileMimeType: 'text/csv',
  fileSuffix: 'csv',
  headers: [
    {
      label: 'Router IP',
      value: 'nasIp',
    },
    {
      label: 'Username',
      value: 'username',
    },
    {
      label: 'Domain',
      value: 'domain',
    },
    {
      label: 'HTTP Method',
      value: 'method',
    },
    {
      label: 'URL',
      value: 'url',
    },
    {
      label: 'Member IP',
      value: 'memberIp',
    },
    {
      label: 'Jalali Date',
      value: 'jalaliDate',
    },
    {
      label: 'Date',
      value: 'gregorianDate',
    },
  ],
  output: OutputFormat.CSV,
};

const excelDns: ExcelReportConfig = {
  name: 'DNS',
  helperName: 'dnsReportHelper.txt',
  templateName: 'dnsReportTemplate.xlsx',
  fileMimeType:
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  fileSuffix: 'xlsx',
  output: OutputFormat.EXCEL,
};

const csvDns: CsvReportConfig = {
  name: 'DNS',
  headers: [
    {
      label: 'Router IP',
      value: 'nasIp',
    },
    {
      label: 'Username',
      value: 'username',
    },
    {
      label: 'Domain',
      value: 'domain',
    },
    {
      label: 'Jalali Date',
      value: 'jalaliDate',
    },
    {
      label: 'Date',
      value: 'gregorianDate',
    },
  ],
  fileMimeType: 'text/csv',
  fileSuffix: 'csv',
  output: OutputFormat.CSV,
};

interface ReportConfig {
  name: string;
  fileMimeType: string;
  fileSuffix: string;
  output: OutputFormat;
}

interface ExcelReportConfig extends ReportConfig {
  helperName: string;
  templateName: string;
}

interface CsvReportConfig extends ReportConfig {
  headers: Array<{
    label: string;
    value: string;
  }>;
}

const getReportConfig = (
  output: OutputFormat,
  reportType: REPORT_TYPE,
): ReportConfig => {
  if (output === OutputFormat.EXCEL) {
    switch (reportType) {
      case REPORT_TYPE.DNS:
        return excelDns;
      case REPORT_TYPE.NETFLOW:
        return excelNetflow;
      case REPORT_TYPE.WEBPROXY:
        return excelWebproxy;
      default:
        throw new Error('invalid report type');
    }
  } else if (output === OutputFormat.CSV) {
    switch (reportType) {
      case REPORT_TYPE.DNS:
        return csvDns;
      case REPORT_TYPE.NETFLOW:
        return csvNetflow;
      case REPORT_TYPE.WEBPROXY:
        return csvWebproxy;
      default:
        throw new Error('invalid report type');
    }
  } else {
    throw new Error('invalid report output');
  }
};

export { getReportConfig, ReportConfig, CsvReportConfig, ExcelReportConfig };
