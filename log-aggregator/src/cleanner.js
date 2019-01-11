/**
 * Created by Payam on 11/11/18.
 */

require('date-utils');
var logger = require('./modules/logger');
var log = logger.createLogger();
var CronJob = require('cron').CronJob;
var aggregate = require('./modules/aggregates');
log.debug('Doc Clean Up Service Is Up...');

function cleanNetflowDoc() {
  if (process.env.NETFLOW_OLD_DOC_CLEANUP_ENABLED !== 'true') {
    log.debug('netflow doc clean up is disabled');
    return;
  }
  var from = new Date();
  from.remove({ years: 2 });
  from.clearTime();
  var to = new Date();
  to.remove({ months: 7 });
  to.clearTime();

  aggregate
    .cleanupDoc('netflow', from.getTime(), to.getTime())
    .then(function(result) {
      log.info('netflow docs cleanup result:', result);
    })
    .fail(function(error) {
      log.error(error);
      throw error;
    });
}

function cleanSyslogDoc() {
  if (process.env.SYSLOG_OLD_DOC_CLEANUP_ENABLED !== 'true') {
    log.debug('syslog doc clean up is disabled');
    return;
  }
  var from = new Date();
  from.remove({ years: 2 });
  from.clearTime();
  var to = new Date();
  to.remove({ months: 7 });
  to.clearTime();

  aggregate
    .cleanupDoc('syslog', from.getTime(), to.getTime())
    .then(function(result) {
      log.info('syslog docs cleanup result:', result);
    })
    .fail(function(error) {
      log.error(error);
      throw error;
    });
}

function cleanAccountingDoc() {
  if (process.env.ACCOUNTING_OLD_DOC_CLEANUP_ENABLED !== 'true') {
    log.debug('acc doc clean up is disabled');
    return;
  }
  var from = new Date();
  from.remove({ years: 2 });
  from.clearTime();
  var to = new Date();
  to.remove({ months: 7 });
  to.clearTime();

  aggregate
    .cleanupDoc('accounting', from.getTime(), to.getTime())
    .then(function(result) {
      log.info('accounting docs cleanup result:', result);
    })
    .fail(function(error) {
      log.error(error);
      throw error;
    });
}

var accountingDocCleanupJob = new CronJob({
  cronTime: process.env.ACCOUNTING_OLD_DOC_CLEANUP,
  onTick: function() {
    cleanAccountingDoc();
  },
  start: true,
  timeZone: 'Asia/Tehran',
});
accountingDocCleanupJob.start();
log.debug(
  'Runner Service Scheduled to run ACCOUNTING_OLD_DOC_CLEANUP: ',
  accountingDocCleanupJob.running,
  ' : ',
  process.env.ACCOUNTING_OLD_DOC_CLEANUP,
);

var netflowCleanUpJob = new CronJob({
  cronTime: process.env.NETFLOW_OLD_DOC_CLEANUP,
  onTick: function() {
    cleanNetflowDoc();
  },
  start: true,
  timeZone: 'Asia/Tehran',
});
netflowCleanUpJob.start();
log.debug(
  'Runner Service Scheduled to run NETFLOW_OLD_DOC_CLEANUP: ',
  netflowCleanUpJob.running,
  ' : ',
  process.env.NETFLOW_OLD_DOC_CLEANUP,
);

var syslogCleanUpJob = new CronJob({
  cronTime: process.env.SYSLOG_OLD_DOC_CLEANUP,
  onTick: function() {
    cleanSyslogDoc();
  },
  start: true,
  timeZone: 'Asia/Tehran',
});
syslogCleanUpJob.start();
log.debug(
  'Runner Service Scheduled to run SYSLOG_OLD_DOC_CLEANUP: ',
  syslogCleanUpJob.running,
  ' : ',
  process.env.SYSLOG_OLD_DOC_CLEANUP,
);

process.on('uncaughtException', function(error) {
  console.error('Something bad happened here....');
  console.error(error);
  console.error(error.stack);
  log.error(error);
  log.error(error.stack);
});
