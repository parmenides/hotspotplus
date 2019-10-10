/**
 * Created by payamyousefi on 5/11/15.
 */
const RadiusAdaptor = require('../modules/radiusAdaptor');
const logger = require('../modules/logger');
const log = logger.createLogger();

module.exports = function(app) {
  const router = app.loopback.Router();

  router.post('/api/radius/authorize/:nasIp', async (req, res) => {
    try {
      log.error('#### Authorize #####');

      const Member = app.models.Member;
      const AccessRequest = await RadiusAdaptor.RadiusMessage(req.body);
      AccessRequest.setNasIp(req.params.nasIp);
      const RadiusResponse = await Member.radiusAuthorize(AccessRequest);
      log.debug(RadiusResponse);
      log.debug(RadiusResponse.getMessage());
      log.debug(RadiusResponse.getCode());
      return res.status(RadiusResponse.getCode()).json(RadiusResponse.getMessage());
    } catch (error) {
      log.error(error);
      if (error.statusCode && error.message) {
        return res.status(error.statusCode || 500).json(error.message);
      }
      return res.status(500).json(error);
    }
  });

  router.post('/api/radius/post-auth', async (req, res) => {
    log.debug('#### Post Auth #####');
    try {
      const Member = app.models.Member;
      const AccessRequest = await RadiusAdaptor.RadiusMessage(req.body);
      const RadiusResponse = await Member.radiusPostAuth(AccessRequest);
      return res.status(RadiusResponse.getCode()).json(RadiusResponse.getMessage());
    } catch (error) {
      log.error(error);
      log.error(error);
      if (error.statusCode && error.message) {
        return res.status(error.statusCode || 500).json(error.message);
      }
      return res.status(500).json(error);
    }
  });

  router.post('/api/radius/accounting/:nasIp', async (req, res) => {
    log.debug('#### Accounting #####');
    try {
      const AccountingMessage = await RadiusAdaptor.RadiusMessage(req.body);
      AccountingMessage.setNasIp(req.params.nasIp);
      const Member = app.models.Member;
      const RadiusResponse = await Member.radiusAccounting(AccountingMessage);
      return res.status(200).json(RadiusResponse.getMessage());
    } catch (error) {
      log.error(error);
      return res.status(500).json('Server Error: Failed to add usage report, Not Okay!');
    }
  });

  // send scripts zip file for each nas
  router.get('/api/radius/downloadScripts/:nasName', function(req, res) {
    const Nas = app.models.Nas;
    const bizId = req.query.businessId;
    const nasId = req.query.nasId;
    if (!bizId || !nasId) {
      return res.status(500).send('invalid nas or bizId');
    }
    Nas.getMikrotikScripts(bizId, nasId)
      .then(function(scriptsZippedFiles) {
        return res.download(scriptsZippedFiles, 'hotspotplusTheme.zip');
      })
      .fail(function(error) {
        return res.status(500).json(error);
      });
  });

  app.use(router);
};
