/**
 * Created by Payam on 11/11/18.
 */

require('date-utils');
var Q = require('q');

var logger = require('./modules/logger');
var aggregates = require('./modules/aggregates');

var log = logger.createLogger(
  'AccountingAggregatorService',
  process.env.LOG_DIR,
);
var CronJob = require('cron').CronJob;
log.debug('Accounting Aggregator Service Is Up...');

function mergeAll() {
  log.debug('@merge All');
  var mergeTasks = [];
  var MERGE_SEQUENCE = process.env.MERGE_SEQUENCE
    ? Number(process.env.MERGE_SEQUENCE)
    : 1;
  var cleaningStartTime = process.env.CLEANING_START_TIME_IN_MS
    ? Number(process.env.CLEANING_START_TIME_IN_MS)
    : new Date()
        .remove({ days: 4 })
        .clearTime()
        .getTime();
  var cleaningSpaceInDays = process.env.CLEANING_SPACE_IN_DAYS
    ? Number(process.env.CLEANING_SPACE_IN_DAYS)
    : 2;
  try {
    for (var i = 0; i < MERGE_SEQUENCE; i++) {
      var fromDate = new Date(cleaningStartTime);
      fromDate.add({ days: i * cleaningSpaceInDays });
      fromDate.clearTime();

      var toDate = new Date(fromDate);
      toDate.add({ days: cleaningSpaceInDays });
      toDate.clearTime();

      log.debug('startDate: ', fromDate);
      log.debug('endDate: ', toDate);
      log.debug('cleaningSpaceInDays: ', cleaningSpaceInDays);

      mergeTasks.push(
        (function(from, to) {
          return function() {
            return mergeAccounting(from, to);
          };
        })(fromDate, toDate),
      );
    }

    var mergeTasksResult = Q({});
    mergeTasks.forEach(function(f) {
      mergeTasksResult = mergeTasksResult.then(f);
    });

    mergeTasksResult
      .then(function() {
        log.info('all usage report merged.');
        return;
      })
      .fail(function(error) {
        log.error(error);
        return;
      });
  } catch (e) {
    log.error('Exception occurred');
    log.error(e);
  }
}

function mergeAccounting(fromDate, toDate) {
  return Q.Promise(function(resolve, reject) {
    try {
      aggregates
        .getAllSessions(fromDate.getTime(), toDate.getTime())
        .then(function(allSessionsIds) {
          var aggregateUsageTasks = [];
          log.debug('Sessions found:', allSessionsIds.length);
          allSessionsIds.forEach(function(sessionId) {
            aggregateUsageTasks.push(
              (function(scopedSessionId) {
                return function() {
                  return aggregates
                    .getAggregatedUsageBySessionId(scopedSessionId)
                    .then(function(result) {
                      var aggregatedResult = result.aggregatedResult;
                      var range = result.range;
                      return aggregates
                        .addAccountingDoc(aggregatedResult)
                        .then(function() {
                          return aggregates.deleteBySessionId(
                            range.fromDateInMs,
                            range.toDateInMs,
                            scopedSessionId,
                          );
                        });
                    });
                };
              })(sessionId),
            );
          });
          var usageReportTaskResult = Q({});
          aggregateUsageTasks.forEach(function(f) {
            usageReportTaskResult = usageReportTaskResult.then(f);
          });

          usageReportTaskResult
            .then(function() {
              log.debug('all usage report merged.');
              return resolve();
            })
            .fail(function(error) {
              log.error(error);
              return reject(error);
            });
        });
    } catch (e) {
      log.error(e);
      return reject(e);
    }
  });
}

var mergeJob = new CronJob({
  cronTime: process.env.ACCOUNTING_CRON_JOB_TIME,
  onTick: function() {
    mergeAll();
  },
  start: true,
  timeZone: 'Asia/Tehran',
});
mergeJob.start();
log.debug(
  'Runner Service Scheduled to run merge: ',
  mergeJob.running,
  ' : ',
  process.env.ACCOUNTING_CRON_JOB_TIME,
);

process.on('uncaughtException', function(error) {
  console.error('Something bad happened here....');
  console.error(error);
  console.error(error.stack);
  log.error(error);
  log.error(error.stack);
});
