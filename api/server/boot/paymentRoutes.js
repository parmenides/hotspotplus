/**
 * Created by rezanazari on 12/14/16.
 */
var logger = require('../modules/logger');
var log = logger.createLogger();

module.exports = function(app) {
  var router = app.loopback.Router();

  router.get('/api/payment/hotspot/return', function(req, res) {
    var invoiceId = req.query.invoiceId;
    var username = req.query.username;
    var password = req.query.password;
    var businessId = req.query.businessId;
    var memberId = req.query.memberId;
    var nasId = req.query.nasId;
    var host = req.query.host;
    var Member = app.models.Member;
    Member.verifySubscriptionPayment(
      invoiceId,
      username,
      password,
      host,
      nasId,
      memberId,
      businessId
    )
      .then(function(result) {
        var url = result.returnUrl;
        var code = result.code;
        return res.status(code).redirect(url);
      })
      .fail(function(error) {
        log.error('error', error);
        return res.json(500, error);
      });
  });

  router.get('/api/payment/business/return', function(req, res) {
    var Business = app.models.Business;
    var invoiceId = req.query.invoiceId;
    var refId = req.query.refId;

    Business.verifyBuyPackage(invoiceId,refId)
      .then(function(result) {
        var url = result.returnUrl;
        var code = result.code;
        return res.status(code).redirect(url);
      })
      .fail(function(error) {
        log.error('error', error);
        return res.json(500, { error: error });
      });
  });

  router.get('/api/payment/external/return', function(req, res) {
    var Invoice = app.models.Invoice;
    var invoiceId = req.query.invoiceId;
    var refId = req.query.refId;
    Invoice.verifyExternalInvoice(invoiceId,refId)
      .then(function(result) {
        var url = result.returnUrl;
        var code = result.code;
        return res.status(code).redirect(url);
      })
      .fail(function(error) {
        log.error('error', error);
        return res.json(500, { error: error });
      });
  });

  router.get('/api/payment/charge/return', function(req, res) {
    var Business = app.models.Business;
    var invoiceId = req.query.invoiceId;
    var refId = req.query.refId;
    Business.verifyBuyCredit(invoiceId,refId)
      .then(function(result) {
        var url = result.returnUrl;
        var code = result.code;
        return res.status(code).redirect(url);
      })
      .fail(function(error) {
        log.error('error', error);
        return res.json(500, { error: error });
      });
  });

  router.get('/api/payment/member/return', function(req, res) {
    var Member = app.models.Member;
    var invoiceId = req.query.invoiceId;
    var refId = req.query.refId;

    Member.verifyPayment(invoiceId,refId)
      .then(function(result) {
        var url = result.returnUrl;
        var code = result.code;
        return res.status(code).redirect(url);
      })
      .fail(function(error) {
        log.error('error', error);
        return res.json(500, { error: error });
      });
  });

  app.use(router);
};
