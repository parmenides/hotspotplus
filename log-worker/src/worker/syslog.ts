import logger from '../utils/logger';
import elasticClient from '../utils/elastic';
import momentTz from 'moment-timezone';
import {Moment} from 'moment';
import momentJ from 'moment-jalaali';

const LOG_WORKER_QUEUE = process.env.LOG_WORKER_QUEUE;
const SYSLOG_INDEX = process.env.SYSLOG_INDEX;
const log = logger.createLogger();
if (!LOG_WORKER_QUEUE || !SYSLOG_INDEX) {
    throw new Error('invalid settings');
}

interface SyslogIpQueryData {
    clientIpList: string[];
    nasIpList: string[];
}

/*
* {
        "_index" : "hotspotplussyslog",
        "_type" : "report",
        "_id" : "AWfgBtpUTl52eqElWkOx",
        "_score" : 1.0,
        "_source" : {
          "@version" : "1",
          "mac" : "F4:09:D8:E3:DE:97",
          "@timestamp" : "2018-12-24T11:43:24.473Z",
          "domain" : "library.hotspotplus.ir:8080",
          "logDate" : "2018-12-24T11:22:34.768Z",
          "creationDateStr" : "2018-12-24 15:13:23",
          "host" : "2.182.220.63",
          "logDateStr" : "2018-12-24 14:52:34",
          "creationDate" : 1545651803548,
          "clientIp" : "192.168.2.244",
          "url" : "http://library.hotspotplus.ir:8080/",
          "businessId" : "5c18784aff8b930013b6381b",
          "username" : "9186983970",
          "nasId" : "5c1881a3ff8b930013b6381e"
        }
      }
      */
const formatReports = (
    username: string,
    rawSyslogReports: Array<RawSyslogReport>,
) => {
    return rawSyslogReports.map((rawReport) => {
        const localDate = momentTz.tz(
            rawReport._source['@timestamp'],
            'Asia/Tehran',
        );
        const jalaaliDate = momentJ(localDate);

        return {
            username,
            date: getJalaaliDate(jalaaliDate),
            '@timestamp': rawReport._source['@timestamp'],
            ...rawReport._source
        };
    });
};

const getJalaaliDate = (date: Moment) => {
    return date.format('jYYYY/jM/jD HH:MM');
};


const getSyslogReports = async (
    username: string,
    from: number,
    to: number,
    syslogIpQueryData: SyslogIpQueryData,
) => {
    const fromDate = momentTz.tz(from, 'Europe/London');
    const toDate = momentTz.tz(to, 'Europe/London');

    const countResponse = await countSyslogReport(
        fromDate,
        toDate,
        syslogIpQueryData,
    );

    const totalLogs = countResponse.count;
    log.debug(totalLogs);
    const maxResultSize = 500;
    log.debug(Math.ceil(totalLogs / maxResultSize));
    const partsLen =
        totalLogs > maxResultSize ? Math.ceil(totalLogs / maxResultSize) : 1;

    const parts = new Array(partsLen);
    let fromIndex = 0;
    let result: Array<{ _source: any }> = [];
    for (const i of parts) {
        try {
            const queryResult = await querySyslogReports(
                fromIndex,
                maxResultSize,
                fromDate,
                toDate,
                syslogIpQueryData,
            );
            if (queryResult.hits) {
                result = result.concat(queryResult.hits.hits);
            } else {
                log.warn(queryResult);
            }
            fromIndex = fromIndex + maxResultSize;
        } catch (error) {
            log.error(error);
            throw error;
        }
    }
    return formatReports(username, result);
};

const countSyslogReport = async (
    fromDate: Moment,
    toDate: Moment,
    syslogIpQueryData: SyslogIpQueryData,
) => {
    const result = await elasticClient.count({
        index: SYSLOG_INDEX,
        body: createSyslogQuery(fromDate, toDate, syslogIpQueryData),
    });
    return result;
};

const querySyslogReports = async (
    fromIndex: number,
    size: number,
    fromDate: Moment,
    toDate: Moment,
    syslogIpQueryData: SyslogIpQueryData,
) => {
    const result = await elasticClient.search({
        index: SYSLOG_INDEX,
        from: fromIndex,
        size,
        body: createSyslogQuery(fromDate, toDate, syslogIpQueryData),
    });
    return result;
};

const createSyslogQuery = (
    fromDate: Moment,
    toDate: Moment,
    syslogIpQueryData: SyslogIpQueryData,
) => {
    return {
        query: {
            bool: {
                must: [
                    {
                        terms: {
                            host: syslogIpQueryData.nasIpList,
                        },
                    },
                    {
                        terms: {
                            client_ip: syslogIpQueryData.clientIpList,
                        },
                    },
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
    };
};

interface RawSyslogReport {
    _source: {
        host: string;
        type: string;
        mac : string,
        domain : string,
        client_ip : string,
        url : string,
        tags: string[];
        '@timestamp': string;
    };
}

export default {
    getSyslogReports,
};
