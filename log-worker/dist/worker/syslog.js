"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const elastic_1 = __importDefault(require("../utils/elastic"));
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const moment_jalaali_1 = __importDefault(require("moment-jalaali"));
const typings_1 = require("../typings");
const lodash_1 = __importDefault(require("lodash"));
const SYSLOG_LOG_INDEX_PREFIX = `syslog-`;
const log = logger_1.default.createLogger();
const getIndexNames = (from, to) => {
    const fromDateCounter = from.clone();
    const diffBetweenInMs = to.diff(fromDateCounter);
    let days = 0;
    if (diffBetweenInMs > 86400000) {
        days = Math.ceil(diffBetweenInMs / 86400000);
    }
    const indexNames = [exports.createSyslogIndexName(fromDateCounter)];
    for (let i = 0; i < days; i++) {
        fromDateCounter.add(1, 'days');
        indexNames.push(exports.createSyslogIndexName(fromDateCounter));
    }
    return indexNames;
};
const getSyslogReports = async (syslogReportRequestTask) => {
    const fromDate = syslogReportRequestTask.fromDate;
    const toDate = syslogReportRequestTask.toDate;
    const indexNames = getIndexNames(fromDate, toDate);
    let data = [];
    log.debug('indexes: ', indexNames);
    for (const indexName of indexNames) {
        try {
            const result = await getSyslogByIndex(indexName, {
                fromDate,
                toDate,
                method: syslogReportRequestTask.method,
                domain: syslogReportRequestTask.domain,
                nasId: syslogReportRequestTask.nasId,
                url: syslogReportRequestTask.url,
                username: syslogReportRequestTask.username,
            });
            if (result) {
                data = data.concat(result);
            }
        }
        catch (error) {
            if (error.status === 404) {
                log.warn(`${indexName} index not found`);
            }
            else {
                log.error(error.status);
                throw error;
            }
        }
    }
    //log.debug('log', data);
    log.debug('Result size:', data.length);
    //log.debug(formattedResult);
    return formatReports(data);
};
const formatReports = (rawSyslogReports) => {
    const formatted = rawSyslogReports.map((rawReport) => {
        const localDate = moment_timezone_1.default.tz(rawReport._source['@timestamp'], typings_1.LOCAL_TIME_ZONE);
        const gregorianDate = moment_timezone_1.default.tz(rawReport._source['@timestamp'], typings_1.LOCAL_TIME_ZONE);
        const jalaaliDate = moment_jalaali_1.default(localDate);
        return {
            Router: rawReport._source.nasTitle,
            Username: rawReport._source.username,
            IP: rawReport._source.memberIp,
            Mac: rawReport._source.mac,
            Jalali_Date: getJalaaliDate(jalaaliDate),
            Http_Method: rawReport._source.method,
            Domain: rawReport._source.domain,
            Url: rawReport._source.url,
            Gregorian_Date: gregorianDate.format('YYYY/MM/DD HH:mm'),
        };
    });
    return lodash_1.default.sortBy(formatted, ['Router', 'Username', 'Jalali_Date', 'Domain']);
};
const getJalaaliDate = (date) => {
    return date.format('jYYYY/jM/jD HH:MM');
};
exports.createSyslogIndexName = (fromDate) => {
    return `${SYSLOG_LOG_INDEX_PREFIX}${fromDate.format('YYYY.MM.DD')}`;
};
const getSyslogByIndex = async (syslogIndex, syslogReportQueryParams) => {
    const exist = await elastic_1.default.indices.exists({
        index: syslogIndex,
    });
    if (!exist) {
        return;
    }
    const query = createSyslogQuery(syslogReportQueryParams);
    const countResponse = await elastic_1.default.count({
        index: syslogIndex,
        body: query,
    });
    log.debug(`query from ${syslogIndex} from ${syslogReportQueryParams.fromDate.format()} to ${syslogReportQueryParams.toDate.format()}`);
    const totalLogs = countResponse.count;
    if (totalLogs === 0) {
        return;
    }
    let result = [];
    const scrollTtl = '2m';
    const maxResultSize = 500;
    log.debug(`total logs count ${totalLogs}`);
    const scrollResult = await elastic_1.default.search({
        scroll: scrollTtl,
        index: syslogIndex,
        size: maxResultSize,
        sort: ['_doc'],
        body: query,
        ignore: [404],
    });
    if (!scrollResult._scroll_id) {
        throw new Error('invalid scrollId ');
    }
    let scrollId = scrollResult._scroll_id;
    const allScrollId = [scrollId];
    if (scrollResult.hits) {
        result = result.concat(scrollResult.hits.hits);
    }
    const partsLen = totalLogs > maxResultSize ? Math.ceil(totalLogs / maxResultSize) : 1;
    log.debug(`query parts: ${partsLen}`);
    const parts = new Array(partsLen);
    for (const i of parts) {
        try {
            const queryResult = await elastic_1.default.scroll({
                scrollId: scrollId,
                scroll: scrollTtl,
            });
            if (queryResult._scroll_id && queryResult._scroll_id !== scrollId) {
                log.debug('new scroll id : ', queryResult._scroll_id);
                scrollId = queryResult._scroll_id;
                allScrollId.push(scrollId);
            }
            if (queryResult.hits) {
                result = result.concat(queryResult.hits.hits);
            }
            else {
                log.warn(queryResult);
            }
        }
        catch (error) {
            log.error(error);
            throw error;
        }
    }
    log.debug('ids:', allScrollId);
    const clearanceRes = await elastic_1.default.clearScroll({
        scrollId: allScrollId,
    });
    log.debug('clear: ', clearanceRes);
    return result;
};
const createSyslogQuery = (syslogReportQueryParams) => {
    const filter = [];
    if (syslogReportQueryParams.domain) {
        filter.push({
            wildcard: {
                domain: syslogReportQueryParams.domain,
            },
        });
    }
    if (syslogReportQueryParams.username) {
        filter.push({
            wildcard: {
                username: syslogReportQueryParams.username,
            },
        });
    }
    if (syslogReportQueryParams.url) {
        filter.push({
            wildcard: {
                url: syslogReportQueryParams.url,
            },
        });
    }
    filter.push({
        term: {
            status: 'enriched',
        },
    });
    filter.push({
        range: {
            '@timestamp': {
                gte: syslogReportQueryParams.fromDate.format(),
                lte: syslogReportQueryParams.toDate.format(),
            },
        },
    });
    if (syslogReportQueryParams.method) {
        filter.push({
            terms: {
                method: syslogReportQueryParams.method,
            },
        });
    }
    if (syslogReportQueryParams.nasId) {
        filter.push({
            terms: {
                nasId: syslogReportQueryParams.nasId,
            },
        });
    }
    return {
        query: {
            bool: {
                filter,
            },
        },
    };
};
const syslogGroupByIp = async (fromDate, toDate) => {
    const indexNames = getIndexNames(fromDate, toDate);
    let data = [];
    for (const indexName of indexNames) {
        try {
            const result = await aggregateSyslogByIp(indexName, fromDate, toDate);
            if (result) {
                data = data.concat(result);
            }
        }
        catch (error) {
            if (error.status === 404) {
                log.warn(`${indexName} index not found`);
            }
            else {
                log.error(error.status);
                throw error;
            }
        }
    }
    log.debug('syslog group by ip result length: ', data.length);
    return data;
};
const aggregateSyslogByIp = async (syslogIndex, fromDate, toDate) => {
    const exist = await elastic_1.default.indices.exists({
        index: syslogIndex,
    });
    if (!exist) {
        return;
    }
    const queryResult = await elastic_1.default.search({
        index: syslogIndex,
        size: 0,
        body: createSyslogGroupByQuery(fromDate, toDate),
    });
    return queryResult.aggregations;
};
const createSyslogGroupByQuery = (fromDate, toDate) => {
    return {
        size: 0,
        query: {
            bool: {
                must_not: [
                    {
                        term: { status: 'enriched' },
                    },
                ],
                filter: [
                    {
                        range: {
                            '@timestamp': {
                                gte: fromDate.format(),
                                lte: toDate.format(),
                            },
                        },
                    },
                ],
            },
        },
        aggs: {
            group_by_nas_ip: {
                terms: {
                    field: 'nasIp',
                },
                aggs: {
                    group_by_member_ip: {
                        terms: {
                            field: 'memberIp',
                        },
                    },
                },
            },
        },
    };
};
const updateSyslogs = async (fromDate, toDate, nasIp, memberIp, updates) => {
    const indexNames = getIndexNames(fromDate, toDate);
    let data = [];
    log.debug('INDEXES:', indexNames);
    for (const index of indexNames) {
        try {
            const result = await elastic_1.default.updateByQuery({
                index,
                type: 'doc',
                maxRetries: 5,
                conflicts: 'proceed',
                body: createUsernameUpdateQuery(fromDate, toDate, nasIp, memberIp, updates),
            });
            data = data.concat(result);
        }
        catch (error) {
            if (error.status === 404) {
                log.warn(`${index} index not found`);
            }
            else {
                log.error(error.status);
                throw error;
            }
        }
    }
    log.debug(data);
    return data;
};
const createUsernameUpdateQuery = (fromDate, toDate, nasIp, memberIp, update) => {
    return {
        query: {
            bool: {
                must_not: [
                    {
                        term: { status: 'enriched' },
                    },
                ],
                filter: [
                    {
                        range: {
                            '@timestamp': {
                                gte: fromDate.format(),
                                lte: toDate.format(),
                            },
                        },
                    },
                    {
                        term: {
                            nasIp,
                        },
                    },
                    {
                        term: {
                            memberIp,
                        },
                    },
                ],
            },
        },
        script: {
            lang: 'painless',
            inline: `
            ctx._source['username'] = "${update.username}";
            ctx._source['status'] = "enriched";
            ctx._source['nasId'] = "${update.nasId}";
            ctx._source['nasTitle'] = "${update.nasTitle}";
            ctx._source['mac'] = "${update.mac}";
            ctx._source['memberId'] = "${update.memberId}";
            ctx._source['businessId'] = "${update.businessId}";
            `,
        },
    };
};
const countBusinessReports = async (fromDate, toDate) => {
    const indexNames = getIndexNames(fromDate, toDate);
    let reportCounts = [];
    for (const index of indexNames) {
        const exist = await elastic_1.default.indices.exists({
            index,
        });
        if (exist) {
            const response = await elastic_1.default.search({
                index,
                body: createSyslogGroupByBusinessIdQuery(),
            });
            if (response.aggregations.group_by_business_id &&
                response.aggregations.group_by_business_id.buckets) {
                reportCounts = reportCounts.concat(response.aggregations.group_by_business_id.buckets);
            }
        }
    }
    const businessReportCount = {};
    for (const reportCount of reportCounts) {
        businessReportCount[reportCount.key] =
            businessReportCount[reportCount.key] || 0;
        businessReportCount[reportCount.key] =
            businessReportCount[reportCount.key] + reportCount.doc_count;
    }
    log.error('2783648723647263478627486278634728643');
    log.error(businessReportCount);
    return businessReportCount;
};
const createSyslogGroupByBusinessIdQuery = () => {
    return {
        size: 0,
        aggs: {
            group_by_business_id: {
                terms: {
                    field: 'businessId',
                },
            },
        },
    };
};
exports.default = {
    syslogGroupByIp,
    updateSyslogs,
    getSyslogReports,
    countBusinessReports,
};
//# sourceMappingURL=syslog.js.map