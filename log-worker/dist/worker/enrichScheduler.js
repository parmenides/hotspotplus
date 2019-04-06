"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const rabbitmq_1 = require("../utils/rabbitmq");
const typings_1 = require("../typings");
const logger_1 = __importDefault(require("../utils/logger"));
const cron_1 = require("cron");
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const log = logger_1.default.createLogger();
const ENRICHMENT_SCOPE = Number(process.env.ENRICHMENT_SCOPE);
exports.addEnrichmentTasks = async (reportType) => {
    try {
        const toDate = moment_timezone_1.default.tz(typings_1.LOGGER_TIME_ZONE);
        const fromDate = toDate.clone();
        fromDate.subtract({ minute: ENRICHMENT_SCOPE });
        log.debug(`Add enrichment scope for : ${typings_1.REPORT_TYPE} from ${fromDate} to ${toDate}`);
        const channel = await rabbitmq_1.getRabbitMqChannel();
        const duration = moment_1.default.duration(toDate.diff(fromDate));
        const hours = Math.ceil(duration.asHours());
        const RUN_TASK_EVERY_MINUTES = 5;
        const taskLen = new Array(hours * (60 / RUN_TASK_EVERY_MINUTES));
        for (const t of taskLen) {
            const start = fromDate.clone();
            fromDate.add({
                minutes: RUN_TASK_EVERY_MINUTES,
            });
            const end = fromDate.clone();
            const enrichTask = {
                from: start,
                to: end,
                reportType,
            };
            log.debug(`add new ${enrichTask.reportType} enrichment task from ${moment_1.default(enrichTask.from).format('YYYY.MM.DD hh:mm')} to ${moment_1.default(enrichTask.to).format('YYYY.MM.DD hh:mm')}`);
            await channel.sendToQueue(typings_1.QUEUES.LOG_ENRICHMENT_WORKER_QUEUE, Buffer.from(JSON.stringify(enrichTask)));
        }
    }
    catch (e) {
        log.error(e);
        throw e;
    }
};
exports.startEnrichScheduler = () => {
    const job = new cron_1.CronJob('0 */1 * * *', async () => {
        await exports.addEnrichmentTasks(typings_1.REPORT_TYPE.NETFLOW);
        await exports.addEnrichmentTasks(typings_1.REPORT_TYPE.SYSLOG);
    });
    job.start();
};
if (process.env.START_MANUAL_ENRICHMENT === 'true') {
    exports.addEnrichmentTasks(typings_1.REPORT_TYPE.NETFLOW);
    exports.addEnrichmentTasks(typings_1.REPORT_TYPE.SYSLOG);
}
//# sourceMappingURL=enrichScheduler.js.map