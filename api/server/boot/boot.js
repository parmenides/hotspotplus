const config = require('../modules/config')
const Q = require('q')
const logger = require('../modules/logger')
const utility = require('../modules/utility')
//const redis = require('redis');
const db = require('../modules/db.factory')
/*
const redisLicenseReload = redis.createClient(
  process.env.REDIS_PORT,
  process.env.REDIS_IP
);*/

module.exports = async function (app) {
  const User = app.models.User
  const Role = app.models.Role
  const log = logger.createLogger()

  addDefaultRolesAndUsers()

  try {
    await db.init();
  } catch (error) {
    log.error('failed to init database', error);
  }

  log.debug('App started')

  function addDefaultRolesAndUsers () {
    Q.all([
      addOrLoadRole(config.ROLES.OPERATOR),
      addOrLoadRole(config.ROLES.ADMIN),
      addOrLoadRole(config.ROLES.RESELLER),
      addOrLoadRole(config.ROLES.NETWORKADMIN),
      addOrLoadRole(config.ROLES.NAS),
      addOrLoadRole(config.ROLES.HOTSPOTMEMBER),
      addOrLoadRole(config.ROLES.SERVICEPROVIDER),
      addOrLoadRole(config.ROLES.CUSTOMER),
    ]).then(function (result) {
      log.debug('all roles added')
      addOrLoadUser(
        config.DEFAULTS.ADMIN_USERNAME,
        config.DEFAULTS.ADMIN_PASS,
        config.DEFAULTS.ADMIN_ROLES
      )
    }).fail((error) => {
      log.error(error)
    })
  }

  function addOrLoadUser (username, password, roles) {
    User.findOne({where: {username: username}}, function (error, user) {
      if (error) {
        log.error(error)
        return
      }

      const superuser = {
        username: username,
        active: true,
        password: password,
        email: username + '@' + config.DEFAULTS.USERS_DOMAIN,
      }
      if (!user) {
        User.create(superuser, function (error, user) {
          if (error) {
            log.error(error)
            return
          }
          for (let i = 0; i < roles.length; i++) {
            var roleName = roles[i]
            Role.findOne({where: {name: roleName}}, function (error, role) {
              if (error) {
                log.error(error)
                return
              }
              if (!role) {
                log.error('no such a role to assign: ', roleName)
                return
              }
              const roleMapping = {principalType: 'USER', principalId: user.id}
              role.principals.create(roleMapping, function (error) {
                if (error) {
                  log.error('failed to assign role', error)
                  return
                }
                log.debug('Role added to user, ', username, ' ', role)
              })
            })
          }
        })
      } else {
        user.updateAttributes(superuser, function (error, updated) {
          if (error) {
            log.error(error)
            return
          }
          log.debug('user updated')
        })
      }
    })
  }

  function addOrLoadRole (roleName) {
    log.debug('Going to check role:', roleName)
    return Q.Promise(function (resolve, reject) {
      Role.findOne({where: {name: roleName}}, function (error, role) {
        if (error) {
          return reject(error)
        }
        if (!role) {
          log.debug('Going to Add role:', roleName)
          Role.create({name: roleName}, function (error, createdRole) {
            if (error) {
              log.error('failed to create role', error)
              return reject(error)
            }
            log.debug('Role created ', roleName)
            return resolve(createdRole)
          })
        } else {
          log.debug('Role exist so no need to re add', role)
          return resolve(role)
        }
      })
    })
  }
}
