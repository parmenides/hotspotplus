"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const netflow_1 = __importDefault(require("./netflow"));
const syslog_1 = __importDefault(require("./syslog"));
const session_1 = __importDefault(require("./session"));
const rabbitmq_1 = require("../utils/rabbitmq");
const typings_1 = require("../typings");
const logger_1 = __importDefault(require("../utils/logger"));
const moment = require("moment");
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const log = logger_1.default.createLogger();
exports.enrichLogs = async () => {
    log.debug('At processing enrichment requests');
    const channel = await rabbitmq_1.getRabbitMqChannel();
    channel.prefetch(5, true);
    process.once('SIGINT', async () => {
        await channel.close();
    });
    channel.consume(typings_1.QUEUES.LOG_ENRICHMENT_WORKER_QUEUE, async (message) => {
        if (!message) {
            log.debug('empty message:', message);
            throw new Error('empty message');
        }
        const body = message.content.toString();
        try {
            log.debug(" [x] enrichment message received '%s'", body);
            const enrichTask = JSON.parse(body);
            const fromDATE = moment(enrichTask.from);
            const toDate = moment(enrichTask.to);
            const reportType = enrichTask.reportType;
            if (reportType === typings_1.REPORT_TYPE.SYSLOG) {
                const result = await syslog_1.default.syslogGroupByIp(fromDATE, toDate);
                const ipData = getIpData(result);
                await searchAndUpdateReport(reportType, ipData, fromDATE, toDate);
            }
            else if (reportType === typings_1.REPORT_TYPE.NETFLOW) {
                const result = await netflow_1.default.netflowGroupByIp(fromDATE, toDate);
                const ipData = getIpData(result);
                await searchAndUpdateReport(reportType, ipData, fromDATE, toDate);
            }
            else {
                log.warn('unknown enrichment type:', reportType);
                channel.ack(message);
                return;
            }
            channel.ack(message);
        }
        catch (error) {
            log.error(error);
            channel.nack(message, false, false);
        }
    }, { noAck: false });
};
const getIpData = (groupedReports) => {
    const ips = {};
    for (const aggregateResult of groupedReports) {
        for (const nasIpBucket of aggregateResult.group_by_nas_ip.buckets) {
            const nasIp = nasIpBucket.key;
            ips[nasIp] = [];
            for (const memberIpBucket of nasIpBucket.group_by_member_ip.buckets) {
                const memberIp = memberIpBucket.key;
                ips[nasIp].push(memberIp);
            }
        }
    }
    const ipData = [];
    Object.keys(ips).forEach((nasIp) => {
        ipData.push({ nasIp, memberIpList: ips[nasIp] });
    });
    return ipData;
};
const searchAndUpdateReport = async (reportType, ipData, from, to) => {
    if (ipData.length === 0) {
        return;
    }
    log.debug(`going to update reports: `, ipData);
    for (const flowData of ipData) {
        const nasIp = flowData.nasIp;
        for (const memberIp of flowData.memberIpList) {
            const groupedSessions = await session_1.default.querySessionsByIp(nasIp, memberIp, from, to);
            if (groupedSessions.group_by_username.buckets.length > 0) {
                log.warn('sessions: ', groupedSessions);
            }
            if (groupedSessions.group_by_username.buckets.length === 1) {
                const session = groupedSessions.group_by_username.buckets[0];
                const username = session.key;
                const nasId = groupedSessions.extra.hits.hits[0]._source.nasId;
                const nasTitle = groupedSessions.extra.hits.hits[0]._source.nasTitle;
                const mac = groupedSessions.extra.hits.hits[0]._source.mac;
                const memberId = groupedSessions.extra.hits.hits[0]._source.memberId;
                const businessId = groupedSessions.extra.hits.hits[0]._source.businessId;
                let updateResult;
                if (reportType === typings_1.REPORT_TYPE.SYSLOG) {
                    updateResult = await syslog_1.default.updateSyslogs(from, to, nasIp, memberIp, {
                        nasId,
                        nasTitle,
                        mac,
                        memberId,
                        businessId,
                        username,
                    });
                }
                else if (reportType === typings_1.REPORT_TYPE.NETFLOW) {
                    updateResult = await netflow_1.default.updateNetflows(from, to, nasIp, memberIp, {
                        nasId,
                        nasTitle,
                        mac,
                        memberId,
                        businessId,
                        username,
                    });
                }
                else {
                    throw new Error(`invalid report type: ${reportType}`);
                }
                log.debug(`updating ${reportType} report for ${username}  user, from:${moment(from).format('YYYY.MM.DD HH:MM')} to:${moment(to).format('YYYY.MM.DD HH:MM')} router IP:${nasIp} member IP:${memberIp}`, {
                    nasId,
                    memberId,
                    businessId,
                    username,
                });
                //log.debug(`update result`, updateResult);
            }
            else if (groupedSessions.group_by_username.buckets.length > 1) {
                log.debug('more than two up found going to split time range');
                const channel = await rabbitmq_1.getRabbitMqChannel();
                //split range in two;
                const newTo = moment_timezone_1.default.tz(from.valueOf() + (to.valueOf() - from.valueOf()) / 2, typings_1.LOGGER_TIME_ZONE);
                const reQueueOne = {
                    from,
                    to: newTo,
                    reportType,
                };
                await channel.sendToQueue(typings_1.QUEUES.RETRY_LOG_ENRICHMENT_WORKER_QUEUE, Buffer.from(JSON.stringify(reQueueOne)));
                const reQueueTwo = {
                    from: newTo,
                    to,
                    reportType,
                };
                await channel.sendToQueue(typings_1.QUEUES.RETRY_LOG_ENRICHMENT_WORKER_QUEUE, Buffer.from(JSON.stringify(reQueueTwo)));
            }
            else if (groupedSessions.group_by_username.buckets.length === 0) {
                log.warn(`nothing to update  ${reportType} from:${moment(from)} to:${moment(to)} router IP:${nasIp} member IP:${memberIp}`);
            }
        }
    }
};
//# sourceMappingURL=enrich.js.map