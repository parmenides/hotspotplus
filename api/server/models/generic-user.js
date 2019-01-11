var logger = require('../modules/logger');
var Q = require('q');
var loopback = require('loopback');
var Generic = require('./generic');
module.exports = function(GenericUser) {
  GenericUser.getLogger = function() {
    return logger.createLogger();
  };
  var log = GenericUser.getLogger();

  GenericUser.getCurrentUserId = function(ctx) {
    const token = ctx && ctx.accessToken;
    const userId = token && token.userId;
    return userId;
  };

  GenericUser.createOptionsFromRemotingContext = function(ctx) {
    var base = this.base.createOptionsFromRemotingContext(ctx);
    base.currentUserId = base.accessToken && base.accessToken.userId;
    return base;
  };

  GenericUser.addRole = function(userId, roleName) {
    return Q.Promise(function(resolve, reject) {
      if (_.isUndefined(userId)) {
        return reject('userId is empty');
      }
      app.models.Role.findOne({ where: { name: roleName } }, function(
        error,
        role,
      ) {
        if (error) {
          return reject(error);
        }
        if (!role) {
          return reject(
            roleName + ' role not found, delete user and add it again',
          );
        }
        var roleMapping = {
          principalType: app.models.RoleMapping.USER,
          principalId: userId,
        };
        role.principals.create(roleMapping, function(error, result) {
          if (error) {
            return reject(error);
          }
          return resolve(result);
        });
      });
    });
  };

  // todo change password does not work for user/returns 401
  /* Remote method to change user credential or generate random password */
  GenericUser.changePassword = function(
    userId,
    oldPassword,
    newPassword,
    setClearTextPassword,
    model,
  ) {
    return Q.Promise(function(resolve, reject) {
      model.findOne({ where: { id: userId } }, function(error, user) {
        if (error) {
          return reject('user not found');
        }
        model.login(
          { username: user.username, password: oldPassword },
          function(error, result) {
            if (error) {
              return reject('Invalid password');
            }
            var userUpdates = {};
            userUpdates.pashword = newPassword;
            model.set_Profile_Password(
              userUpdates,
              newPassword,
              setClearTextPassword,
            );
            user.updateAttributes(userUpdates, function(error, result) {
              if (error) {
                return reject(error);
              }
              return resolve(result);
            });
          },
        );
      });
    });
  };
};
