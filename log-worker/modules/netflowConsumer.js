const kafka = require('kafka-node');
require('date-utils');
const Q = require('q');
const logger = require('hotspotplus-common').logger;
const utility = require('hotspotplus-common').utility;
const log = logger.createLogger('netflowConsumer', process.env.LOG_DIR);
const redis = require('redis');
const redisClient = redis.createClient(
  process.env.REDIS_PORT,
  process.env.REDIS_HOST,
);
const ZOOKEEPER_IP = process.env.ZOOKEEPER_IP;
const ZOOKEEPER_PORT = process.env.ZOOKEEPER_PORT || '2181';
const kafkaClient = new kafka.KafkaClient({
  kafkaHost: process.env.KAFKA_IP + ':' + process.env.KAFKA_PORT,
});
const kafkaProducer = new kafka.Producer(kafkaClient, {
  requireAcks: 0,
  partitionerType: 2,
});

kafkaProducer.on('ready', function() {
  log.warn('Producer ready...');
  kafkaClient.refreshMetadata([process.env.NETFLOW_TOPIC], function(error) {
    log.debug('@refreshMetadata Error:', error);
  });
});

kafkaProducer.on('error', function(error) {
  log.error('Producer preparation failed:', error);
});

const consumerGroupOptions = {
  host: ZOOKEEPER_IP + ':' + ZOOKEEPER_PORT, // zookeeper host omit if connecting directly to broker (see kafkaHost below)
  groupId: 'RawNetflowConsumerGroup',
  sessionTimeout: 15000,
  // An array of partition assignment protocols ordered by preference.
  // 'roundrobin' or 'range' string for built ins (see below to pass in custom assignment protocol)
  protocol: ['roundrobin'],

  // Offsets to use for new groups other options could be 'earliest' or 'none' (none will emit an error if no offsets were saved)
  // equivalent to Java client's auto.offset.reset
  fromOffset: 'latest', // default
  commitOffsetsOnFirstJoin: true, // on the very first time this consumer group subscribes to a topic, record the offset returned in fromOffset (latest/earliest)
  // how to recover from OutOfRangeOffset error (where save offset is past server retention) accepts same value as fromOffset
  outOfRangeOffset: 'earliest', // default
  migrateHLC: false, // for details please see Migration section below
  migrateRolling: true,
  // Callback to allow consumers with autoCommit false a chance to commit before a rebalance finishes
  // isAlreadyMember will be false on the first connection, and true on rebalances triggered after that
  onRebalance: function(isAlreadyMember, callback) {
    log.debug('onRebalance:', isAlreadyMember);
    callback();
  },
};
const consumerGroup = new kafka.ConsumerGroup(consumerGroupOptions, [
  process.env.RAW_NETFLOW_TOPIC,
]);
log.debug('Netflow consumer service is up');

consumerGroup.on('message', function(message) {
  try {
    log.debug('Message received');
    const netFlowPkg = JSON.parse(message.value);
    const hostIp = netFlowPkg.host;
    if (!netFlowPkg || !netFlowPkg.netflow) {
      log.debug('@netflow invalid netflow packet', netFlowPkg);
      return;
    }
    getIpSession(hostIp)
      .then(function(nasSession) {
        if (!nasSession || !nasSession.businessId || !nasSession.nasId) {
          log.debug('no session found for ', hostIp);
          return;
        }
        if (nasSession.hasValidLogSubscription !== true) {
          log.debug('this business does not have a valid log subscription');
          return;
        }
        const localMemberIp = netFlowPkg.netflow['ipv4_src_addr'];
        const destinationIp = netFlowPkg.netflow['ipv4_dst_addr'];
        const destinationPort = netFlowPkg.netflow['l4_dst_port'];
        const sourcePort = netFlowPkg.netflow['l4_src_port'];
        const bizId = nasSession.businessId;
        const nasId = nasSession.nasId;
        getMemberSession(bizId, nasId, localMemberIp)
          .then(function(memberSession) {
            const netFlowLog = {
              username: memberSession.username,
              mac: memberSession.mac,
              host: hostIp,
              sourceIp: localMemberIp,
              sourcePort: sourcePort,
              groupIdentityId: memberSession.groupIdentityId,
              groupIdentity: memberSession.groupIdentity,
              groupIdentityType: memberSession.groupIdentityType,
              destinationIp: destinationIp,
              destinationPort: destinationPort,
              businessId: bizId,
              nasId: nasId,
              creationDate: new Date(
                netFlowPkg.netflow['first_switched'],
              ).getTime(),
              creationDateStr: new Date(
                netFlowPkg.netflow['first_switched'],
              ).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' }),
              flowDate: new Date(
                netFlowPkg.netflow['first_switched'],
              ).getTime(),
              flowDateStr: new Date(
                netFlowPkg.netflow['first_switched'],
              ).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' }),
            };
            kafkaProducer.send(
              [
                {
                  topic: process.env.NETFLOW_TOPIC,
                  messages: JSON.stringify(netFlowLog),
                },
              ],
              function(error, data) {
                if (error) {
                  log.error('Failed to add message to kafka: ', error);
                  return;
                }
                log.debug('Netflow log added:', data);
              },
            );
          })
          .fail(function(error) {
            log.debug('@netflow member not found');
            log.debug(error);
          });
      })
      .fail(function(error) {
        log.debug(error);
        log.debug('@netflow empty nas session');
      });
  } catch (error) {
    log.error(error);
  }
});

function getIpSession(nasIp) {
  return Q.promise(function(resolve, reject) {
    if (!nasIp) {
      return reject('invalid nas ip', nasIp);
    }
    redisClient.get(nasIp, function(error, reply) {
      if (error) {
        log.error('Error:', error);
        return reject(error);
      }
      if (!reply) {
        return reject('nas by ip not found');
      }
      const nasSession = JSON.parse(reply);
      return resolve(nasSession);
    });
  });
}

function getMemberSession(businessId, nasId, memberIp) {
  return Q.Promise(function(resolve, reject) {
    if (!businessId || !nasId || !memberIp) {
      return reject('invalid parameters !businessId || !nasId || !memberIp');
    }
    const memberSessionKey = businessId + ':' + nasId + ':' + memberIp;
    redisClient.get(memberSessionKey, function(error, rawMemberSession) {
      if (error) {
        log.error(error);
        return;
      }
      if (!rawMemberSession) {
        //log.error ( "no rawMemberSession" );
        return reject('no rawMemberSession for id ', memberSessionKey);
      }
      try {
        return resolve(JSON.parse(rawMemberSession));
      } catch (error) {
        log.error('failed to pars member session json', error);
        return reject(error);
      }
    });
  });
}

consumerGroup.on('error', function(error) {
  log.error('Error', error);
});

consumerGroup.on('ready', function() {
  log.debug('ready');
});
