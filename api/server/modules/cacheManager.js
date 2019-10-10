const config = require('./config')
var redis = require('promise-redis')()
const logger = require('./logger')
const log = logger.createLogger()

var redisClient = redis.createClient(
  process.env.REDIS_PORT,
  process.env.REDIS_IP
)

const cacheIt = async (id, jsonData) => {
  try {
    if (jsonData && id) {
      const data = JSON.stringify(jsonData)
      id = id.toString()
      const result = await redisClient.set(id, data)
      await redisClient.expire(id, config.APP_CACHE_TTL)
      log.debug('cached in ', result)
    }
  } catch (e) {
    log.error('failed to stringify json to cache')
  }
}
const clearCache = async (id) => {
  if (id) {
    log.debug(`going to clear up cache for id: ${id}`)
    await redisClient.del(id.toString())
    log.debug('cleared up', result)
  }
}

const readFromCache = async (id) => {
  if (!id) {
    return
  }
  id = id.toString()
  const data = await redisClient.get(id)
  if (data) {
    try {
      log.debug('reading from cache:', id)
      return JSON.parse(data)
    } catch (e) {
      log.error(`failed to parse data from cache id ${id}`)
    }
  }
}

const addMemberUsage = async (options) => {
  log.error('@addMemberUsage', options)
  if (options.memberId || options.sessionId) {
    log.debug('going to add member usage to cache', options)
    const {memberId, sessionId, download, upload, sessionTime} = options
    await redisClient.hincrby(memberId, `${sessionId}:download`, download)
    await redisClient.hincrby(memberId, `${sessionId}:upload`, upload)
    await redisClient.hincrby(memberId, `${sessionId}:sessionTime`, sessionTime)
    await redisClient.expire(memberId, 3600)
  }
}

const getMemberUsage = async (memberId) => {
  log.error('@getMemberUsage ', memberId)
  const result = await redisClient.hgetall(memberId)
  if (!result) {
    return null
  }
  log.debug('loading usage from cache ', result)
  const keys = Object.keys(result)
  const allUsage = {}
  for (const key of keys) {
    const value = result[key]
    const keyParts = key.split(':')
    const sessionId = keyParts[0]
    const propName = keyParts[1]
    allUsage[sessionId] = allUsage[sessionId] || {}
    allUsage[sessionId][propName] = value
  }
  return Object.keys(allUsage).map((key) => {
    return {...allUsage[key], sessionId: key}
  })
}

module.exports = {
  addMemberUsage,
  getMemberUsage,
  cacheIt,
  clearCache,
  readFromCache
}