const app = require('../../server/server');
const utility = require('../../server/modules/utility');
const Q = require('q');
const config = require('../../server/modules/config.js');
const logger = require('../../server/modules/logger');
const db = require('../../server/modules/db.factory');
const redis = require('redis');
const redisClient = redis.createClient(config.REDIS.PORT, config.REDIS.HOST);
const log = logger.createLogger();
const smsModule = require('../../server/modules/sms');
const createError = require('http-errors');
const radiusAdaptor = require('../../server/modules/radiusAdaptor');
const Radius_Messages = require('../../server/modules/radiusMessages');
const _ = require('underscore');
const querystring = require('querystring');
const radiusPod = require('../../server/modules/radiusDisconnectService');
const dust = require('dustjs-helpers');
const fs = require('fs');
const createHttpError = require('http-errors');
const hotspotMessages = require('../../server/modules/hotspotMessages');
const csvtojson = require('csvtojson');
const cacheManager = require('../../server/modules/cacheManager');
const Payment = require('../../server/modules/payment');

module.exports = function(Member) {
  Member.validatesUniquenessOf('uniqueUserId');

  Member.signIn = async function(businessId, username, password, routerType, nasId, pinCode, mac, cb) {
    log.debug('@Signin');
    const {member} = await Member.checkAuthorization(businessId, nasId, username);
    return cb(null, {
      ok: true,
      memberId: member.id,
      active: member.active,
      language: member.language,
    });
  };

  Member.remoteMethod('signIn', {
    accepts: [
      {
        arg: 'businessId',
        type: 'string',
        required: true,
      },
      {
        arg: 'username',
        type: 'string',
        required: true,
      },
      {
        arg: 'password',
        type: 'string',
        required: true,
      },
      {
        arg: 'routerType',
        type: 'string',
        required: true,
      },
      {
        arg: 'nasId',
        type: 'string',
        required: true,
      },
      {
        arg: 'pinCode',
        type: 'string',
      },
      {
        arg: 'mac',
        type: 'string',
      },
    ],
    returns: {root: true},
  });

  /* return array of new & old count of members base on interval date from aggregates.js
	 startDate: number
	 endDate: number
	 businessId: String
	 */
  Member.getMembersChart = function(
    startDate,
    endDate,
    businessId,
    offset,
    monthDays,
    cb
  ) {
    // todo: replace with db aggregates
    const fromDate = Number.parseInt(startDate);
    const toDate = Number.parseInt(endDate);
    offset = -offset * config.AGGREGATE.HOUR_MILLISECONDS;
    const oneDay = config.AGGREGATE.DAY_MILLISECONDS;
    const intervalMilli = oneDay;
    // todo re implement me
    cb(null, {message: 'needs to reimplement'});
    /*
        aggregate
          .newMemberInterval(fromDate, toDate, offset, intervalMilli, businessId)
          .then(function (newMembers) {
            var response = {date: [], verified: [], failed: []}
            if (monthDays.length == 0) {
              // calculate daily interval docs
              for (var newMember in newMembers) {
                response.date[newMember] = newMembers[newMember].key
                response.verified[newMember] = newMembers[newMember].verified
                response.failed[newMember] = newMembers[newMember].failed
              }
            } else {
              // sum of persian month days
              var days = 0
              var daysCounter = 0
              for (var month in monthDays) {
                var verifiedMember = 0
                var failedMember = 0
                days += monthDays[month]
                for (daysCounter; daysCounter < days; daysCounter++) {
                  verifiedMember += newMembers[daysCounter].verified
                  failedMember += newMembers[daysCounter].failed
                }
                // add calculated month to response
                response.date[month] = newMembers[days].key
                response.verified[month] = verifiedMember
                response.failed[month] = failedMember
              }
            }
            log.debug(
              'process of getting members info completed successfully' +
              JSON.stringify(response)
            )
            return cb(null, response)
          })
          .fail(function (error) {
            log.error(error)
            return cb(error)
          }) */
  };

  Member.remoteMethod('getMembersChart', {
    description: 'Find data for chart of members from data source.',
    accepts: [
      {
        arg: 'startDate',
        type: 'string',
        required: true,
        description: 'Start Date',
      },
      {
        arg: 'endDate',
        type: 'string',
        required: true,
        description: 'End Date',
      },
      {
        arg: 'businessId',
        type: 'string',
        required: true,
        description: 'business ID',
      },
      {
        arg: 'offset',
        type: 'number',
        required: false,
        description: 'Time Zone',
      },
      {
        arg: 'monthDays',
        type: 'array',
        required: false,
        description: 'Days Of Month',
      },
    ],
    returns: {arg: 'result', type: 'Object'},
  });

  Member.observe('after save', function(ctx, next) {
    const Role = app.models.Role;

    if (ctx.instance) {
      const entity = ctx.instance;
      const memberId = entity.id;
      cacheManager.clearMember(memberId);
      cacheManager.clearMemberByUsername(cacheManager.createMemberByUsernameCacheId(entity.businessId, entity.username));
      cacheManager.clearMemberSession(memberId);
      cacheManager.clearMemberUsage(memberId);
    }

    if (ctx.isNewInstance) {
      const id = ctx.instance.id;
      Role.findOne({where: {name: config.ROLES.HOTSPOTMEMBER}}, function(
        error,
        role
      ) {
        if (error) {
          log.error(
            'failed to load ' +
            config.ROLES.HOTSPOTMEMBER +
            ' for role assignment',
            error
          );
          return next(error);
        }
        if (!role) {
          return next('failed to load role');
        }
        const roleMapping = {principalType: 'USER', principalId: id};
        role.principals.create(roleMapping, function(error, result) {
          if (error) {
            log.error('failed to assign role to business', error);
            return next(error);
          }
          return next();
        });
      });
    } else {
      return next();
    }
  });

  Member.observe('before save', function(ctx, next) {
    if (ctx.instance) {
      doTheThings(ctx.instance, function(error) {
        return next(error);
      });
    } else if (ctx.data) {
      doTheThings(ctx.data, function(error) {
        return next(error);
      });
    }

    function doTheThings(member, clbk) {
      if (member.mobile) {
        member.mobile = utility.verifyAndTrimMobile(member.mobile);
        if (!member.mobile) {
          const error = new Error();
          error.status = 422;
          error.message = hotspotMessages.invalidMobileNumber;
          return clbk(error);
        }
      }
      if (member.passwordText) {
        const password = member.passwordText;
        member.password = password;
        member.passwordText = utility.encrypt(password, config.ENCRYPTION_KEY);
      }
      if (ctx.instance && ctx.isNewInstance) {
        if (!member.username) {
          member.username = member.mobile;
        }
      }
      if (member.username && member.businessId) {
        member.uniqueUserId = member.businessId + member.username;
        member.username = Member.createUsername(
          member.businessId,
          member.username
        );
      }
      return clbk();
    }
  });

  Member.sendPassword = async (businessId, memberId) => {
    log.debug('@sendPassword');
    const member = await Member.findOne(
      {
        where: {
          and: [{id: memberId}, {businessId: businessId}],
        },
      }
    );
    if (!member) {
      throw createHttpError(404, hotspotMessages.memberNotFound);
    }
    if (!member.mobile) {
      throw createHttpError(403, hotspotMessages.noMobileNumber);
    }
    const plainPassword = utility.decrypt(
      member.passwordText,
      config.ENCRYPTION_KEY
    );
    const plainUsername = member.username.split('@')[0];

    Member.sendSms(businessId, {
      businessId: businessId,
      token1: plainUsername,
      token2: plainPassword,
      mobile: member.mobile,
      template: config.HOTSPOT_CREDENTIALS_MESSAGE_TEMPLATE,
    });
    return 'sms added to Queue';
  };

  Member.remoteMethod('sendPassword', {
    description: 'send password to member',
    accepts: [
      {
        arg: 'businessId',
        type: 'string',
        required: true,
      },
      {
        arg: 'memberId',
        type: 'string',
        required: true,
      },
    ],
    returns: {root: true},
  });

  Member.recoverHotspotUser = function(userMobile, host, nasId, businessId) {
    log.debug('@recoverHotspotUser', userMobile, host, nasId, businessId);
    return Q.Promise(function(resolve, reject) {
      Member.findOne(
        {
          where: {
            and: [
              {businessId: businessId},
              {mobile: utility.verifyAndTrimMobile(userMobile)},
            ],
          },
        },
        function(error, member) {
          if (error) {
            log.error(error);
            return reject(error);
          }
          if (
            !member ||
            member.mobile !== utility.verifyAndTrimMobile(userMobile)
          ) {
            log.error('no such member: ', userMobile);
            error = new Error();
            error.message = hotspotMessages.memberNotFound;
            error.status = 404;
            return reject(error);
          }
          return Member.sendPassword(member.businessId, member.id, nasId, host)
            .then(function(response) {
              return resolve(response);
            })
            .fail(function(error) {
              return reject(error);
            });
        }
      );
    });
  };

  Member.remoteMethod('recoverHotspotUser', {
    accepts: [
      {
        arg: 'usernameOrMobile',
        type: 'string',
        required: true,
      },
      {
        arg: 'host',
        type: 'string',
      },
      {
        arg: 'nasId',
        type: 'string',
      },
      {
        arg: 'businessId',
        type: 'string',
        required: true,
      },
    ],
    returns: {root: true},
  });

  /* Member.observe ( 'loaded', function ( ctx, next ) {
		if ( ctx.data ) {
			if ( ctx.data.internetPlanHistory ) {
				var internetPlanHistory = ctx.data.internetPlanHistory;
				if ( internetPlanHistory.length > 20 ) {
					internetPlanHistory = internetPlanHistory.splice ( internetPlanHistory.length - 20 );
					ctx.data.internetPlanHistory = internetPlanHistory;
				}
			}
		}
		return next ();
	} ); */

  Member.loadMember = function(memberId, ctx, cb) {
    Member.findOne(
      {
        where: {
          and: [{id: memberId}],
        },
        fields: {
          passwordText: false,
        },
      },
      function(error, member) {
        if (error) {
          log.error(error);
          return cb(error);
        }
        if (!member) {
          log.error('member not found');
          return cb('member not found');
        }
        log.debug(member);
        return cb(null, member);
      }
    );
  };

  Member.remoteMethod('loadMember', {
    description: 'load member',
    accepts: [
      {
        arg: 'memberId',
        type: 'string',
        required: true,
      },
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    returns: {root: true},
  });

  Member.loadMemberPassword = function(memberId, businessId, ctx, cb) {
    businessId = businessId || ctx.currentUserId;
    Member.findOne(
      {
        where: {
          and: [{id: memberId}, {businessId: businessId}],
        },
        fields: {
          passwordText: true,
        },
      },
      function(error, member) {
        if (error) {
          log.error(error);
          return cb(error);
        }
        if (!member) {
          log.error('member not found');
          return cb('member not found');
        }
        member.passwordText = utility.decrypt(
          member.passwordText,
          config.ENCRYPTION_KEY
        );
        return cb(null, member);
      }
    );
  };

  Member.remoteMethod('loadMemberPassword', {
    description: 'load member\'s password',
    accepts: [
      {
        arg: 'memberId',
        type: 'string',
        required: true,
      },
      {
        arg: 'businessId',
        type: 'string',
      },
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    returns: {root: true},
  });

  Member.loadMemberInternetPlans = function(businessId, memberId, cb) {
    Member.findOne(
      {
        where: {
          and: [{id: memberId}, {businessId: businessId}],
        },
        fields: {
          internetPlanHistory: true,
        },
      },
      function(error, member) {
        if (error) {
          log.error(error);
          return cb(error);
        }
        if (!member) {
          log.error('member not found');
          return cb('member not found');
        }
        return cb(null, member);
      }
    );
  };

  Member.remoteMethod('loadMemberInternetPlans', {
    description: 'load member\'s internetPlan history',
    accepts: [
      {
        arg: 'businessId',
        type: 'string',
        required: true,
      },
      {
        arg: 'memberId',
        type: 'string',
        required: true,
      },
    ],
    returns: {root: true},
  });

  Member.getMemberByUserName = async function(businessId, username) {
    const cacheKey = cacheManager.createMemberByUsernameCacheId(businessId, username);
    const cachedMember = await cacheManager.getMemberByUsername(cacheKey);
    if (cachedMember) {
      return cachedMember;
    }
    const member = await Member.findOne({
      where: {
        and: [
          {businessId: businessId},
          {username: Member.createUsername(businessId, username)},
        ],
      },
    });
    cacheManager.cacheMemberByUsername(cacheKey, member);
    return member;
  };

  Member.radiusAuthorize = async (AccessRequest) => {
    log.debug('@RadiusAuthorize');
    const RadiusResponse = new radiusAdaptor.RadiusResponseFactory(AccessRequest);
    const Member = app.models.Member;
    const username = AccessRequest.getAttribute('username');
    const nas = AccessRequest.nas;

    const member = await Member.getMemberByUserName(nas.businessId, username);
    // const {member} = await Member.checkAuthorization(businessId, nas.id, username)
    const clearTextPass = utility.decrypt(member.passwordText, config.ENCRYPTION_KEY);
    RadiusResponse.addControl('clearTextPass', clearTextPass);
    RadiusResponse.setCode(200);
    return RadiusResponse;
  };

  Member.checkAuthorization = async (businessId, nasId, username) => {
    const Business = app.models.Business;
    const InternetPlan = app.models.InternetPlan;
    const business = await Business.loadById(businessId);
    const validSubscription = await Business.hasValidSubscription(business);
    if (!validSubscription) {
      throw createError(401, hotspotMessages.businessServiceExpired);
    }

    // todo move this part to license check or scheduler
    /* const isAllowed = await Business.isMoreSessionAllowed(business)
    if (isAllowed === false) {
      throw createError(500, hotspotMessages.maxOnlineUsersReached)
    } */

    // has cache
    const member = await Member.getMemberByUserName(businessId, username);
    if (!member) {
      throw createError(401, hotspotMessages.invalidUsernameOrPassword);
    }

    if (!member.active) {
      throw createError(401, Radius_Messages.inActiveUser);
    }

    if (!member.internetPlanId) {
      throw createError(401, Radius_Messages.memberHasNoInternetPlan);
    }

    const internetPlan = await InternetPlan.loadById(member.internetPlanId);
    if (!internetPlan) {
      throw createError(401, Radius_Messages.internetPlanRemoved);
    }

    const duration = Member.getSubscriptionDuration(member, internetPlan);
    if (!duration) {
      throw createError(401, Radius_Messages.noActiveSubscription);
    }

    const usageReport = await Member.getInternetUsage(businessId.toString(), member.id.toString(), duration.from.getTime(), duration.to.getTime());
    log.error(usageReport);
    const remainingBulk = Member.hasEnoughBulk(internetPlan, usageReport.bulk, member.extraBulk);
    if (remainingBulk <= 0) {
      throw createError(403, Radius_Messages.outOfBulk);
    }

    const remainingTimeInSeconds = Member.hasEnoughTime(internetPlan, usageReport.sessionTime);
    if (remainingTimeInSeconds <= 0) {
      throw createError(401, Radius_Messages.outOfTime);
    }
    log.debug('member authorized...');
    return {business, member, internetPlan, duration, remainingBulk, remainingTimeInSeconds};
  };

  Member.radiusPostAuth = async function(AccessRequest) {
    const RadiusResponse = new radiusAdaptor.RadiusResponseFactory(AccessRequest);
    const nas = AccessRequest.nas;
    const nasId = nas.id;
    const businessId = nas.businessId.valueOf();
    const username = AccessRequest.getAttribute('username');

    const {member, internetPlan, remainingBulk, remainingTimeInSeconds} = await Member.checkAuthorization(businessId, nasId, username);
    const memberId = member.id;
    const ClientSession = app.models.ClientSession;
    const memberSessions = await ClientSession.getActiveMemberSessions(memberId);
    const numberOfMembersSession = memberSessions.length;
    if (nas.sessionStatus !== 'multiSession' && numberOfMembersSession >= 1) {
      throw createError(401, Radius_Messages.noMoreSessionAllowed);
    }

    RadiusResponse.addReply('accountingUpdateInterval', config.DEFAULT_ACCOUNTING_UPDATE_INTERVAL_SECONDS);
    RadiusResponse.addAllowedBulk(remainingBulk);
    RadiusResponse.addSessionTimeOut(remainingTimeInSeconds);

    // Add speed limit
    let uploadSpeed = utility.toKbps(internetPlan.speed.value, internetPlan.speed.type);
    let downloadSpeed = utility.toKbps(internetPlan.speed.value, internetPlan.speed.type);

    // Add burst
    const burstTime = internetPlan.burstTime || config.DEFAULT_BURST_TIME_IN_SECONDS;
    const burstDownloadFactor = internetPlan.burstDownloadFactor || config.DEFAULT_DOWNLOAD_BURST_FACTOR;
    const burstUploadFactor = internetPlan.burstUploadFactor || config.DEFAULT_UPLOAD_BURST_FACTOR;

    // Add valid ip pool name
    if (internetPlan.ipPoolName) {
      RadiusResponse.addIpPool(internetPlan.ipPoolName);
    }

    if (uploadSpeed > 0 && downloadSpeed > 0) {
      uploadSpeed = Math.round(uploadSpeed);
      downloadSpeed = Math.round(downloadSpeed);
      RadiusResponse.addConnectionSpeed(
        nas.accessPointType,
        downloadSpeed,
        downloadSpeed * burstDownloadFactor,
        uploadSpeed,
        uploadSpeed * burstUploadFactor,
        burstTime
      );
    }
    RadiusResponse.setCode(200);
    return RadiusResponse;
  };

  Member.getInternetUsage = async function(
    businessId,
    memberId,
    fromDateInMs,
    toDateInMs
  ) {
    log.debug(`'GetInternetUsage businessId ${businessId} MemberId ${memberId} From:  ${fromDateInMs}  to ${toDateInMs}`);
    let usageList = await cacheManager.getMemberUsage(memberId);
    log.debug({usageList});
    if (!usageList) {
      log.debug('loading usage from db');
      usageList = await db.getMemberUsage(fromDateInMs, toDateInMs, memberId, businessId);
      log.debug({usageList});
      for (const usage of usageList) {
        log.warn('refreshing cache from db ', usage);
        usage.memberId = memberId;
        await cacheManager.addMemberUsage(usage);
      }
    }

    const total = {
      memberId,
      bulk: 0,
      download: 0,
      upload: 0,
      sessionTime: 0,
    };
    for (const usage of usageList) {
      total.download = total.download + Number(usage.download);
      total.upload = total.upload + Number(usage.upload);
      total.sessionTime = total.sessionTime + Number(usage.sessionTime);
    }
    total.bulk = total.download + total.upload;

    return total;
  };

  Member.getSubscriptionDuration = function(member, internetPlan) {
    const now = new Date();
    const subscriptionDate = new Date(member.subscriptionDate);
    const planDuration = Number(internetPlan.duration);
    const to = new Date(subscriptionDate);
    to.add({hours: 24 * planDuration});
    if (now.between(subscriptionDate, to)) {
      log.debug('It works and has a subscription');
      return {from: subscriptionDate, to};
    } else {
      return null;
    }
  };

  Member.hasEnoughBulk = function(internetPlan, usedBulk, extraBulk) {
    const maxAllowedBulk = 3900000000;
    if (!usedBulk) {
      usedBulk = 0;
    }
    let allowedBulk = 0;
    if (internetPlan.bulk) {
      allowedBulk = utility.toByte(
        internetPlan.bulk.value,
        internetPlan.bulk.type
      );
      if (internetPlan.bulk.value === '0' || internetPlan.bulk.value === 0) {
        return maxAllowedBulk;
      }
    }
    if (extraBulk) {
      allowedBulk = allowedBulk + utility.toByte(extraBulk, 'gb');
    }
    log.debug('allowed bulk: ', allowedBulk);
    log.debug('usedBulk bulk: ', usedBulk);
    const remainingBulk = allowedBulk - usedBulk;
    log.debug('remaining bulk: ', remainingBulk);
    return remainingBulk > 0 ? remainingBulk : 0;
  };

  Member.hasEnoughTime = function(internetPlan, usedTimeInSeconds) {
    const maxAllowedTime = 86400 * 2;
    var usedTimeInSeconds = Number(usedTimeInSeconds) || 0;
    const allowedTimeInMinutes = Number(internetPlan.timeDuration) || 0;
    if (allowedTimeInMinutes === 0) {
      return maxAllowedTime;
    }
    const allowedTimeInSeconds = allowedTimeInMinutes * 60;
    if (allowedTimeInSeconds > usedTimeInSeconds) {
      return allowedTimeInSeconds - usedTimeInSeconds;
    } else {
      return 0;
    }
  };

  Member.loadMemberCredentialsByMac = function(mac, businessId) {
    return Q.Promise(function(resolve, reject) {
      log.warn('mac is :', mac);
      if (!mac || !businessId) {
        log.debug('mac is empty');
        return resolve({});
      }
      mac = utility.trimMac(mac);
      Member.findOne(
        {
          where: {
            and: [{businessId: businessId}, {mac: mac}],
          },
        },
        function(error, member) {
          if (error) {
            log.error(error);
            return reject(error);
          }
          if (member && member.active) {
            // Fill in credentials
            const clearTextPass = utility.decrypt(
              member.passwordText,
              config.ENCRYPTION_KEY
            );
            return resolve({
              username: member.username,
              clearTextPassword: clearTextPass,
            });
          } else {
            // return empty credential
            log.debug('member not found by mac');
            return resolve({});
          }
        }
      );
    });
  };

  async function saveAccounting(RadiusAccountingMessage) {
    const ClientSession = app.models.ClientSession;
    const nas = RadiusAccountingMessage.nas;
    const businessId = nas.businessId.valueOf();
    const username = RadiusAccountingMessage.getAttribute('username');
    const member = await Member.getMemberByUserName(businessId, username);
    if (!member) {
      log.warn('accounting with unknown member, silently discarded');
    }
    // await Usage.addUsageReport(usage)
    await ClientSession.setSession({
      RadiusAccountingMessage,
      member,
      nas,
    });

    /* if (nas.sessionStatus === 'multiSession' || nas.kickOnSingleSession) {
      Member.evaluateMemberUsage(member, businessId)
    } */

    const mac = RadiusAccountingMessage.getAttribute('mac');
    const memberInstance = await Member.findById(member.id);
    await Member.setMemberMac(memberInstance, mac);
  }

  Member.radiusAccounting = async (RadiusAccountingMessage) => {
    try {
      const RadiusResponse = new radiusAdaptor.RadiusResponseFactory(
        RadiusAccountingMessage
      );
      saveAccounting(RadiusAccountingMessage);
      RadiusResponse.addReplyMessage('message received from radius and scheduled to record Ok:200');
      RadiusResponse.setCode(5);
      return RadiusResponse;
    } catch (error) {
      log.error(error);
      throw new Error('failed to add accounting report');
    }
  };

  Member.setMemberMac = async function(memberInstance, mac, forceUpdate) {
    return Q.Promise(function(resolve, reject) {
      if (forceUpdate || (!memberInstance.mac && mac)) {
        mac = utility.trimMac(mac);
        memberInstance.updateAttributes({mac: mac}, function(error, result) {
          if (error) {
            log.error('failed to update member mac', error);
            return reject(error);
          }
          log.debug('member mac updated: ', mac);
          return resolve(result);
        });
      } else {
        return resolve();
      }
    });
  };

  /* Member.evaluateMemberUsage = function (member, businessId) {
    var InternetPlan = app.models.InternetPlan
    var internetPlanId = member.internetPlanId
    var memberId = member.id.toString()
    businessId = businessId.toString()
    return Q.Promise(function (resolve, reject) {
      InternetPlan.findById(internetPlanId).then(function (internetPlan) {
        if (!internetPlan) {
          return reject(internetPlan)
        }
        const duration = Member.getSubscriptionDuration(member, internetPlan)
        if (!duration) {
          Member.disconnectAllSessionOfMember(businessId, memberId)
            .then(function () {
              log.debug(`expired subscription duration, send kill all for ${member.username}`)
              return resolve()
            }).fail(function (error) {
            log.error(error)
            return reject(error)
          })
        }
        Member.getInternetUsage(
          businessId,
          memberId,
          duration.from.getTime(),
          duration.to.getTime()
        )
          .then(function (usageReport) {
            log.debug('Evaluate usage report:', usageReport)
            Member.hasEnoughBulk(
              internetPlan,
              usageReport.bulk,
              member.extraBulk
            )
              .then(function (remainingBulk) {
                //nothing to do, has permission to use anything
                log.debug('Remaining bulk: ', remainingBulk)
                return resolve()
              })
              .fail(function () {
                //has no bulk so send kill all
                Member.disconnectAllSessionOfMember(businessId, memberId)
                  .then(function () {
                    log.debug(
                      'not enough bulk send kill all for ',
                      member.username
                    )
                    return resolve()
                  })
                  .fail(function (error) {
                    log.error(error)
                    return reject(error)
                  })
              })
          })
          .fail(function (error) {
            log.error('failed to query usage report')
            log.error(error)
            return reject()
          })

      })
    })
  } */

  Member.disconnectAllSessionOfMember = async function(businessId, memberId) {
    log.debug('dc for: ', businessId, ' memberId:', memberId);
    const ClientSession = app.models.ClientSession;
    const sessions = await ClientSession.getActiveMemberSessions(memberId);
    for (const session of sessions) {
      radiusPod.sendPod(session);
    }
  };

  Member.createShortVerificationUrl = function(
    businessId,
    nasId,
    host,
    verificationCode,
    memberId,
    cb
  ) {
    if (!businessId || !nasId || !host || !verificationCode || !memberId) {
      return cb('invalid params to create verification url');
    }
    const verificationUrl = config
      .HOTSPOT_VERIFICATION_URL()
      .replace('{businessId}', businessId)
      .replace('{nasId}', nasId)
      .replace('{host}', host)
      .replace('{verificationCode}', verificationCode)
      .replace('{memberId}', memberId);
    const urlKey = utility.createRandomKeyword(6);
    const shortUrl = config.SHORTNER_URL() + urlKey;
    redisClient.set(
      urlKey,
      verificationUrl,
      'EX',
      config.SHORT_VERIFICATION_URL_EXPIRES_AT
    );
    return cb(null, shortUrl);
  };

  Member.createShortSigninUrl = function(
    businessId,
    nasId,
    host,
    username,
    password,
    memberId,
    cb
  ) {
    const signInUrl = config
      .HOTSPOT_SIGNIN_URL()
      .replace('{businessId}', businessId)
      .replace('{nasId}', nasId)
      .replace('{host}', host)
      .replace('{username}', username)
      .replace('{password}', password)
      .replace('{memberId}', memberId);
    const urlKey = utility.createRandomKeyword(6);
    const shortUrl = config.SHORTNER_URL() + urlKey;
    redisClient.set(urlKey, signInUrl, 'EX', config.SHORT_LOGIN_URL_EXPIRES_AT);
    return cb(null, shortUrl);
  };

  Member.createNewMember = function(options, businessId, nasId, host) {
    const Business = app.models.Business;
    return Q.Promise(function(resolve, reject) {
      const member = {};
      member.businessId = businessId;
      member.mobile = options.mobile;
      member.email = options.email;
      member.groupIdentity = options.groupIdentity;
      if (options.expiresAt) {
        member.expiresAt = options.expiresAt;
      }
      member.groupIdentityId = options.groupIdentityId;
      member.groupIdentityType = options.groupIdentityType;
      member.passportNumber = options.passportNumber;
      member.roomNumber = options.roomNumber;
      member.studentGrade = options.studentGrade;
      member.studentId = options.studentId;
      member.username =
        options.username || utility.verifyAndTrimMobile(member.mobile);
      member.passwordText =
        options.password || utility.createRandomNumericalPassword();
      member.verificationCode = utility.createVerificationCode();
      member.passportNumber = options.passportNumber;
      // member.active = true;
      if (options.active != null) {
        member.active = options.active;
      }
      member.active = false;
      if (options.active != null) {
        member.active = options.active;
      }
      // Check if this is a hotel user
      if (member.passportNumber && !member.mobile) {
        member.username = member.passportNumber.trim();
        if (member.roomNumber) {
          member.passwordText = member.roomNumber.trim();
        }
      }
      member.language = options.language;
      member.firstName = options.firstName;
      member.lastName = options.lastName;
      member.fullName = options.fullName;
      member.gender = options.gender;
      member.birthday = options.birthday;
      member.birthDay = options.birthDay;
      member.birthMonth = options.birthMonth;
      member.birthYear = options.birthYear;
      member.nationalCode = options.nationalCode;
      member.age = options.age;
      member.creationDate = options.creationDate || new Date().getTime();
      member.subscriptionDate =
        options.subscriptionDate || new Date().getTime();
      if (options.sendVerificationSms) {
        member.verificationCount = 1;
      }

      Business.findById(businessId).then(function(business) {
        if (!business) {
          log.error('business not found');
          return reject('business not found');
        }

        const defaultInternetPlan = business.defaultInternetPlan || {};
        if (options.internetPlanId) {
          member.internetPlanId = options.internetPlanId;
        } else if (defaultInternetPlan.id) {
          member.internetPlanId = business.defaultInternetPlan.id;
          member.activateDefaultPlanCount = 1;
        }
        // todo check verification method and decide for 'active' attribute

        Member.create(member, function(error, result) {
          if (error) {
            log.error(error);
            return reject(error);
          }
          const memberId = result.id;
          if (options.sendVerificationSms) {
            Member.sendVerificationMessage(
              business,
              nasId,
              host,
              member.verificationCode,
              memberId,
              member.mobile
            )
              .then(function(verificationInfo) {
                log.debug('verification code sent');
                return resolve({
                  internetPlanId: member.internetPlanId,
                  username: member.username,
                  shortUrl: verificationInfo.shortUrl,
                  verificationCode: verificationInfo.verificationCode,
                  password: member.passwordText,
                  businessId: member.businessId,
                  memberId: memberId,
                });
              })
              .fail(function(error) {
                log.error('failed to send verification code');
                log.error(error);
                return reject(error);
              });
          } else {
            // log.debug ( "member created: ", member.username );
            return resolve({
              internetPlanId: member.internetPlanId,
              username: member.username,
              password: member.passwordText,
              businessId: member.businessId,
              memberId: memberId,
            });
          }
        });
      });
    });
  };

  Member.remoteMethod('createNewMember', {
    accepts: [
      {
        arg: 'options',
        type: 'object',
        required: true,
      },
      {
        arg: 'businessId',
        type: 'string',
        required: true,
      },
      {
        arg: 'nasId',
        type: 'string',
      },
      {
        arg: 'host',
        type: 'string',
      },
    ],
    returns: {root: true},
  });

  Member.sendVerificationMessage = function(
    business,
    nasId,
    host,
    verificationCode,
    memberId,
    mobile
  ) {
    const businessId = business.id;
    return Q.Promise(function(resolve, reject) {
      Member.createShortVerificationUrl(
        businessId,
        nasId,
        host,
        verificationCode,
        memberId,
        function(error, shortUrl) {
          if (error) {
            log.error('failed to create short url');
            return reject(error);
          }
          shortUrl = shortUrl || '';
          log.debug('addHotSpotMember message added to queue');
          let smsVerificationTemplate =
            config.HOTSPOT_VERIFICATION_MESSAGE_TEMPLATE;
          if (business.callBasedVerification === true) {
            smsVerificationTemplate =
              config.HOTSPOT_VERIFICATION_MESSAGE_TEMPLATE_BY_CALL;
          }

          Member.sendSms(businessId, {
            businessId: businessId,
            token1: verificationCode,
            token2: shortUrl,
            mobile: mobile,
            template: smsVerificationTemplate,
          });
          return resolve({
            shortUrl: shortUrl,
            verificationCode: verificationCode,
          });
        }
      );
    });
  };

  Member.createHotSpotMember = function(
    mobile,
    firstName,
    lastName,
    fullName,
    gender,
    birthday,
    birthDay,
    birthMonth,
    birthYear,
    username,
    password,
    email,
    nationalCode,
    age,
    businessId,
    host,
    nasId,
    language,
    roomNumber,
    passportNumber,
    studentGrade,
    studentId,
    verificationMethod,
    cb
  ) {
    log.debug('@createHotSpotMember');
    Member.findOne(
      {
        where: {
          and: [
            {businessId: businessId},
            {
              or: [
                {
                  username:
                    utility.verifyAndTrimMobile(mobile) + '@' + businessId,
                },
                {mobile: utility.verifyAndTrimMobile(mobile)},
              ],
            },
          ],
        },
      },
      function(error, previousMember) {
        if (error) {
          log.error(error);
          return cb(error);
        }

        // Fix findOne bug;
        if (
          previousMember &&
          previousMember.mobile !== utility.verifyAndTrimMobile(mobile)
        ) {
          previousMember = null;
        }

        let sendVerificationSms = false;
        let isActive = false;
        let responseStatus = 0;
        verificationMethod = verificationMethod || 'mobile';

        if (verificationMethod === 'mobile') {
          sendVerificationSms = true;
          isActive = false;
          if (!mobile) {
            var error = new Error();
            error.message = hotspotMessages.mobileIsRequired;
            error.status = 403;
            return cb(error);
          }
          responseStatus = 0;
        } else if (verificationMethod === 'manual') {
          responseStatus = 5;
          sendVerificationSms = false;
          isActive = false;
        } else if (verificationMethod === 'auto') {
          responseStatus = 6;
          sendVerificationSms = true;
          isActive = false;
        }

        const Business = app.models.Business;
        if (!previousMember) {
          Member.createNewMember(
            {
              mobile: mobile,
              gender: gender,
              firstName: firstName,
              lastName: lastName,
              fullName: fullName,
              birthday: birthday,
              birthDay: birthDay,
              birthYear: birthYear,
              birthMonth: birthMonth,
              active: isActive,
              sendVerificationSms: sendVerificationSms,
              username: username,
              password: password,
              email: email,
              nationalCode: nationalCode,
              language: language,
              passportNumber: passportNumber,
              roomNumber: roomNumber,
              studentGrade: studentGrade,
              studentId: studentId,
              age: age,
            },
            businessId,
            nasId,
            host
          )
            .then(function(credential) {
              credential.status = responseStatus;
              if (verificationMethod !== 'auto') {
                delete credential.shortUrl;
                delete credential.verificationCode;
              }
              return cb(null, credential);
            })
            .fail(function(error) {
              log.error(error);
              return cb(error);
            });
        } else {
          log.debug('Previous member exist', previousMember);
          Business.findById(businessId).then(function(business) {
            if (!business) {
              const error = new Error();
              error.message = hotspotMessages.businessNotFound;
              error.status = 404;
              return cb(error);
            }
            const verificationCodeMax =
              business.MAX_VERIFICATION_COUNT || config.MAX_VERIFICATION_COUNT;
            if (previousMember.active) {
              log.error(
                'Member Exist with username: ',
                previousMember.username
              );
              return cb(null, {status: -1});
            }
            if (!previousMember.mobile) {
              log.debug(
                'Member find but needs manual verification ',
                previousMember.username
              );
              return cb(null, {status: 3});
            }
            if (
              (!previousMember.active &&
                previousMember.verificationCount <= verificationCodeMax) ||
              !previousMember.verificationCount
            ) {
              log.debug(
                'Member find but it is not active, username: ',
                previousMember.username
              );
              const count = previousMember.verificationCount + 1;
              previousMember.updateAttributes(
                {verificationCount: count},
                function(error, res) {
                  if (error) {
                    log.error(error);
                    return cb(error);
                  }
                  Member.sendVerificationMessage(
                    business,
                    nasId,
                    host,
                    previousMember.verificationCode,
                    previousMember.id,
                    previousMember.mobile
                  )
                    .then(function() {
                      log.debug('verification code sent to: ', mobile);
                    })
                    .fail(function(error) {
                      log.error('failed to send verification code');
                      log.error(error);
                    });
                }
              );
              return cb(null, {status: 0, memberId: previousMember.id});
            } else if (
              !previousMember.active &&
              previousMember.verificationCount > verificationCodeMax
            ) {
              log.debug(
                'Member exist but verification message limit reached: ',
                previousMember.username
              );
              return cb(null, {status: 2});
            }
          });
        }
      }
    );
  };

  Member.remoteMethod('createHotSpotMember', {
    accepts: [
      {
        arg: 'mobile',
        type: 'string',
      },
      {
        arg: 'firstName',
        type: 'string',
      },
      {
        arg: 'lastName',
        type: 'string',
      },
      {
        arg: 'fullName',
        type: 'string',
      },
      {
        arg: 'gender',
        type: 'string',
      },
      {
        arg: 'birthday',
        type: 'number',
      },
      {
        arg: 'birthDay',
        type: 'number',
      },
      {
        arg: 'birthMonth',
        type: 'number',
      },
      {
        arg: 'birthYear',
        type: 'number',
      },
      {
        arg: 'username',
        type: 'string',
      },
      {
        arg: 'password',
        type: 'string',
      },
      {
        arg: 'email',
        type: 'string',
      },
      {
        arg: 'nationalCode',
        type: 'string',
      },
      {
        arg: 'age',
        type: 'number',
      },
      {
        arg: 'id',
        type: 'string',
        required: true,
      },
      {
        arg: 'host',
        type: 'string',
        required: true,
      },
      {
        arg: 'nasId',
        type: 'string',
        required: true,
      },
      {
        arg: 'language',
        type: 'string',
      },
      {
        arg: 'roomNumber',
        type: 'string',
      },
      {
        arg: 'passportNumber',
        type: 'string',
      },
      {
        arg: 'studentGrade',
        type: 'string',
      },
      {
        arg: 'studentId',
        type: 'string',
      },
      {
        arg: 'verificationMethod',
        type: 'string',
        required: true,
      },
    ],
    returns: {root: true},
  });

  /* return status of hotspot member or create one if it's not exist
	 businessId: String
	 memberId: String
	 verificationCode: String
	 */
  Member.verifyHotSpot = function(
    businessId,
    memberId,
    verificationCode,
    host,
    nasId,
    cb
  ) {
    log.debug('@verifyHotSpotMember');
    const Member = app.models.Member;
    Member.findById(memberId).then(function(member) {
      log.debug(member);
      verificationCode = Number(verificationCode);
      if (member && member.verificationCode == verificationCode) {
        const activatedPreviously = member.active;
        member.updateAttributes(
          {
            active: true,
            verificationDate: new Date().getTime(),
          },
          function(error, res) {
            if (error) {
              log.error(error);
              return cb(error);
            }
            const password = utility.decrypt(
              member.passwordText,
              config.ENCRYPTION_KEY
            );
            if (activatedPreviously !== true) {
              log.debug('member did not verified previously');
              Member.sendPassword(businessId, memberId, nasId, host)
                .then(function() {
                  return cb(null, {
                    username: member.username,
                    password: password,
                  });
                })
                .fail(function(error) {
                  return cb(error);
                });
            } else {
              log.debug('member verified true');
              return cb(null, {
                username: member.username,
                password: password,
              });
            }
          }
        );
      } else {
        const error = new Error();
        if (member) {
          error.message = hotspotMessages.invalidVerificationCode;
          error.status = 403;
        } else {
          error.message = hotspotMessages.memberNotFound;
          error.status = 404;
        }
        return cb(error);
      }
    });
  };

  Member.remoteMethod('verifyHotSpot', {
    description: 'Verify mobile number',
    http: {
      verb: 'post',
    },
    accepts: [
      {
        arg: 'id',
        type: 'string',
        required: true,
      },
      {
        arg: 'memberId',
        type: 'string',
        required: true,
      },
      {
        arg: 'verificationCode',
        type: 'string',
        required: true,
      },
      {
        arg: 'host',
        type: 'string',
      },
      {
        arg: 'nasId',
        type: 'string',
      },
    ],
    returns: {root: true},
  });

  Member.paySubscription = function(
    businessId,
    memberId,
    internetPlanId,
    nasId,
    host,
    username,
    password
  ) {
    log.debug(
      'businessId, memberId, internetPlanId, nasId, host, username, password'
    );
    log.debug(
      businessId,
      memberId,
      internetPlanId,
      nasId,
      host,
      username,
      password
    );
    return Q.Promise(function(resolve, reject) {
      const Business = app.models.Business;
      const InternetPlan = app.models.InternetPlan;
      Business.findById(businessId).then(function(business) {
        if (!business) {
          var error = new Error();
          error.message = hotspotMessages.businessNotFound;
          error.status = 404;
          return reject(error);
        }
        if (!business.paymentApiKey) {
          var error = new Error();
          error.message = hotspotMessages.invalidPaymentApiKey;
          error.status = 500;
          return reject(error);
        }
        InternetPlan.findById(internetPlanId).then(function(internetPlan) {
          if (!internetPlan) {
            const error = new Error();
            error.message = hotspotMessages.internetPlanDoesNotExist;
            error.status = 404;
            return reject(error);
          }
          const price = internetPlan.price;
          const desc =
            internetPlan.name +
            internetPlan.type +
            ', ' +
            internetPlan.speed.value +
            internetPlan.speed.type +
            ', ' +
            internetPlan.bulk.value +
            internetPlan.bulk.type;
          const issueDate = new Date().getTime();
          const Invoice = app.models.Invoice;
          Invoice.create(
            {
              price: price,
              planId: internetPlanId,
              payed: false,
              description: desc,
              issueDate: issueDate,
              businessId: businessId,
              memberId: memberId,
            },
            function(error, invoice) {
              if (error) {
                log.error(error);
                return reject(error);
              }

              const returnUrl = config
                .HOTSPOT_PAYMENT_RETURN_URL()
                .replace('{0}', 'invoiceId')
                .replace('{1}', invoice.id)
                .replace('{username}', username)
                .replace('{password}', password)
                .replace('{nasId}', nasId)
                .replace('{businessId}', businessId)
                .replace('{memberId}', memberId)
                .replace('{host}', host);
              Payment.openPaymentGateway(
                business.paymentApiKey,
                price,
                config.PAYMENT_GATEWAY_INTERNET_PLAN_PAYMENT_DESC,
                business.email,
                business.mobile,
                returnUrl
              )
                .then(function(response) {
                  const paymentId = response.paymentId;
                  invoice.updateAttributes(
                    {
                      paymentId: paymentId,
                    },
                    function(error) {
                      if (error) {
                        log.error(error);
                        return reject(error);
                      }
                      return resolve({
                        code: 200,
                        url: response.url,
                      });
                    }
                  );
                })
                .fail(function(error) {
                  log.error(error);
                  return reject(error);
                });
            }
          );
        });
      });
    });
  };

  Member.remoteMethod('paySubscription', {
    http: {
      verb: 'post',
    },
    accepts: [
      {
        arg: 'businessId',
        type: 'string',
        required: true,
      },
      {
        arg: 'memberId',
        type: 'string',
        required: true,
      },
      {
        arg: 'packageId',
        type: 'string',
        required: true,
      },

      {
        arg: 'nasId',
        type: 'string',
        required: true,
      },
      {
        arg: 'host',
        type: 'string',
        required: true,
      },
      {
        arg: 'username',
        type: 'string',
        required: true,
      },
      {
        arg: 'password',
        type: 'string',
        required: true,
      },
    ],
    returns: {root: true},
  });

  Member.verifySubscriptionPayment = function(
    refId,
    invoiceId,
    username,
    password,
    host,
    nasId,
    memberId,
    businessId
  ) {
    return Q.Promise(function(resolve, reject) {
      const Invoice = app.models.Invoice;
      const InternetPlan = app.models.InternetPlan;
      const Business = app.models.Business;

      try {
        Invoice.findById(invoiceId, function(error, invoice) {
          const params = {
            host: host,
            businessId: businessId,
            nasId: nasId,
            memberIdId: memberId,
            username: username,
            password: password,
          };
          if (error) {
            log.error('Error in return url finding invoice ' + error);
            log.error(error);
            params.payStatus = false;
            return resolve({
              code: 302,
              returnUrl: config
                .HOTSPOT_PAYMENT_WEB_RETURN_URL()
                .replace('{0}', querystring.stringify(params)),
            });
          }
          if (!invoice) {
            log.error('Invalid internet invoice id');
            params.payStatus = false;
            return resolve({
              code: 302,
              returnUrl: config
                .HOTSPOT_PAYMENT_WEB_RETURN_URL()
                .replace('{0}', querystring.stringify(params)),
            });
          }
          var businessId = invoice.businessId;
          const paymentId = invoice.paymentId;
          const price = invoice.price;
          Business.findById(businessId).then(function(business) {
            if (!business) {
              log.error('Invalid business id');
              params.payStatus = false;
              return resolve({
                code: 302,
                returnUrl: config
                  .HOTSPOT_PAYMENT_WEB_RETURN_URL()
                  .replace('{0}', querystring.stringify(params)),
              });
            }

            if (!business.paymentApiKey) {
              params.payStatus = false;
              return resolve({
                code: 500,
                returnUrl: config
                  .HOTSPOT_PAYMENT_WEB_RETURN_URL()
                  .replace('{0}', querystring.stringify(params)),
              });
            }
            Payment.verifyPayment(business.paymentApiKey, refId, price)
              .then(function(verificationResult) {
                log.warn(verificationResult);

                if (verificationResult.payed) {
                  const refId = verificationResult.refId;
                  invoice.updateAttributes(
                    {
                      payed: true,
                      paymentRefId: refId,
                      paymentDate: new Date().getTime(),
                    },
                    function(error) {
                      if (error) {
                        log.error(error);
                        log.error('Error in update invoice : ', invoice.id);
                        params.payStatus = false;
                        return resolve({
                          code: 302,
                          returnUrl: config
                            .HOTSPOT_PAYMENT_WEB_RETURN_URL()
                            .replace('{0}', querystring.stringify(params)),
                        });
                      }
                      log.debug(
                        'Update invoiceId ' +
                        invoiceId +
                        ' with verify payment refId ' +
                        refId
                      );
                      InternetPlan.assignPlanToMember(
                        invoice.memberId,
                        invoice.planId
                      )
                        .then(function() {
                          log.debug('%%%%%%%%%%%');
                          log.debug(invoice);
                          params.payStatus = true;
                          return resolve({
                            code: 302,
                            returnUrl: config
                              .HOTSPOT_PAYMENT_WEB_RETURN_URL()
                              .replace('{0}', querystring.stringify(params)),
                          });
                        })
                        .fail(function(error) {
                          log.error(error);
                          params.payStatus = false;
                          return resolve({
                            code: 302,
                            returnUrl: config
                              .HOTSPOT_PAYMENT_WEB_RETURN_URL()
                              .replace('{0}', querystring.stringify(params)),
                          });
                        });
                    }
                  );
                } else {
                  log.debug('Payment failed ' + invoiceId);
                  log.debug(
                    'Payment failed ' +
                    config
                      .HOTSPOT_PAYMENT_WEB_RETURN_URL()
                      .replace('{0}', false)
                      .replace('{1}', 'verify')
                  );
                  params.payStatus = false;
                  return resolve({
                    code: 302,
                    returnUrl: config
                      .HOTSPOT_PAYMENT_WEB_RETURN_URL()
                      .replace('{0}', querystring.stringify(params)),
                  });
                }
              })
              .fail(function(error) {
                log.error(error);
                log.error('Error in verify payment invoiceId ' + invoiceId);
                params.payStatus = false;
                return resolve({
                  code: 302,
                  returnUrl: config
                    .HOTSPOT_PAYMENT_WEB_RETURN_URL()
                    .replace('{0}', querystring.stringify(params)),
                });
              });
          });
        });
      } catch (e) {
        log.error(e);
      }
    });
  };

  Member.autoReSubscribe = function(businessId, memberId, dateInMs) {
    const InternetPlan = app.models.InternetPlan;
    return Q.Promise(function(resolve, reject) {
      if (!businessId || !memberId) {
        return reject('memid or biz id is empty');
      }
      if (!dateInMs) {
        dateInMs = new Date().clearTime().getTime();
      }
      Member.findById(memberId).then(function(member) {
        if (!member) {
          return reject('member not found');
        }
        member.updateAttributes(
          {
            extraBulk: 0,
            subscriptionDate: dateInMs,
          },
          function(error) {
            if (error) {
              log.error(error);
              return reject(error);
            }
            InternetPlan.updateInternetPlanHistory(
              memberId,
              member.internetPlanId
            )
              .then(function() {
                Member.findById(memberId).then(function(latestMember) {
                  if (!latestMember) {
                    return reject('latestMember not found');
                  }
                  log.debug(
                    'member resubscribed automatically:',
                    businessId,
                    ':',
                    memberId
                  );
                  return resolve(latestMember);
                });
              })
              .fail(function(error) {
                log.error(error);
                return reject(error);
              });
          }
        );
      });
    });
  };

  /* return subscriptionDate of member
	 memberId: String
	 */
  Member.getSubscriptionDate = function(memberId) {
    return Q.Promise(function(resolve, reject) {
      Member.find(
        {
          fields: {subscriptionDate: true, id: true},
          where: {id: memberId},
          order: 'subscriptionDate DESC',
        },
        function(error, member) {
          if (error) {
            log.error(error);
            return reject(error);
          }
          let subscriptionDate = null;
          if (member.length > 0) {
            subscriptionDate = member[0].subscriptionDate;
          }
          return resolve(subscriptionDate);
        }
      );
    });
  };

  Member.calculateBulkSmsCost = function(receptorsLength, messageText) {
    if (receptorsLength == null || !messageText) {
      return 0;
    }
    let cost = 0;
    let standardPageLength;
    if (utility.isPersianSms(messageText)) {
      cost = config.PERSIAN_SMS_COST;
      standardPageLength = 70;
    } else {
      standardPageLength = 60;
      cost = config.ENGLISH_SMS_COST;
    }
    const numberOfSmsPage = Math.ceil(messageText.length / standardPageLength);
    return receptorsLength * numberOfSmsPage * cost;
  };

  Member.getSmsCostForAllMembers = function(businessId, messageText) {
    return Q.Promise(function(resolve, reject) {
      if (!businessId) {
        return reject('noBusinessId');
      }
      if (!messageText) {
        return reject('noMessageText');
      }

      Member.count({businessId: businessId, mobile: {gt: 0}}, function(
        error,
        receptorsLength
      ) {
        if (error) {
          log.error('@getSmsCostForAllMembers', error);
          return reject(error);
        }
        const totalCost = Member.calculateBulkSmsCost(
          receptorsLength,
          messageText
        );
        db.getProfileBalance(businessId)
          .then(function(balance) {
            const result = {
              totalCost: totalCost,
              receptorsLength: receptorsLength,
              messageText: messageText,
              balance: balance.balance,
              balanceEnough: balance.balance > totalCost,
            };
            return resolve(result);
          })
          .fail(function(error) {
            log.error('@getSmsCostForAllMembers', error);
            return reject(error);
          });
      });
    });
  };

  Member.remoteMethod('getSmsCostForAllMembers', {
    description: 'get Sms cost for all members with mobile number',
    accepts: [
      {
        arg: 'businessId',
        type: 'string',
        required: true,
      },
      {
        arg: 'messageText',
        type: 'string',
        required: true,
      },
    ],
    returns: {root: true},
  });

  Member.sendMessageToAll = function(messageText, ctx) {
    const businessId = ctx.currentUserId;
    return Q.Promise(function(resolve, reject) {
      Member.count({businessId: businessId, mobile: {gt: 0}}, function(
        error,
        receptorsLength
      ) {
        if (error) {
          log.error('@sendMessageToAll', error);
          return reject(error);
        }
        const totalCost = Member.calculateBulkSmsCost(
          receptorsLength,
          messageText
        );
        db
          .getProfileBalance(businessId)
          .then(function(balance) {
            if (balance.balance > totalCost) {
              Member.find(
                {
                  where: {
                    and: [
                      {businessId: businessId},
                      {
                        mobile: {
                          gt: 0,
                        },
                      },
                    ],
                  },
                  fields: {
                    mobile: true,
                  },
                },
                function(error, mobileList) {
                  if (error) {
                    log.error('@sendMessageToAll', error);
                    return reject(error);
                  }
                  const mobiles = [];
                  for (let i = 0; i < mobileList.length; i++) {
                    mobiles.push(mobileList[i].mobile);
                  }
                  Member.sendSms(businessId, {
                    businessId: businessId,
                    mobiles: mobiles,
                    message: messageText,
                  })
                    .then(function() {
                      return resolve('sms added to Queue');
                    })
                    .fail(function(error) {
                      return reject(error);
                    });
                }
              );
            } else {
              const error = 'balanceNotEnough';
              log.error('@sendMessageToAll', error);
              return reject(error);
            }
          })
          .fail(function(error) {
            log.error('@sendMessageToAll', error);
            return reject(error);
          });
      });
    });
  };

  Member.sendSms = function(businessId, smsData) {
    const Business = app.models.Business;
    return Q.Promise(function(resolve, reject) {
      Business.findById(businessId).then(function(business) {
        if (business.modules && business.modules.sms) {
          if (new Date().isBefore(new Date(business.modules.sms.expiresAt))) {
            smsModule
              .send(smsData)
              .then(function() {
                return resolve();
              })
              .fail(function(error) {
                return reject(error);
              });
          } else {
            log.error('you need valid sms subscription');
            var error = new Error();
            error.message = hotspotMessages.smsSubscriptionExpired;
            error.status = 500;
            return reject(error);
          }
        } else {
          log.error('you need valid sms module');
          var error = new Error();
          error.message = hotspotMessages.smsModulesNeeded;
          error.status = 500;
          return reject('you need valid sms module');
        }
      });
    });
  };

  Member.remoteMethod('sendMessageToAll', {
    description: 'send message to all members with mobile number',
    accepts: [
      {
        arg: 'messageText',
        type: 'string',
        required: true,
      },
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    returns: {root: true},
  });

  Member.loadMemberUsage = async (members) => {
    const results = {};
    for (const member of members) {
      if (member.subscriptionDate) {
        const fromDate = member.subscriptionDate;
        const toDate = new Date().getTime();
        const memberId = member.id;
        const businessId = member.businessId;

        const memberTraffic = await Member.getInternetUsage(businessId, memberId, fromDate, toDate);
        const {bulk, upload, download, sessionTime} = memberTraffic;
        results[memberId] = {
          upload,
          download,
          bulk,
          sessionTime,
          memberId,
        };
      }
    }
    return results;
  };

  Member.remoteMethod('loadMemberUsage', {
    description: 'loadMemberUsage returns members traffic',
    accepts: [
      {
        arg: 'members',
        type: 'array',
        required: true,
      },
    ],
    returns: {root: true},
  });

  /* return balance of hotspot member
	 businessId: String
	 memberId: String
	 */
  Member.getMemberBalance = function(businessId, memberId, cb) {
    log.debug('@getMemberBalance');
    if (!businessId) {
      var error = new Error();
      error.message = hotspotMessages.invalidBusinessId;
      error.status = 500;
      return cb(error);
    }
    if (!memberId) {
      var error = new Error();
      error.message = hotspotMessages.invalidMemberId;
      error.status = 500;
      return cb(error);
    }
    Member.findOne(
      {
        where: {
          and: [{id: memberId}, {businessId: businessId}],
        },
      },
      function(error, member) {
        if (error) {
          log.error(error);
          return cb(error);
        }
        if (!member) {
          var error = new Error();
          error.message = hotspotMessages.memberNotFound;
          error.status = 404;
          log.error('@getMemberBalance : member not found');
          return cb(error);
        }
        if (!member.internetPlanId) {
          var error = new Error();
          error.message = hotspotMessages.invalidInternetPlanId;
          error.status = 500;
          log.error('@getMemberBalance : member has no internet plan');
          return cb(error);
        }
        const InternetPlan = app.models.InternetPlan;
        InternetPlan.findOne(
          {
            where: {
              id: member.internetPlanId,
            },
          },
          function(error, internetPlan) {
            if (error) {
              log.error(error);
              return cb(error);
            }
            if (!internetPlan) {
              var error = new Error();
              error.message = hotspotMessages.internetPlanDoesNotExist;
              error.status = 500;
              log.error('@getMemberBalance : plan not found');
              return cb(error);
            }
            let plan = {};
            plan = internetPlan;
            plan.originalBulk = plan.bulk.value;
            plan.originalTimeDuration = plan.timeDuration;
            let extraBulk = 0;
            const toDateInMs = new Date().getTime();
            const fromDateInMs = member.subscriptionDate;
            if (member.extraBulk) {
              extraBulk = member.extraBulk;
            }
            plan.extraBulk = extraBulk;
            Member.getInternetUsage(
              businessId,
              memberId,
              fromDateInMs,
              toDateInMs
            )
              .then(function(usage) {
                if (plan.bulk.value == 0) {
                  // means unlimited
                  plan.bulk.value = -1;
                } else {
                  let currentBulk = Number.parseInt(plan.bulk.value);
                  switch (plan.bulk.type) {
                    case 'KB':
                      extraBulk = utility.convertGBtoKB(extraBulk);
                      currentBulk += extraBulk;
                      currentBulk -= utility.toKByte(usage.bulk).toFixed(0);
                      break;
                    case 'MB':
                      extraBulk = utility.convertGBtoMB(extraBulk);
                      currentBulk += extraBulk;
                      currentBulk -= utility.toMByte(usage.bulk).toFixed(0);
                      break;
                    case 'GB':
                      currentBulk += extraBulk;
                      currentBulk -= utility.toGByte(usage.bulk).toFixed(2);
                      break;
                    default:
                      extraBulk = utility.convertGBtoByte(extraBulk);
                      currentBulk -= usage.bulk;
                  }
                  if (currentBulk < 0) {
                    currentBulk = 0;
                  }
                  plan.bulk.value = currentBulk;
                }
                if (plan.timeDuration > 0) {
                  let currentTime =
                    plan.timeDuration - (usage.sessionTime / 60).toFixed(0);
                  if (currentTime < 0) {
                    currentTime = 0;
                  }
                  plan.timeDuration = currentTime;
                } else if (plan.timeDuration == 0) {
                  // means unlimited
                  plan.timeDuration = -1;
                }
                return cb(null, plan);
              })
              .fail(function(error) {
                log.error(error);
                return cb(error);
              });
          }
        );
      }
    );
  };

  Member.remoteMethod('getMemberBalance', {
    description: 'Calculate Member Internet Plan Balance',
    accepts: [
      {
        arg: 'businessId',
        type: 'string',
        required: true,
      },
      {
        arg: 'memberId',
        type: 'string',
        required: true,
      },
    ],
    returns: {root: true},
  });

  /* logOut hotspot member
	 businessId: String
	 memberId: String
	 */
  Member.logOutHotSpot = function(businessId, memberId, cb) {
    log.debug('@logOutHotSpot');
    if (!businessId) {
      return cb('businessId not defined');
    }
    if (!memberId) {
      return cb('memberId not defined');
    }
    return cb(null, true);
  };

  Member.remoteMethod('logOutHotSpot', {
    description: 'LogOut Hotspot Member',
    accepts: [
      {
        arg: 'businessId',
        type: 'string',
        required: true,
      },
      {
        arg: 'memberId',
        type: 'string',
        required: true,
      },
    ],
    returns: {root: true},
  });

  /* Find Business Id from Member User Name And Business Url Prefix
	 businessUrl: String
	 username: String
	 */
  Member.getBusinessId = function(businessUrl, username, cb) {
    log.debug('@getBusinessId');
    if (!businessUrl) {
      return cb('businessUrl not defined');
    }
    if (!username) {
      return cb('username not defined');
    }
    const Business = app.models.Business;
    Business.find(
      {
        where: {
          urlPrefix: businessUrl,
        },
      },
      function(error, business) {
        if (error) {
          return cb('error in finding business');
        }
        if (!business || business.length <= 0) {
          return cb('business not found');
        }
        if (!business[0].id) {
          return cb('id of business not found');
        }
        const businessId = business[0].id;
        const uniqueUserId = Member.createUsername(businessId, username);
        return cb(null, {username: uniqueUserId});
      }
    );
  };

  Member.extractUsername = function(username) {
    if (!username) {
      return null;
    }
    return username.split('@')[0];
  };

  Member.createUsername = function(usernameSuffix, username) {
    if (!username || !usernameSuffix) {
      return null;
    }
    username = username.toString();
    if (username.indexOf('@') != -1) {
      return username;
    }
    return username + '@' + usernameSuffix;
  };

  Member.remoteMethod('getBusinessId', {
    description:
      'Find Business Id from Member User Name And Business Url Prefix',
    accepts: [
      {
        arg: 'businessUrl',
        type: 'string',
        required: true,
      },
      {
        arg: 'username',
        type: 'string',
        required: true,
      },
    ],
    returns: {root: true},
  });

  /* Find Internet Usage of a Member Base on Daily Interval
	 businessId: String
	 memberId: String
	 */
  Member.getDailyUsage = function(businessId, memberId, startDate, cb) {
    log.debug('@getDailyUsage');
    if (!businessId) {
      return cb('businessId not defined');
    }
    if (!memberId) {
      return cb('memberId not defined');
    }
    if (!startDate) {
      return cb('startDate not defined');
    }
    db.getMemberDailyUsage(businessId, memberId, startDate)
      .then(function(memberUsage) {
        const result = {};
        result.date = [];
        result.download = [];
        result.upload = [];
        if (memberUsage.length > 0) {
          const date = [];
          const download = [];
          const upload = [];
          for (let i = 0; i < memberUsage.length; i++) {
            date.push(memberUsage[i].key);
            download.push(
              utility.toMByte(memberUsage[i].sum_download.value).toFixed(0)
            );
            upload.push(
              utility.toMByte(memberUsage[i].sum_upload.value).toFixed(0)
            );
          }
          result.date = date;
          result.download = download;
          result.upload = upload;
        }
        return cb(null, result);
      })
      .fail(function(error) {
        return cb('error in get daily usage of member');
      });
  };

  Member.remoteMethod('getDailyUsage', {
    description: 'Find Internet Usage of a Member Base on Daily Interval',
    accepts: [
      {
        arg: 'businessId',
        type: 'string',
        required: true,
      },
      {
        arg: 'memberId',
        type: 'string',
        required: true,
      },
      {
        arg: 'startDate',
        type: 'number',
        required: true,
      },
    ],
    returns: {root: true},
  });

  Member.buyPlan = function(businessId, memberId, internetPlanId) {
    return Q.Promise(function(resolve, reject) {
      const Business = app.models.Business;
      const InternetPlan = app.models.InternetPlan;
      Business.findById(businessId).then(function(business) {
        if (!business) {
          return reject('invalid business id');
        }

        if (!business.paymentApiKey) {
          // return reject ( 'invalid business payment panel token' );
          return resolve({
            code: 500,
            url: '/',
          });
        }
        InternetPlan.findById(internetPlanId).then(function(internetPlan) {
          if (!internetPlan) {
            return reject('invalid internet plan id');
          }
          const price = internetPlan.price;
          const desc =
            internetPlan.name +
            internetPlan.type +
            ', ' +
            internetPlan.speed.value +
            internetPlan.speed.type +
            ', ' +
            internetPlan.bulk.value +
            internetPlan.bulk.type;
          const issueDate = new Date().getTime();
          const Invoice = app.models.Invoice;
          Invoice.create(
            {
              price: price,
              planId: internetPlanId,
              payed: false,
              invoiceType: config.BUY_INTERNET_PLAN,
              description: desc,
              issueDate: issueDate,
              businessId: businessId,
              memberId: memberId,
            },
            function(error, invoice) {
              if (error) {
                return reject('Error in create invoice ' + error);
              }
              const returnUrl = config
                .MEMBER_PAYMENT_RETURN_URL()
                .replace('{0}', 'invoiceId')
                .replace('{1}', invoice.id);
              Payment.openPaymentGateway(
                business.paymentApiKey,
                price,
                config.PAYMENT_GATEWAY_INTERNET_PLAN_PAYMENT_DESC,
                business.email,
                business.mobile,
                returnUrl
              )
                .then(function(response) {
                  const paymentId = response.paymentId;
                  invoice.updateAttributes(
                    {
                      paymentId: paymentId,
                    },
                    function(error) {
                      if (error) {
                        return reject('Error in replace invoice ' + error);
                      }
                      return resolve({
                        code: 200,
                        url: response.url,
                      });
                    }
                  );
                })
                .fail(function(error) {
                  return reject('Error in replace payment id ' + error);
                });
            }
          );
        });
      });
    });
  };

  Member.remoteMethod('buyPlan', {
    description: 'InternetPlan Payment By Member',
    accepts: [
      {
        arg: 'businessId',
        type: 'string',
        required: true,
      },
      {
        arg: 'memberId',
        type: 'string',
        required: true,
      },
      {
        arg: 'internetPlanId',
        type: 'string',
        required: true,
      },
    ],
    returns: {root: true},
  });

  Member.verifyPayment = function(invoiceId, refId) {
    return Q.Promise(function(resolve, reject) {
      const Invoice = app.models.Invoice;
      const InternetPlan = app.models.InternetPlan;
      const Business = app.models.Business;
      const returnUrl = config.MEMBER_PAYMENT_RESULT_URL();
      if (!invoiceId) {
        return resolve({
          code: 302,
          returnUrl: returnUrl
            .replace('{0}', 'false')
            .replace('{1}', '&error=No invoice id'),
        });
      }
      Invoice.findById(invoiceId, function(error, invoice) {
        if (error) {
          log.error(error);
          return resolve({
            code: 302,
            returnUrl: returnUrl
              .replace('{0}', 'false')
              .replace('{1}', '&error=Error in finding invoice'),
          });
        }
        if (!invoice) {
          return resolve({
            code: 302,
            returnUrl: returnUrl
              .replace('{0}', 'false')
              .replace('{1}', '&error=Invalid invoice id'),
          });
        }
        const businessId = invoice.businessId;
        const price = invoice.price;
        const invoiceType = invoice.invoiceType;
        Business.findById(businessId).then(function(business) {
          if (!business) {
            return resolve({
              code: 302,
              returnUrl: returnUrl
                .replace('{0}', 'false')
                .replace('{1}', '&error=Invalid business id'),
            });
          }

          if (!business.paymentApiKey) {
            return resolve({
              code: 302,
              returnUrl: returnUrl
                .replace('{0}', 'false')
                .replace('{1}', '&error=Invalid payment token id'),
            });
          }
          Payment.verifyPayment(business.paymentApiKey, refId, price)
            .then(function(verificationResult) {
              log.warn(verificationResult);

              if (verificationResult.payed) {
                const refId = verificationResult.refId;
                invoice.updateAttributes(
                  {
                    payed: true,
                    paymentRefId: refId,
                    paymentDate: new Date().getTime(),
                  },
                  function(error) {
                    if (error) {
                      log.error(error);
                      log.error('Error in update invoice : ', invoice.id);
                      return resolve({
                        code: 302,
                        returnUrl: returnUrl
                          .replace('{0}', 'false')
                          .replace(
                            '{1}',
                            '&error=Error in update invoice with payment reference Id'
                          ),
                      });
                    }
                    log.debug(
                      'Update invoiceId ' +
                      invoiceId +
                      ' with verify payment refId ' +
                      refId
                    );
                    switch (invoiceType) {
                      case config.BUY_INTERNET_PLAN:
                        InternetPlan.assignPlanToMember(
                          invoice.memberId,
                          invoice.planId
                        )
                          .then(function() {
                            log.debug('%%%%%%%%%%%');
                            log.debug(invoice);
                            return resolve({
                              code: 302,
                              returnUrl: returnUrl
                                .replace('{0}', 'true')
                                .replace('{1}', '&desc=success'),
                            });
                          })
                          .fail(function(error) {
                            log.error(error);
                            return resolve({
                              code: 302,
                              returnUrl: returnUrl
                                .replace('{0}', 'false')
                                .replace(
                                  '{1}',
                                  '&error=Error in adding plan to member'
                                ),
                            });
                          });
                        break;
                      case config.BUY_EXTRA_BULK:
                        Member.findById(invoice.memberId).then(function(
                          member
                        ) {
                          if (!invoice) {
                            return resolve({
                              code: 302,
                              returnUrl: returnUrl
                                .replace('{0}', 'false')
                                .replace('{1}', '&error=Invalid member id'),
                            });
                          }
                          const description = invoice.description;
                          let amount = Number.parseInt(
                            description.split(',')[0]
                          );
                          if (member.extraBulk) {
                            amount += Number.parseInt(member.extraBulk);
                          }
                          member.updateAttributes(
                            {
                              extraBulk: amount,
                            },
                            function(error, response) {
                              if (error) {
                                log.error(error);
                                log.error(
                                  'Error in update member : ',
                                  invoice.memberId
                                );
                                return resolve({
                                  code: 302,
                                  returnUrl: returnUrl
                                    .replace('{0}', 'false')
                                    .replace(
                                      '{1}',
                                      '&error=Error in update invoice with payment reference Id'
                                    ),
                                });
                              }
                              if (response) {
                                return resolve({
                                  code: 302,
                                  returnUrl: returnUrl
                                    .replace('{0}', 'true')
                                    .replace('{1}', '&desc=success'),
                                });
                              }
                            }
                          );
                        });
                        break;
                    }
                  }
                );
              } else {
                log.debug('Payment failed ' + invoiceId);
                log.debug(
                  'Payment failed ' +
                  returnUrl.replace('{0}', false).replace('{1}', 'verify')
                );
                return resolve({
                  code: 302,
                  returnUrl: returnUrl
                    .replace('{0}', 'false')
                    .replace('{1}', '&error=Payment failed'),
                });
              }
            })
            .fail(function(error) {
              log.error(error);
              log.error('Error in verify payment invoiceId ' + invoiceId);
              return resolve({
                code: 302,
                returnUrl: returnUrl
                  .replace('{0}', 'false')
                  .replace('{1}', '&error=Error in verifying payment'),
              });
            });
        });
      });
    });
  };

  Member.getMemberSession = function(businessId, nasId, memberIp) {
    return Q.Promise(function(resolve, reject) {
      if (!businessId || !nasId || !memberIp) {
        return reject('invalid parameters !businessId || !nasId || !memberIp');
      }
      const memberSessionKey = businessId + ':' + nasId + ':' + memberIp;
      redisClient.get(memberSessionKey, function(error, rawMemberSession) {
        if (error) {
          log.error(error);
          return;
        }
        if (!rawMemberSession) {
          // log.error ( "no rawMemberSession" );
          return reject('no rawMemberSession');
        }
        let memberSession = {};
        try {
          memberSession = JSON.parse(rawMemberSession);
          return resolve(memberSession);
        } catch (error) {
          return reject(error);
        }
      });
    });
  };

  Member.buyBulk = function(businessId, memberId, internetPlanId, amount) {
    return Q.Promise(function(resolve, reject) {
      const Business = app.models.Business;
      const InternetPlan = app.models.InternetPlan;
      Business.findById(businessId).then(function(business) {
        if (!business) {
          return reject('invalid business id');
        }

        if (!business.paymentApiKey) {
          return reject('invalid business payment panel token');
        }
        InternetPlan.findById(internetPlanId).then(function(internetPlan) {
          if (!internetPlan) {
            return reject('invalid internet plan id');
          }
          const price = Number.parseInt(internetPlan.extraBulkPrice);
          amount = Number.parseInt(amount);
          const totalPrice = amount * price;
          const desc = amount + ', ' + price + ', ' + totalPrice;
          const issueDate = new Date().getTime();
          const Invoice = app.models.Invoice;
          Invoice.create(
            {
              price: totalPrice,
              planId: internetPlanId,
              payed: false,
              invoiceType: config.BUY_EXTRA_BULK,
              description: desc,
              issueDate: issueDate,
              businessId: businessId,
              memberId: memberId,
            },
            function(error, invoice) {
              if (error) {
                return reject('Error in create invoice ' + error);
              }

              const returnUrl = config
                .MEMBER_PAYMENT_RETURN_URL()
                .replace('{0}', 'invoiceId')
                .replace('{1}', invoice.id);
              Payment.openPaymentGateway(
                business.paymentApiKey,
                totalPrice,
                config.PAYMENT_GATEWAY_INTERNET_BULK_PAYMENT_DESC,
                business.email,
                business.mobile,
                returnUrl
              )
                .then(function(response) {
                  const paymentId = response.paymentId;
                  invoice.updateAttributes(
                    {
                      paymentId: paymentId,
                    },
                    function(error) {
                      if (error) {
                        return reject('Error in replace invoice ' + error);
                      }
                      return resolve({
                        code: 200,
                        url: response.url,
                      });
                    }
                  );
                })
                .fail(function(error) {
                  return reject('Error in replace payment id ' + error);
                });
            }
          );
        });
      });
    });
  };
  Member.remoteMethod('buyBulk', {
    description: 'Extra Bulk Payment By Member',
    accepts: [
      {
        arg: 'businessId',
        type: 'string',
        required: true,
      },
      {
        arg: 'memberId',
        type: 'string',
        required: true,
      },
      {
        arg: 'internetPlanId',
        type: 'string',
        required: true,
      },
      {
        arg: 'amount',
        type: 'number',
        required: true,
      },
    ],
    returns: {root: true},
  });

  Member.checkDefaultPlan = function(businessId, memberId, planId, cb) {
    log.debug('@checkDefaultPlan');
    if (!businessId) {
      var error = new Error();
      error.message = hotspotMessages.invalidBusinessId;
      error.status = 500;
      return cb(error);
    }
    if (!memberId) {
      var error = new Error();
      error.message = hotspotMessages.invalidMemberId;
      error.status = 500;
      return cb(error);
    }
    const Business = app.models.Business;
    Business.findById(businessId).then(function(business) {
      if (!business) {
        var error = new Error();
        error.message = hotspotMessages.businessNotFound;
        error.status = 404;
        return cb(error);
      }
      if (!business.defaultInternetPlan.id) {
        var error = new Error();
        error.message = hotspotMessages.defaultInternetPlanIsNotSet;
        error.status = 500;
        return cb(error);
      }
      if (business.defaultInternetPlan.id != planId) {
        return cb(null, true);
      }
      const defaultPlanPeriod = business.defaultInternetPlan.period;
      const defaultPlanCount = business.defaultInternetPlan.count;
      const Member = app.models.Member;
      Member.findById(memberId).then(function(member) {
        if (!business) {
          const error = new Error();
          error.message = hotspotMessages.businessNotFound;
          error.status = 404;
          return cb(error);
        }
        if (!member.activateDefaultPlanCount) {
          return cb(null, true);
        }
        const memberDefaultPlanCount = member.activateDefaultPlanCount;
        const subscriptionDate = member.subscriptionDate;
        const now = new Date().getTime();
        const defaultPlanTime =
          subscriptionDate +
          defaultPlanPeriod * config.AGGREGATE.HOUR_MILLISECONDS;
        if (
          memberDefaultPlanCount < defaultPlanCount ||
          now > defaultPlanTime
        ) {
          return cb(null, true);
        } else {
          return cb(null, false);
        }
      });
    });
  };

  Member.remoteMethod('checkDefaultPlan', {
    accepts: [
      {
        arg: 'businessId',
        type: 'string',
        required: true,
      },
      {
        arg: 'memberId',
        type: 'string',
        required: true,
      },
      {
        arg: 'planId',
        type: 'string',
        required: true,
      },
    ],
    returns: {root: true},
  });
  Member.getAllMembersCount = function(departmentId, fromDate, endDate, ctx) {
    return Q.Promise((resolve, reject) => {
      const businessId = ctx.currentUserId;
      log.debug('@getAllMembersCount : ', businessId);
      const Business = app.models.Business;

      if (!departmentId) {
        return resolve({allMembers: 0});
      }

      Business.findById(businessId).then(function(business) {
        if (!business) {
          log.error('business not found');
          return reject(new Error('invalid business'));
        }
        const query = {
          businessId: businessId,
          creationDate: {gte: business.creationDate, lt: endDate},
        };
        if (departmentId && departmentId !== 'all') {
          query.departments = {eq: departmentId};
        }

        Member.count(
          query,
          function(error, members) {
            if (error) {
              log.error(error);
              return reject(error);
            }
            let allMembers = 0;
            if (members) {
              allMembers = members;
            }
            return resolve({allMembers});
          }
        );
      });
    });
  };

  Member.remoteMethod('getAllMembersCount', {
    description: 'Get All Member Count of Business.',
    accepts: [
      {
        arg: 'departmentId',
        type: 'string',
      },
      {
        arg: 'fromDate',
        type: 'number',
      },
      {
        arg: 'endDate',
        type: 'number',
        required: true,
      },
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    returns: {root: true},
  });

  Member.importMemberFromCsv = function(csvString, internetPlanId, ctx) {
    const Business = app.models.Business;
    const businessId = ctx.currentUserId;
    return Q.Promise(function(resolve, reject) {
      if (!businessId || !csvString) {
        const error = new Error();
        error.message = 'invalid parameters';
        error.status = 500;
        return reject(error);
      }
      Business.findById(businessId).then(function(business) {
        if (!business) {
          log.error('biz not found');
          return reject('biz not found');
        }
        const usersOptions = {};
        // username/password/mobile/nationalId/family/name
        csvtojson({noheader: false})
          .fromString(csvString)
          .on('csv', function(csvRow) {
            const user = {};
            user.username = csvRow[0];
            user.password = csvRow[1];
            if (csvRow[2]) {
              user.mobile = csvRow[2];
              user.mobile = utility.verifyAndTrimMobile(user.mobile);
            }
            user.nationalCode = csvRow[3];
            if (csvRow[4] && !csvRow[5]) {
              user.fullName = csvRow[4];
            } else if (!csvRow[4] && csvRow[5]) {
              user.fullName = csvRow[5];
            } else if (csvRow[4] && csvRow[5]) {
              user.fullName = csvRow[5] + ' ' + csvRow[4];
            }
            user.active = true;
            user.internetPlanId = internetPlanId;
            user.subscriptionDate = new Date().getTime();
            usersOptions[user.username] = user;
          })
          .on('done', function() {
            const addMemberTasks = [];
            for (const i in usersOptions) {
              addMemberTasks.push(
                (function(option, businessId) {
                  return function() {
                    return Member.createNewMember(option, businessId);
                  };
                })(usersOptions[i], businessId)
              );
            }
            let addMemberTaskResult = Q({});
            addMemberTasks.forEach(function(f) {
              addMemberTaskResult = addMemberTaskResult.then(f);
            });
            addMemberTaskResult
              .then(function() {
                return resolve({ok: true});
              })
              .fail(function(error) {
                log.error(error);
                return reject(error);
              });
          });
      });
    });
  };

  Member.remoteMethod('importMemberFromCsv', {
    accepts: [
      {
        arg: 'csvString',
        type: 'string',
        required: true,
      },
      {
        arg: 'internetPlanId',
        type: 'string',
      },
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    returns: {root: true},
  });

  Member.getNewMembersCount = function(departmentId, fromDate, endDate, ctx, cb) {
    const businessId = ctx.currentUserId;
    log.debug('getNewMembersCount : ', businessId);
    const Business = app.models.Business;
    if (!departmentId) {
      return {newMembers: 0};
    }
    Business.findById(businessId).then(function(business) {
      if (!business) {
        log.error('business not found');
        return cb('invalid business');
      }

      const query = {
        businessId: businessId,
        creationDate: {gte: fromDate, lt: endDate},
      };
      if (departmentId && departmentId !== 'all') {
        query.departments = {eq: departmentId};
      }
      Member.count(
        query,
        function(error, members) {
          if (error) {
            log.error(error);
            return cb(error);
          }
          let newMembers = 0;
          if (members) {
            newMembers = members;
          }
          return cb(null, {newMembers: newMembers});
        }
      );
    });
  };

  Member.remoteMethod('getNewMembersCount', {
    description: 'Get New Member Count of Business.',
    accepts: [
      {
        arg: 'departmentId',
        type: 'string',
        required: true,
      }, {
        arg: 'fromDate',
        type: 'number',
        required: true,
      },
      {
        arg: 'endDate',
        type: 'number',
        required: true,
      },
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    returns: {root: true},
  });

  Member.loadProfile = function(nasId, mac) {
    const Nas = app.models.Nas;
    return Q.Promise(function(resolve, reject) {
      mac = utility.trimMac(mac);
      mac = mac.toLowerCase();

      Nas.findById(nasId).then(function(nas) {
        if (!nas) {
          const error = new Error();
          error.message = 'nas not found';
          error.status = 401;
          return reject(error);
        }
        Member.findOne({where: {mac: mac}}, function(error, member) {
          if (error) {
            log.error(error);
            return reject(error);
          }

          if (!member) {
            return resolve({registered: false});
          }

          return resolve({
            registered: true,
            username: Member.extractUsername(member.username),
            password: utility.decrypt(
              member.passwordText,
              config.ENCRYPTION_KEY
            ),
          });
        });
      });
    });
  };

  Member.remoteMethod('loadProfile', {
    description: 'load profile status by mac',
    accepts: [
      {
        arg: 'nasId',
        type: 'string',
        required: true,
      },
      {
        arg: 'mac',
        type: 'string',
        required: true,
      },
    ],
    returns: {root: true},
  });

  Member.renderMemberCredentials = function(membersList, helpText, direction) {
    log.debug('#######$$$$$$');
    log.debug(membersList);
    log.debug('#######');
    return Q.Promise(function(resolve, reject) {
      const maxVouchersPerPage = 14;
      const pagesMembers = _.chunk(membersList, maxVouchersPerPage);
      for (let i = 0; i < pagesMembers.length; i++) {
        pagesMembers[i] = _.chunk(pagesMembers[i], 2);
      }
      fs.readFile(config.VOUCHER_TEMPLATE_PATH, {encoding: 'utf-8'}, function(
        error,
        voucherTemplates
      ) {
        if (error) {
          log.error(error);
          return reject(error);
        }
        dust.loadSource(
          dust.compile(voucherTemplates, 'memberPrintTemplate', false)
        );
        const data = {
          members: pagesMembers,
          help: helpText,
          direction: direction || 'rtl',
        };
        log.debug(data);
        dust.render('memberPrintTemplate', data, function(error, script) {
          if (error) {
            log.error(error);
            return reject(error);
          }
          return resolve(script);
        });
      });
    });
  };

  Member.createMembersByGroup = function(
    businessId,
    reserveCode,
    tourCode,
    mobile,
    passportNumber,
    nationalCode,
    count,
    internetPlanId,
    duration,
    helpLanguageCode,
    ctx,
    cb
  ) {
    log.debug('@create group of member');
    const Business = app.models.Business;
    const MemberGroup = app.models.MemberGroup;
    Business.findById(businessId).then(function(business) {
      if (count > 30) {
        return cb('more than 30 member is not allowed');
      }

      if (
        !mobile &&
        !reserveCode &&
        !tourCode &&
        !nationalCode &&
        !passportNumber
      ) {
        return cb('invalid parameters');
      }

      const counterCurrentValue =
        business.groupMemberCounter ||
        config.BUSINESS_GROUP_MEMBER_COUNTER_START;
      const counterNewValue = counterCurrentValue + count;
      business.updateAttributes(
        {
          groupMemberCounter: counterNewValue,
        },
        function(error) {
          if (error) {
            log.error(error);
            return cb(error);
          }
          let groupIdentityType;
          if (mobile) {
            groupIdentityType = 'Mobile';
          } else if (reserveCode) {
            groupIdentityType = 'Reserve Code';
          } else if (tourCode) {
            groupIdentityType = 'Tour Code';
          } else if (nationalCode) {
            groupIdentityType = 'National Code';
          } else if (passportNumber) {
            groupIdentityType = 'Passport Number';
          } else {
            return cb('Group identity type is empty');
          }
          const memberGroupData = {
            groupIdentity:
              mobile ||
              reserveCode ||
              tourCode ||
              nationalCode ||
              passportNumber,
            mobile: mobile,
            tourCode: tourCode,
            groupIdentityType: groupIdentityType,
            reserveCode: reserveCode,
            nationalCode: nationalCode,
            passportNumber: passportNumber,
            businessId: businessId,
            creationDate: new Date().getTime(),
          };
          MemberGroup.create(memberGroupData, function(error, memberGroup) {
            if (error) {
              log.error(error);
              return cb(error);
            }
            log.error('memberGroup');
            log.error(memberGroup);
            const tasks = [];
            for (let i = counterCurrentValue; i < counterNewValue; i++) {
              tasks.push(
                (function(j) {
                  return function(memberList) {
                    const expiresAt = new Date();
                    expiresAt.add({days: duration + 1});
                    expiresAt.clearTime();
                    const options = {
                      businessId: businessId,
                      active: true,
                      sendVerificationSms: false,
                      internetPlanId: internetPlanId,
                      groupIdentity: memberGroup.groupIdentity,
                      groupIdentityId: memberGroup.id,
                      groupIdentityType: memberGroup.groupIdentityType,
                      expiresAt: expiresAt,
                      username: (business.groupMemberPrefix || 'b') + j,
                      password: utility.createRandomHotspotPassword(),
                    };
                    return Member.createNewMember(options, businessId).then(
                      function(theMember) {
                        memberList.push(theMember);
                        return memberList;
                      }
                    );
                  };
                })(i)
              );
            }
            let result = Q([]);
            tasks.forEach(function(f) {
              result = result.then(f);
            });
            result
              .then(function(result) {
                let help = config.DEFAULT_HOTSPOT_HELP;
                let direction = 'rtl';
                if (helpLanguageCode === 'en') {
                  direction = 'ltr';
                }
                if (
                  business.groupMemberHelps &&
                  helpLanguageCode &&
                  business.groupMemberHelps[helpLanguageCode]
                ) {
                  help = business.groupMemberHelps[helpLanguageCode];
                }
                Member.renderMemberCredentials(result, help, direction)
                  .then(function(renderedHtmlAsString) {
                    return cb(null, {html: renderedHtmlAsString});
                  })
                  .fail(function(error) {
                    log.error(error);
                    return cb(error);
                  });
              })
              .fail(function(error) {
                log.error(error);
                return cb(error);
              });
          });
        }
      );
    });
  };

  Member.remoteMethod('createMembersByGroup', {
    returns: {root: true},
    accepts: [
      {
        arg: 'businessId',
        type: 'string',
        required: true,
      }, {
        arg: 'reserveCode',
        type: 'string',
      },
      {
        arg: 'tourCode',
        type: 'string',
      },
      {
        arg: 'mobile',
        type: 'string',
      },
      {
        arg: 'passportNumber',
        type: 'string',
      },
      {
        arg: 'nationalCode',
        type: 'string',
      },
      {
        arg: 'count',
        type: 'number',
        required: true,
      },
      {
        arg: 'internetPlanId',
        type: 'string',
        required: true,
      },
      {
        arg: 'duration',
        type: 'number',
      },
      {
        arg: 'helpLanguageCode',
        type: 'string',
      },
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
  });

  Member.loadById = async function(id) {
    const cachedMember = await cacheManager.getMember(id);
    if (cachedMember) {
      return cachedMember;
    }
    const member = await Member.findById(id);
    log.warn('from db...', member);
    cacheManager.cacheMember(id, member);
    return member;
  };
};
