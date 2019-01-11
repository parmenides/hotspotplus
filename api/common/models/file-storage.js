'use strict';

var logger = require('../../server/modules/logger');
var log = logger.createLogger();
var fs = require('fs');
var Q = require('q');
module.exports = function(FileStorage) {
  FileStorage.addFile = function(businessId, filePath, mimeType, name, size) {
    return Q.Promise(function(resolve, reject) {
      if (!filePath) {
        return reject('file path is empty');
      }
      fs.readFile(filePath, function(error, contents) {
        if (error) {
          log.error(error);
          return reject(error);
        }
        if (!contents) {
          return reject('file content is empty');
        }
        var bufferData = new Buffer(contents, 'base64');
        FileStorage.create(
          {
            businessId: businessId,
            name: name,
            size: size,
            type: mimeType,
            data: bufferData,
          },
          function(error, result) {
            if (error) {
              log.error(error);
              return reject(error);
            }
            return resolve(result.id);
          },
        );
      });
    });
  };

  FileStorage.readFile = function(fileId) {
    return Q.Promise(function(resolve, reject) {
      if (!fileId) {
        return reject('file is is empty');
      }
      FileStorage.findById(fileId, function(error, file) {
        if (error) {
          log.error(error);
          return reject(error);
        }
        if (file && file.data) {
          var contentBuffer = new Buffer(file.data, 'base64');
          return resolve({
            contentBuffer: contentBuffer,
            name: file.name,
            size: file.size,
            mimeType: file.type,
          });
        } else {
          log.error('file not found');
          return reject('file not found');
        }
      });
    });
  };

  FileStorage.getFilesByBusinessId = function(businessId, cb) {
    if (!businessId) {
      return cb('businessId is not defined');
    }
    FileStorage.find(
      {
        fields: { data: false, businessId: false },
        where: { businessId: businessId },
        order: 'name DESC',
      },
      function(error, files) {
        if (error) {
          log.error(error);
          return cb(error);
        }
        return cb(null, files);
      },
    );
  };

  FileStorage.remoteMethod('getFilesByBusinessId', {
    description: 'Get Files Uploaded From Data Source Base on BusinessId.',
    accepts: [
      {
        arg: 'businessId',
        type: 'string',
        required: true,
      },
    ],
    returns: { arg: 'result', type: 'array' },
  });
};
