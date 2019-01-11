/**
 * Created by payamyousefi on 5/11/15.
 */
var config = require('../modules/config');
var logger = require('../modules/logger');
var log = logger.createLogger();
var temp = require('temp').track();
var utility = require('../modules/utility');
var requestIp = require('request-ip');
require('date-utils');
var licenseFile = require('nodejs-license-file');

module.exports = function(app) {
  var router = app.loopback.Router();

  router.post('/api/radius/getLocalPackages', function(req, res) {
    return res.status(200).send(config.LOCAL_MODULES);
  });
  router.get('/api/radius/getLicenseTemplate', function(req, res) {
    return res.status(200).send(config.LICENSE_TEMPLATE);
  });

  router.post('/api/radius/config', function(req, res) {
    var License = app.models.License;
    var LicenseAudit = app.models.LicenseAudit;
    var data = req.body;
    var remoteIp = requestIp.getClientIp(req);
    var reporterIp = data.ip;
    var receivedLicense = data.lc;
    log.debug('checking license ', req.body);
    log.debug(data);
    License.findOne({ where: { serial: receivedLicense.serial } }, function(
      error,
      license,
    ) {
      if (error) {
        //deny
        log.debug(error);
        return res.status(500).json({});
      }

      if (!license || !license.serial) {
        log.debug('license not found');
        return res.status(500).json({});
      }

      var statusCode;
      if (license) {
        if (new Date(license.expiresAt).isAfter(new Date())) {
          //allow
          statusCode = createOkayCode();
        } else {
          //deny
          statusCode = createNokayCode();
        }
      } else {
        //deny
        statusCode = createNokayCode();
      }

      var smsStatusCode = createNokayCode();
      if (license.sms === 1) {
        smsStatusCode = createOkayCode();
      }
      var logStatusCode = createNokayCode();
      if (license.log === 1) {
        logStatusCode = createOkayCode();
      }
      var memberStatusCode = createNokayCode();
      if (license.member === 1) {
        memberStatusCode = createOkayCode();
      }
      var paymentStatusCode = createNokayCode();
      if (license.payment === 1) {
        paymentStatusCode = createOkayCode();
      }

      LicenseAudit.create(
        {
          ip: remoteIp,
          reporterIp: reporterIp,
          licenseId: license.id,
          status: statusCode,
          creationDate: new Date().getTime(),
          creationDateObj: new Date(),
        },
        function(error) {
          if (error) {
            log.error(error);
            return res.status(500).json({});
          }
          log.debug(statusCode);

          var result = {};
          result.radius0 = utility.encrypt(statusCode, license.serial);
          result.radius1 = utility.encrypt(smsStatusCode, license.serial);
          result.radius2 = utility.encrypt(logStatusCode, license.serial);
          result.radius3 = utility.encrypt(paymentStatusCode, license.serial);
          result.radius4 = utility.encrypt(memberStatusCode, license.serial);

          return res
            .status(200)
            .send(utility.encrypt(JSON.stringify(res), license.serial));
        },
      );
    });

    function createOkayCode() {
      return (Math.floor(Math.random() * 9000) + 10000000) * 2;
    }

    function createNokayCode() {
      return (Math.floor(Math.random() * 9000) + 10000000) * 2 + 1;
    }
  });

  app.use(router);
};
