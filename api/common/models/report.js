'use strict'

const config = require('../../server/modules/config')
const logger = require('../../server/modules/logger')
const app = require('../../server/server')
const utility = require('../../server/modules/utility')
const HttpClient = require('../../server/modules/httpClient')
const Q = require('q')

const fs = require('fs')
const Path = require('path')
const Axios = require('axios')
const util = require('util')

if (!process.env.REPORT_SERVICE_URL) {
  throw new Error('invalid REPORT_SERVICE_URL')
}

module.exports = function (Report) {
  const log = logger.createLogger()
  Report.observe('after save', async (ctx, next) => {
    if (ctx.isNewInstance) {
      const report = ctx.instance
      log.debug(report)
      const httpClient = HttpClient(process.env.REPORT_SERVICE_URL)
      const response = await httpClient.post('/api/report/create', report)
      log.debug(response.data)
      return next()
    } else {
      return next()
    }
  })

  Report.searchNetflow = async (report, type, businessId, departments, from, to, username, srcAddress, srcPort, dstAddress, dstPort, limit, skip, sort) => {
    const result = await Report.search({
      report,
      type,
      businessId,
      departments,
      from,
      to,
      username,
      srcAddress,
      srcPort,
      dstAddress,
      dstPort,
      limit,
      skip,
      sort,
    })
    return result
  }

  Report.searchDns = async (report, type, aggregate, businessId, departments, from, to, username, domain, limit, skip, sort) => {
    const result = await Report.search({
      report,
      type,
      aggregate,
      businessId,
      departments,
      from,
      to,
      username,
      domain,
      limit,
      skip,
      sort,
    })
    return result
  }

  Report.remoteMethod('searchDns', {
    description: 'Search Dns',
    accepts: [
      {arg: 'report', type: 'string', required: true},
      {arg: 'type', type: 'string'},
      {arg: 'aggregate', type: 'boolean'},
      {arg: 'businessId', type: 'string'},
      {arg: 'departments', type: ['string']},
      {arg: 'from', type: 'number'},
      {arg: 'to', type: 'number'},
      {arg: 'username', type: 'string'},
      {arg: 'domain', type: 'string'},
      {arg: 'limit', type: 'number'},
      {arg: 'skip', type: 'number'},
      {arg: 'sort', type: 'string'},
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},

    ],
    returns: {root: true},
    http: {
      verb: 'get',
    },
  })

  Report.searchWebProxy = async (report, type, businessId, departments, from, to, username, domain, url, limit, skip, sort) => {
    const result = await Report.search({
      report,
      type,
      businessId,
      departments,
      from,
      to,
      username,
      domain,
      url,
      limit,
      skip,
      sort,
    })
    return result
  }

  Report.remoteMethod('searchWebProxy', {
    description: 'Search WebProxy',
    accepts: [
      {arg: 'report', type: 'string', required: true},
      {arg: 'type', type: 'string'},
      {arg: 'businessId', type: 'string'},
      {arg: 'departments', type: ['string']},
      {arg: 'from', type: 'number'},
      {arg: 'to', type: 'number'},
      {arg: 'username', type: 'string'},
      {arg: 'domain', type: 'string'},
      {arg: 'url', type: 'string'},
      {arg: 'limit', type: 'number'},
      {arg: 'skip', type: 'number'},
      {arg: 'sort', type: 'string'},
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},

    ],
    returns: {root: true},
    http: {
      verb: 'get',
    },
  })

  Report.search = async (options) => {
    const {type, report, from} = options
    if (type === 'json') {
      const httpClient = HttpClient(process.env.REPORT_SERVICE_URL)
      const response = await httpClient.get(`/api/${report}/search`, {
        params: options,
      })
      return response.data
    } else {
      const HTTP_TIME_OUT = 1000 * 60 * 2
      const BigFile = app.models.BigFile
      const result = await Axios({
        url: `${process.env.REPORT_SERVICE_URL}/api/${report}/search`,
        timeout: HTTP_TIME_OUT,
        method: 'get',
        responseType: 'stream',
        params: options,
      })

      log.debug(`Report status ${result.status}`)
      let current_datetime = new Date()
      let fileName = `${current_datetime.getFullYear()}-${current_datetime.getMonth() + 1}-${current_datetime.getDate()}-${current_datetime.getHours()}-${current_datetime.getMinutes()}-${current_datetime.getSeconds()}-${type}`
      if (type === 'excel') {
        fileName = `${fileName}.xlsx`
      } else if (type === 'csv') {
        fileName = `${fileName}.csv`
      }
      const container = 'reports'
      const writer = BigFile.uploadStream(container, fileName)
      await result.data.pipe(writer)
      return {
        container,
        fileName,
      }
    }
  }

  Report.remoteMethod('searchNetflow', {
    description: 'Search Netflow',
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
      verb: 'get',
    },
  })
}
