'use strict'

const config = require('../../server/modules/config')
var logger = require('../../server/modules/logger')
var app = require('../../server/server')
var utility = require('../../server/modules/utility')
var HttpClient = require('../../server/modules/httpClient')
var Q = require('q')

if (!process.env.REPORT_SERVICE_URL) {
  throw new Error('invalid REPORT_SERVICE_URL')
}

module.exports = function (Report) {
  var log = logger.createLogger()
  Report.observe('after save', async (ctx, next) => {
    if (ctx.isNewInstance) {
      var report = ctx.instance
      log.debug(report)
      const httpClient = HttpClient(process.env.REPORT_SERVICE_URL)
      const response = await httpClient.post('/api/report/create', report)
      log.debug(response.data)
      return next()
    } else {
      return next()
    }
  })

  Report.searchNetflow = async (type, businessId, departments, from, to, username, srcAddress, srcPort, dstAddress, dstPort, limit, skip, sort, ctx) => {
    const httpClient = HttpClient(process.env.REPORT_SERVICE_URL)
    const response = await httpClient.post('/api/netflow/search', {
      type, businessId, departments, from, to, username, srcAddress, srcPort, dstAddress, dstPort,limit,skip,sort
    })
    return response.data
  }

  Report.remoteMethod('searchNetflow', {
    description: 'Search netflow',
    accepts: [
      {arg: 'type', type: 'string'},
      {arg: 'businessId', type: 'string'},
      {arg: 'departments', type: ['string']},
      {arg: 'from', type: 'number'},
      {arg: 'to', type: 'number'},
      {arg: 'username', type: 'string'},
      {arg: 'srcAddress', type: 'string'},
      {arg: 'srcPort', type: 'string'},
      {arg: 'dstAddress', type: 'string'},
      {arg: 'dstPort', type: 'string'},
      {arg: 'limit', type: 'number', required: true},
      {arg: 'skip', type: 'number', required: true},
      {arg: 'sort', type: 'string'},
      {arg: 'options', type: 'object', http: 'optionsFromRequest'}
    ],
    returns: {root: true},
  })
}
