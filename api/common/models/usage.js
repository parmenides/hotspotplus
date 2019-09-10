'use strict'
var app = require('../../server/server')
var utility = require('../../server/modules/utility')
var Q = require('q')
var kafka = require('kafka-node')
var aggregate = require('../../server/modules/aggregates')
var config = require('../../server/modules/config.js')
var logger = require('../../server/modules/logger')
var log = logger.createLogger()
var _ = require('underscore')
var kafkaClient = new kafka.KafkaClient({
  kafkaHost: process.env.KAFKA_IP + ':' + process.env.KAFKA_PORT
})
const db = require('../../server/modules/db.factory')

var kafkaProducer = new kafka.Producer(kafkaClient, {partitionerType: 2})
var redis = require('redis')
var redisClient = redis.createClient(config.REDIS.PORT, config.REDIS.HOST)

kafkaProducer.on('ready', function () {
  log.warn('Producer ready...')
  kafkaClient.refreshMetadata([config.ACCOUNTING_TOPIC], function (error) {
    log.debug('@refreshMetadata Error:', error)
  })
})

kafkaProducer.on('error', function (error) {
  log.error('Producer preparation failed:', error)
})

module.exports = function (Usage) {

  Usage.calculateUsage = async (sessionId, usage) => {
    let {upload, download, sessionTime} = usage
    const previewsUsage = await Usage.getUsageFromCache(sessionId)
    if (previewsUsage) {
      upload = upload - previewsUsage.upload
      download = download - previewsUsage.download
      sessionTime = sessionTime - previewsUsage.sessionTime
    }
    return {upload, download, sessionTime}
  }

  Usage.getUsage = async (startDate, endDate, ctx) => {
    var businessId = ctx.currentUserId
    const result = await db.getBusinessUsage(businessId,startDate,endDate);
    return result;
  }

  Usage.remoteMethod('getUsage', {
    description: 'Get usage report.',
    accepts: [
      {
        arg: 'startDate',
        type: 'number',
        required: true,
        description: 'Start Date',
      },
      {
        arg: 'endDate',
        type: 'number',
        required: true,
        description: 'End Date',
      },
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    returns: {root: true}
  })

  Usage.cacheUsage = function (usage) {
    return Q.promise((resolve, reject) => {
      redisClient.set(
        usage.sessionId,
        JSON.stringify(usage),
        'EX',
        3600
        , function (error) {
          if (error) {
            log.error('failed to cache usage', error)
            throw new Error(error)
          }
          return resolve()
        })
    })
  }

  Usage.getUsageFromCache = function (sessionId) {
    return Q.promise((resolve, reject) => {
      redisClient.get(sessionId, (error, usage) => {
        if (error) {
          log.error(`failed to get usage from cache by id: ${sessionId}`)
          throw new Error(error)
        }
        if (!usage) {
          log.warn('previews session is empty');
          return resolve()
        }
        return resolve(JSON.parse(usage))
      })
    })
  }

  // Usage.getBusinessUsageReport = function (
  //   startDate,
  //   endDate,
  //   businessId,
  //   offset,
  //   intervalMili,
  //   monthDays
  // ) {
  //   return Q.Promise(function (resolve, reject) {
  //
  //     offset = -offset * config.AGGREGATE.HOUR_MILLISECONDS
  //     log.debug('@getTrafficUsage from elastic')
  //     aggregate
  //       .getUniqueSessionCount(businessId, startDate, endDate)
  //       .then(function (sessionCount) {
  //         if (sessionCount < config.DEFAULT_AGGREGATION_SIZE) {
  //           sessionCount = config.DEFAULT_AGGREGATION_SIZE
  //         }
  //         aggregate
  //           .getMemberTrafficUsageReport(
  //             startDate,
  //             endDate,
  //             businessId,
  //             offset,
  //             intervalMili,
  //             sessionCount
  //           )
  //           .then(function (memberResult) {
  //             var response = {date: [], download: [], upload: []}
  //             monthDays = monthDays || []
  //             if (monthDays.length === 0) {
  //               // calculate daily interval docs
  //               for (var i = 0; i < memberResult.length; i++) {
  //                 response.date[i] = memberResult[i].key
  //                 response.download[i] = utility
  //                   .toMByte(memberResult[i].download.value)
  //                   .toFixed(0)
  //                 response.upload[i] = utility
  //                   .toMByte(memberResult[i].upload.value)
  //                   .toFixed(0)
  //               }
  //             } else {
  //               // sum of persian month days
  //               var days = 0
  //               var daysCounter = 0
  //               for (var month in monthDays) {
  //                 var downloads = 0
  //                 var uploads = 0
  //                 days += monthDays[month]
  //                 for (daysCounter; daysCounter < days; daysCounter++) {
  //                   downloads += memberResult[daysCounter].download.value
  //                   uploads += memberResult[daysCounter].upload.value
  //                 }
  //                 // add calculated month to response
  //                 response.date[month] = memberResult[days].key
  //                 response.download[month] = utility
  //                   .toMByte(downloads)
  //                   .toFixed(2)
  //                 response.upload[month] = utility
  //                   .toMByte(uploads)
  //                   .toFixed(2)
  //               }
  //             }
  //             log.debug(
  //               'process of getting traffic usage info completed successfully' +
  //               JSON.stringify(response)
  //             )
  //             return resolve(response)
  //           })
  //           .fail(function (error) {
  //             log.error(error)
  //             return reject(error)
  //           })
  //       })
  //       .fail(function (error) {
  //         log.error(error)
  //         return reject(error)
  //       })
  //   })
  // }

  // Usage.getSessionUsage = function (sessionList) {
  //   return Q.Promise(function (resolve, reject) {
  //     var sessionReportFunc = []
  //     var ownersDictionary = {}
  //     for (var i = 0; i < sessionList.length; i++) {
  //       var singleSession = sessionList[i]
  //       var sessionId = singleSession.id
  //       ownersDictionary[sessionId] = singleSession
  //       sessionReportFunc.push(
  //         aggregate.getSessionsReport(
  //           singleSession.creationDate,
  //           singleSession.memberId,
  //           sessionId
  //         )
  //       )
  //     }
  //     // get report info from getSessionsReport aggregation
  //     Q.all(sessionReportFunc)
  //       .then(function (tasksResult) {
  //         //log.debug( '@getSessionsReport', tasksResult )
  //         var report = []
  //         for (var n = 0; n < tasksResult.length; n++) {
  //           var reportResult = tasksResult[n]
  //           var sessionReportList = reportResult.sessionReports
  //           var sessionCreationDate = reportResult.fromDate
  //           var reportSessionId = reportResult.sessionId
  //           var res = ownersDictionary[reportSessionId]
  //           for (var k = 0; k < sessionReportList.length; k++) {
  //             var sessionReport = sessionReportList[k]
  //             res.download = utility
  //               .toMByte(sessionReport.download.value)
  //               .toFixed(0)
  //             res.upload = utility
  //               .toMByte(sessionReport.upload.value)
  //               .toFixed(0)
  //             res.sessionTime = (
  //               (new Date().getTime() - sessionCreationDate) /
  //               60000
  //             ).toFixed(0)
  //           }
  //           report.push(res)
  //         }
  //         return resolve({data: report})
  //       })
  //       .fail(function (error) {
  //         log.error(error)
  //         return reject(error)
  //       })
  //   })
  // }
}
