var Q = require('q')
var logger = require('./logger')
var log = logger.createLogger()
const config = require('./config')
const ACCOUNTING_INDEX = `${process.env.ELASTIC_INDEX_PREFIX}accounting`
const {Client} = require('@elastic/elasticsearch')
const elasticClient = new Client({
  node: `http://${process.env.ELASTIC_IP}:${process.env.ELASTIC_PORT}`,
  apiVersion: '6.7',
  log: process.env.ELASTICSEARCH_LOG_LEVEL || 'info',
})


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
    var interval = config.AGGREGATE.DAY_MILLISECONDS
    var offset = new Date(startDate)
    offset = offset.getTimezoneOffset() * config.AGGREGATE.MINUTE_MILLISECONDS

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
