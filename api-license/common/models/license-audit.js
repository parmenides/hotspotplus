'use strict';

var app = require('../../server/server');

module.exports = function(Licenseaudit) {
  Licenseaudit.ping = function(systemUuid, ip, ctx) {
    var License = app.models.License;
    var licenseId = ctx.currentUserId;
    return License.findById(licenseId).then(function(license) {
      if (license.systemUuid === systemUuid) {
        return Licenseaudit.create({
          licenseId: licenseId,
          ip: ip,
          creationDateStr: new Date(),
          creationDate: new Date().getTime(),
        }).then(function() {
          return { ok: true };
        });
      } else {
        return { ok: false };
      }
    });
  };

  Licenseaudit.remoteMethod('ping', {
    description: 'Ping',
    http: { verb: 'post' },
    accepts: [
      { arg: 'systemUuid', type: 'string', required: true },
      { arg: 'ip', type: 'string', required: true },
      { arg: 'options', type: 'object', http: 'optionsFromRequest' },
    ],
    returns: { root: true },
  });
};
