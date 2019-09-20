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

    if (type === 'json') {
      const httpClient = HttpClient(process.env.REPORT_SERVICE_URL)
      const response = await httpClient.get('/api/netflow/search', {
        params: {
          type, businessId, departments, from, to, username, srcAddress, srcPort, dstAddress, dstPort, limit, skip, sort
        }
      })
      return response.data
    } else {
      const response = await Axios({
        url: `${process.env.REPORT_SERVICE_URL}api/netflow/search`,
        method: 'get',
        responseType: 'stream',
        params: {
          type, businessId, departments, from, to, username, srcAddress, srcPort, dstAddress, dstPort, limit, skip, sort
        }
      })

      const writer = fs.createWriteStream('/files')
      response.data.pipe(writer)

      writer.on('finish', () => {
        log.debug('report saved')
        return {ok: true}
      })

      writer.on('error', () => {
        log.error('report failed to save')
      })
    }
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
      {arg: 'limit', type: 'number'},
      {arg: 'skip', type: 'number'},
      {arg: 'sort', type: 'string'},
      {arg: 'options', type: 'object', http: 'optionsFromRequest'}
    ],
    http: {
      verb: 'get'
    },
    returns: {root: true},
  })
}
