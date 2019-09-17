'use strict'
var logger = require('../../server/modules/logger')
var app = require('../../server/server')
var config = require('../../server/modules/config')
var utility = require('../../server/modules/utility')
var Payment = require('../../server/modules/payment')
var request = require('request')
var Q = require('q')
const uuid = require('uuid')
const log = logger.createLogger()

module.exports = function (Operator) {

  Operator.observe('after save', async (ctx) => {
    var Role = app.models.Role
    if (ctx.isNewInstance) {
      var operatorId = ctx.instance.id
      const role = await Role.findOne({where: {name: config.ROLES.OPERATOR}})
      log.error({role});
      await role.principals.create({principalType: 'USER', principalId: operatorId})
    }
  })

  Operator.observe('before save', async (ctx) => {
    let user

    if (ctx.instance) {
      user = ctx.instance
    } else if (ctx.data) {
      user = ctx.data
    }
    if (user) {
      user.username = Operator.createUsername(
        user.businessId,
        user.username
      )
      user.email = user.username
      if (!user.password) {
        user.password = uuid.v4()
      }
    }
  })

  Operator.extractUsername = function (username) {
    if (!username) {
      return null
    }
    return username.split('@')[0]
  }

  Operator.createUsername = function (businessId, username) {
    if (!username || !businessId) {
      return null
    }
    username = username.toString()
    if (username.indexOf('@') != -1) {
      return username
    }
    return username + '@' + businessId
  }
}
