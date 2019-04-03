var Q = require('q')
var logger = require('./logger')
var log = logger.createLogger()
var needle = require('needle')
var elasticURL =
  'http://' + process.env.ELASTIC_IP + ':' + process.env.ELASTIC_PORT + '/'
var ELASTIC_ACCOUNTING_USAGE_SEARCH =
  elasticURL +
  process.env.ELASTIC_INDEX_PREFIX +
  'accounting/{0}{1}'
var ELASTIC_ACCOUNTING_INDEX =
  elasticURL + process.env.ELASTIC_INDEX_PREFIX + 'accounting'

var ELASTIC_SYSLOG_REPORT_INDEX =
  elasticURL + process.env.ELASTIC_INDEX_PREFIX + 'syslog/report'
var ELASTIC_NETFLOW_REPORT_INDEX =
  elasticURL + process.env.ELASTIC_INDEX_PREFIX + 'netflow/report'


module.exports.deleteBySessionId = function (
  fromDateInMs,
  toDateInMs,
  sessionId,
) {
  return Q.Promise(function (resolve, reject) {
    if (!sessionId) {
      return reject('sessionId not defined')
    }
    var query = {
      query: {
        bool: {
          must_not: {
            terms: {
              accStatusType: [0],
            },
          },
          must: [
            {
              term: {
                sessionId: sessionId,
              },
            },
            {
              range: {
                creationDate: {
                  gte: fromDateInMs,
                  lte: toDateInMs + 1000,
                },
              },
            },
          ],
        },
      },
    }
    needle.post(
      ELASTIC_ACCOUNTING_USAGE_SEARCH.replace('{0}{1}', '_delete_by_query'),
      query,
      {json: true},
      function (error, response, body) {
        if (error) {
          log.error('@deleteBySessionId: ', error)
          return reject(error)
        }

        if (!body || body.deleted == undefined) {
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
            body.deleted,
          )
        }
        return resolve(body)
      },
    )
  })
}

module.exports.cleanupDoc = function (docType, fromDateInMs, toDateInMs) {
  return Q.Promise(function (resolve, reject) {
    if (!docType || !fromDateInMs || !toDateInMs) {
      return reject('not enough parameters to remove docs!')
    }
    var SELECTED_INDEX
    if (docType === 'accounting') {
      SELECTED_INDEX = ELASTIC_ACCOUNTING_INDEX
    } else if (docType === 'netflow') {
      SELECTED_INDEX = ELASTIC_NETFLOW_REPORT_INDEX
    } else if (docType === 'syslog') {
      SELECTED_INDEX = ELASTIC_SYSLOG_REPORT_INDEX
    } else {
      return reject('invalid doc type')
    }
    var query = {
      query: {
        bool: {
          must: [
            {
              range: {
                creationDate: {
                  gte: fromDateInMs,
                  lte: toDateInMs,
                },
              },
            },
          ],
        },
      },
    }
    needle.post(
      SELECTED_INDEX.replace('{0}{1}', '_delete_by_query'),
      query,
      {json: true},
      function (error, response, body) {
        if (error) {
          log.error('@cleanupElastic: ', error)
          return reject(error)
        }

        if (!body || body.deleted == undefined) {
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
      },
    )
  })
}

module.exports.addAccountingDoc = function (doc) {
  return Q.Promise(function (resolve, reject) {
    needle.post(ELASTIC_ACCOUNTING_INDEX, doc, {json: true}, function (
      error,
      result,
      body,
    ) {
      if (error) {
        log.error(error)
        return reject(error)
      }
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
      size: size,
      query: {
        bool: {
          must_not: {
            terms: {
              accStatusType: [0],
            },
          },
          must: [
            {
              range: {
                creationDate: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            },
          ],
        },
      },
      aggs: {
        sessions: {
          terms: {
            field: 'sessionId',
            size: size,
          },
        },
      },
    }
    needle.post(
      ELASTIC_ACCOUNTING_USAGE_SEARCH.replace('{0}{1}', '_search'),
      query,
      {json: true},
      function (error, response, body) {
        if (error) {
          log.error('@getAllSessions: ', error)
          return reject(error)
        }
        if (
          !body ||
          !body.aggregations ||
          !body.aggregations.sessions ||
          !response.body.aggregations.sessions.buckets
        ) {
          log.warn('aggregation result is empty: ', body)
          log.warn(query)
          return resolve([])
        }
        var buckets = response.body.aggregations.sessions.buckets
        var sessionIds = []
        for (var i = 0; i < buckets.length; i++) {
          sessionIds.push(buckets[i].key)
        }
        return resolve(sessionIds)
      },
    )
  })
}

module.exports.getAggregatedUsageBySessionId = function (sessionId) {
  return Q.Promise(function (resolve, reject) {
    if (!sessionId) {
      return reject('sessionId not defined')
    }
    var size = 0
    var query = {
      size: size,
      query: {
        term: {
          sessionId: sessionId,
        },
      },
      aggs: {
        sessionTime: {
          max: {
            field: 'sessionTime',
          },
        },
        download: {
          max: {
            field: 'download',
          },
        },
        upload: {
          max: {
            field: 'upload',
          },
        },
        creationDate: {
          max: {
            field: 'creationDate',
          },
        },
        minCreationDate: {
          min: {
            field: 'creationDate',
          },
        },
        accountingDoc: {
          terms: {
            field: 'sessionId',
            size: 1,
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
                    'creationDateObj',
                  ],
                },
                size: 1,
              },
            },
          },
        },
      },
    }
    needle.post(
      ELASTIC_ACCOUNTING_USAGE_SEARCH.replace('{0}{1}', '_search'),
      query,
      {json: true},
      function (error, response, body) {
        if (error) {
          log.error('@getAllSessions: ', error)
          return reject(error)
        }

        if (!body || !body.aggregations) {
          log.warn('aggregation result is empty: ', body)
          log.warn(query)
          return reject('invalid response')
        }
        var aggregations = body.aggregations

        if (
          !aggregations.download ||
          aggregations.download.value == undefined ||
          !aggregations.upload ||
          aggregations.upload.value == undefined
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
            toDateInMs: result.creationDate,
          },
        })
      },
    )
  })
}
