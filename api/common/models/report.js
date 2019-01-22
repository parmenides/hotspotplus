'use strict';

module.exports = function(Report) {

  Report.remoteMethod("downloadReport",{
    description: 'download report',
    accepts: [
      {
        arg: 'resellerId',
        type: 'string',
        required: true,
      },
    ],
    returns: { root: true },
  })

};
