var Q = require('q')
var logger = require('./logger')
var log = logger.createLogger()

const ACCOUNTING_INDEX = `${process.env.ELASTIC_INDEX_PREFIX}accounting`
//const CHARGE_INDEX = `${process.env.ELASTIC_INDEX_PREFIX}charge`
//const LICENSE_CHARGE_INDEX = `${process.env.ELASTIC_INDEX_PREFIX}licensecharge`
const {Client} = require('@elastic/elasticsearch')
const elasticClient = new Client({
  node: `http://${process.env.ELASTIC_IP}:${process.env.ELASTIC_PORT}`,
  apiVersion: '6.7',
  log: process.env.ELASTICSEARCH_LOG_LEVEL || 'info',
})

var self = this
/* Return Max of Session Time & Download & Upload for Business Base on Member
 startDate: Date
 endDate: Date
 businessId: String
 offset: number
 interval: number
 */
// module.exports.getMemberTrafficUsageReport = function (
//   startDate,
//   endDate,
//   businessId,
//   offset,
//   interval,
//   size
// ) {
//   return Q.Promise(function (resolve, reject) {
//     if (offset == null) {
//       return reject('offset is undefined')
//     }
//     if (interval == null) {
//       return reject('interval is undefined')
//     }
//     if (!businessId) {
//       return reject('business ID is undefined')
//     }
//     if (!startDate || !endDate) {
//       return reject('startDate or endDate is undefined')
//     }
//
//     const query = {
//       query: {
//         bool: {
//           must: [
//             {
//               term: {
//                 businessId: businessId
//               }
//             },
//             {
//               range: {
//                 creationDate: {
//                   gte: startDate,
//                   lt: endDate
//                 }
//               }
//             }
//           ]
//         }
//       },
//       aggs: {
//         usage: {
//           histogram: {
//             field: 'creationDate',
//             interval: interval,
//             min_doc_count: 0,
//             extended_bounds: {
//               min: startDate,
//               max: endDate
//             },
//             offset: offset
//           },
//           aggs: {
//             group_by_sessionId: {
//               terms: {
//                 field: 'sessionId',
//                 size: size
//               },
//               aggs: {
//                 sessionTime: {
//                   max: {
//                     field: 'sessionTime'
//                   }
//                 },
//                 download: {
//                   max: {
//                     field: 'download'
//                   }
//                 },
//                 upload: {
//                   max: {
//                     field: 'upload'
//                   }
//                 }
//               }
//             }
//           }
//         }
//       }
//     }
//
//     elasticClient.search({
//       index: ACCOUNTING_INDEX,
//       body: query
//     }, (error, response) => {
//       if (error) {
//         log.error('Error TrafficUsageReport: %j', error)
//         return reject(error)
//       }
//       const body = response.body
//       if (body.aggregations.usage.buckets) {
//         var result = []
//         var usageDates = body.aggregations.usage.buckets
//         for (var i = 0; i < usageDates.length; i++) {
//           var usage = {
//             key: usageDates[i].key,
//             download: {value: 0},
//             upload: {value: 0},
//             sessionTime: {value: 0}
//           }
//           if (usageDates[i].group_by_sessionId.buckets) {
//             var sessionIdGroup = usageDates[i].group_by_sessionId.buckets
//             //log.debug( "###########################@getTrafficUsageReport:" )
//             //log.debug( sessionIdGroup )
//             if (sessionIdGroup.length > 0) {
//               for (var j = 0; j < sessionIdGroup.length; j++) {
//                 var sessionGroup = sessionIdGroup[j]
//                 log.debug(sessionGroup)
//                 usage.download.value += sessionGroup.download.value
//                 usage.upload.value += sessionGroup.upload.value
//                 usage.sessionTime.value += sessionGroup.sessionTime.value
//               }
//               result.push(usage)
//             } else {
//               result.push(usage)
//             }
//           } else {
//             result.push(usage)
//           }
//         }
//         return resolve(result)
//       } else {
//         log.debug(body)
//         return reject(body)
//       }
//     })
//   })
// }

// module.exports.getMemberUsage = function (
//   startDate,
//   endDate,
//   memberId,
//   businessId
// ) {
//   return Q.Promise(function (resolve, reject) {
//     if (!businessId) {
//       return reject('business ID is undefined')
//     }
//     if (!startDate || !endDate || startDate.getTime) {
//       return reject('invalid startDate or endDate ', startDate, endDate)
//     }
//     self.getMemberUniqueSessionCount(businessId, memberId, startDate, endDate)
//       .then(function (sessionCount) {
//         if (sessionCount < 10) {
//           sessionCount = 10
//         }
//
//         elasticClient.search({
//           index: ACCOUNTING_INDEX,
//           body: {
//             query: {
//               bool: {
//                 must: [
//                   {
//                     term: {
//                       businessId: businessId
//                     }
//                   },
//                   {
//                     term: {
//                       memberId: memberId
//                     }
//                   },
//                   {
//                     range: {
//                       creationDate: {
//                         gte: startDate,
//                         lt: endDate
//                       }
//                     }
//                   }
//                 ]
//               }
//             },
//             aggs: {
//               group_by_sessionId: {
//                 terms: {
//                   size: sessionCount,
//                   field: 'sessionId'
//                 },
//                 aggs: {
//                   sessionTime: {
//                     max: {
//                       field: 'sessionTime'
//                     }
//                   },
//                   totalUsage: {
//                     max: {
//                       field: 'totalUsage'
//                     }
//                   },
//                   upload: {
//                     max: {
//                       field: 'upload'
//                     }
//                   },
//                   download: {
//                     max: {
//                       field: 'download'
//                     }
//                   }
//                 }
//               }
//             }
//           }
//         }, (error, response) => {
//           if (error) {
//             log.error('@getMemberUsage', error)
//             return reject(error)
//           }
//           const body = response.body
//           const usage = {
//             memberId: memberId,
//             bulk: 0,
//             download: 0,
//             upload: 0,
//             sessionTime: 0
//           }
//
//           if (response.statusCode >= 300) {
//             log.error('request to elastic failed ', body)
//             return reject('request to elastic failed ')
//           }
//           if (
//             body &&
//             body.aggregations &&
//             body.aggregations.group_by_sessionId.buckets.length > 0
//           ) {
//             var results = body.aggregations.group_by_sessionId.buckets
//             for (var j = 0; j < results.length; j++) {
//               var usageItem = results[j]
//               usage.bulk += usageItem.totalUsage.value
//               usage.download += usageItem.download.value
//               usage.upload += usageItem.upload.value
//               usage.sessionTime += usageItem.sessionTime.value
//             }
//           } else {
//             log.warn('going to send empty usage', body)
//           }
//           return resolve(usage)
//         })
//       }).fail(function (error) {
//       return reject(error)
//     })
//   })
// }

// module.exports.getLicenseBalance = function (licenseId) {
//   return Q.Promise(function (resolve, reject) {
//     if (!licenseId) {
//       return reject('licenseId is undefined')
//     }
//
//     log.debug('get license balance ', LICENSE_CHARGE_INDEX)
//     try {
//       elasticClient.search({
//         index: LICENSE_CHARGE_INDEX,
//         body: {
//           query: {
//             term: {
//               licenseId: licenseId
//             }
//           },
//           aggs: {
//             balance: {
//               sum: {
//                 field: 'amount'
//               }
//             }
//           }
//         }
//       }, (error, response) => {
//         if (error) {
//           log.error('getProfileBalance:', error)
//           return reject(error)
//         }
//         const body = response.body;
//
//         if (body && body.aggregations) {
//           var result = body.aggregations
//           var balance = result.balance.value
//           return resolve({
//             balance: balance
//           })
//         } else {
//           log.error(body)
//           return reject(body)
//         }
//       })
//     } catch (error) {
//       log.error(error)
//       return reject(error)
//     }
//   })
// }

// module.exports.getProfileBalance = function (businessId) {
//   return Q.Promise(function (resolve, reject) {
//     if (!businessId) {
//       return reject('business ID is undefined')
//     }
//     try {
//       elasticClient.search({
//         index: CHARGE_INDEX,
//         body: {
//           query: {
//             term: {
//               businessId: businessId
//             }
//           },
//           aggs: {
//             balance: {
//               sum: {
//                 field: 'amount'
//               }
//             }
//           }
//         },
//       }, (error, response) => {
//         if (error) {
//           log.error('getProfileBalance:', error)
//           return reject(error)
//         }
//         const body = response.body;
//
//         if (body && body.aggregations) {
//           var result = body.aggregations
//           var balance = result.balance.value
//           return resolve({
//             balance: balance
//           })
//         } else {
//           log.debug(body)
//           return reject(body)
//         }
//       })
//     } catch (error) {
//       log.error(error)
//       return reject(error)
//     }
//   })
// }

/* Return sum of Session Time & Download & Upload for Member Online Users & Max for Ip Online Users
 fromDate: number
 memberId: string
 */
// module.exports.getSessionsReport = function (fromDateInMs, memberId, sessionId) {
//   return Q.Promise(function (resolve, reject) {
//     if (!memberId) {
//       return reject('memberId is undefined')
//     }
//     if (!sessionId) {
//       return reject('sessionId is undefined')
//     }
//     // no subscription date so return zero for download, upload & session time
//     if (!fromDateInMs) {
//       return resolve({
//         fromDate: new Date().getTime(),
//         sessionReports: [
//           {
//             download: {value: 0},
//             upload: {value: 0},
//             sessionTime: {value: 0}
//           }
//         ],
//         memberId: memberId
//       })
//     }
//     var aggregate = {
//       group_by_sessionId: {
//         terms: {
//           field: 'sessionId'
//         },
//         aggs: {
//           sessionTime: {
//             max: {
//               field: 'sessionTime'
//             }
//           },
//           download: {
//             max: {
//               field: 'download'
//             }
//           },
//           upload: {
//             max: {
//               field: 'upload'
//             }
//           }
//         }
//       }
//     }
//
//     elasticClient.search({
//       index: ACCOUNTING_INDEX,
//       body: {
//         query: {
//           bool: {
//             must: [
//               {
//                 term: {memberId: memberId}
//               },
//               {
//                 term: {sessionId: sessionId}
//               },
//               {
//                 range: {
//                   creationDate: {
//                     gte: fromDateInMs
//                   }
//                 }
//               }
//             ]
//           }
//         },
//         aggs: aggregate
//       },
//     }, (error, response) => {
//       if (error) {
//         log.error('@getSessionsReport: ', error)
//         return reject(error)
//       }
//       const body = response.body;
//
//       if (!body.aggregations) {
//         return resolve({
//           fromDate: fromDateInMs,
//           sessionReports: [
//             {
//               download: {value: 0},
//               upload: {value: 0},
//               sessionTime: {value: 0}
//             }
//           ],
//           memberId: memberId
//         })
//       } else {
//         var sessionReports =
//           body.aggregations.group_by_sessionId.buckets
//         if (!sessionReports || sessionReports.length === 0) {
//           sessionReports = [
//             {
//               download: {value: 0},
//               upload: {value: 0},
//               sessionTime: {value: 0}
//             }
//           ]
//         }
//         return resolve({
//           fromDate: fromDateInMs,
//           sessionReports: sessionReports,
//           sessionId: sessionId,
//           memberId: memberId
//         })
//       }
//     })
//   })
// }

/* Return Daily Internet Usage of a Member
 businessId, memberId : string
 */
module.exports.getMemberDailyUsage = function (businessId, memberId, startDate) {
  return Q.Promise(function (resolve, reject) {
    if (!businessId) {
      return reject('businessId not defined')
    }
    if (!memberId) {
      return reject('memberId not defined')
    }
    if (!startDate) {
      return reject('startDate not defined')
    }
    log.debug('@getMemberDailyUsage')
    var endDate = new Date().getTime()
    var interval = process.env.DAY_MILLISECONDS
    var offset = new Date(startDate)
    offset = offset.getTimezoneOffset() * process.env.MINUTE_MILLISECONDS

    // Get Daily Traffic Usage from ElasticSearch based on startDate, endDate, businessId & memberId
    elasticClient.search({
      index: ACCOUNTING_INDEX,
      body: {
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
      }
    }, (error, response) => {
      if (error) {
        log.error('@getMemberDailyUsage: ', error)
        return reject(error)
      }
      const body = response.body;

      if (
        !body.aggregations ||
        !body.aggregations.usage ||
        !body.aggregations.usage.buckets
      ) {
        return resolve([])
      }
      var result = body.aggregations.usage.buckets
      //log.debug ( '@getMemberDailyUsage: ', result );
      return resolve(result)
    })
  })
}

/* Return Unique Session Count for businessId from Accounting UsageReport based on startDate, endDate
 startDate, endDate : number
 businessId: string
 */
// module.exports.getUniqueSessionCount = function (
//   businessId,
//   startDate,
//   endDate
// ) {
//   return Q.Promise(function (resolve, reject) {
//     if (!startDate) {
//       return reject('startDate not defined')
//     }
//     if (!endDate) {
//       return reject('endDate not defined')
//     }
//     log.debug('@getUniqueSessionCount')
//
//     // Get Unique Session Count from ElasticSearch
//     elasticClient.search({
//       index: ACCOUNTING_INDEX,
//       body: {
//         query: {
//           bool: {
//             must: [
//               {
//                 term: {
//                   businessId: businessId
//                 }
//               },
//               {
//                 range: {
//                   creationDate: {
//                     gte: startDate,
//                     lte: endDate
//                   }
//                 }
//               }
//             ]
//           }
//         },
//         aggs: {
//           distinct_session: {
//             cardinality: {
//               field: 'sessionId'
//             }
//           }
//         }
//       }
//     }, (error, response) => {
//       if (error) {
//         log.error('@getUniqueSessionCount: ', error)
//         return reject(error)
//       }
//       const body = response.body;
//
//       if (
//         !body.aggregations ||
//         !body.aggregations.distinct_session ||
//         !body.aggregations.distinct_session.value
//       ) {
//         return resolve(0)
//       }
//       var result = body.aggregations.distinct_session.value
//       return resolve(result)
//     })
//   })
// }

/* Return All Unique Session Count from Accounting UsageReport based on startDate, endDate
 startDate, endDate : number
 */
// module.exports.getAllUniqueSessionCount = function (startDate, endDate) {
//   return Q.Promise(function (resolve, reject) {
//     if (!startDate) {
//       return reject('startDate not defined')
//     }
//     if (!endDate) {
//       return reject('endDate not defined')
//     }
//     log.debug('@getAllUniqueSessionCount')
//
//     // Get Unique Session Count from ElasticSearch
//     elasticClient.search({
//       index: ACCOUNTING_INDEX,
//       body: {
//         query: {
//           bool: {
//             must: [
//               {
//                 range: {
//                   creationDate: {
//                     gte: startDate,
//                     lte: endDate
//                   }
//                 }
//               }
//             ]
//           }
//         },
//         aggs: {
//           distinct_session: {
//             cardinality: {
//               field: 'sessionId'
//             }
//           }
//         }
//       }
//     }, (error, response) => {
//       if (error) {
//         log.error('@getAllUniqueSessionCount: ', error)
//         return reject(error)
//       }
//       const body = response.body;
//
//       if (
//         !body.aggregations ||
//         !body.aggregations.distinct_session ||
//         !body.aggregations.distinct_session.value
//       ) {
//         return resolve(0)
//       }
//       var result = body.aggregations.distinct_session.value
//       return resolve(result)
//     })
//   })
// }

// module.exports.getCharges = function (businessId, startDate, skip, limit) {
//   return Q.Promise(function (resolve, reject) {
//     if (!businessId) {
//       return reject('business ID is undefined')
//     }
//     if (!startDate) {
//       return reject('startDate or endDate is undefined')
//     }
//     if (!limit) {
//       return reject('limit is undefined')
//     }
//     if (skip == null) {
//       return reject('skip is undefined')
//     }
//     try {
//       elasticClient.search({
//         index: CHARGE_INDEX,
//         from: skip,
//         size: limit,
//         body: {
//           sort: [{date: 'desc'}],
//           query: {
//             bool: {
//               must: [
//                 {
//                   term: {businessId: businessId}
//                 },
//                 {
//                   range: {
//                     date: {
//                       gte: startDate
//                     }
//                   }
//                 }
//               ]
//             }
//           },
//         }
//
//       }, (error, response) => {
//         if (error) {
//           log.error('Error', error)
//           log.error('body: %j', response.body)
//           return reject(error)
//         }
//         const body = response.body;
//         log.debug('status code', response.statusCode)
//
//         if (body && body.hits && !body.hits.hits) {
//           log.error('getCharges', body)
//           return resolve({})
//         }
//         if (body && body.hits && body.hits.hits) {
//           var result = body.hits.hits
//           return resolve({
//             charges: result
//           })
//         } else {
//           log.debug(body)
//           return reject(body)
//         }
//       })
//
//     } catch (error) {
//       log.error('getCharges %j', error)
//       return reject(error)
//     }
//   })
// }

/* Return Unique Session Count for Member of business from Accounting UsageReport based on startDate, endDate
 startDate, endDate : number
 businessId, memberId: string
 */
// module.exports.getMemberUniqueSessionCount = function (
//   businessId,
//   memberId,
//   startDate,
//   endDate
// ) {
//   return Q.Promise(function (resolve, reject) {
//     if (!startDate) {
//       return reject('startDate not defined')
//     }
//     if (!endDate) {
//       return reject('endDate not defined')
//     }
//     log.debug('@getMemberUniqueSessionCount')
//
//     const query = {
//       query: {
//         bool: {
//           must: [
//             {
//               term: {
//                 businessId: businessId
//               }
//             },
//             {
//               term: {
//                 memberId: memberId
//               }
//             },
//             {
//               range: {
//                 creationDate: {
//                   gte: startDate,
//                   lte: endDate
//                 }
//               }
//             }
//           ]
//         }
//       },
//       aggs: {
//         distinct_session: {
//           cardinality: {
//             field: 'sessionId'
//           }
//         }
//       }
//     }
//     elasticClient.search({
//       index: ACCOUNTING_INDEX,
//       body: query
//     }, (error, response) => {
//       if (error) {
//         log.error('@getMemberUniqueSessionCount: ', error)
//         return reject(error)
//       }
//       const body = response.body;
//
//       if (
//         !body.aggregations ||
//         !body.aggregations.distinct_session ||
//         !body.aggregations.distinct_session.value
//       ) {
//         return resolve(0)
//       }
//       var result = body.aggregations.distinct_session.value
//       return resolve(result)
//     })
//   })
// }
//
// module.exports.getAllSessions = function (startDate, endDate, size) {
//   return Q.Promise(function (resolve, reject) {
//     if (!startDate) {
//       return reject('startDate not defined')
//     }
//     if (!endDate) {
//       return reject('endDate not defined')
//     }
//     size = size || 10000
//     var query = {
//       query: {
//         bool: {
//           must_not: {
//             terms: {
//               accStatusType: [0]
//             }
//           },
//           must: [
//             {
//               range: {
//                 creationDate: {
//                   gte: startDate,
//                   lte: endDate
//                 }
//               }
//             }
//           ]
//         }
//       },
//       aggs: {
//         sessions: {
//           terms: {
//             field: 'sessionId',
//             size: size
//           }
//         }
//       }
//     }
//     elasticClient.search({
//       index: ACCOUNTING_INDEX,
//       body: query,
//       size: size
//     }, (error, response) => {
//       if (error) {
//         log.error('@getAllSessions: ', error)
//         return reject(error)
//       }
//       const body = response.body
//       if (
//         !body ||
//         !body.aggregations ||
//         !body.aggregations.sessions ||
//         !body.aggregations.sessions.buckets
//       ) {
//         log.warn('aggregation result is empty: ', body)
//         log.warn(query)
//         return resolve([])
//       }
//       var buckets = body.aggregations.sessions.buckets
//       var sessionIds = []
//       for (var i = 0; i < buckets.length; i++) {
//         sessionIds.push(buckets[i].key)
//       }
//       return resolve(sessionIds)
//     })
//   })
// }
//
// module.exports.getAggregatedUsageBySessionId = function (sessionId) {
//   return Q.Promise(function (resolve, reject) {
//     if (!sessionId) {
//       return reject('sessionId not defined')
//     }
//     var size = 0
//     var query = {
//       query: {
//         term: {
//           sessionId: sessionId
//         }
//       },
//       aggs: {
//         sessionTime: {
//           max: {
//             field: 'sessionTime'
//           }
//         },
//         download: {
//           max: {
//             field: 'download'
//           }
//         },
//         upload: {
//           max: {
//             field: 'upload'
//           }
//         },
//         creationDate: {
//           max: {
//             field: 'creationDate'
//           }
//         },
//         minCreationDate: {
//           min: {
//             field: 'creationDate'
//           }
//         },
//         accountingDoc: {
//           terms: {
//             field: 'sessionId',
//             size: 1
//           },
//           aggs: {
//             lastAccountingDoc: {
//               top_hits: {
//                 _source: {
//                   includes: [
//                     'businessId',
//                     'nasId',
//                     'username',
//                     'memberId',
//                     'mac',
//                     'creationDateObj'
//                   ]
//                 },
//                 size: 1
//               }
//             }
//           }
//         }
//       }
//     }
//     elasticClient.search({
//       index: ACCOUNTING_INDEX,
//       size: size,
//       body: query
//     }, (error, response) => {
//       if (error) {
//         log.error('@getAllSessions: ', error)
//         return reject(error)
//       }
//
//       const body = response.body
//       const aggregations = body.aggregations
//
//       if (
//         !aggregations.download ||
//         aggregations.download.value === undefined ||
//         !aggregations.upload ||
//         aggregations.upload.value === undefined
//       ) {
//         log.warn('session data not found:', body)
//         log.warn(query)
//         return reject('data not found for this session')
//       }
//
//       if (
//         !aggregations.accountingDoc ||
//         !aggregations.accountingDoc.buckets ||
//         aggregations.accountingDoc.buckets.length === 0
//       ) {
//         return reject('top heat aggregated result is empty')
//       }
//
//       var result =
//         aggregations.accountingDoc.buckets[0].lastAccountingDoc.hits.hits[0]
//           ._source
//       result.accStatusType = 0
//       result.sessionId = sessionId
//       result.download = aggregations.download.value
//       result.upload = aggregations.upload.value
//       result.totalUsage = result.upload + result.download
//       result.sessionTime = aggregations.sessionTime.value
//       result.creationDate = aggregations.creationDate.value
//       return resolve({
//         aggregatedResult: result,
//         range: {
//           fromDateInMs: aggregations.minCreationDate.value,
//           toDateInMs: result.creationDate
//         }
//       })
//     })
//   })
// }
//
// module.exports.deleteBySessionId = function (
//   fromDateInMs,
//   toDateInMs,
//   sessionId
// ) {
//   return Q.Promise(function (resolve, reject) {
//     if (!sessionId) {
//       return reject('sessionId not defined')
//     }
//     const query = {
//       query: {
//         bool: {
//           must_not: {
//             terms: {
//               accStatusType: [0]
//             }
//           },
//           must: [
//             {
//               term: {
//                 sessionId: sessionId
//               }
//             },
//             {
//               range: {
//                 creationDate: {
//                   gte: fromDateInMs,
//                   lte: toDateInMs + 1000
//                 }
//               }
//             }
//           ]
//         }
//       }
//     }
//     elasticClient.deleteByQuery({
//       index: ACCOUNTING_INDEX,
//       body: query
//     }, (error, response) => {
//       if (error) {
//         log.error('@deleteBySessionId: ', error)
//         return reject(error)
//       }
//       const body = response.body
//       if (!body || body.deleted === undefined) {
//         log.error('delete failed: ', body)
//         log.error(query)
//         return reject('delete failed')
//       }
//       if (body.deleted === 0) {
//         log.warn('no document deleted for this session', sessionId)
//         log.error(query)
//       } else {
//         log.debug(
//           'Docs deleted for this session:',
//           sessionId,
//           ' : ',
//           body.deleted
//         )
//       }
//       return resolve(body)
//     })
//   })
// }
//
// module.exports.cleanupDoc = function (docType, fromDateInMs, toDateInMs) {
//   return Q.Promise(function (resolve, reject) {
//     if (!docType || !fromDateInMs || !toDateInMs) {
//       return reject('not enough parameters to remove docs!')
//     }
//     var SELECTED_INDEX
//     if (docType === 'accounting') {
//       SELECTED_INDEX = ACCOUNTING_INDEX
//     }
//     var query = {
//       query: {
//         bool: {
//           must: [
//             {
//               range: {
//                 creationDate: {
//                   gte: fromDateInMs,
//                   lte: toDateInMs
//                 }
//               }
//             }
//           ]
//         }
//       }
//     }
//
//     elasticClient.deleteByQuery({
//       index: SELECTED_INDEX,
//       body: query
//     }, (error, response) => {
//       if (error) {
//         log.error('@cleanupElastic: ', error)
//         return reject(error)
//       }
//       const body = response.body
//       if (!body || body.deleted === undefined) {
//         log.error('cleanupElastic failed: ', body)
//         log.error(query)
//         return reject('cleanupElastic failed')
//       }
//       if (body.deleted === 0) {
//         log.warn('nothing to clean up')
//         log.error(query)
//       } else {
//         log.debug('Docs cleaned up:', body.deleted)
//       }
//       return resolve(body)
//     })
//   })
// }
//
// module.exports.addAccountingDoc = function (doc) {
//   return Q.Promise(function (resolve, reject) {
//     elasticClient.index({
//       index: ACCOUNTING_INDEX,
//       body: doc
//     }, (error, response) => {
//       if (error) {
//         log.error(error)
//         return reject(error)
//       }
//       const body = response.body
//       if (!body || !body._id) {
//         log.error(body)
//         return reject('body result is empty')
//       }
//       log.debug('usage report created: ', body)
//       return resolve()
//
//     })
//   })
// }
