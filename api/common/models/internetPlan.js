var app = require('../../server/server')
var utility = require('../../server/modules/utility')
var Q = require('q')
var config = require('../../server/modules/config.js')
var logger = require('../../server/modules/logger')
var log = logger.createLogger()
var hotspotMessages = require('../../server/modules/hotspotMessages')
const hspCache = require('../../server/modules/hspCache')

module.exports = function (InternetPlan) {
  InternetPlan.observe('after save', function (ctx, next) {
    var Business = app.models.Business
    if (ctx.isNewInstance) {
      var plan = ctx.instance
      //Business.updateBusinessHistoryActivity ( plan.businessId, { name: "Internet plan created" } );
      next()
    } else {
      next()
    }
  })

  InternetPlan.loadById = async function (id) {
    const cachedInternetPlan = await hspCache.readFromCache(id)
    if (cachedInternetPlan) {
      return cachedInternetPlan
    }
    const plan = await InternetPlan.findById(id)
    log.warn('from db...', plan)
    hspCache.cacheIt(id, plan)
    return plan
  }

  InternetPlan.assignPlanToMember = function (memberId, planId, isFree) {
    log.debug('@assignPlanToMember')
    var Member = app.models.Member
    return Q.Promise(function (resolve, reject) {
      InternetPlan.findById(planId).then(function (plan) {
        if (!plan) {
          log.error('no such plan')
          return reject('plan not found ', planId)
        }

        if (isFree && plan.price !== 0) {
          return reject('not a free plan', planId)
        }

        Member.findById(memberId).then(function (member) {
          if (!member) {
            log.error('member not found')
            return reject('member not found')
          }
          if (!member.businessId || !plan.businessId) {
            return reject('invalid business id')
          }

          if (member.businessId.toString() !== plan.businessId.toString()) {
            return reject('member and business plan mismatch')
          }
          var Business = app.models.Business
          Business.findById(member.businessId).then(function (business) {
            if (!business) {
              log.error('business not found')
              return reject('business not found')
            }
            var dateNow = new Date().getTime()
            var subscriptionDate = dateNow
            var activateDefaultPlanCount = 0
            if (
              isFree &&
              (business.defaultInternetPlan &&
                business.defaultInternetPlan.id) &&
              plan.id == business.defaultInternetPlan.id
            ) {
              activateDefaultPlanCount = 1
              if (member.activateDefaultPlanCount) {
                activateDefaultPlanCount = member.activateDefaultPlanCount || 0
                var period =
                  business.defaultInternetPlan.period *
                  config.AGGREGATE.HOUR_MILLISECONDS
                if (member.subscriptionDate) {
                  subscriptionDate = new Date(
                    member.subscriptionDate
                  ).getTime()
                }
                var expireTime = subscriptionDate + period
                if (
                  expireTime > dateNow &&
                  member.activateDefaultPlanCount <
                  business.defaultInternetPlan.count
                ) {
                  activateDefaultPlanCount =
                    member.activateDefaultPlanCount + 1
                } else if (expireTime < dateNow) {
                  subscriptionDate = dateNow
                } else {
                  log.error('default plan activated too many times')
                  return reject('default plan activated too many times')
                }
              }
            }

            /*var internetPlanHistory = member.internetPlanHistory || [];
						var newPlan = plan;
						newPlan.assignDate = new Date ().getTime ();
						internetPlanHistory.push ( newPlan );
*/
            member.updateAttributes(
              {
                internetPlanId: plan.id,
                internetPlanName: plan.name,
                subscriptionDate: subscriptionDate,
                activateDefaultPlanCount: activateDefaultPlanCount,
                extraBulk: 0
              },
              function (error, result) {
                if (error) {
                  log.error(error)
                  return reject(error)
                }
                InternetPlan.updateInternetPlanHistory(memberId, planId)
                  .then(function () {
                    log.debug('plan assigned :', result)
                    return resolve()
                  })
                  .fail(function (error) {
                    log.error(error)
                    return reject(error)
                  })
              }
            )
          })
        })
      })
    })
  }

  InternetPlan.calculatePreviewsPlanUsage = (businessId, memberId, previousPlan) => {
    var Member = app.models.Member
    return Q.Promise((resolve, reject) => {
      log.debug('//////////')
      log.debug(memberId)
      log.debug(businessId)
      log.debug(previousPlan)
      if (previousPlan) {
        const to = (new Date()).getTime()
        Member.getInternetUsage(businessId, memberId, previousPlan.assignDate, to).then((usageReport) => {
          log.debug(usageReport)
          previousPlan.totalUsage = usageReport.bulk || 0
          return resolve(previousPlan)
        }).fail((error) => {
          log.error(error)
          return reject('failed to load old plan usage ')
        })
      } else {
        return resolve()
      }
    })
  }

  InternetPlan.updateInternetPlanHistory = function (memberId, planId) {
    log.debug('@updateInternetPlanHistory')
    var Member = app.models.Member
    return Q.Promise(function (resolve, reject) {
      InternetPlan.findById(planId).then(function (plan) {
        if (!plan) {
          log.error('no such plan')
          return reject('plan not found ', planId)
        }

        Member.findById(memberId).then(function (member) {
          if (!member) {
            log.error('member not found')
            return reject('member not found')
          }

          var internetPlanHistory = member.internetPlanHistory || []
          InternetPlan.calculatePreviewsPlanUsage(member.businessId, memberId, internetPlanHistory.pop()).then((oldPlan) => {
            if (oldPlan) {
              internetPlanHistory.push(oldPlan)
            }
            var newPlan = plan
            newPlan.assignDate = new Date().getTime()
            internetPlanHistory.push(newPlan)
            if (internetPlanHistory.length > 20) {
              internetPlanHistory = internetPlanHistory.splice(
                internetPlanHistory.length - 20
              )
            }
            member.updateAttributes(
              {
                internetPlanHistory: internetPlanHistory
              },
              function (error, result) {
                if (error) {
                  log.error(error)
                  return reject(error)
                }
                log.debug('internet plan history update result:', result)
                return resolve()
              }
            )
          }).fail((error) => {
            log.error(error)
            return reject('failed to add old plan usage')
          })
        })
      })
    })
  }

  InternetPlan.remoteMethod('assignPlanToMember', {
    accepts: [
      {
        arg: 'memberId',
        type: 'string',
        required: true
      },
      {
        arg: 'planId',
        type: 'string',
        required: true
      },
      {
        arg: 'isFree',
        type: 'boolean'
      },
      {
        arg: 'byBusiness',
        type: 'boolean'
      }
    ],
    returns: {root: true}
  })

  InternetPlan.assignFreePlanToMember = function (memberId, planId, clbk) {
    log.debug('@assignFreePlanToMember')
    InternetPlan.assignPlanToMember(memberId, planId, true)
      .then(function () {
        return clbk(null, {ok: true})
      })
      .fail(function (error) {
        log.error(error)
        return clbk(error)
      })
  }

  InternetPlan.remoteMethod('assignFreePlanToMember', {
    accepts: [
      {
        arg: 'memberId',
        type: 'string',
        required: true
      },
      {
        arg: 'planId',
        type: 'string',
        required: true
      }
    ],
    returns: {root: true}
  })

  InternetPlan.getPublicInternetPlans = function (businessId, clbk) {
    log.debug('@getPublicInternetPlans')
    if (!businessId) {
      var error = new Error()
      error.message = hotspotMessages.invalidBusinessId
      error.status = 404
      return clbk(error)
    }
    InternetPlan.find(
      {
        where: {
          and: [
            {businessId: businessId},
            {accessType: config.PUPLIC_INTERNET_PLAN}
          ]
        }
      },
      function (error, internetPlans) {
        if (error) {
          log.error(error)
          return clbk(error)
        }
        return clbk(null, internetPlans)
      }
    )
  }

  InternetPlan.remoteMethod('getPublicInternetPlans', {
    accepts: [
      {
        arg: 'businessId',
        type: 'string',
        required: true
      }
    ],
    returns: {root: true}
  })
}
