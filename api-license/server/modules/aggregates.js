var Q = require('q');
var logger = require('./logger');
var log = logger.createLogger();
var needle = require('needle');
var utility = require('./utility');
var elasticURL =
  'http://' + process.env.ELASTIC_IP + ':' + process.env.ELASTIC_PORT;
var ELASTIC_ACCOUNTING_USAGE_SEARCH =
  elasticURL +
  process.env.ELASTIC_INDEX_PREFIX +
  'accounting/usagereport/{0}{1}';
var ELASTIC_SESSION_LOG =
  elasticURL + process.env.ELASTIC_INDEX_PREFIX + 'sessions/report/{0}';
var ELASTIC_ACCOUNTING_INDEX =
  elasticURL + process.env.ELASTIC_INDEX_PREFIX + 'accounting/usagereport';

var ELASTIC_CHARGE_SEARCH =
  elasticURL + process.env.ELASTIC_INDEX_PREFIX + 'charge/charge/_search';
var ELASTIC_LICENS_CHARGE_SEARCH =
  elasticURL +
  process.env.ELASTIC_INDEX_PREFIX +
  'licensecharge/licensecharge/_search';
var ELASTIC_SYSLOG_REPORT_INDEX =
  elasticURL + process.env.ELASTIC_INDEX_PREFIX + 'syslog/report';
var ELASTIC_NETFLOW_REPORT_INDEX =
  elasticURL + process.env.ELASTIC_INDEX_PREFIX + 'netflow/report';

var FOOT_TRAFFIC_PATH =
  elasticURL +
  process.env.ELASTIC_INDEX_PREFIX +
  'foottraffic/foottraffic/{0}{1}';
var MEMBER_PATH =
  elasticURL + process.env.ELASTIC_INDEX_PREFIX + 'member/member/{0}';
var minSignal = process.env.MIN_SIGNAL_STRENGTH_DEFAULT;
var DEVICE_VENDOR_NAME = process.env.DEVICE_VENDOR_NAME;
var DEVICE_VENDOR_PHRASE = process.env.DEVICE_VENDOR_PHRASE;
var partitionsNumber = process.env.NUM_PARTITIONS;
var redis = require('redis');
var redisClient = redis.createClient(
  process.env.REDIS_PORT,
  process.env.REDIS_HOST
);
var self = this;
/* Return Max of Session Time & Download & Upload for Business Base on Member
 startDate: Date
 endDate: Date
 businessId: String
 offset: number
 interval: number
 */
module.exports.getMemberTrafficUsageReport = function(
  startDate,
  endDate,
  businessId,
  offset,
  interval,
  size
) {
  return Q.Promise(function(resolve, reject) {
    if (offset == null) {
      return reject('offset is undefined');
    }
    if (interval == null) {
      return reject('interval is undefined');
    }
    if (!businessId) {
      return reject('business ID is undefined');
    }
    if (!startDate || !endDate) {
      return reject('startDate or endDate is undefined');
    }
    // Get Max Traffic Usage from ElasticSearch based on startDate, endDate & BusinessId
    needle.post(
      ELASTIC_ACCOUNTING_USAGE_SEARCH.replace('{0}{1}', '_search'),
      {
        query: {
          bool: {
            must: [
              {
                term: {
                  businessId: businessId
                }
              },
              {
                range: {
                  creationDate: {
                    gte: startDate,
                    lt: endDate
                  }
                }
              }
            ]
          }
        },
        aggs: {
          usage: {
            histogram: {
              field: 'creationDate',
              interval: interval,
              min_doc_count: 0,
              extended_bounds: {
                min: startDate,
                max: endDate
              },
              offset: offset
            },
            aggs: {
              group_by_sessionId: {
                terms: {
                  field: 'sessionId',
                  size: size
                },
                aggs: {
                  sessionTime: {
                    max: {
                      field: 'sessionTime'
                    }
                  },
                  download: {
                    max: {
                      field: 'download'
                    }
                  },
                  upload: {
                    max: {
                      field: 'upload'
                    }
                  }
                }
              }
            }
          }
        }
      },
      { json: true },
      function(error, response) {
        //log.debug ( '@getTrafficUsageReport status code', response.statusCode )
        if (error) {
          log.error('Error TrafficUsageReport: %j', error);
          return reject(error);
        }

        if (response.statusCode !== 200) {
          log.error('Error TrafficUsageReport: %j', response.statusCode);
          log.error('Error TrafficUsageReport Body: %j', response.body);
          return reject(response.body);
        }
        if (!response.body.aggregations || !response.body.aggregations.usage) {
          log.error('Error TrafficUsageReport: ', response.body);
          return resolve({});
        }
        if (response.body.aggregations.usage.buckets) {
          var result = [];
          var usageDates = response.body.aggregations.usage.buckets;
          for (var i = 0; i < usageDates.length; i++) {
            var usage = {
              key: usageDates[i].key,
              download: { value: 0 },
              upload: { value: 0 },
              sessionTime: { value: 0 }
            };
            if (usageDates[i].group_by_sessionId.buckets) {
              var sessionIdGroup = usageDates[i].group_by_sessionId.buckets;
              //log.debug( "###########################@getTrafficUsageReport:" )
              //log.debug( sessionIdGroup )
              if (sessionIdGroup.length > 0) {
                for (var j = 0; j < sessionIdGroup.length; j++) {
                  var sessGroup = sessionIdGroup[j];
                  log.debug(sessGroup);
                  usage.download.value += sessGroup.download.value;
                  usage.upload.value += sessGroup.upload.value;
                  usage.sessionTime.value += sessGroup.sessionTime.value;
                }
                result.push(usage);
              } else {
                result.push(usage);
              }
            } else {
              result.push(usage);
            }
          }
          return resolve(result);
        } else {
          log.debug(response.body);
          return reject(response.body);
        }
      }
    );
  });
};

module.exports.getMemberUsage = function(
  startDate,
  endDate,
  memberId,
  businessId
) {
  return Q.Promise(function(resolve, reject) {
    if (!businessId) {
      return reject('business ID is undefined');
    }
    if (!startDate || !endDate || startDate.getTime) {
      return reject('invalid startDate or endDate ', startDate, endDate);
    }
    self
      .getMemberUniqueSessionCount(businessId, memberId, startDate, endDate)
      .then(function(sessionCount) {
        if (sessionCount < 10) {
          sessionCount = 10;
        }
        // Get All Visits from ElasticSearch based on startDate, endDate & BusinessId
        needle.post(
          ELASTIC_ACCOUNTING_USAGE_SEARCH.replace('{0}{1}', '_search'),
          {
            query: {
              bool: {
                must: [
                  {
                    term: {
                      businessId: businessId
                    }
                  },
                  {
                    term: {
                      memberId: memberId
                    }
                  },
                  {
                    range: {
                      creationDate: {
                        gte: startDate,
                        lt: endDate
                      }
                    }
                  }
                ]
              }
            },
            aggs: {
              group_by_sessionId: {
                terms: {
                  size: sessionCount,
                  field: 'sessionId'
                },
                aggs: {
                  sessionTime: {
                    max: {
                      field: 'sessionTime'
                    }
                  },
                  totalUsage: {
                    max: {
                      field: 'totalUsage'
                    }
                  },
                  upload: {
                    max: {
                      field: 'upload'
                    }
                  },
                  download: {
                    max: {
                      field: 'download'
                    }
                  }
                }
              }
            }
          },
          { json: true },
          function(error, response, body) {
            if (error) {
              log.error(error);
              return reject(error);
            }
            var usage = {
              memberId: memberId,
              bulk: 0,
              download: 0,
              upload: 0,
              sessionTime: 0
            };

            if (response.statusCode >= 300) {
              log.error('request to elastic failed ', body);
              return reject('request to elastic failed ');
            }
            if (
              body &&
              body.aggregations &&
              body.aggregations.group_by_sessionId.buckets.length > 0
            ) {
              var results = body.aggregations.group_by_sessionId.buckets;
              for (var j = 0; j < results.length; j++) {
                var usageItem = results[j];
                usage.bulk += usageItem.totalUsage.value;
                usage.download += usageItem.download.value;
                usage.upload += usageItem.upload.value;
                usage.sessionTime += usageItem.sessionTime.value;
              }
            } else {
              log.warn('going to send empty usage', body);
            }
            return resolve(usage);
          }
        );
      })
      .fail(function(error) {
        return reject(error);
      });
  });
};

module.exports.getLicenseBalance = function(licenseId) {
  return Q.Promise(function(resolve, reject) {
    if (!licenseId) {
      return reject('licenseId is undefined');
    }
    try {
      needle.post(
        ELASTIC_LICENS_CHARGE_SEARCH,
        {
          query: {
            term: {
              licenseId: licenseId
            }
          },
          aggs: {
            balance: {
              sum: {
                field: 'amount'
              }
            }
          }
        },
        { json: true },
        function(error, response) {
          log.debug('Body: %j', response.body);
          log.debug('StatusCode: %j', response.statusCode);
          log.debug('StatusCode: %j', typeof response.statusCode);
          log.debug('Status ', response.status);
          log.debug('Status ', typeof response.status);
          log.debug('Body: %j', error);

          if (error) {
            log.error('getProfileBalance:', error);
            return reject(error);
          }
          if (response.statusCode !== 200) {
            log.error('Error %j', response.body);
            return reject(response.body);
          }
          if (!response.body.aggregations) {
            return resolve({});
          }
          if (response.body && response.body.aggregations) {
            var result = response.body.aggregations;
            var balance = result.balance.value;
            return resolve({
              balance: balance
            });
          } else {
            log.debug(response.body);
            return reject(response.body);
          }
        }
      );
    } catch (error) {
      log.error(error);
      return reject(error);
    }
  });
};
module.exports.getProfileBalance = function(businessId) {
  return Q.Promise(function(resolve, reject) {
    if (!businessId) {
      return reject('business ID is undefined');
    }
    try {
      needle.post(
        ELASTIC_CHARGE_SEARCH,
        {
          query: {
            term: {
              businessId: businessId
            }
          },
          aggs: {
            balance: {
              sum: {
                field: 'amount'
              }
            }
          }
        },
        { json: true },
        function(error, response) {
          log.debug('Body: %j', response.body);
          log.debug('StatusCode: %j', response.statusCode);
          log.debug('StatusCode: %j', typeof response.statusCode);
          log.debug('Status ', response.status);
          log.debug('Status ', typeof response.status);
          log.debug('Body: %j', error);
          if (error) {
            log.error('getProfileBalance:', error);
            return reject(error);
          }
          if (!response.body.aggregations) {
            //log.debug ( 'getBusinessBalance:', response.body )
            return resolve({});
          }
          //log.debug ( 'getBusinessBalance:', response.body.aggregations )
          if (response.body && response.body.aggregations) {
            var result = response.body.aggregations;
            var balance = result.balance.value;
            return resolve({
              balance: balance
            });
          } else {
            log.debug(response.body);
            return reject(response.body);
          }
        }
      );
    } catch (error) {
      log.error(error);
      return reject(error);
    }
  });
};

/* Return sum of Session Time & Download & Upload for Member Online Users & Max for Ip Online Users
 fromDate: number
 memberId: string
 */
module.exports.getSessionsReport = function(fromDateInMs, memberId, sessionId) {
  return Q.Promise(function(resolve, reject) {
    if (!memberId) {
      return reject('memberId is undefined');
    }
    if (!sessionId) {
      return reject('sessionId is undefined');
    }
    // no subscription date so return zero for download, upload & session time
    if (!fromDateInMs) {
      return resolve({
        fromDate: new Date().getTime(),
        sessionReports: [
          {
            download: { value: 0 },
            upload: { value: 0 },
            sessionTime: { value: 0 }
          }
        ],
        memberId: memberId
      });
    }
    var aggregate = {
      group_by_sessionId: {
        terms: {
          field: 'sessionId'
        },
        aggs: {
          sessionTime: {
            max: {
              field: 'sessionTime'
            }
          },
          download: {
            max: {
              field: 'download'
            }
          },
          upload: {
            max: {
              field: 'upload'
            }
          }
        }
      }
    };

    needle.post(
      ELASTIC_ACCOUNTING_USAGE_SEARCH.replace('{0}{1}', '_search'),
      {
        query: {
          bool: {
            must: [
              {
                term: { memberId: memberId }
              },
              {
                term: { sessionId: sessionId }
              },
              {
                range: {
                  creationDate: {
                    gte: fromDateInMs
                  }
                }
              }
            ]
          }
        },
        aggs: aggregate
      },
      { json: true },
      function(error, response) {
        if (error) {
          log.error('@getSessionsReport: ', error);
          return reject(error);
        }
        if (response.statusCode !== 200) {
          log.error('Error %j', response.body);
          return reject(response.body);
        }

        // no result for aggregation so return noReport
        if (!response.body.aggregations) {
          return resolve({
            fromDate: fromDateInMs,
            sessionReports: [
              {
                download: { value: 0 },
                upload: { value: 0 },
                sessionTime: { value: 0 }
              }
            ],
            memberId: memberId
          });
        } else {
          //log.debug ( 'Members session usage aggregations : ', response.body.aggregations.group_by_sessionId.buckets )
          var sessionReports =
            response.body.aggregations.group_by_sessionId.buckets;
          if (!sessionReports || sessionReports.length == 0) {
            sessionReports = [
              {
                download: { value: 0 },
                upload: { value: 0 },
                sessionTime: { value: 0 }
              }
            ];
          }
          return resolve({
            fromDate: fromDateInMs,
            sessionReports: sessionReports,
            sessionId: sessionId,
            memberId: memberId
          });
        }
      }
    );
  });
};

/*
 Return Netflow Log of users
 businessId : string
 startDate, endDate, skip, limit: Number
 */

module.exports.getNetflowLog = function(options) {
  return Q.Promise(function(resolve, reject) {
    log.debug('@getNetflowLog');
    if (!options.businessId) {
      return reject('business ID is undefined');
    }

    if (!options.fromDate || !options.toDate) {
      return reject('fromDate or toDate is undefined');
    }
    var fromDate = Number.parseInt(options.fromDate);
    var toDate = Number.parseInt(options.toDate);

    var mustQuery = [];
    var params = {};
    var skip = 0;
    var limit = 10;

    // check parameters exist
    if (utility.isValidString(options.businessId)) {
      params.businessId = options.businessId;
    }
    if (utility.isValidString(options.username)) {
      params.username = options.username;
    }
    if (utility.isValidString(options.mac)) {
      params.mac = options.mac;
    }
    if (utility.isValidString(options.host)) {
      params.host = options.host;
    }
    if (utility.isValidString(options.nasId)) {
      params.nasId = options.nasId;
    }
    if (utility.isValidString(options.sourcePort)) {
      params.sourcePort = options.sourcePort;
    }
    if (utility.isValidString(options.destinationPort)) {
      params.destinationPort = options.destinationPort;
    }
    if (utility.isValidString(options.sourceIp)) {
      params.sourceIp = options.sourceIp;
    }
    if (utility.isValidString(options.destinationIp)) {
      params.destinationIp = options.destinationIp;
    }
    if (options.skip) {
      skip = options.skip;
    }
    if (options.limit > 0 && options.limit) {
      limit = options.limit;
    }
    // create range query for fromDate & toDate
    var queryDate = {
      range: {
        creationDate: {
          gte: fromDate,
          lt: toDate
        }
      }
    };
    // add fromDate & toDate to needle must query
    mustQuery.push(queryDate);
    // add parameters to needle must query
    for (var param in params) {
      if (params.hasOwnProperty(param) && param && params[param]) {
        var q = {
          match: {}
        };
        q.match[param] = {
          query: params[param],
          type: 'phrase'
        };
        mustQuery.push(q);
      }
    }
    var finalQuery = {
      from: skip,
      size: limit,
      sort: [{ creationDate: { order: 'asc' } }],
      query: {
        bool: {
          must: mustQuery
        }
      },
      _source: {
        excludes: []
      }
    };
    log.debug('Netflow query', JSON.stringify(finalQuery, null, 2));
    needle.post(
      ELASTIC_NETFLOW_REPORT_INDEX + '/_search',
      finalQuery,
      { json: true },
      function(error, response) {
        //log.debug ( '@getNetflowLog status code', response.statusCode )
        if (error) {
          log.error(error);
          return reject(error);
        }
        if (
          !response.body.hits ||
          !response.body.hits.total ||
          !response.body.hits.hits
        ) {
          log.error('@getNetflowLog: ', response.body);
          return reject(response.body);
        }
        return resolve({
          total: response.body.hits.total,
          log: response.body.hits.hits
        });
      }
    );
  });
};

module.exports.getReports = function(fromDate, toDate, memberId) {};

module.exports.getSessionLog = function(
  fromDate,
  toDate,
  memberId,
  businessId
) {
  const query = {
    query: {
      bool: {
        must: [
          {
            term: {
              memberId: memberId
            }
          },
          {
            term: {
              businessId: businessId
            }
          },
          {
            range: {
              creationDate: {
                gte: startDate,
                lte: endDate
              }
            }
          }
        ]
      }
    }
  };
  needle.post(
    ELASTIC_SESSION_LOG.replace('{0}', '_search'),
    query,
    { json: true },
    function(error, response) {
      if (error) {
        log.error('Error Session Log Query: %j', error);
        return reject(error);
      }

      if (response.statusCode !== 200) {
        log.error(
          'Error Session Logs: %j %j',
          response.statusCode,
          response.body
        );
        return reject(response.body);
      }
      return resolve(response.body);
    }
  );
};

module.exports.getNetflowLogReports = function(
  fromDate,
  toDate,
  hostIps,
  lanIps
) {
  var query = {
    query: {
      bool: {
        must: [
          {
            terms: {
              host: hostIps || []
            }
          },
          {
            terms: {
              'netflow.src_addr': lanIps || []
            }
          },
          {
            range: {
              '@timestamp': {
                gte: fromDate,
                lte: toDate
              }
            }
          }
        ]
      }
    }
  };

  log.debug('netflow query %j', query);
  needle.post(
    query,
    ELASTIC_SESSION_LOG.replace('{0}', '_search'),
    { json: true },
    function(error, response) {
      //log.debug ( '@getTrafficUsageReport status code', response.statusCode )
      if (error) {
        log.error('Error TrafficUsageReport: %j', error);
        return reject(error);
      }

      if (response.statusCode !== 200) {
        log.error(
          'Error TrafficUsageReport: %j %j',
          response.statusCode,
          response.body
        );
        return reject(response.body);
      }
      return resolve(response.body);
    }
  );
};

/*
 Return Syslog of users
 businessId : string
 startDate, endDate, skip, limit: Number
 */

module.exports.getSyslog = function(options) {
  return Q.Promise(function(resolve, reject) {
    log.debug('@getSyslog');
    if (!options.businessId) {
      return reject('business ID is undefined');
    }

    if (!options.fromDate || !options.toDate) {
      return reject('fromDate or toDate is undefined');
    }
    var businessId = options.businessId;
    var fromDate = Number.parseInt(options.fromDate);
    var toDate = Number.parseInt(options.toDate);

    var mustQuery = [];
    var params = {};
    var skip = 0;
    var limit = 10;

    // check parameters exist
    if (utility.isValidString(options.username)) {
      params.username = options.username;
    }
    if (utility.isValidString(options.mac)) {
      params.mac = options.mac;
    }
    if (utility.isValidString(options.host)) {
      params.host = options.host;
    }
    if (utility.isValidString(options.clientIp)) {
      params.clientIp = options.clientIp;
    }
    if (utility.isValidString(options.nasId)) {
      params.nasId = options.nasId;
    }
    if (utility.isValidString(options.url)) {
      params.url = options.url;
    }
    if (utility.isValidString(options.domain)) {
      params.domain = options.domain;
    }
    if (options.skip) {
      skip = options.skip;
    }
    if (options.limit > 0 && options.limit) {
      limit = options.limit;
    }
    // create match query for businessId
    var queryBusiness = {
      match: {
        businessId: {
          query: businessId,
          type: 'phrase'
        }
      }
    };
    // create range query for fromDate & toDate
    var queryDate = {
      range: {
        creationDate: {
          gte: fromDate,
          lt: toDate
        }
      }
    };
    // add businessId to needle must query
    mustQuery.push(queryBusiness);
    // add fromDate & toDate to needle must query
    mustQuery.push(queryDate);
    // add parameters to needle must query
    for (var param in params) {
      var match = {};
      match = {
        query_string: {
          analyze_wildcard: true,
          default_field: param,
          query: '*' + params[param] + '*'
        }
      };
      mustQuery.push(match);
    }
    needle.post(
      ELASTIC_SYSLOG_REPORT_INDEX + '/_search',
      {
        from: skip,
        size: limit,
        sort: [{ creationDate: { order: 'asc' } }],
        query: {
          bool: {
            must: mustQuery
          }
        },
        _source: {
          excludes: []
        }
      },
      { json: true },
      function(error, response) {
        //log.debug ( '@getSyslog status code', response.statusCode )
        if (error) {
          log.error(error);
          return reject(error);
        }
        if (
          !response.body.hits ||
          !response.body.hits.total ||
          !response.body.hits.hits ||
          response.body.hits.total == 0
        ) {
          log.error('@getSyslog: ', response.body);
          return resolve({ total: 0, log: [] });
        }
        return resolve({
          total: response.body.hits.total,
          log: response.body.hits.hits
        });
      }
    );
  });
};

/* Return Daily Internet Usage of a Member
 businessId, memberId : string
 */
module.exports.getMemberDailyUsage = function(businessId, memberId, startDate) {
  return Q.Promise(function(resolve, reject) {
    if (!businessId) {
      return reject('businessId not defined');
    }
    if (!memberId) {
      return reject('memberId not defined');
    }
    if (!startDate) {
      return reject('startDate not defined');
    }
    log.debug('@getMemberDailyUsage');
    var endDate = new Date().getTime();
    var interval = process.env.DAY_MILLISECONDS;
    var offset = new Date(startDate);
    offset = offset.getTimezoneOffset() * process.env.MINUTE_MILLISECONDS;

    // Get Daily Traffic Usage from ElasticSearch based on startDate, endDate, businessId & memberId
    needle.post(
      ELASTIC_ACCOUNTING_USAGE_SEARCH.replace('{0}{1}', '_search'),
      {
        query: {
          bool: {
            must: [
              {
                term: {
                  businessId: businessId
                }
              },
              {
                term: {
                  memberId: memberId
                }
              },
              {
                range: {
                  creationDate: {
                    gte: startDate,
                    lt: endDate
                  }
                }
              }
            ]
          }
        },
        aggs: {
          usage: {
            histogram: {
              field: 'creationDate',
              interval: interval,
              min_doc_count: 0,
              extended_bounds: {
                min: startDate,
                max: endDate
              },
              offset: offset
            },
            aggs: {
              group_by_sessionId: {
                terms: {
                  field: 'sessionId'
                },
                aggs: {
                  download: {
                    max: {
                      field: 'download'
                    }
                  },
                  upload: {
                    max: {
                      field: 'upload'
                    }
                  }
                }
              },
              sum_download: {
                sum_bucket: {
                  buckets_path: 'group_by_sessionId>download'
                }
              },
              sum_upload: {
                sum_bucket: {
                  buckets_path: 'group_by_sessionId>upload'
                }
              }
            }
          }
        }
      },
      { json: true },
      function(error, response) {
        //log.debug ( '@getMemberDailyUsage status code', response.statusCode );
        if (error) {
          log.error('@getMemberDailyUsage: ', error);
          return reject(error);
        }
        if (
          !response.body.aggregations ||
          !response.body.aggregations.usage ||
          !response.body.aggregations.usage.buckets
        ) {
          return resolve([]);
        }
        var result = response.body.aggregations.usage.buckets;
        //log.debug ( '@getMemberDailyUsage: ', result );
        return resolve(result);
      }
    );
  });
};

/* Return Max Usage Report Docs from Accounting UsageReport based on startDate, endDate
 startDate, endDate : number
 */
module.exports.getMaxUsageReports = function(
  startDate,
  endDate,
  size,
  partition
) {
  return Q.Promise(function(resolve, reject) {
    if (!startDate) {
      return reject('startDate not defined');
    }
    if (!endDate) {
      return reject('endDate not defined');
    }
    log.debug('@getMaxUsageReports');

    // Get Max Traffic Usage from ElasticSearch for Each Session
    var query = {
      query: {
        bool: {
          must: [
            {
              range: {
                creationDate: {
                  gte: startDate,
                  lte: endDate
                }
              }
            }
          ]
        }
      },
      aggs: {
        sessions: {
          terms: {
            field: 'sessionId',
            include: {
              partition: partition,
              num_partitions: partitionsNumber
            },
            size: size
          },
          aggs: {
            businessId: {
              terms: {
                field: 'businessId'
              }
            },
            memberId: {
              terms: {
                field: 'memberId'
              }
            },
            nasId: {
              terms: {
                field: 'nasId'
              }
            },
            username: {
              terms: {
                field: 'username.keyword'
              }
            },
            mac: {
              terms: {
                field: 'mac'
              }
            },
            accStatusType: {
              terms: {
                field: 'accStatusType'
              }
            },
            creationDate: {
              max: {
                field: 'creationDate'
              }
            },
            sessionTime: {
              max: {
                field: 'sessionTime'
              }
            },
            totalUsage: {
              max: {
                field: 'totalUsage'
              }
            },
            download: {
              max: {
                field: 'download'
              }
            },
            upload: {
              max: {
                field: 'upload'
              }
            },
            timestamp: {
              max: {
                field: 'timestamp'
              }
            }
          }
        }
      }
    };
    log.debug(query);
    needle.post(
      ELASTIC_ACCOUNTING_USAGE_SEARCH.replace('{0}{1}', '_search'),
      query,
      { json: true },
      function(error, response) {
        if (error) {
          log.error('Error in getMaxUsageReports: ', error);
          return reject(error);
        }
        if (
          !response.body.aggregations ||
          !response.body.aggregations.sessions ||
          !response.body.aggregations.sessions.buckets
        ) {
          log.error('@getMaxUsageReports: ', response.body);
          return resolve([]);
        }
        var sessions = response.body.aggregations.sessions.buckets;
        var result = [];
        for (var i = 0; i < sessions.length; i++) {
          var session = sessions[i];
          var accStatusType = 0;
          var accStatusTypes = session.accStatusType.buckets;
          for (var j = 0; j < accStatusTypes.length; j++) {
            accStatusType = accStatusTypes[j].key;
            if (accStatusType === 0) {
              break;
            }
          }
          if (accStatusType !== 0) {
            var doc = {};
            doc.memberId = session.memberId.buckets[0].key;
            doc.nasId = session.nasId.buckets[0].key;
            doc.businessId = session.businessId.buckets[0].key;
            doc.username = session.username.buckets[0].key;
            doc.creationDate = session.creationDate.value;
            doc.accStatusType = 0;
            doc.sessionId = session.key;
            doc.mac = session.mac.buckets[0].key;
            doc.download = session.download.value;
            doc.upload = session.upload.value;
            doc.totalUsage = session.totalUsage.value;
            doc.sessionTime = session.sessionTime.value;
            doc.timestamp = session.timestamp.value;
            result.push(doc);
          }
        }
        log.debug('Result Length:', result.length);
        return resolve(result);
      }
    );
  });
};

/* Return SessionIds with defined accStatusType from Accounting UsageReport based on startDate, endDate
 startDate, endDate : number
 */
module.exports.getUsageReportSessions = function(
  startDate,
  endDate,
  accStatusType,
  size,
  partition
) {
  return Q.Promise(function(resolve, reject) {
    if (!startDate) {
      return reject('startDate not defined');
    }
    if (!endDate) {
      return reject('endDate not defined');
    }
    log.debug('@getUsageReportSessions');

    // Get Max Traffic Usage from ElasticSearch for Each Session
    needle.post(
      ELASTIC_ACCOUNTING_USAGE_SEARCH.replace('{0}{1}', '_search'),
      {
        query: {
          bool: {
            must: [
              {
                term: {
                  accStatusType: accStatusType
                }
              },
              {
                range: {
                  creationDate: {
                    gte: startDate,
                    lte: endDate
                  }
                }
              }
            ]
          }
        },
        aggs: {
          sessions: {
            terms: {
              field: 'sessionId',
              include: {
                partition: partition,
                num_partitions: partitionsNumber
              },
              size: size
            }
          }
        }
      },
      { json: true },
      function(error, response) {
        if (error) {
          log.error('@getUsageReportSessions: ', error);
          return reject(error);
        }
        if (
          !response.body.aggregations ||
          !response.body.aggregations.sessions ||
          !response.body.aggregations.sessions.buckets
        ) {
          return resolve([]);
        }
        var sessions = response.body.aggregations.sessions.buckets;
        var result = [];
        for (var i = 0; i < sessions.length; i++) {
          result.push(sessions[i].key);
        }
        return resolve(result);
      }
    );
  });
};

/* Return Unique Session Count for businessId from Accounting UsageReport based on startDate, endDate
 startDate, endDate : number
 businessId: string
 */
module.exports.getUniqueSessionCount = function(
  businessId,
  startDate,
  endDate
) {
  return Q.Promise(function(resolve, reject) {
    if (!startDate) {
      return reject('startDate not defined');
    }
    if (!endDate) {
      return reject('endDate not defined');
    }
    log.debug('@getUniqueSessionCount');

    // Get Unique Session Count from ElasticSearch
    needle.post(
      ELASTIC_ACCOUNTING_USAGE_SEARCH.replace('{0}{1}', '_search'),
      {
        query: {
          bool: {
            must: [
              {
                term: {
                  businessId: businessId
                }
              },
              {
                range: {
                  creationDate: {
                    gte: startDate,
                    lte: endDate
                  }
                }
              }
            ]
          }
        },
        aggs: {
          distinct_session: {
            cardinality: {
              field: 'sessionId'
            }
          }
        }
      },
      { json: true },
      function(error, response) {
        if (error) {
          log.error('@getUniqueSessionCount: ', error);
          return reject(error);
        }
        if (
          !response.body.aggregations ||
          !response.body.aggregations.distinct_session ||
          !response.body.aggregations.distinct_session.value
        ) {
          return resolve(0);
        }
        var result = response.body.aggregations.distinct_session.value;
        return resolve(result);
      }
    );
  });
};

/* Return All Unique Session Count from Accounting UsageReport based on startDate, endDate
 startDate, endDate : number
 */
module.exports.getAllUniqueSessionCount = function(startDate, endDate) {
  return Q.Promise(function(resolve, reject) {
    if (!startDate) {
      return reject('startDate not defined');
    }
    if (!endDate) {
      return reject('endDate not defined');
    }
    log.debug('@getAllUniqueSessionCount');

    // Get Unique Session Count from ElasticSearch
    needle.post(
      ELASTIC_ACCOUNTING_USAGE_SEARCH.replace('{0}{1}', '_search'),
      {
        query: {
          bool: {
            must: [
              {
                range: {
                  creationDate: {
                    gte: startDate,
                    lte: endDate
                  }
                }
              }
            ]
          }
        },
        aggs: {
          distinct_session: {
            cardinality: {
              field: 'sessionId'
            }
          }
        }
      },
      { json: true },
      function(error, response) {
        if (error) {
          log.error('@getAllUniqueSessionCount: ', error);
          return reject(error);
        }
        if (
          !response.body.aggregations ||
          !response.body.aggregations.distinct_session ||
          !response.body.aggregations.distinct_session.value
        ) {
          return resolve(0);
        }
        var result = response.body.aggregations.distinct_session.value;
        return resolve(result);
      }
    );
  });
};

module.exports.getCharges = function(businessId, startDate, skip, limit) {
  return Q.Promise(function(resolve, reject) {
    if (!businessId) {
      return reject('business ID is undefined');
    }
    if (!startDate) {
      return reject('startDate or endDate is undefined');
    }
    if (!limit) {
      return reject('limit is undefined');
    }
    if (skip == null) {
      return reject('skip is undefined');
    }
    try {
      needle.post(
        ELASTIC_CHARGE_SEARCH,
        {
          from: skip,
          size: limit,
          query: {
            bool: {
              must: [
                {
                  term: { businessId: businessId }
                },
                {
                  range: {
                    date: {
                      gte: startDate
                    }
                  }
                }
              ]
            }
          },
          sort: [{ date: 'desc' }]
        },
        { json: true },
        function(error, response) {
          log.debug('status', response.statusCode);
          log.debug('status', response.status);
          log.debug('body: %j', response.body);
          if (error) {
            log.error('Error', error);
            log.error('body: %j', response.body);
            return reject(error);
          }
          log.debug('status code', response.statusCode);
          //log.debug( response.body )
          if (response.body && response.body.hits && !response.body.hits.hits) {
            log.error('getCharges', response.body);
            return resolve({});
          }
          //log.debug( 'getCharges', response.body.hits.hits )
          if (response.body && response.body.hits && response.body.hits.hits) {
            var result = response.body.hits.hits;
            return resolve({
              charges: result
            });
          } else {
            log.debug(response.body);
            return reject(response.body);
          }
        }
      );
    } catch (error) {
      log.error('getCharges %j', error);
      return reject(error);
    }
  });
};

/* Return Unique Session Count for Member of business from Accounting UsageReport based on startDate, endDate
 startDate, endDate : number
 businessId, memberId: string
 */
module.exports.getMemberUniqueSessionCount = function(
  businessId,
  memberId,
  startDate,
  endDate
) {
  return Q.Promise(function(resolve, reject) {
    if (!startDate) {
      return reject('startDate not defined');
    }
    if (!endDate) {
      return reject('endDate not defined');
    }
    log.debug('@getMemberUniqueSessionCount');

    // Get Unique Session Count from ElasticSearch
    needle.post(
      ELASTIC_ACCOUNTING_USAGE_SEARCH.replace('{0}{1}', '_search'),
      {
        query: {
          bool: {
            must: [
              {
                term: {
                  businessId: businessId
                }
              },
              {
                term: {
                  memberId: memberId
                }
              },
              {
                range: {
                  creationDate: {
                    gte: startDate,
                    lte: endDate
                  }
                }
              }
            ]
          }
        },
        aggs: {
          distinct_session: {
            cardinality: {
              field: 'sessionId'
            }
          }
        }
      },
      { json: true },
      function(error, response) {
        if (error) {
          log.error('@getMemberUniqueSessionCount: ', error);
          return reject(error);
        }
        if (
          !response.body.aggregations ||
          !response.body.aggregations.distinct_session ||
          !response.body.aggregations.distinct_session.value
        ) {
          return resolve(0);
        }
        var result = response.body.aggregations.distinct_session.value;
        return resolve(result);
      }
    );
  });
};

module.exports.getUsageReportSessions = function(
  startDate,
  endDate,
  accStatusType,
  size,
  partition
) {
  return Q.Promise(function(resolve, reject) {
    if (!startDate) {
      return reject('startDate not defined');
    }
    if (!endDate) {
      return reject('endDate not defined');
    }
    log.debug('@getUsageReportSessions');

    // Get Max Traffic Usage from ElasticSearch for Each Session
    needle.post(
      ELASTIC_ACCOUNTING_USAGE_SEARCH.replace('{0}{1}', '_search'),
      {
        query: {
          bool: {
            must: [
              {
                term: {
                  accStatusType: accStatusType
                }
              },
              {
                range: {
                  creationDate: {
                    gte: startDate,
                    lte: endDate
                  }
                }
              }
            ]
          }
        },
        aggs: {
          sessions: {
            terms: {
              field: 'sessionId',
              include: {
                partition: partition,
                num_partitions: partitionsNumber
              },
              size: size
            }
          }
        }
      },
      { json: true },
      function(error, response) {
        if (error) {
          log.error('@getUsageReportSessions: ', error);
          return reject(error);
        }
        if (
          !response.body.aggregations ||
          !response.body.aggregations.sessions ||
          !response.body.aggregations.sessions.buckets
        ) {
          return resolve([]);
        }
        var sessions = response.body.aggregations.sessions.buckets;
        var result = [];
        for (var i = 0; i < sessions.length; i++) {
          result.push(sessions[i].key);
        }
        return resolve(result);
      }
    );
  });
};

module.exports.getAllSessions = function(startDate, endDate, size) {
  return Q.Promise(function(resolve, reject) {
    if (!startDate) {
      return reject('startDate not defined');
    }
    if (!endDate) {
      return reject('endDate not defined');
    }
    size = size || 10000;
    var query = {
      size: size,
      query: {
        bool: {
          must_not: {
            terms: {
              accStatusType: [0]
            }
          },
          must: [
            {
              range: {
                creationDate: {
                  gte: startDate,
                  lte: endDate
                }
              }
            }
          ]
        }
      },
      aggs: {
        sessions: {
          terms: {
            field: 'sessionId',
            size: size
          }
        }
      }
    };
    needle.post(
      ELASTIC_ACCOUNTING_USAGE_SEARCH.replace('{0}{1}', '_search'),
      query,
      { json: true },
      function(error, response, body) {
        if (error) {
          log.error('@getAllSessions: ', error);
          return reject(error);
        }
        if (
          !body ||
          !body.aggregations ||
          !body.aggregations.sessions ||
          !response.body.aggregations.sessions.buckets
        ) {
          log.warn('aggregation result is empty: ', body);
          log.warn(query);
          return resolve([]);
        }
        var buckets = response.body.aggregations.sessions.buckets;
        var sessionIds = [];
        for (var i = 0; i < buckets.length; i++) {
          sessionIds.push(buckets[i].key);
        }
        return resolve(sessionIds);
      }
    );
  });
};

module.exports.getAggregatedUsageBySessionId = function(sessionId) {
  return Q.Promise(function(resolve, reject) {
    if (!sessionId) {
      return reject('sessionId not defined');
    }
    var size = 0;
    var query = {
      size: size,
      query: {
        term: {
          sessionId: sessionId
        }
      },
      aggs: {
        sessionTime: {
          max: {
            field: 'sessionTime'
          }
        },
        download: {
          max: {
            field: 'download'
          }
        },
        upload: {
          max: {
            field: 'upload'
          }
        },
        creationDate: {
          max: {
            field: 'creationDate'
          }
        },
        minCreationDate: {
          min: {
            field: 'creationDate'
          }
        },
        accountingDoc: {
          terms: {
            field: 'sessionId',
            size: 1
          },
          aggs: {
            lastAccountingDoc: {
              top_hits: {
                _source: {
                  includes: [
                    'businessId',
                    'nasId',
                    'username',
                    'memberId',
                    'mac',
                    'creationDateObj'
                  ]
                },
                size: 1
              }
            }
          }
        }
      }
    };
    needle.post(
      ELASTIC_ACCOUNTING_USAGE_SEARCH.replace('{0}{1}', '_search'),
      query,
      { json: true },
      function(error, response, body) {
        if (error) {
          log.error('@getAllSessions: ', error);
          return reject(error);
        }

        if (!body || !body.aggregations) {
          log.warn('aggregation result is empty: ', body);
          log.warn(query);
          return reject('invalid response');
        }
        var aggregations = body.aggregations;

        if (
          !aggregations.download ||
          aggregations.download.value == undefined ||
          !aggregations.upload ||
          aggregations.upload.value == undefined
        ) {
          log.warn('session data not found:', body);
          log.warn(query);
          return reject('data not found for this session');
        }

        if (
          !aggregations.accountingDoc ||
          !aggregations.accountingDoc.buckets ||
          aggregations.accountingDoc.buckets.length === 0
        ) {
          return reject('top heat aggregated result is empty');
        }

        var result =
          aggregations.accountingDoc.buckets[0].lastAccountingDoc.hits.hits[0]
            ._source;
        result.accStatusType = 0;
        result.sessionId = sessionId;
        result.download = aggregations.download.value;
        result.upload = aggregations.upload.value;
        result.totalUsage = result.upload + result.download;
        result.sessionTime = aggregations.sessionTime.value;
        result.creationDate = aggregations.creationDate.value;
        return resolve({
          aggregatedResult: result,
          range: {
            fromDateInMs: aggregations.minCreationDate.value,
            toDateInMs: result.creationDate
          }
        });
      }
    );
  });
};

module.exports.deleteBySessionId = function(
  fromDateInMs,
  toDateInMs,
  sessionId
) {
  return Q.Promise(function(resolve, reject) {
    if (!sessionId) {
      return reject('sessionId not defined');
    }
    var query = {
      query: {
        bool: {
          must_not: {
            terms: {
              accStatusType: [0]
            }
          },
          must: [
            {
              term: {
                sessionId: sessionId
              }
            },
            {
              range: {
                creationDate: {
                  gte: fromDateInMs,
                  lte: toDateInMs + 1000
                }
              }
            }
          ]
        }
      }
    };
    needle.post(
      ELASTIC_ACCOUNTING_USAGE_SEARCH.replace('{0}{1}', '_delete_by_query'),
      query,
      { json: true },
      function(error, response, body) {
        if (error) {
          log.error('@deleteBySessionId: ', error);
          return reject(error);
        }

        if (!body || body.deleted == undefined) {
          log.error('delete failed: ', body);
          log.error(query);
          return reject('delete failed');
        }
        if (body.deleted === 0) {
          log.warn('no document deleted for this session', sessionId);
          log.error(query);
        } else {
          log.debug(
            'Docs deleted for this session:',
            sessionId,
            ' : ',
            body.deleted
          );
        }
        return resolve(body);
      }
    );
  });
};

module.exports.cleanupDoc = function(docType, fromDateInMs, toDateInMs) {
  return Q.Promise(function(resolve, reject) {
    if (!docType || !fromDateInMs || !toDateInMs) {
      return reject('not enough parameters to remove docs!');
    }
    var SELECTED_INDEX;
    if (docType === 'accounting') {
      SELECTED_INDEX = ELASTIC_ACCOUNTING_INDEX;
    } else if (docType === 'netflow') {
      SELECTED_INDEX = ELASTIC_NETFLOW_REPORT_INDEX;
    } else if (docType === 'syslog') {
      SELECTED_INDEX = ELASTIC_SYSLOG_REPORT_INDEX;
    } else {
      return reject('invalid doc type');
    }
    var query = {
      query: {
        bool: {
          must: [
            {
              range: {
                creationDate: {
                  gte: fromDateInMs,
                  lte: toDateInMs
                }
              }
            }
          ]
        }
      }
    };
    needle.post(
      SELECTED_INDEX.replace('{0}{1}', '_delete_by_query'),
      query,
      { json: true },
      function(error, response, body) {
        if (error) {
          log.error('@cleanupElastic: ', error);
          return reject(error);
        }

        if (!body || body.deleted == undefined) {
          log.error('cleanupElastic failed: ', body);
          log.error(query);
          return reject('cleanupElastic failed');
        }
        if (body.deleted === 0) {
          log.warn('nothing to clean up');
          log.error(query);
        } else {
          log.debug('Docs cleaned up:', body.deleted);
        }
        return resolve(body);
      }
    );
  });
};

module.exports.addAccountingDoc = function(doc) {
  return Q.Promise(function(resolve, reject) {
    needle.post(ELASTIC_ACCOUNTING_INDEX, doc, { json: true }, function(
      error,
      result,
      body
    ) {
      if (error) {
        log.error(error);
        return reject(error);
      }
      if (!body || !body._id) {
        log.error(body);
        return reject('body result is empty');
      }
      log.debug('usage report created: ', body);
      return resolve();
    });
  });
};
