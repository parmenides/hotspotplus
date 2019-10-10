var app = require('../../server/server')
var utility = require('../../server/modules/utility')
var Q = require('q')
var config = require('../../server/modules/config.js')
var logger = require('../../server/modules/logger')
var log = logger.createLogger()
var hotspotMessages = require('../../server/modules/hotspotMessages')
const cacheManager = require('../../server/modules/cacheManager')

module.exports = function (InternetPlan) {
  InternetPlan.observe('after save', function (ctx, next) {
    if (ctx.instance) {
      const entity = ctx.instance
      cacheManager.clearCache(entity.id)
    }
    next()
  })

  InternetPlan.loadById = async function (id) {
    const cachedInternetPlan = await cacheManager.readFromCache(id)
    if (cachedInternetPlan) {
      return cachedInternetPlan
    }
    const plan = await InternetPlan.findById(id)
    log.warn('from db...', plan)
    cacheManager.cacheIt(id, plan)
    return plan
  }

  InternetPlan.assignPlanToMember = async function (memberId, planId, isFree) {
    log.debug('@assignPlanToMember')
    const Member = app.models.Member

    const plan = await InternetPlan.findById(planId)
    if (isFree && plan.price !== 0) {
      throw new Error('not a free plan', planId)
    }
    const member = await Member.findById(memberId)
    await member.updateAttributes({
      internetPlanId: plan.id,
      internetPlanName: plan.name,
      subscriptionDate: Date.now(),
      activateDefaultPlanCount: 0,
      extraBulk: 0
    })
    await InternetPlan.updateInternetPlanHistory(memberId, planId)
    log.debug('plan assigned')
    return {ok:true}
  }

  InternetPlan.calculatePreviewsPlanUsage = async (businessId, memberId, previousPlan) => {
    const Member = app.models.Member
    if (!previousPlan) {
      return
    }
    const to = (new Date()).getTime()
    const usageReport = await Member.getInternetUsage(businessId, memberId, previousPlan.assignDate, to)
    log.debug({usageReport})
    previousPlan.totalUsage = usageReport.bulk || 0
    return previousPlan
  }

  InternetPlan.updateInternetPlanHistory = async function (memberId, planId) {
    log.debug('@updateInternetPlanHistory')
    const Member = app.models.Member
    const plan = await InternetPlan.findById(planId);
    if (!plan) {
      log.error('no such plan')
      throw new Error('plan not found ', planId)
    }
    const member = await Member.findById(memberId);
    let internetPlanHistory = member.internetPlanHistory || []
    const oldPlan = await InternetPlan.calculatePreviewsPlanUsage(member.businessId, memberId, internetPlanHistory.pop());
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
    await member.updateAttributes({internetPlanHistory: internetPlanHistory})
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

  InternetPlan.assignFreePlanToMember = async function (memberId, planId) {
    log.debug('@assignFreePlanToMember')
    await InternetPlan.assignPlanToMember(memberId, planId, true)
    return {ok:true}
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
