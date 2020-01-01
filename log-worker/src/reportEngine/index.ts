import renderExcel from './excel';
import renderCsv from './csv';
import { ReportConfig } from './reportTypes';
import { Response } from 'jsreport-core';

const enum OutputFormat {
  EXCEL = 'excel',
  CSV = 'csv',
}

export { OutputFormat };

const render = async (
  reportConfig: ReportConfig,
  data: any,
): Promise<string | Response> => {
  switch (reportConfig.output) {
    case OutputFormat.EXCEL:
      return renderExcel(reportConfig, data);
    case OutputFormat.CSV:
      return renderCsv(reportConfig, data);
    default:
      throw new Error('unknown report type');
  }
};

export default render;
