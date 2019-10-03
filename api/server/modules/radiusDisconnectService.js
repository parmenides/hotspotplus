/**
 * Created by payamyousefi on 8/4/16.
 */

var Q = require('q');
var app = require('../server');
var logger = require('./logger');
var log = logger.createLogger();
var radius = require('radius');
var dgram = require('dgram');

exports.sendPod = function(clientSession) {
  return Q.Promise(function(resolve, reject) {
    log.debug('Going to dc ', clientSession);
    var Business = app.models.Business;
    var Nas = app.models.Nas;
    clientSession.source = 'Hotspotplus POD Service';
    var username = clientSession.username;
    var framedIpAddress = clientSession.framedIpAddress;
    var nasSessionId = clientSession.nasSessionId;
    var mac = clientSession.mac;
    var nasId = clientSession.nasId;
    var nasIp = clientSession.nasIp;

    if (!nasId || !username || !framedIpAddress || !nasSessionId || !mac) {
      return reject('invalid parameters, failed to dc user');
    }

    Nas.findById(nasId)
      .then(function(nas) {
        var businessId = nas.businessId;
        Business.findById(businessId)
          .then(function(business) {
            try {
              var port = nas.port || '3799';
              if (nasIp && port) {
                log.debug('nas ip and port, IP: ', nasIp, ', Port:', port);
                var secret = business.nasSharedSecret;
                var routerAddress = nasIp;
                var routerPort = port;

                var podMessage = {
                  code: 'Disconnect-Request',
                  secret: secret,
                  attributes: [
                    ['User-Name', username],
                    ['Framed-IP-Address', framedIpAddress],
                    ['Acct-Session-Id', nasSessionId],
                    ['Calling-Station-Id', mac]
                  ]
                };
                var podRequest = radius.encode(podMessage);
                var server = dgram.createSocket('udp4');
                server.on('message', function(msg, rinfo) {
                  var packet = radius.decode({ packet: msg, secret: secret });
                  if (packet.code === 'Disconnect-ACK') {
                    server.close(function() {
                      log.debug('Closed after Disconnect');
                      log.debug('User ', username, ' disconnected');
                      return resolve();
                    });
                  } else {
                    log.debug('failed to disconnect user', username);
                    log.debug(packet);
                    server.close(function() {
                      log.error('Closed after big failure');
                      return reject(
                        new Error('failed to disconnect user', username)
                      );
                    });
                  }
                });

                server.on('error', function(error) {
                  log.error('Error:', error);
                  server.close(function() {
                    log.error('Closed, error ');
                    return reject(error);
                  });
                });
                log.debug('Sending pod to ', routerAddress, routerPort);
                server.send(
                  podRequest,
                  0,
                  podRequest.length,
                  routerPort,
                  routerAddress,
                  function(error, bytes) {
                    if (error) {
                      log.error('Error sending response to ', error);
                      server.close(function() {
                        log.error('Closed on send Error');
                        return reject(error);
                      });
                    }
                    log.debug('message sent....');
                    server.close(function(closed) {
                      log.debug('socket closed!', closed);
                      return resolve();
                    });
                  }
                );
              } else {
                log.error(
                  'nas ip or port is empty, nothing to do, IP: ',
                  nasIp,
                  ', Port:',
                  port
                );
                return resolve();
              }
            } catch (error) {
              log.error('Some Exceptions happened', error);
              log.error(error);
              return resolve(error);
            }
          })
          .catch(function(error) {
            log.error('failed to load biz,', username, error);
            return reject(error);
          });
      })
      .catch(function(error) {
        log.error('failed to load nas,', username, error);
        return reject(error);
      });
  });
};
