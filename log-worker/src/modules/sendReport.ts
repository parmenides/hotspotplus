import logger from '../utils/logger';
import { createHttpClient } from '../utils/httpClient';
import request from 'request-promise';
import { login } from '../utils/auth';
import { GeneralReportRequestTask } from '../typings';
import ReadStream = NodeJS.ReadStream;
import * as fs from 'fs';
import { ReportConfig } from '../reportEngine/reportTypes';

const log = logger.createLogger();
const REPORT_CONTAINER = process.env.REPORT_CONTAINER || 'reports';
const UPLOAD_API = `${
  process.env.API_ADDRESS
}/api/BigFiles/${REPORT_CONTAINER}/upload`;
const REPORT_API = `${process.env.API_ADDRESS}/api/Reports`;

if (
  !process.env.SERVICE_MAN_USERNAME ||
  !process.env.SERVICE_MAN_PASSWORD ||
  !process.env.API_ADDRESS
) {
  throw new Error('invalid auth env variables');
}
//const writeFile = util.promisify(fs.writeFile);
//const closeFile = util.promisify(fs.close);
//const unlink = util.promisify(fs.unlink);

const sendReport = async (
  reportRequest: GeneralReportRequestTask,
  path: string,
  reportConfig: ReportConfig,
) => {
  try {
    const token = await login(
      // @ts-ignore
      process.env.SERVICE_MAN_USERNAME,
      process.env.SERVICE_MAN_PASSWORD,
    );
    const fileName = `${Date.now().toString()}.${reportConfig.fileSuffix}`;
    const options = {
      method: 'POST',
      url: UPLOAD_API,
      timeout: 600000,
      headers: {
        authorization: token,
        Accept: 'application/json',
        'cache-control': 'no-cache',
        'content-type':
          'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
      },
      formData: {
        businessId: reportRequest.businessId,
        myfile: {
          value: fs.createReadStream(path),
          options: {
            filename: fileName,
            contentType: reportConfig.fileMimeType,
          },
        },
      },
    };
    const response = await request(options);
    log.debug(`uploaded: ${response.status}`);
    await updateReportStatus(reportRequest, reportConfig, {
      container: REPORT_CONTAINER,
      fileName,
    });
  } catch (error) {
    log.error('upload failed');
    log.error(error);
    throw error;
  }
};

const updateReportStatus = async (
  reportRequest: GeneralReportRequestTask,
  reportConfig: ReportConfig,
  fileInfo: { fileName: string; container: string },
) => {
  log.debug('updating report request', fileInfo);
  log.debug('updating report request', reportRequest);
  const token = await login(
    // @ts-ignore
    process.env.SERVICE_MAN_USERNAME,
    process.env.SERVICE_MAN_PASSWORD,
  );
  log.debug('report:', reportRequest.id);
  log.debug({ fileInfo });
  const update = {
    status: 'ready',
    container: fileInfo.container,
    fileName: fileInfo.fileName,
    reportType: reportConfig.type,
    from: reportRequest.from,
    to: reportRequest.to,
  };
  log.debug({ update });

  const httpClient = createHttpClient(`${REPORT_API}`);
  await httpClient.patch(`/${reportRequest.id}`, update, {
    headers: {
      authorization: token,
    },
  });
};

export { sendReport };
