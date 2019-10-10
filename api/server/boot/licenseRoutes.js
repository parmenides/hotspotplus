/**
 * Created by payamyousefi on 5/11/15.
 */
const config = require('../modules/config');
const logger = require('../modules/logger');
const log = logger.createLogger();
const temp = require('temp').track();
const utility = require('../modules/utility');
const requestIp = require('request-ip');
require('date-utils');
const licenseFile = require('nodejs-license-file');

module.exports = function(app) {
  const router = app.loopback.Router();

  router.post('/api/radius/getLocalPackages', function(req, res) {
    return res.status(200).send(config.LOCAL_MODULES);
  });
  router.get('/api/radius/getLicenseTemplate', function(req, res) {
    return res.status(200).send(config.LICENSE_TEMPLATE);
  });

  router.post('/api/radius/config', function(req, res) {
    const License = app.models.License;
    const LicenseAudit = app.models.LicenseAudit;
    const data = req.body;
    const remoteIp = requestIp.getClientIp(req);
    const reporterIp = data.ip;
    const receivedLicense = data.lc;
    log.debug('checking license ', req.body);
    log.debug(data);
    License.findOne({where: {serial: receivedLicense.serial}}, function(
      error,
      license
    ) {
      if (error) {
        // deny
        log.debug(error);
        return res.status(500).json({});
      }

      if (!license || !license.serial) {
        log.debug('license not found');
        return res.status(500).json({});
      }

      let statusCode;
      if (license) {
        if (new Date(license.expiresAt).isAfter(new Date())) {
          // allow
          statusCode = createOkayCode();
        } else {
          // deny
          statusCode = createNokayCode();
        }
      } else {
        // deny
        statusCode = createNokayCode();
      }

      let smsStatusCode = createNokayCode();
      if (license.sms === 1) {
        smsStatusCode = createOkayCode();
      }
      let logStatusCode = createNokayCode();
      if (license.log === 1) {
        logStatusCode = createOkayCode();
      }
      let memberStatusCode = createNokayCode();
      if (license.member === 1) {
        memberStatusCode = createOkayCode();
      }
      let paymentStatusCode = createNokayCode();
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

          const result = {};
          result.radius0 = utility.encrypt(statusCode, license.serial);
          result.radius1 = utility.encrypt(smsStatusCode, license.serial);
          result.radius2 = utility.encrypt(logStatusCode, license.serial);
          result.radius3 = utility.encrypt(paymentStatusCode, license.serial);
          result.radius4 = utility.encrypt(memberStatusCode, license.serial);

          return res
            .status(200)
            .send(utility.encrypt(JSON.stringify(res), license.serial));
        }
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
