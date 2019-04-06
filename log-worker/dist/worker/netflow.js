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
const NETFLOW_LOG_INDEX_PREFIX = `netflow-`;
const log = logger_1.default.createLogger();
const getIndexNames = (from, to) => {
    const fromDateCounter = from.clone();
    const diffBetweenInMs = to.diff(fromDateCounter);
    let days = 0;
    if (diffBetweenInMs > 86400000) {
        days = Math.ceil(diffBetweenInMs / 86400000);
    }
    const indexNames = [createNetflowIndexName(fromDateCounter)];
    for (let i = 0; i < days; i++) {
        fromDateCounter.add(1, 'days');
        indexNames.push(createNetflowIndexName(fromDateCounter));
    }
    return indexNames;
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
                body: createNetflowGroupByBusinessId(),
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
    return businessReportCount;
};
const getNetflowReports = async (reportRequestTask) => {
    const fromDate = reportRequestTask.fromDate;
    const toDate = reportRequestTask.toDate;
    const indexNames = getIndexNames(fromDate, toDate);
    let data = [];
    for (const indexName of indexNames) {
        try {
            const result = await getNetflowsByIndex(indexName, {
                fromDate,
                toDate,
                srcAddress: reportRequestTask.srcAddress,
                srcPort: reportRequestTask.srcPort,
                username: reportRequestTask.username,
                dstAddress: reportRequestTask.dstAddress,
                dstPort: reportRequestTask.dstPort,
                nasId: reportRequestTask.nasId,
                protocol: reportRequestTask.protocol,
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
    log.debug(data.length);
    //log.debug(formattedResult);
    return formatReports(data);
};
const formatReports = (rawNetflowReports) => {
    const formatted = rawNetflowReports.map((rawReport) => {
        const localDate = moment_timezone_1.default.tz(rawReport._source['@timestamp'], typings_1.LOCAL_TIME_ZONE);
        const jalaaliDate = moment_jalaali_1.default(localDate);
        const gregorianDate = moment_timezone_1.default.tz(rawReport._source['@timestamp'], typings_1.LOCAL_TIME_ZONE);
        let protocolString = '';
        if (rawReport._source.netflow.protocol === '6') {
            protocolString = 'tcp';
        }
        if (rawReport._source.netflow.protocol === '17') {
            protocolString = 'udp';
        }
        return {
            nasId: rawReport._source.nasId,
            Router: rawReport._source.nasTitle,
            Username: rawReport._source.username,
            Mac: rawReport._source.mac,
            Jalali_Date: getJalaaliDate(jalaaliDate),
            Src_Addr: rawReport._source.netflow.src_addr,
            Src_Port: rawReport._source.netflow.src_port,
            Dst_Addr: rawReport._source.netflow.dst_addr,
            Dst_Port: rawReport._source.netflow.dst_port,
            Protocol: protocolString,
            Gregorian_Date: gregorianDate.format('YYYY/MM/DD HH:mm'),
        };
    });
    return lodash_1.default.sortBy(formatted, [
        'Router',
        'Username',
        'Jalali_Date',
        'Src_Addr',
        'Src_Port',
    ]);
};
const getJalaaliDate = (date) => {
    return date.format('jYYYY/jM/jD HH:MM');
};
const createNetflowIndexName = (fromDate) => {
    return `${NETFLOW_LOG_INDEX_PREFIX}${fromDate.format('YYYY.MM.DD')}`;
};
const getNetflowsByIndex = async (netflowIndex, netflowReportQueryParams) => {
    const exist = await elastic_1.default.indices.exists({
        index: netflowIndex,
    });
    if (!exist) {
        return;
    }
    log.debug(`query from ${netflowIndex} from ${netflowReportQueryParams.fromDate.format()} to ${netflowReportQueryParams.toDate.format()}`);
    const countResponse = await elastic_1.default.count({
        index: netflowIndex,
        body: createNetflowQuery(netflowReportQueryParams),
    });
    const totalLogs = countResponse.count;
    if (totalLogs === 0) {
        return;
    }
    const maxResultSize = 500;
    const partsLen = totalLogs > maxResultSize ? Math.ceil(totalLogs / maxResultSize) : 1;
    log.debug(`query parts: ${partsLen}`);
    const scrollTtl = '2m';
    let result = [];
    const query = createNetflowQuery(netflowReportQueryParams);
    const scrollResult = await elastic_1.default.search({
        scroll: scrollTtl,
        index: netflowIndex,
        size: maxResultSize,
        sort: ['_doc'],
        body: query,
        ignore: [404],
    });
    if (scrollResult.hits) {
        result = result.concat(scrollResult.hits.hits);
    }
    log.debug('netflow query: %j', query);
    if (!scrollResult._scroll_id) {
        throw new Error('invalid scrollId ');
    }
    let scrollId = scrollResult._scroll_id;
    const allScrollId = [scrollId];
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
            log.error('error @getNetflowsByIndex');
            log.error(error);
            throw error;
        }
    }
    log.debug('ids', allScrollId);
    const clearanceRes = await elastic_1.default.clearScroll({
        scrollId: allScrollId,
    });
    log.debug('clear: ', clearanceRes);
    return result;
};
const createNetflowQuery = (netflowReportQueryParams) => {
    const filter = [];
    filter.push({
        term: {
            status: 'enriched',
        },
    });
    filter.push({
        range: {
            '@timestamp': {
                gte: netflowReportQueryParams.fromDate.format(),
                lte: netflowReportQueryParams.toDate.format(),
            },
        },
    });
    if (netflowReportQueryParams.protocol) {
        const protocol = netflowReportQueryParams.protocol.toLowerCase();
        if (protocol === 'tcp') {
            filter.push({
                term: {
                    'netflow.protocol': '6',
                },
            });
        }
        else if (protocol === 'udp') {
            filter.push({
                term: {
                    'netflow.protocol': '17',
                },
            });
        }
        else if (protocol === 'tcp/udp') {
            filter.push({
                terms: {
                    'netflow.protocol': ['17', '6'],
                },
            });
        }
    }
    if (netflowReportQueryParams.srcPort) {
        filter.push({
            terms: {
                'netflow.src_port': netflowReportQueryParams.srcPort,
            },
        });
    }
    if (netflowReportQueryParams.srcAddress) {
        filter.push({
            wildcard: {
                'netflow.src_addr': netflowReportQueryParams.srcAddress,
            },
        });
    }
    if (netflowReportQueryParams.dstPort) {
        filter.push({
            terms: {
                'netflow.dst_port': netflowReportQueryParams.dstPort,
            },
        });
    }
    if (netflowReportQueryParams.dstAddress) {
        filter.push({
            wildcard: {
                'netflow.dst_addr': netflowReportQueryParams.dstAddress,
            },
        });
    }
    if (netflowReportQueryParams.nasId) {
        filter.push({
            terms: {
                nasId: netflowReportQueryParams.nasId,
            },
        });
    }
    if (netflowReportQueryParams.username) {
        filter.push({
            wildcard: {
                username: netflowReportQueryParams.username,
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
const netflowGroupByIp = async (fromDate, toDate) => {
    const indexNames = getIndexNames(fromDate, toDate);
    let data = [];
    for (const indexName of indexNames) {
        try {
            const result = await aggregateNetflowByIp(indexName, fromDate, toDate);
            if (result) {
                data = data.concat(result);
            }
        }
        catch (error) {
            if (error.status === 404) {
                log.warn(`${indexName} index not found`);
            }
            else {
                log.error(error);
                log.error(error.status);
                throw error;
            }
        }
    }
    log.debug('netflow group by ip result length: ', data.length);
    return data;
};
const aggregateNetflowByIp = async (netflowIndex, fromDate, toDate) => {
    try {
        await elastic_1.default.search({});
        const exist = await elastic_1.default.indices.exists({
            index: netflowIndex,
        });
        if (!exist) {
            return;
        }
        const queryResult = await elastic_1.default.search({
            index: netflowIndex,
            size: 0,
            body: createNetflowGroupByAggregate(fromDate, toDate),
        });
        return queryResult.aggregations;
    }
    catch (e) {
        log.error('error @aggregateNetflowByIp');
        log.error(e);
        throw e;
    }
};
const createNetflowGroupByAggregate = (fromDate, toDate) => {
    return {
        size: 0,
        query: {
            bool: {
                must: [
                    {
                        range: {
                            '@timestamp': {
                                gte: fromDate.format(),
                                lte: toDate.format(),
                            },
                        },
                    },
                ],
                must_not: [
                    {
                        term: { status: 'enriched' },
                    },
                ],
            },
        },
        aggs: {
            group_by_nas_ip: {
                terms: {
                    field: 'host',
                },
                aggs: {
                    group_by_member_ip: {
                        terms: {
                            field: 'netflow.src_addr',
                        },
                    },
                },
            },
        },
    };
};
const createNetflowGroupByBusinessId = () => {
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
const updateNetflows = async (fromDate, toDate, nasIp, memberIp, updates) => {
    const indexNames = getIndexNames(fromDate, toDate);
    let data = [];
    //log.debug('INDEXES:', indexNames);
    for (const indexName of indexNames) {
        try {
            const result = await elastic_1.default.updateByQuery({
                index: indexName,
                type: 'doc',
                maxRetries: 5,
                conflicts: 'proceed',
                body: createNetflowUpdateQuery(fromDate, toDate, nasIp, memberIp, updates),
            });
            data = data.concat(result);
        }
        catch (error) {
            if (error.status === 404) {
                log.warn(`${indexName} index not found`);
            }
            else {
                log.error('error @updateNetflows');
                log.error(error.status);
                throw error;
            }
        }
    }
    log.debug(data);
    return data;
};
const createNetflowUpdateQuery = (fromDate, toDate, nasIp, memberIp, update) => {
    return {
        query: {
            bool: {
                must_not: [
                    {
                        term: { status: 'enriched' },
                    },
                ],
                filter: [
                    { term: { host: nasIp } },
                    {
                        range: {
                            '@timestamp': {
                                gte: fromDate.format(),
                                lte: toDate.format(),
                            },
                        },
                    },
                ],
                should: [
                    {
                        term: {
                            'netflow.src_addr': memberIp,
                        },
                    },
                    {
                        term: {
                            'netflow.dst_addr': memberIp,
                        },
                    },
                ],
                minimum_should_match: 1,
            },
        },
        script: {
            lang: 'painless',
            inline: `
      ctx._source['username']="${update.username}";
      ctx._source['status']="enriched";
      ctx._source['nasId']="${update.nasId}";
      ctx._source['nasTitle']="${update.nasTitle}";
      ctx._source['mac']="${update.mac}";
      ctx._source['memberId']="${update.memberId}";
      ctx._source['businessId']="${update.businessId}"`,
        },
    };
};
exports.default = {
    updateNetflows,
    netflowGroupByIp,
    getNetflowReports,
    countBusinessReports,
};
//# sourceMappingURL=netflow.js.map