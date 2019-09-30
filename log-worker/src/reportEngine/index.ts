import renderExcel from './excel';
import { ReportConfig } from './reportTypes';

const enum OutputFormat {
  EXCEL = 'excel',
}

export { OutputFormat };

const render = async (reportConfig: ReportConfig, data: any) => {
  switch (reportConfig.type) {
    case OutputFormat.EXCEL:
      const report = await renderExcel(reportConfig, data);
      return report;
    default:
      throw new Error('unknown report type');
  }
};

export default render;
