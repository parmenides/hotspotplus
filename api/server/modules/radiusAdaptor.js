/**
 * Created by payamyousefi on 12/6/16.
 */

const app = require('../server');
const AVPS = require('./avps');
const Q = require('q');
const logger = require('./logger');
const log = logger.createLogger();
const config = require('./config');
const utility = require('./utility');

module.exports.RadiusResponseFactory = function(RadiusMessage) {
  const data = {
    message: {},
  };

  this.setCode = function(code) {
    data.code = code;
  };

  this.addReply = function(attName, attValue) {
    data.message['reply:' + getAttrAvp(attName)] = attValue;
  };

  this.addReplyMessage = function(message) {
    data.message['reply:' + getAttrAvp('replyMessage')] = message;
  };

  this.setErrorCode = function(message) {
    data.message['Error-Code'] = message;
  };

  this.getErrorCode = function() {
    return data.message['Error-Code'];
  };

  this.addAllowedBulk = function(message) {
    data.message['reply:' + getAttrAvp('bulk')] = message;
  };

  this.addConnectionSpeed = function(
    accessPointType,
    rxRate,
    rxBurstRate,
    txRate,
    txBurstRate,
    burstTime
  ) {
    accessPointType = accessPointType.toLowerCase();
    if (accessPointType === config.ROUTER_TYPE.MIKROTIK) {
      data.message['reply:' + getAttrAvp('speed')] = AVPS[
        RadiusMessage.getNasType()
      ].getRateLimit(rxRate, rxBurstRate, txRate, txBurstRate, burstTime);
      log.debug(
        'addConnectionSpeed',
        data.message['reply:' + getAttrAvp('speed')]
      );
    } else if (accessPointType === config.ROUTER_TYPE.COOVACHILLI) {
      data.message['reply:' + getAttrAvp('downloadSpeed')] = txRate;
      data.message['reply:' + getAttrAvp('uploadSpeed')] = rxRate;
    } else if (accessPointType === config.ROUTER_TYPE.ENGENIUS) {
      data.message['reply:' + getAttrAvp('downloadSpeed')] = txRate;
      data.message['reply:' + getAttrAvp('uploadSpeed')] = rxRate;
    } else {
      log.error('AP not found', accessPointType);
    }
  };

  this.addSessionTimeOut = function(message) {
    // data.message['reply:' + getAttrAvp('sessionTerminateTime')] = message;
    data.message['reply:' + getAttrAvp('sessionTimeout')] = message;
  };

  this.addIp = function(ip) {
    data.message['reply:' + getAttrAvp('framedIpAddress')] = ip;
  };

  this.addIpPool = function(pool) {
    data.message['reply:' + getAttrAvp('framedIpPool')] = pool;
  };

  this.addNetmask = function(netmask) {
    data.message['reply:' + getAttrAvp('framedIpNetmask')] = netmask;
  };

  this.addControl = function(attName, attValue) {
    data.message['control:' + getAttrAvp(attName)] = attValue;
  };

  function getAttrAvp(attr) {
    return AVPS[RadiusMessage.getNasType()][attr];
  }

  this.removeReply = function(attName, attValue) {
    delete data.message['reply:' + attName];
  };

  this.removeControl = function(attName, attValue) {
    delete data.message['control:' + attName];
  };

  this.getMessage = function() {
    return data.message;
  };

  this.getCode = function() {
    return data.code;
  };
};

module.exports.RadiusMessage = async function(radiusRequestData) {
  function RadMsg(radMessage) {
    this.message = {};
    this.nas = {};
    try {
      /*
		 var s = {
		 '`Identifier': { type: 'array', value: '' },
		 } */
      for (const key in radMessage) {
        const msg = radMessage[key];
        if (msg['type'] == 'array' || msg['type'] == 'object') {
          this.message[key] = msg['value'];
        } else if (msg['type'] == 'integer') {
          this.message[key] = msg['value'][0];
        } else if (msg['type'] == 'date') {
          this.message[key] = new Date(msg['value'][0]);
        } else if (msg['type'] == 'ipaddr') {
          this.message[key] = msg['value'][0];
        } else {
          this.message[key] = msg['value'].join();
        }
      }
    } catch (e) {
      log.error('failed to pars radius message');
      log.error(e);
    }

    this.getNasId = function() {
      return this.message[AVPS['nasId']]; // || '58567adb74b6085996bb78ff';
    };

    this.getCalledStationIdAsNasId = function() {
      return utility.trimMac(this.message[AVPS['calledStationId']]);
    };

    this.setNasId = function(nasId) {
      this.message[AVPS['nasId']] = nasId;
    };

    this.getNasType = function() {
      return this.message.nasType;
    };

    this.getAttribute = function(attribute) {
      return this.message[AVPS[this.message.nasType][attribute]];
    };

    this.getSessionId = function() {
      return this.message[AVPS[this.message.nasType]['sessionId']];
    };

    this.setAttribute = function(attribute, value) {
      this.message[AVPS[this.message.nasType][attribute]] = value;
    };

    this.setNasIp = function(nasIp) {
      this.nasIp = nasIp;
    };

    this.getNasIp = function() {
      return this.nasIp;
    };
  }

  const radiusMessage = new RadMsg(radiusRequestData);
  const Nas = app.models.Nas;
  const nasId = radiusMessage.getNasId();
  const nas = await Nas.loadById(nasId);
  if (!nas) {
    throw new Error(`nas not found ${nasId}`);
  }
  radiusMessage.nas = nas;
  radiusMessage.message.nasType = nas.accessPointType.toLowerCase();
  return radiusMessage;
};
