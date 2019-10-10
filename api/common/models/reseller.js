'use strict';
const logger = require('../../server/modules/logger');
const app = require('../../server/server');
const config = require('../../server/modules/config');
const utility = require('../../server/modules/utility');
const smsModule = require('../../server/modules/sms');
const Q = require('q');
const db = require('../../server/modules/db.factory');

module.exports = function(Reseller) {
  const log = logger.createLogger();

  Reseller.addResellerCommission = function(resellerId, businessId, price) {
    return Q.Promise(function(resolve, reject) {
      const Reseller = app.models.Reseller;
      const Charge = app.models.Charge;
      Reseller.findById(resellerId, function(error, reseller) {
        if (error) {
          log.error(error);
          return reject(error);
        }

        const commission =
          price *
          (reseller.commissionRate ||
            config.SERVICES.RESELLERS_COMMISSION_RATE);
        log.debug({
          businessId: resellerId,
          type: config.RESELLER_COMMISSION_CHARGE,
          amount: commission,
          forThe: resellerId + ':' + businessId,
          date: new Date().getTime(),
        });
        Charge.addCharge({
          businessId: resellerId,
          type: config.RESELLER_COMMISSION_CHARGE,
          amount: commission,
          forThe: resellerId + ':' + businessId,
          date: new Date().getTime(),
        });
        return resolve();
      });
    });
  };

  Reseller.getBalance = function(resellerId) {
    log.debug('@getProfileBalance');
    return Q.Promise(function(resolve, reject) {
      db.getProfileBalance(resellerId)
        .then(function(balance) {
          log.debug(balance);
          return resolve(balance);
        })
        .fail(function(error) {
          log.error(error);
          return reject(error);
        });
    });
  };

  Reseller.remoteMethod('getBalance', {
    description: 'Load business list',
    accepts: [
      {
        arg: 'resellerId',
        type: 'string',
        required: true,
      },
    ],
    returns: {root: true},
  });

  Reseller.loadBusiness = function(options) {
    const Business = app.models.Business;
    return Q.Promise(function(resolve, reject) {
      if (!options.where || !options.where.resellerId) {
        log.error('invalid query: ', options);
        return reject('invalid query');
      }
      Business.find(options, function(error, businesses) {
        if (error) {
          log.error(error);
          return reject(error);
        }
        return resolve({businesses: businesses, total: businesses.length});
      });
    });
  };

  Reseller.remoteMethod('loadBusiness', {
    description: 'Load business list',
    accepts: [
      {
        arg: 'options',
        type: 'object',
        required: true,
      },
    ],
    returns: {root: true},
  });

  Reseller.createBusiness = function(business) {
    const Business = app.models.Business;
    return Q.Promise(function(resolve, reject) {
      if (!business) {
        return reject('invalid args');
      }
      if (!business.resellerId) {
        return reject('invalid resellerId');
      }
      business.password = String(business.password);
      /* business.services = {
				id:               "economic",
				subscriptionDate: new Date ().getTime (),
				expiresAt:        (new Date ().addDays ( config.TRIAL_DAYS )).getTime (),
				duration:         1
			}; */
      try {
        log.debug('BIZ:  ', business);
        Business.create(business, function(error) {
          if (error) {
            log.error('@createBusiness by reseller', error);
            return reject(error);
          }
          return resolve({});
        });
      } catch (e) {
        log.error(e);
        return reject(e);
      }
    });
  };

  Reseller.remoteMethod('createBusiness', {
    description: 'create business by reseller',
    accepts: [
      {
        arg: 'business',
        type: 'object',
        required: true,
      },
    ],
    returns: {root: true},
  });

  Reseller.assignBusinessToReseller = function(businessId, resellerId) {
    const Business = app.models.Business;
    return Q.Promise(function(resolve, reject) {
      Business.findById(businessId).then(function(business) {
        const update = {
          resellerId: resellerId,
        };
        business.updateAttributes(update, function(error) {
          if (error) {
            log.error('@createBusiness by reseller', error);
            return reject(error);
          }
          return resolve({});
        });
      });
    });
  };

  Reseller.remoteMethod('assignBusinessToReseller', {
    description: 'assign business to reseller',
    accepts: [
      {
        arg: 'businessId',
        type: 'string',
        required: true,
      },
      {
        arg: 'resellerId',
        type: 'string',
        required: true,
      },
    ],
    returns: {root: true},
  });

  Reseller.findBusiness = function(resellerId, businessId, cb) {
    const Business = app.models.Business;
    if (!resellerId) {
      return cb('invalid resellerId');
    }
    if (!businessId) {
      return cb('invalid businessId');
    }
    Business.findOne(
      {where: {and: [{resellerId: resellerId}, {id: businessId}]}},
      function(error, result) {
        if (error) {
          log.error(error);
          return cb(error);
        }
        return cb(null, result);
      }
    );
  };

  Reseller.remoteMethod('findBusiness', {
    description: 'Find business',
    accepts: [
      {
        arg: 'resellerId',
        type: 'string',
        required: true,
      },
      {
        arg: 'businessId',
        type: 'string',
        required: true,
      },
    ],
    returns: {root: true},
  });

  Reseller.updateBusiness = function(businessAttributes, cb) {
    const Business = app.models.Business;
    if (!businessAttributes) {
      return cb('invalid businessAttributes');
    }
    if (!businessAttributes.resellerId) {
      return cb('invalid resellerId');
    }
    delete businessAttributes.services;
    Business.findOne(
      {
        where: {
          and: [
            {resellerId: businessAttributes.resellerId},
            {id: businessAttributes.id},
          ],
        },
      },
      function(error, business) {
        if (error) {
          log.error(error);
          return cb(error);
        }
        business.updateAttributes(businessAttributes, function(error) {
          if (error) {
            log.error(error);
            return cb(error);
          }
          return cb(null);
        });
      }
    );
  };

  Reseller.remoteMethod('updateBusiness', {
    description: 'Update business',
    accepts: [
      {
        arg: 'business',
        type: 'object',
        required: true,
      },
    ],
    returns: {root: true},
  });

  Reseller.removeBusiness = function(resellerId, businessId, cb) {
    const Business = app.models.Business;

    if (!resellerId) {
      return cb('invalid resellerId');
    }
    if (!businessId) {
      return cb('invalid businessId');
    }
    Business.findOne(
      {where: {and: [{resellerId: resellerId}, {id: businessId}]}},
      function(error, Business) {
        if (error) {
          log.error(error);
          return cb(error);
        }
        Business.destroy({id: businessId}, function(err, res) {
          if (err) {
            log.error(error);
            return cb(error);
          }
          log.debug('business deleted');
          return cb(null, res);
        });
      }
    );
  };

  Reseller.remoteMethod('removeBusiness', {
    description: 'Remove business',
    accepts: [
      {
        arg: 'resellerId',
        type: 'string',
        required: true,
      },
      {
        arg: 'businessId',
        type: 'string',
        required: true,
      },
    ],
    returns: {root: true},
  });

  Reseller.assignPackageToReseller = function(
    resellerId,
    allowedOnlineUsers,
    durationInMonths
  ) {
    return Q.Promise(function(resolve, reject) {
      if (!resellerId) {
        return reject('invalid resellerId');
      }
      if (!allowedOnlineUsers) {
        return reject('invalid onlineUsers');
      }
      if (!durationInMonths) {
        return reject('invalid durationInMonths');
      }

      Reseller.findById(resellerId, function(error, reseller) {
        reseller.updateAttributes(
          {
            subscriptionDate: new Date().getTime(),
            durationInMonths: durationInMonths,
            allowedOnlineUsers: allowedOnlineUsers,
          },
          function(error) {
            if (error) {
              log.error(error);
              return reject(error);
            }
            smsModule.send({
              token1: allowedOnlineUsers,
              token2: reseller.fullName,
              token3: durationInMonths,
              mobile: reseller.mobile,
              template: config.RESELLER_PURCHASE_PACKAGE_CONFIRMED,
            });
            return resolve();
          }
        );
      });
    });
  };

  Reseller.observe('after save', function(ctx, next) {
    const Role = app.models.Role;
    if (ctx.isNewInstance) {
      const id = ctx.instance.id;
      Role.findOne({where: {name: config.ROLES.RESELLER}}, function(
        error,
        role
      ) {
        if (error) {
          log.error(
            'failed to load ' +
              config.ROLES.NETWORKADMIN +
              ' for role assignment',
            error
          );
          next();
        }
        if (!role) {
          return next('failed to load role');
        }
        const roleMapping = {principalType: 'USER', principalId: id};
        role.principals.create(roleMapping, function(error, result) {
          if (error) {
            log.error('failed to assign role to business', error);
          }
          next();
        });
      });
    } else {
      next();
    }
  });

  Reseller.observe('before save', function(ctx, next) {
    if (ctx.instance) {
      updateModel(ctx.instance);
    } else if (ctx.data) {
      updateModel(ctx.data);
    }

    function updateModel(reseller) {
      if (reseller.mobile) {
        reseller.mobile = utility.verifyAndTrimMobile(reseller.mobile);
        if (!reseller.mobile) {
          return next('invalid mobile: ', reseller.mobile);
        }
      }
      if (reseller.password) {
        reseller.passwordText = utility.encrypt(
          reseller.password,
          config.ENCRYPTION_KEY
        );
      }
    }

    // Check if business is created
    if (ctx.instance && ctx.isNewInstance) {
      ctx.instance.username = ctx.instance.mobile;
      ctx.instance.creationDate = new Date().getTime();
      ctx.instance.subscriptionDate = new Date().getTime();
      ctx.instance.active = ctx.instance.active || true;
      ctx.instance.allowedOnlineUsers =
        ctx.instance.allowedOnlineUsers || config.DEFAULT_RESELLER_ONLINE_USERS;
      ctx.instance.durationInMonths =
        ctx.instance.durationInMonths ||
        config.DEFAULT_RESELLER_DURATION_MONTHS;
      ctx.instance.planType =
        ctx.instance.planType || config.DEFAULT_RESELLER_PLAN_TYPE;
    }
    next();
  });

  Reseller.observe('before delete', function(ctx, next) {
    if (ctx.where && ctx.where.id && ctx.where.id.inq[0]) {
      const resellerId = ctx.where.id.inq[0];
      const Business = app.models.Business;
      log.debug('@Reseller before delete');
      Business.destroyAll({resellerId: resellerId}, function(error, res) {
        if (error) {
          log.error(error);
          return next(error);
        }
        log.debug('Businesses deleted');
      });
    }
    next();
  });

  Reseller.countResellersActiveUsers = function(resellerId) {
    const Business = app.models.Business;
    return Q.Promise(function(resolve, reject) {
      Business.find(
        {
          where: {
            resellerId: resellerId,
          },
        },
        function(error, businesses) {
          if (error) {
            log.error(error);
            return reject(error);
          }

          let numberOfActiveBusiness = 0;
          for (const i in businesses) {
            const biz = businesses[i];
            const services = biz.services;
            if (services && services.id !== 'free') {
              const expires = new Date(services.expiresAt);
              const now = new Date();
              if (now.isBefore(expires)) {
                numberOfActiveBusiness++;
              }
            }
          }
          return resolve({count: numberOfActiveBusiness});
        }
      );
    });
  };
  Reseller.remoteMethod('countResellersActiveUsers', {
    accepts: [
      {
        arg: 'resellerId',
        type: 'string',
        required: true,
      },
    ],
    returns: {root: true},
  });
};
