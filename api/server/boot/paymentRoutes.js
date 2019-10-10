/**
 * Created by rezanazari on 12/14/16.
 */
const logger = require('../modules/logger');
const log = logger.createLogger();

module.exports = function(app) {
  const router = app.loopback.Router();

  router.get('/api/payment/hotspot/return', function(req, res) {
    const invoiceId = req.query.invoiceId;
    const username = req.query.username;
    const password = req.query.password;
    const businessId = req.query.businessId;
    const refId = req.query.refid;
    const memberId = req.query.memberId;
    const nasId = req.query.nasId;
    const host = req.query.host;
    const Member = app.models.Member;
    Member.verifySubscriptionPayment(
      refId,
      invoiceId,
      username,
      password,
      host,
      nasId,
      memberId,
      businessId
    )
      .then(function(result) {
        const url = result.returnUrl;
        const code = result.code;
        return res.status(code).redirect(url);
      })
      .fail(function(error) {
        log.error('error', error);
        return res.json(500, error);
      });
  });

  router.get('/api/payment/business/return', function(req, res) {
    const Business = app.models.Business;
    const invoiceId = req.query.invoiceId;
    const refId = req.query.refid;

    Business.verifyBuyPackage(invoiceId, refId)
      .then(function(result) {
        const url = result.returnUrl;
        const code = result.code;
        return res.status(code).redirect(url);
      })
      .fail(function(error) {
        log.error('error', error);
        return res.json(500, {error: error});
      });
  });

  router.get('/api/payment/external/return', function(req, res) {
    const Invoice = app.models.Invoice;
    const invoiceId = req.query.invoiceId;
    const refId = req.query.refid;
    Invoice.verifyExternalInvoice(invoiceId, refId)
      .then(function(result) {
        const url = result.returnUrl;
        const code = result.code;
        return res.status(code).redirect(url);
      })
      .fail(function(error) {
        log.error('error', error);
        return res.json(500, {error: error});
      });
  });

  router.get('/api/payment/charge/return', function(req, res) {
    const Business = app.models.Business;
    const invoiceId = req.query.invoiceId;
    const refId = req.query.refid;
    Business.verifyBuyCredit(invoiceId, refId)
      .then(function(result) {
        const url = result.returnUrl;
        const code = result.code;
        return res.status(code).redirect(url);
      })
      .fail(function(error) {
        log.error('error', error);
        return res.json(500, {error: error});
      });
  });

  router.get('/api/payment/member/return', function(req, res) {
    const Member = app.models.Member;
    const invoiceId = req.query.invoiceId;
    const refId = req.query.refid;

    Member.verifyPayment(invoiceId, refId)
      .then(function(result) {
        const url = result.returnUrl;
        const code = result.code;
        return res.status(code).redirect(url);
      })
      .fail(function(error) {
        log.error('error', error);
        return res.json(500, {error: error});
      });
  });

  app.use(router);
};
