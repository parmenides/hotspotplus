import Q from 'q';
import logger from './logger';
import needle from 'needle';
import utility from './utility';
import redis from 'redis';

const log = logger.createLogger();
const elasticURL =
  'http://' + process.env.ELASTIC_IP + ':' + process.env.ELASTIC_PORT;
const ELASTIC_ACCOUNTING_USAGE_SEARCH =
  elasticURL +
  process.env.ELASTIC_INDEX_PREFIX +
  'accounting/usagereport/{0}{1}';
const ELASTIC_ACCOUNTING_INDEX =
  elasticURL + process.env.ELASTIC_INDEX_PREFIX + 'accounting/usagereport';

const ELASTIC_CHARGE_SEARCH =
  elasticURL + process.env.ELASTIC_INDEX_PREFIX + 'charge/charge/_search';
const ELASTIC_LICENS_CHARGE_SEARCH =
  elasticURL +
  process.env.ELASTIC_INDEX_PREFIX +
  'licensecharge/licensecharge/_search';
const ELASTIC_SYSLOG_REPORT_INDEX =
  elasticURL + process.env.ELASTIC_INDEX_PREFIX + 'syslog/report';
const ELASTIC_NETFLOW_REPORT_INDEX =
  elasticURL + process.env.ELASTIC_INDEX_PREFIX + 'netflow/report';

const FOOT_TRAFFIC_PATH =
  elasticURL +
  process.env.ELASTIC_INDEX_PREFIX +
  'foottraffic/foottraffic/{0}{1}';
const MEMBER_PATH =
  elasticURL + process.env.ELASTIC_INDEX_PREFIX + 'member/member/{0}';
const minSignal = process.env.MIN_SIGNAL_STRENGTH_DEFAULT;
const DEVICE_VENDOR_NAME = process.env.DEVICE_VENDOR_NAME;
const DEVICE_VENDOR_PHRASE = process.env.DEVICE_VENDOR_PHRASE;
const partitionsNumber = process.env.NUM_PARTITIONS;
const redisClient = redis.createClient(
  process.env.REDIS_PORT,
  process.env.REDIS_HOST,
);
var self = this;

redisClient.get('methodNames', function(error, methods) {
  log.debug('Methods: ', methods);
  if (error || !methods) {
    log.error('failed to load methods');
    return;
  }
  methods = JSON.parse(methods);
  for (var i in methods) {
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
