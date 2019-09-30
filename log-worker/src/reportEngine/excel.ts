import * as fs from 'fs';

const jsreport = require('jsreport-core')();
import { createLogger } from '../utils/logger';
import util from 'util';
import { ReportConfig } from './reportTypes';

const log = createLogger();
jsreport.use(require('jsreport-xlsx')());
jsreport.use(require('jsreport-handlebars')());
jsreport.init();

const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
const closeFile = util.promisify(fs.close);
const unlink = util.promisify(fs.unlink);

const render = async (reportConfig: ReportConfig, data1: any) => {
  const { templateName, helperName } = reportConfig;

  const template = await readFile(
    `${process.env.REPORT_TEMPLATES_PAHT}/${templateName}`,
  );

  const helpers = await readFile(
    `${process.env.REPORT_TEMPLATES_PAHT}/${helperName}`,
  );

  const report = await jsreport.render({
    template: {
      recipe: 'xlsx',
      engine: 'handlebars',
      content: helpers.toString('utf8'),
      xlsxTemplate: {
        content: template.toString('base64'),
      },
    },
    templatingEngines: {
      timeout: 80000,
    },
    data: data1,
  });
  return report;
};

export default render;
