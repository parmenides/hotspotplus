const config = require('./config')
const redis = require('promise-redis')()
const logger = require('./logger')
const log = logger.createLogger()

const redisClient = redis.createClient(
  process.env.REDIS_PORT,
  process.env.REDIS_IP
)

const createUsageCacheId = (memberId) => {
  return `usage:${memberId}`
}

const clearMemberUsage = async (id) => {
  if (id) {
    await redisClient.del(createUsageCacheId(id.toString()))
  }
}

const cacheMemberUsage = async (options) => {
  if (options.memberId || options.sessionId) {
    const {memberId, sessionId, download, upload, sessionTime} = options
    await redisClient.hincrby(createUsageCacheId(memberId), `${sessionId}:download`, download)
    await redisClient.hincrby(createUsageCacheId(memberId), `${sessionId}:upload`, upload)
    await redisClient.hincrby(createUsageCacheId(memberId), `${sessionId}:sessionTime`, sessionTime)
    await redisClient.expire(createUsageCacheId(memberId), 3600 * 24)
  }
}

const getMemberUsage = async (memberId) => {
  const result = await redisClient.hgetall(createUsageCacheId(memberId))
  if (!result) {
    return null
  }
  const keys = Object.keys(result)
  const allUsage = {}
  for (const key of keys) {
    const value = result[key]
    const keyParts = key.split(':')
    const sessionId = keyParts[0]
    const propName = keyParts[1]
    allUsage[sessionId] = allUsage[sessionId] || {}
    allUsage[sessionId][propName] = Number(value)
  }
  return Object.keys(allUsage).map((key) => {
    return {...allUsage[key], sessionId: key}
  })
}

const simpleCacheManagerFactory = (options) => {
  const {redisClient, ttl, prefix} = options
  return {
    add: async (id, jsonData) => {
      if (jsonData && id) {
        const data = JSON.stringify(jsonData)
        id = id.toString()
        const key = `${prefix}${id}`
        await redisClient.set(key, data)
        await redisClient.expire(key, ttl)
      }
    },
    clear: async (id) => {
      const key = `${prefix}${id.toString()}`
      await redisClient.del(key)
    },
    get: async (id) => {
      const key = `${prefix}${id.toString()}`
      const data = await redisClient.get(key)
      return data ? JSON.parse(data) : null
    },
  }
}

const listCacheManagerFactory = (options) => {
  const {ttl, parentCacheIdCreator, childCacheIdCreator, redisClient} = options
  return {
    add: async (parentId, childId, data) => {
      if (parentId && childId) {
        await redisClient.set(childCacheIdCreator(childId), JSON.stringify(data))
        await redisClient.expire(childCacheIdCreator(childId), ttl)
        const key = parentCacheIdCreator(parentId)
        await redisClient.sadd(key, childCacheIdCreator(childId))
      }
    },
    clear: async (id) => {
      if (id) {
        await redisClient.del(parentCacheIdCreator(id))
      }
    },
    load: async (parentId, filter) => {
      if (parentId) {
        const key = parentCacheIdCreator(parentId)
        const childIds = await redisClient.smembers(key)
        if (childIds.length === 0) {
          return []
        }
        const dataItems = await redisClient.mget(childIds)

        const notNullItems = dataItems.filter((item) => {
          return (item && item !== undefined && item !== null)
        })
        return notNullItems.map((value) => {
          const data = JSON.parse(value)
          if (filter) {
            return filter(data)
          } else {
            return data
          }
        })
      }
    },
  }
}

const memberSessionCacheManager = listCacheManagerFactory({
  ttl: Math.round((Number(config.DEFAULT_ACCOUNTING_UPDATE_INTERVAL_SECONDS)) + 60),
  parentCacheIdCreator: (memberId) => {
    return `member:session:list:${memberId}`
  },
  childCacheIdCreator: (sessionId) => {
    return `member:session:${sessionId}`
  },
  redisClient,
})

const businessSessionCacheManager = listCacheManagerFactory({
  ttl: Math.round((Number(config.DEFAULT_ACCOUNTING_UPDATE_INTERVAL_SECONDS)) + 60),
  parentCacheIdCreator: (businessId) => {
    return `business:session:${businessId}`
  },
  childCacheIdCreator: (sessionId) => {
    return `business:session:${sessionId}`
  },
  redisClient,
})

const memberCacheManager = simpleCacheManagerFactory({
  ttl: config.APP_CACHE_TTL,
  prefix: 'member:',
  redisClient,
})

const memberByUsernameCacheManager = simpleCacheManagerFactory({
  ttl: config.APP_CACHE_TTL,
  prefix: 'business:username:',
  redisClient,
})

const nasCacheManager = simpleCacheManagerFactory({
  ttl: config.APP_CACHE_TTL,
  prefix: 'nas:',
  redisClient,
})

const businessCacheManager = simpleCacheManagerFactory({
  ttl: config.APP_CACHE_TTL,
  prefix: 'business:',
  redisClient,
})

const internetPlanCacheManager = simpleCacheManagerFactory({
  ttl: config.APP_CACHE_TTL,
  prefix: 'internetPlan:',
  redisClient,
})

const createMemberByUsernameCacheId = (businessId, username) => {
  return `${businessId}:${username}`
}

module.exports = {

  getBusinessSessions: businessSessionCacheManager.load,
  cacheBusinessSession: businessSessionCacheManager.add,

  getMemberSessions: memberSessionCacheManager.load,
  cacheMemberSession: memberSessionCacheManager.add,
  clearMemberSession: memberSessionCacheManager.clear,

  getMember: memberCacheManager.get,
  cacheMember: memberCacheManager.add,
  clearMember: memberCacheManager.clear,

  getMemberByUsername: memberByUsernameCacheManager.get,
  cacheMemberByUsername: memberByUsernameCacheManager.add,
  clearMemberByUsername: memberByUsernameCacheManager.clear,

  getNas: nasCacheManager.get,
  cacheNas: nasCacheManager.add,
  clearNas: nasCacheManager.clear,

  getBusiness: businessCacheManager.get,
  cacheBusiness: businessCacheManager.add,
  clearBusiness: businessCacheManager.clear,

  getInternetPlan: internetPlanCacheManager.get,
  cacheInternetPlan: internetPlanCacheManager.add,
  clearInternetPlan: internetPlanCacheManager.clear,

  createMemberByUsernameCacheId,
  clearMemberUsage,
  addMemberUsage: cacheMemberUsage,
  getMemberUsage,
}

