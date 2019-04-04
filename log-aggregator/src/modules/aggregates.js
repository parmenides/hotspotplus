var Q = require('q')
var logger = require('./logger')
var log = logger.createLogger()
const {Client} = require('@elastic/elasticsearch')
const elasticClient = new Client({
  node: `http://${process.env.ELASTIC_IP}:${process.env.ELASTIC_PORT}`,
  apiVersion: '6.7',
  log: process.env.ELASTICSEARCH_LOG_LEVEL || 'info',
})
const ACCOUNTING_INDEX = `${process.env.ELASTIC_INDEX_PREFIX}accounting`

module.exports.deleteBySessionId = function (
  fromDateInMs,
  toDateInMs,
  sessionId
) {
  return Q.Promise(function (resolve, reject) {
    if (!sessionId) {
      return reject('sessionId not defined')
    }
    const query = {
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
    }
    elasticClient.deleteByQuery({
      index: ACCOUNTING_INDEX,
      body: query
    }, (error, response) => {
      if (error) {
        log.error('@deleteBySessionId: ', error)
        return reject(error)
      }
      const body = response.body
      if (!body || body.deleted === undefined) {
        log.error('delete failed: ', body)
        log.error(query)
        return reject('delete failed')
      }
      if (body.deleted === 0) {
        log.warn('no document deleted for this session', sessionId)
        log.error(query)
      } else {
        log.debug(
          'Docs deleted for this session:',
          sessionId,
          ' : ',
          body.deleted
        )
      }
      return resolve(body)
    })
  })
}


module.exports.cleanupDoc = function (docType, fromDateInMs, toDateInMs) {
  return Q.Promise(function (resolve, reject) {
    if (!docType || !fromDateInMs || !toDateInMs) {
      return reject('not enough parameters to remove docs!')
    }
    var SELECTED_INDEX
    if (docType === 'accounting') {
      SELECTED_INDEX = ACCOUNTING_INDEX
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
    }

    elasticClient.deleteByQuery({
      index: SELECTED_INDEX,
      body: query
    }, (error, response) => {
      if (error) {
        log.error('@cleanupElastic: ', error)
        return reject(error)
      }
      const body = response.body
      if (!body || body.deleted === undefined) {
        log.error('cleanupElastic failed: ', body)
        log.error(query)
        return reject('cleanupElastic failed')
      }
      if (body.deleted === 0) {
        log.warn('nothing to clean up')
        log.error(query)
      } else {
        log.debug('Docs cleaned up:', body.deleted)
      }
      return resolve(body)
    })
  })
}


module.exports.addAccountingDoc = function (doc) {
  return Q.Promise(function (resolve, reject) {
    elasticClient.index({
      index: ACCOUNTING_INDEX,
      body: doc
    }, (error, response) => {
      if (error) {
        log.error(error)
        return reject(error)
      }
      const body = response.body
      if (!body || !body._id) {
        log.error(body)
        return reject('body result is empty')
      }
      log.debug('usage report created: ', body)
      return resolve()

    })
  })
}
module.exports.getAllSessions = function (startDate, endDate, size) {
  return Q.Promise(function (resolve, reject) {
    if (!startDate) {
      return reject('startDate not defined')
    }
    if (!endDate) {
      return reject('endDate not defined')
    }
    size = size || 10000
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
    }
    elasticClient.search({
      index: ACCOUNTING_INDEX,
      body: query,
      size: size
    }, (error, response) => {
      if (error) {
        log.error('@getAllSessions: ', error)
        return reject(error)
      }
      const body = response.body
      if (
        !body ||
        !body.aggregations ||
        !body.aggregations.sessions ||
        !body.aggregations.sessions.buckets
      ) {
        log.warn('aggregation result is empty: ', body)
        log.warn(query)
        return resolve([])
      }
      var buckets = body.aggregations.sessions.buckets
      var sessionIds = []
      for (var i = 0; i < buckets.length; i++) {
        sessionIds.push(buckets[i].key)
      }
      return resolve(sessionIds)
    })
  })
}



module.exports.getAggregatedUsageBySessionId = function (sessionId) {
  return Q.Promise(function (resolve, reject) {
    if (!sessionId) {
      return reject('sessionId not defined')
    }
    var size = 0
    var query = {
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
    }
    elasticClient.search({
      index: ACCOUNTING_INDEX,
      size: size,
      body: query
    }, (error, response) => {
      if (error) {
        log.error('@getAllSessions: ', error)
        return reject(error)
      }

      const body = response.body
      const aggregations = body.aggregations

      if (
        !aggregations.download ||
        aggregations.download.value === undefined ||
        !aggregations.upload ||
        aggregations.upload.value === undefined
      ) {
        log.warn('session data not found:', body)
        log.warn(query)
        return reject('data not found for this session')
      }

      if (
        !aggregations.accountingDoc ||
        !aggregations.accountingDoc.buckets ||
        aggregations.accountingDoc.buckets.length === 0
      ) {
        return reject('top heat aggregated result is empty')
      }

      var result =
        aggregations.accountingDoc.buckets[0].lastAccountingDoc.hits.hits[0]
          ._source
      result.accStatusType = 0
      result.sessionId = sessionId
      result.download = aggregations.download.value
      result.upload = aggregations.upload.value
      result.totalUsage = result.upload + result.download
      result.sessionTime = aggregations.sessionTime.value
      result.creationDate = aggregations.creationDate.value
      return resolve({
        aggregatedResult: result,
        range: {
          fromDateInMs: aggregations.minCreationDate.value,
          toDateInMs: result.creationDate
        }
      })
    })
  })
}
