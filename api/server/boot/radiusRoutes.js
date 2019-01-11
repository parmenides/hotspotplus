import RadiusAdaptor from '../modules/radiusAdaptor';
import logger from '../modules/logger';
const log = logger.createLogger();

module.exports = function(app) {
  const router = app.loopback.Router();

  router.post('/echo/:id', function(req, res) {
    log.debug('Echo: ', req.params);
    log.debug(req.body);
    console.log('Echo: ');
    console.log(req.body);
    res.status(200).json({ ok: true });
  });

  router.post('/api/radius/authorize/:nasIp', function(req, res) {
    var Member = app.models.Member;
    RadiusAdaptor.RadiusMessage(req.body)
      .then(function(AccessRequest) {
        AccessRequest.setNasIp(req.params.nasIp);
        Member.authorize(AccessRequest)
          .then(function(RadiusResponse) {
            log.debug('SENDING RESPONSE');
            log.debug(RadiusResponse.getMessage());
            return res
              .status(RadiusResponse.getCode())
              .json(RadiusResponse.getMessage());
          })
          .fail(function(RadiusResponse) {
            return res
              .status(RadiusResponse.getCode())
              .json(RadiusResponse.getMessage());
          });
      })
      .fail(function(error) {
        log.error(error);
        return res.status(500).json(error);
      });
  });

  router.post('/api/radius/post-auth', function(req, res) {
    log.debug('@postAuth');
    log.debug(req.body);
    var Member = app.models.Member;
    RadiusAdaptor.RadiusMessage(req.body)
      .then(function(AccessRequest) {
        Member.postAuth(AccessRequest)
          .then(function(RadiusResponse) {
            log.debug('SENDING RESPONSE');
            log.debug(RadiusResponse.getMessage());
            return res
              .status(RadiusResponse.getCode())
              .json(RadiusResponse.getMessage());
          })
          .fail(function(RadiusResponse) {
            return res
              .status(RadiusResponse.getCode())
              .json(RadiusResponse.getMessage());
          });
      })
      .fail(function(error) {
        log.error(error);
        return res.status(500).json(error);
      });
  });

  router.post('/api/radius/accounting/:nasIp', function(req, res) {
    log.debug('@accounting received');
    var Member = app.models.Member;
    RadiusAdaptor.RadiusMessage(req.body)
      .then(function(AccountingMessage) {
        AccountingMessage.setNasIp(req.params.nasIp);
        Member.accounting(AccountingMessage)
          .then(function(RadiusResponse) {
            return res.status(200).json(RadiusResponse.getMessage());
          })
          .fail(function(RadiusResponse) {
            log.error(RadiusResponse);
            return res.status(500).json(RadiusResponse.getMessage());
          });
      })
      .fail(function(RadiusResponse) {
        log.error(RadiusResponse);
        return res.status(500).json(RadiusResponse.getMessage());
      });
  });

  // send scripts zip file for each nas
  router.get('/api/radius/downloadScripts/:nasName', function(req, res) {
    var Nas = app.models.Nas;
    var bizId = req.query.businessId;
    var nasId = req.query.nasId;
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
