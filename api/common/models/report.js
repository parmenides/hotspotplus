'use strict'

const config = require('../../server/modules/config')
var logger = require('../../server/modules/logger')
var app = require('../../server/server')
var utility = require('../../server/modules/utility')
var HttpClient = require('../../server/modules/httpClient')
var Q = require('q')

const fs = require('fs')
const Path = require('path')
const Axios = require('axios')
const util = require('util')

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

  Report.search = async (report, type, businessId, departments, from, to, username, srcAddress, srcPort, dstAddress, dstPort, limit, skip, sort, ctx) => {
    if (type === 'json') {
      const httpClient = HttpClient(process.env.REPORT_SERVICE_URL)
      const response = await httpClient.get(`/api/${report}/search`, {
        params: {
          type, businessId, departments, from, to, username, srcAddress, srcPort, dstAddress, dstPort, limit, skip, sort
        }
      })
      return response.data
    } else {
      const HTTP_TIME_OUT = 1000* 60;
      var BigFile = app.models.BigFile
      const result = await Axios({
        url: `${process.env.REPORT_SERVICE_URL}api/${report}/search`,
        timeout: HTTP_TIME_OUT,
        method: 'get',
        responseType: 'stream',
        params: {
          type, businessId, departments, from, to, username, srcAddress, srcPort, dstAddress, dstPort, limit, skip, sort
        }
      })

      let fileName = `${new Date()}-${Date.now()}`
      if (type === 'excel') {
        fileName = `${Date.now()}.xlsx`
      }
      const container = 'reports'
      const writer = BigFile.uploadStream(container, fileName)
      await result.data.pipe(writer)
      return {
        container,
        fileName
      }
    }
  }

  Report.remoteMethod('search', {
    description: 'Search reports',
    accepts: [
      {arg: 'report', type: 'string', required: true},
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
      {arg: 'limit', type: 'number'},
      {arg: 'skip', type: 'number'},
      {arg: 'sort', type: 'string'},
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},

    ],
    returns: {root: true},
    http: {
      verb: 'get'
    }
  })
}
