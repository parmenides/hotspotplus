var Q = require('q')
var logger = require('./logger')
var log = logger.createLogger()


var redis = require('redis');
var redisClient = redis.createClient(
  process.env.REDIS_PORT,
  process.env.REDIS_HOST
);
var self = this;
/*

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
      redisClient.get(`sc_${theMethodName}`, function(error, a_method) {
        if (error) {
          log.error(error);
          return;
        }
        module.exports[theMethodName] = function() {
          log.debug(theMethodName);
          log.debug(arguments);
          return eval(`(${a_method}).apply(this,arguments)`);
          //return eval('(' + a_method + ').apply(this,arguments)');
        };
      });
    })(methods[i]);
  }
});
*/
