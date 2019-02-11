/** Created by rezanazari on 8/31/16. ... */

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

redisClient.get('methodNames', function(error, methods) {
  log.debug('Methods: ', methods);
  if (error || !methods) {
    log.error('failed to load methods');
    return;
  }
  methods = JSON.parse(methods);
  for (let i in methods) {
    (function(theMethodName) {
      log.debug('TheMethodName: ', theMethodName);
      redisClient.get('sc_' + theMethodName, function(error, a_method) {
        if (error) {
          log.error(error);
          return;
        }
        module.exports[theMethodName] = function() {
          return eval('(' + a_method + ').apply(this,arguments)');
        };
      });
    })(methods[i]);
  }
});
