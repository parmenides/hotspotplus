"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const cron_1 = require("cron");
const auth_1 = require("../utils/auth");
const httpClient_1 = require("../utils/httpClient");
const netflow_1 = __importDefault(require("../worker/netflow"));
const syslog_1 = __importDefault(require("../worker/syslog"));
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const typings_1 = require("../typings");
const BUSINESS_API = `${process.env.API_ADDRESS}/api/Businesses`;
const log = logger_1.default.createLogger();
exports.countAndUpdateBusinessReports = async () => {
    const to = moment_timezone_1.default.tz(Date.now(), typings_1.LOGGER_TIME_ZONE);
    to.add({ days: 1 });
    to.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    const from = to.clone().subtract({ days: 10 });
    const netflowBusinessReportCount = await netflow_1.default.countBusinessReports(from, to);
    const netflowReportsArray = [];
    for (const businessId in netflowBusinessReportCount) {
        netflowReportsArray.push({
            businessId,
            count: netflowBusinessReportCount[businessId],
        });
    }
    for (const report of netflowReportsArray) {
        try {
            await updateBusiness(report.businessId, {
                netflowReportCount: report.count,
            });
        }
        catch (e) {
            log.error(e);
        }
    }
    const businessReportCount = await syslog_1.default.countBusinessReports(from, to);
    const reportsArray = [];
    for (const businessId in businessReportCount) {
        reportsArray.push({ businessId, count: businessReportCount[businessId] });
    }
    for (const report of reportsArray) {
        try {
            await updateBusiness(report.businessId, {
                syslogReportCount: report.count,
            });
        }
        catch (e) {
            log.error(e);
        }
    }
};
const updateBusiness = async (businessId, update) => {
    const token = await auth_1.login(
    // @ts-ignore
    process.env.SERVICE_MAN_USERNAME, process.env.SERVICE_MAN_PASSWORD);
    const httpClient = httpClient_1.createHttpClient(`${BUSINESS_API}`);
    await httpClient.patch(`/${businessId}`, update, {
        headers: {
            authorization: token,
        },
    });
};
exports.startCounterScheduler = () => {
    const job = new cron_1.CronJob('0 */2 * * *', async () => {
        await exports.countAndUpdateBusinessReports();
        log.debug('report count updated as scheduled', new Date());
    });
    job.start();
};
if (process.env.START_MANUAL_COUNTER === 'true') {
    exports.countAndUpdateBusinessReports();
}
//# sourceMappingURL=counterScheduler.js.map