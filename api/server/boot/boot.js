var config = require('../modules/config');
var Q = require('q');
var logger = require('../modules/logger');
var needle = require('needle');
var utility = require('../modules/utility');
var redis = require('redis');
const db = require('../modules/db.factory')

var redisLicenseReload = redis.createClient(
  process.env.REDIS_PORT,
  process.env.REDIS_IP
);


module.exports = async function (app) {
  var User = app.models.User;
  var Business = app.models.Business;
  var Role = app.models.Role;
  var SystemConfig = app.models.SystemConfig;
  var log = logger.createLogger();

  SystemConfig.getConfig();
  addDefaultRolesAndUsers();
  await db.init()

  log.debug('App started');
  utility.sendMessage('Server started', { fileName: 'boot.js' });

  function addDefaultRolesAndUsers() {
    Q.all([
      addOrLoadRole(config.ROLES.OPERATOR),
      addOrLoadRole(config.ROLES.ADMIN),
      addOrLoadRole(config.ROLES.SERVICEMAN),
      addOrLoadRole(config.ROLES.RESELLER),
      addOrLoadRole(config.ROLES.NETWORKADMIN),
      addOrLoadRole(config.ROLES.NAS),
      addOrLoadRole(config.ROLES.HOTSPOTMEMBER),
      addOrLoadRole(config.ROLES.SERVICEPROVIDER),
      addOrLoadRole(config.ROLES.CUSTOMER)
    ]).then(function(result) {
      log.debug('all roles added');
      addOrLoadUser(
        config.DEFAULTS.SERVICE_MAN_USERNAME,
        config.DEFAULTS.SERVICE_MAN_PASSWORD,
        config.DEFAULTS.SERVICE_MAN_ROLES
      );
      addOrLoadUser(
        config.DEFAULTS.ADMIN_USERNAME,
        config.DEFAULTS.ADMIN_PASS,
        config.DEFAULTS.ADMIN_ROLES
      );
    }).fail((error)=>{
      log.error(error)
    });
  }

  function addOrLoadUser(username, password, roles) {
    User.findOne({ where: { username: username } }, function(error, user) {
      if (error) {
        log.error(error);
        return;
      }

      var superuser = {
        username: username,
        active: true,
        password: password,
        email: username + '@' + config.DEFAULTS.USERS_DOMAIN
      };
      if (!user) {
        User.create(superuser, function(error, user) {
          if (error) {
            log.error(error);
            return;
          }
          for (var i = 0; i < roles.length; i++) {
            var roleName = roles[i];
            Role.findOne({ where: { name: roleName } }, function(error, role) {
              if (error) {
                log.error(error);
                return;
              }
              if (!role) {
                log.error('no such a role to assign: ', roleName);
                return;
              }
              var roleMapping = { principalType: 'USER', principalId: user.id };
              role.principals.create(roleMapping, function(error) {
                if (error) {
                  log.error('failed to assign role', error);
                  return;
                }
                log.debug('Role added to user, ', username, ' ', role);
              });
            });
          }
        });
      } else {
        user.updateAttributes(superuser, function(error, updated) {
          if (error) {
            log.error(error);
            return;
          }
          log.debug('user updated');
        });
      }
    });
  }

  function addOrLoadRole(roleName) {
    log.debug('Going to check role:', roleName);
    return Q.Promise(function(resolve, reject) {
      Role.findOne({ where: { name: roleName } }, function(error, role) {
        if (error) {
          return reject(error);
        }
        if (!role) {
          log.debug('Going to Add role:', roleName);
          Role.create({ name: roleName }, function(error, createdRole) {
            if (error) {
              log.error('failed to create role', error);
              return reject(error);
            }
            log.debug('Role created ', roleName);
            return resolve(createdRole);
          });
        } else {
          log.debug('Role exist so no need to re add', role);
          return resolve(role);
        }
      });
    });
  }

  /*function createElasticMapping() {
    var accountingMapping = {
      mappings: {
        usagereport: {
          properties: {
            timestamp: { type: 'date' },
            businessId: { type: 'keyword' },
            memberId: { type: 'keyword' },
            sessionId: { type: 'keyword' },
            nasId: { type: 'keyword' },
            mac: { type: 'keyword' },
            creationDate: { type: 'long' },
            sessionTime: { type: 'long' },
            totalUsage: { type: 'long' },
            download: { type: 'long' },
            upload: { type: 'long' }
          }
        }
      }
    };
    needle.put(
      config.ELASTIC_ACCOUNTING_MAIN_CONTEXT,
      accountingMapping,
      { json: true },
      function(error, result, body) {
        if (error) {
          log.error(error);
          return;
        }
        log.debug(
          'accounting usagereport mapping created',
          config.ELASTIC_ACCOUNTING_MAIN_CONTEXT,
          body
        );
      }
    );

    /!*needle.put(
      config.ELASTIC_SESSION_REPORT_MAIN_CONTEXT,
      {},
      { json: true },
      function(error, result, body) {
        if (error) {
          log.error('###############################');
          log.error(error);
          return;
        }
        log.debug(
          'sessionLog mapping created',
          config.ELASTIC_SESSION_REPORT_MAIN_CONTEXT,
          body
        );
      }
    );*!/

    var chargeMapping = {
      mappings: {
        charge: {
          properties: {
            timestamp: { type: 'date' },
            businessId: { type: 'keyword' },
            forThe: { type: 'keyword' },
            type: { type: 'keyword' },
            amount: { type: 'integer' },
            date: { type: 'long' }
          }
        }
      }
    };
    needle.put(
      config.ELASTIC_CHARGE_MAIN_CONTEXT,
      chargeMapping,
      { json: true },
      function(error, result, body) {
        if (error) {
          log.error(error);
          return;
        }
        log.info('charge mapping mapping created', body);
      }
    );

   /!* var netflowMapping = {
      mappings: {
        report: {
          properties: {
            username: { type: 'keyword' },
            mac: { type: 'keyword' },
            host: { type: 'keyword' },
            businessId: { type: 'keyword' },
            nasId: { type: 'keyword' },
            sourcePort: { type: 'keyword' },
            destinationPort: { type: 'keyword' },
            groupIdentityId: { type: 'keyword' },
            groupIdentity: { type: 'keyword' },
            groupIdentityType: { type: 'keyword' },
            sourceIp: { type: 'ip' },
            destinationIp: { type: 'ip' },
            creationDate: { type: 'date' },
            flowDate: { type: 'date' },
            srcGeoIp: {
              properties: {
                location: {
                  type: 'geo_point'
                },
                timezone: { type: 'keyword' },
                city_name: { type: 'keyword' },
                country_name: { type: 'keyword' }
              }
            },
            dstGeoIp: {
              properties: {
                location: {
                  type: 'geo_point'
                },
                timezone: { type: 'keyword' },
                city_name: { type: 'keyword' },
                country_name: { type: 'keyword' }
              }
            },
            hostGeoIp: {
              properties: {
                location: {
                  type: 'geo_point'
                },
                timezone: { type: 'keyword' },
                city_name: { type: 'keyword' },
                country_name: { type: 'keyword' }
              }
            }
          }
        }
      }
    };
    needle.put(
      config.ELASTIC_NETFLOW_MAIN_CONTEXT,
      netflowMapping,
      { json: true },
      function(error, result, body) {
        if (error) {
          log.error(error);
          return;
        }
        log.info('netflow mapping mapping created', body);
      }
    );

    var syslogMapping = {
      mappings: {
        report: {
          properties: {
            timestamp: { type: 'date' },
            nasIp: { type: 'keyword' },
            path: { type: 'keyword' },
            query: { type: 'keyword' },
            params: { type: 'keyword' },
            message: { type: 'keyword' },
            protocol: { type: 'keyword' },
            memberIp: { type: 'keyword' },
            method: { type: 'keyword' },
            url: { type: 'keyword' },
            domain: { type: 'keyword' },
            hostGeoIp: {
              properties: {
                location: {
                  type: 'geo_point'
                },
                timezone: { type: 'keyword' },
                city_name: { type: 'keyword' },
                country_name: { type: 'keyword' }
              }
            }
          }
        }
      }
    };
    needle.put(
      config.ELASTIC_SYSLOG_MAIN_CONTEXT,
      syslogMapping,
      { json: true },
      function(error, result, body) {
        if (error) {
          log.error(error);
          return;
        }
        log.info('syslog mapping mapping created', body);
      }
    );*!/
  }*/

  //radius.startRadius ();
  utility.installRaven();
  redisLicenseReload.on('message', function() {
    process.exit(1);
  });
  redisLicenseReload.subscribe('LICENSE_RELOAD');
};
