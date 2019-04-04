var logger = require('../modules/logger');
var config = require('../modules/config');
var Q = require('q');

module.exports = function(Generic) {
  Generic.getLogger = function() {
    return logger.createLogger();
  };
  var log = Generic.getLogger();

  Generic.getCurrentUserId = function(ctx) {
    const token = ctx && ctx.accessToken;
    const userId = token && token.userId;
    return userId;
  };

  Generic.createOptionsFromRemotingContext = function(ctx) {
    var base = this.base.createOptionsFromRemotingContext(ctx);
    base.currentUserId = base.accessToken && base.accessToken.userId;
    return base;
  };
};
