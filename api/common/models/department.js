'use strict'
const app = require('../../server/server')
const logger = require('../../server/modules/logger')

module.exports = function (Department) {
  const log = logger.createLogger()

  Department.observe('before delete', async function (ctx) {
    const Member = app.models.Member
    const instance = ctx.instance
    log.debug({instance})
    const affectedMembers = await Member.find({
      where: {
        departments: {
          eq: instance.id.toString()
        }
      }
    })
    if (affectedMembers.length > 0) {
      const error = new Error()
      error.message = 'has related members'
      error.status = 400
      throw error
    }
    return
  })

}
