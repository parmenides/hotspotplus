var config = require('../modules/config');
var Q = require('q');
var logger = require('../modules/logger');
var log = logger.createLogger();
var needle = require('needle');

module.exports = function(app) {
  var User = app.models.User;
  var Role = app.models.Role;

  addDefaultRolesAndUsers();
  addElasticIndex();

  function addElasticIndex() {
    var chargeMapping = {
      mappings: {
        charge: {
          properties: {
            timestamp: { type: 'date' },
            licenseId: { type: 'keyword' },
            licenseProfileId: { type: 'keyword' },
            forThe: { type: 'keyword' },
            type: { type: 'keyword' },
            amount: { type: 'integer' },
            date: { type: 'long' }
          }
        }
      }
    };
    needle.put(
      config.ELASTIC_LICENSE_CHARGE_MAIN_CONTEXT,
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
  }

  function addDefaultRolesAndUsers() {
    log.debug('all roles added');
    addOrLoadRole(config.ROLES.ADMIN)
      .then(function() {
        addOrLoadRole(config.ROLES.LICENSE_ROLE)
          .then(function() {
            addOrLoadUser(
              config.ADMIN_USERNAME,
              config.ADMIN_PASSWORD,
              config.ADMIN_ROLES
            );
          })
          .fail(function(error) {
            log.error('failed to add role', error);
          });
      })
      .fail(function(error) {
        log.error('failed to add role', error);
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
        email: username + '@' + config.ROOT_USERS_DOMAIN
      };

      if (!user) {
        log.debug('ROOT', user);
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
};
