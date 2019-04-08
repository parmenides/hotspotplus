"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const rabbitmq_1 = require("../utils/rabbitmq");
const netflow_1 = __importDefault(require("./netflow"));
const httpClient_1 = require("../utils/httpClient");
const json2csv_1 = require("json2csv");
const fs_1 = __importDefault(require("fs"));
const request_promise_1 = __importDefault(require("request-promise"));
const auth_1 = require("../utils/auth");
const tmp_promise_1 = require("tmp-promise");
const util_1 = __importDefault(require("util"));
const syslog_1 = __importDefault(require("./syslog"));
const typings_1 = require("../typings");
const momentTz = require("moment-timezone");
// Convert fs.readFile into Promise version of same
const log = logger_1.default.createLogger();
const REPORT_CONTAINER = process.env.REPORT_CONTAINER || 'reports';
const UPLOAD_API = `${process.env.API_ADDRESS}/api/BigFiles/${REPORT_CONTAINER}/upload`;
const REPORT_API = `${process.env.API_ADDRESS}/api/Reports`;
if (!process.env.SERVICE_MAN_USERNAME ||
    !process.env.SERVICE_MAN_PASSWORD ||
    !process.env.API_ADDRESS) {
    throw new Error('invalid auth env variables');
}
exports.processLogRequest = async () => {
    log.debug('At processing log requests');
    const channel = await rabbitmq_1.getRabbitMqChannel();
    channel.prefetch(2, true);
    process.once('SIGINT', async () => {
        await channel.close();
    });
    channel.consume(typings_1.QUEUES.LOG_WORKER_QUEUE, async (message) => {
        if (!message) {
            log.debug('empty message:', message);
            throw new Error('empty message');
        }
        const body = message.content.toString();
        log.debug(" [x] Received Log Request '%s'", body);
        const generalReportRequestTask = JSON.parse(body);
        if (!generalReportRequestTask.to) {
            generalReportRequestTask.toDate = momentTz.tz(typings_1.LOGGER_TIME_ZONE);
            generalReportRequestTask.to = momentTz(generalReportRequestTask.toDate, typings_1.LOCAL_TIME_ZONE).valueOf();
        }
        else {
            generalReportRequestTask.toDate = momentTz.tz(generalReportRequestTask.to, typings_1.LOGGER_TIME_ZONE);
        }
        // create fromDate 1 year before from Date
        if (!generalReportRequestTask.from) {
            generalReportRequestTask.fromDate = momentTz.tz(generalReportRequestTask.toDate.valueOf() - 31539999 * 1000, typings_1.LOGGER_TIME_ZONE);
            generalReportRequestTask.from = momentTz(generalReportRequestTask.fromDate, typings_1.LOCAL_TIME_ZONE).valueOf();
        }
        else {
            generalReportRequestTask.fromDate = momentTz.tz(generalReportRequestTask.from, typings_1.LOGGER_TIME_ZONE);
        }
        log.debug(`Create ${generalReportRequestTask.type} report from ${generalReportRequestTask.fromDate} to ${generalReportRequestTask.toDate}`, JSON.stringify(generalReportRequestTask));
        try {
            let reports;
            let fields;
            if (generalReportRequestTask.type === typings_1.REPORT_TYPE.NETFLOW) {
                reports = await netflow_1.default.getNetflowReports(generalReportRequestTask);
                fields = getNetflowFields();
            }
            else if (generalReportRequestTask.type === typings_1.REPORT_TYPE.SYSLOG) {
                reports = await syslog_1.default.getSyslogReports(generalReportRequestTask);
                fields = getSyslogFields();
            }
            else {
                throw new Error('invalid report type');
            }
            log.debug(`index one of result size: ${reports.length}`);
            const csvReport = jsonToCsv(fields, reports);
            await uploadReport(generalReportRequestTask, csvReport);
            channel.ack(message);
        }
        catch (error) {
            log.error(error);
            //todo remove me after test
            //channel.ack(message);
            channel.nack(message, false, false);
        }
    }, { noAck: false });
};
const getNetflowFields = () => {
    return [
        'Router',
        'Username',
        'Jalali_Date',
        'Mac',
        'Src_Addr',
        'Src_Port',
        'Dst_Addr',
        'Dst_Port',
        'Protocol',
        'Gregorian_Date',
    ];
};
const getSyslogFields = () => {
    return [
        'Router',
        'Username',
        'IP',
        'Mac',
        'Jalali_Date',
        'Http_Method',
        'Domain',
        'Url',
        'Gregorian_Date',
    ];
};
const jsonToCsv = (fields, jsonData) => {
    try {
        const opts = { fields, defaultValue: 'N/A' };
        const json2CsvParser = new json2csv_1.Parser(opts);
        const csvReport = json2CsvParser.parse(jsonData);
        return csvReport;
    }
    catch (error) {
        log.error(error);
        throw error;
    }
};
const writeFile = util_1.default.promisify(fs_1.default.writeFile);
const closeFile = util_1.default.promisify(fs_1.default.close);
const unlink = util_1.default.promisify(fs_1.default.unlink);
const uploadReport = async (reportRequest, csv) => {
    const reportFile = await tmp_promise_1.file();
    await writeFile(reportFile.path, csv, 'utf8');
    await closeFile(reportFile.fd);
    log.debug(reportFile.path);
    log.debug(reportFile.path);
    const token = await auth_1.login(
    // @ts-ignore
    process.env.SERVICE_MAN_USERNAME, process.env.SERVICE_MAN_PASSWORD);
    const fileName = `${Date.now().toString()}.csv`;
    const options = {
        method: 'POST',
        url: UPLOAD_API,
        headers: {
            authorization: token,
            Accept: 'application/json',
            'cache-control': 'no-cache',
            'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
        },
        formData: {
            businessId: reportRequest.businessId,
            myfile: {
                value: fs_1.default.createReadStream(reportFile.path),
                options: { filename: fileName, contentType: 'text/csv' },
            },
        },
    };
    const response = await request_promise_1.default(options);
    await unlink(reportFile.path);
    log.debug(JSON.parse(response));
    await updateReportRequest(reportRequest, {
        container: REPORT_CONTAINER,
        fileName: fileName,
    });
};
const updateReportRequest = async (reportRequest, fileInfo) => {
    const token = await auth_1.login(
    // @ts-ignore
    process.env.SERVICE_MAN_USERNAME, process.env.SERVICE_MAN_PASSWORD);
    log.debug('report:', reportRequest.id);
    log.debug('file:', fileInfo);
    const update = {
        status: 'ready',
        container: fileInfo.container,
        fileName: fileInfo.fileName,
        from: reportRequest.from,
        to: reportRequest.to,
    };
    const httpClient = httpClient_1.createHttpClient(`${REPORT_API}`);
    await httpClient.patch(`/${reportRequest.id}`, update, {
        headers: {
            authorization: token,
        },
    });
};
//# sourceMappingURL=index.js.map