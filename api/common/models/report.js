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
      const httpClient = HttpClient(process.env.REPORT_SERVICE_URL);
      const response = await httpClient.post('/api/report/create', report)
      log.debug(response.data)
      return next()
    } else {
      return next()
    }
  })

}
