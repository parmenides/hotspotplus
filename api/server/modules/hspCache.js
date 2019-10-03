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
    const data = JSON.stringify(jsonData)
    id = id.toString()
    await redisClient.set(id, data)
    await redisClient.expire(id, config.APP_CACHE_TTL)
  } catch (e) {
    log.error('failed to stringify json to cache')
  }
}
const clearCache = async (id) => {
  if (id) {
    log.debug(`going to clear up cache for id: ${id}`)
    return redisClient.del(id)
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
      return JSON.parse(data)
    } catch (e) {
      log.error(`failed to parse data from cache id ${id}`)
    }
  }
}

module.exports = {
  cacheIt,
  clearCache,
  readFromCache
}