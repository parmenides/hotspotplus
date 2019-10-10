/**
 * Created by payam on 12/14/16.
 */
const logger = require('../modules/logger');
const log = logger.createLogger();

module.exports = function(app) {
  const router = app.loopback.Router();

  router.get('/api/dropBox', function(req, res) {
    const Business = app.models.Business;
    Business.dropboxSaveToken(req.query)
      .then(function(result) {
        const url = result.returnUrl;
        const code = result.code;
        return res.status(code).redirect(url);
      })
      .fail(function(error) {
        log.error('error');
        log.error(error);
        return res.json(500, {error: error});
      });
  });

  router.get('/api/payping', function(req, res) {
    const Business = app.models.Business;
    Business.paypingSaveToken(req.query)
      .then(function(result) {
        const url = result.returnUrl;
        const code = result.code;
        return res.status(code).redirect(url);
      }).fail(function(error) {
        log.error('error');
        log.error(error);
        return res.json(500, {error: error});
      });
  });

  app.use(router);
};
