/**
 * Created by payamyousefi on 2/13/16.
 */

require('date-utils');
var config = require('./config');
var Q = require('q');
var needle = require('needle');
var utility = require('./modules/utility');
var auth = require('./modules/auth');
var logger = require('./modules/logger');
var log = logger.createLogger();
var CronJob = require('cron').CronJob;

var pingService = (module.exports.pingService = function() {
  return Q.Promise(function(resolve, reject) {
    needle.get('http://myip.dnsomatic.com/', function(error, response) {
      if (error) {
        return reject();
      }
      var ip = response.body;
      utility
        .getSystemUuid(config.SYSTEM_ID_PATH)
        .then(function(systemUuid) {
          auth
            .loginToLicenseServer(config.LICENSE_LOGIN)
            .then(function(authResult) {
              var token = authResult.token;
              needle.post(
                config.CONFIG_SERVER_PING.replace('{token}', token),
                {
                  ip: ip,
                  systemUuid: systemUuid,
                },
                { rejectUnauthorized: true, json: true },
                function(error, result, body) {
                  if (error) {
                    log.error(error);
                    return reject();
                  }
                  log.debug('Ping Status Code', result.statusCode);
                  return resolve();
                },
              );
            })
            .fail(function(error) {
              log.error(error);
              return reject(new Error('failed to authenticate'));
            });
        })
        .fail(function(error) {
          log.error(error);
          return reject(error);
        });
    });
  });
});
pingService();
var job = new CronJob({
  cronTime: config.PING_JOB_SCHEDULER,
  onTick: function() {
    pingService();
  },
  start: true,
  timeZone: 'Asia/Tehran',
});
job.start();
log.debug('Ping service: ', job.running);
