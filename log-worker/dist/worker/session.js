"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const elastic_1 = __importDefault(require("../utils/elastic"));
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const typings_1 = require("../typings");
const SESSION_LOG_INDEX = `${process.env.ELASTIC_INDEX_PREFIX}sessions`;
const log = logger_1.default.createLogger();
const countSessions = async (sessionQuery) => {
    const result = await elastic_1.default.count({
        index: SESSION_LOG_INDEX,
        body: createSearchSessionQuery(sessionQuery),
    });
    return result;
};
const findSessions = async (reportRequestTask) => {
    const countResponse = await countSessions(reportRequestTask);
    const totalSessions = countResponse.count;
    const maxResultSize = 500;
    log.debug(Math.ceil(totalSessions / maxResultSize));
    const partsLen = totalSessions > maxResultSize
        ? Math.ceil(totalSessions / maxResultSize)
        : 1;
    const parts = new Array(partsLen);
    let from = 0;
    let result = [];
    for (const i of parts) {
        try {
            const queryResult = await querySessions(from, maxResultSize, reportRequestTask);
            if (queryResult.hits) {
                result = result.concat(queryResult.hits.hits);
            }
            else {
                log.warn(queryResult);
            }
            from = from + maxResultSize;
        }
        catch (error) {
            log.error(error);
            throw error;
        }
    }
    const clientIpList = new Set();
    const nasIpList = new Set();
    result.map((item) => {
        clientIpList.add(item._source.framedIpAddress);
        nasIpList.add(item._source.nasIp);
    });
    log.debug(Array.from(clientIpList));
    log.debug(Array.from(nasIpList));
    return {
        memberIpList: Array.from(clientIpList),
        nasIpList: Array.from(nasIpList),
    };
};
const querySessions = async (from, size, sessionQuery) => {
    //log.debug(`session query %j`, createSearchSessionQuery(sessionQuery));
    const result = await elastic_1.default.search({
        index: SESSION_LOG_INDEX,
        from,
        size,
        filterPath: [
            'hits.hits._source.framedIpAddress',
            'hits.hits._source.nasIp',
        ],
        body: createSearchSessionQuery(sessionQuery),
    });
    return result;
};
const createSearchSessionQuery = (sessionQuery) => {
    return {
        query: {
            bool: {
                must: [
                    {
                        term: {
                            memberId: sessionQuery.memberId,
                        },
                    },
                    {
                        term: {
                            businessId: sessionQuery.businessId,
                        },
                    },
                    {
                        range: {
                            '@timestamp': {
                                gte: sessionQuery.fromDate.format(),
                                lte: sessionQuery.toDate.format(),
                            },
                        },
                    },
                ],
            },
        },
    };
};
const querySessionsByIp = async (nasIp, memberIp, from, to) => {
    const fromDate = moment_timezone_1.default.tz(from, typings_1.LOGGER_TIME_ZONE);
    const toDate = moment_timezone_1.default.tz(to, typings_1.LOGGER_TIME_ZONE);
    log.debug(`session query %j`, createSessionByIpQuery(nasIp, memberIp, fromDate, toDate));
    const result = await elastic_1.default.search({
        index: SESSION_LOG_INDEX,
        size: 0,
        body: createSessionByIpQuery(nasIp, memberIp, fromDate, toDate),
    });
    if (result.aggregations.group_by_username.buckets.length > 0) {
        log.warn('query session: %j  result:', createSessionByIpQuery(nasIp, memberIp, fromDate, toDate), JSON.stringify(result));
    }
    return result.aggregations;
};
const createSessionByIpQuery = (nasIp, memberIp, fromDate, toDate) => {
    return {
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
                    {
                        terms: {
                            nasIp: [nasIp],
                        },
                    },
                    {
                        terms: {
                            framedIpAddress: [memberIp],
                        },
                    },
                ],
            },
        },
        aggs: {
            group_by_username: {
                terms: {
                    field: 'username',
                },
            },
            extra: {
                top_hits: {
                    size: 1,
                },
            },
        },
    };
};
exports.default = {
    querySessionsByIp,
};
//# sourceMappingURL=session.js.map