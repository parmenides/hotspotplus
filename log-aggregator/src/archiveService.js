var Q = require('q');
var utility = require('./modules/utility');
var CronJob = require('cron').CronJob;
var needle = require('needle');
var fs = require('fs');
var theDropbox = require('./modules/dropbox');
var auth = require('./modules/auth');
var temp = require('temp').track();
var Json2csvParser = require('json2csv').Parser;
var logger = require('./modules/logger');

var log = logger.createLogger();
var elasticURL = `http://${process.env.ELASTIC_IP}:${process.env.ELASTIC_PORT}`;
var ELASTIC_NETFLOW_REPORT = `${elasticURL}/${process.env.ELASTIC_INDEX_PREFIX}netflow/report`;
var ELASTIC_SYSLOG_REPORT = `${elasticURL}/${process.env.ELASTIC_INDEX_PREFIX}syslog/report`;
var businessSize = process.env.BUSINESS_SIZE;
var API_ADDRESS = utility.getApiAddress();
var BUSINESS_GET_REST_API =`${API_ADDRESS}/api/Businesses/{0}?access_token={1}`;
var fileRows = process.env.FILES_ROWS;

function getBusinessList(options) {
  return Q.promise(function(resolve, reject) {
    if (!options.size) {
      return reject('elastic aggregation size is not defined');
    }
    if (!options.elasticPath) {
      return reject('elastic aggregation path is not defined');
    }
    var size = options.size;
    var elasticPath = options.elasticPath;
    var endDate = options.endDate;

    needle.post(
      elasticPath + '/_search',
      {
        size: 0,
        query: {
          range: {
            creationDate: {
              lt: endDate,
            },
          },
        },
        aggs: {
          businesses: {
            terms: {
              field: 'businessId',
              size: size,
            },
          },
        },
      },
      { json: true },
      function(error, response) {
        if (error) {
          log.error(error);
          return reject(error);
        }
        if (
          !response.body.aggregations ||
          !response.body.aggregations.businesses ||
          !response.body.aggregations.businesses.buckets
        ) {
          log.error(response.body);
          return resolve([]);
        }
        var businesses = response.body.aggregations.businesses.buckets;
        return resolve(businesses);
      },
    );
  });
}

function processLogs(data) {
  return Q.promise(function(resolve, reject) {
    if (!data) {
      log.error('no data for create report file');
      return reject('no data for create report file');
    }
    if (!data.elasticPath) {
      log.error('no elastic path for create report file');
      return reject('no elastic path for create report file');
    }
    if (!data.businessId) {
      log.error('no elastic path for create report file');
      return reject('no businessId for create report file');
    }
    if (!data.endDate) {
      log.error('no endDate for create report file');
      return reject('no endDate for create report file');
    }
    var elasticPath = data.elasticPath;
    var businessId = data.businessId;
    var endDate = data.endDate;

    //check for business dropbox token
    log.debug('get docs count from elasticSearch');
    getDropBoxToken(businessId)
      .then(function(dropboxToken) {
        log.debug('token for business ', businessId, ':', dropboxToken);
        if (dropboxToken.result) {
          var accessToken = dropboxToken.token;
          var keepLogs = dropboxToken.keepLogs;
          //get docs count from elasticSearch
          log.debug('get docs count from elasticSearch');
          log.debug('Dropbox token', dropboxToken);
          getDocsCount(businessId, elasticPath, endDate)
            .then(function(docsCount) {
              log.debug('loaded doc count', docsCount);

              if (docsCount > 0) {
                var tasks = [];
                var limit = fileRows;
                for (var i = 0; i < docsCount; ) {
                  tasks.push(
                    getDocs(businessId, elasticPath, endDate, limit, i),
                  );
                  i += limit;
                }
                //get docs from elasticSearch for specific businessId
                Q.all(tasks)
                  .then(function(docs) {
                    var writeTask = [];
                    for (var i = 0; i < docs.length; i++) {
                      if (docs[i].length > 0) {
                        var type = elasticPath.split('/');
                        type = type[type.length - 2];
                        var newDate = new Date(endDate);
                        var newDay = newDate.getDate();
                        var newMonth = newDate.getMonth() + 1;
                        var newYear = newDate.getFullYear();
                        //newDate = newYear + "-" + newMonth + "-" + newDay;
                        var fileName =
                          type +
                          '_' +
                          i +
                          '_' +
                          newDate.toLocaleString('fa-IR', {
                            timeZone: 'Asia/Tehran',
                          }) +
                          '.csv';
                        fileName = fileName.split(' ').join('_');
                        fileName = fileName.split('/').join('_');
                        fileName =
                          newYear +
                          '/' +
                          newMonth +
                          '/' +
                          newDay +
                          '/' +
                          fileName;
                        writeTask.push(
                          transferToExternalStorage(
                            docs[i],
                            fileName,
                            accessToken,
                          ),
                        );
                      }
                    }

                    //create file for logs and copy to dropbox
                    Q.all(writeTask)
                      .then(function(response) {
                        var isNotSafeToDeleted = true;
                        for (var i = 0; i < response.length; i++) {
                          if (!response[i].status) {
                            isNotSafeToDeleted = false;
                            break;
                          }
                        }
                        if (isNotSafeToDeleted) {
                          log.debug(
                            'logs deleted for businessId: ',
                            businessId,
                          );
                          //delete docs from elasticSearch for specific businessId
                          if (keepLogs === true) {
                            return resolve();
                          }
                          deleteLog(businessId, elasticPath, endDate)
                            .then(function() {
                              log.debug(
                                'logs deleted from elastic, businessId: ',
                                businessId,
                              );
                            })
                            .fail(function(error) {
                              //error for deleting docs from elasticSearch for specific businessId
                              log.error(error);
                              return reject(error);
                            });
                        } else {
                          log.debug(
                            'no logs delete for businessId: ',
                            businessId,
                          );
                        }
                        return resolve();
                      })
                      .fail(function(error) {
                        //error for creating file for logs and copy to dropbox
                        log.error(error);
                        return reject(error);
                      });
                  })
                  .fail(function(error) {
                    //error for getting docs from elasticSearch for specific businessId
                    log.error(error);
                    return reject(error);
                  });
              } else {
                log.debug(
                  'there is no docs to create file for business: ',
                  businessId,
                );
                return resolve();
              }
            })
            .fail(function(error) {
              //error for getting docs count from elasticSearch
              log.error(error);
              return reject(error);
            });
        } else {
          log.debug('can not find dropbox token for businessId: ', businessId);
          return resolve();
        }
      })
      .fail(function(error) {
        log.error(error);
        return reject(error);
      });
  });
}

// get docs count from elasticSearch
function getDocsCount(businessId, elasticPath, endDate) {
  return Q.promise(function(resolve, reject) {
    if (!businessId) {
      return reject('businessId is not defined');
    }
    if (!elasticPath) {
      return reject('elasticPath is not defined');
    }
    if (typeof endDate == 'undefined' || endDate == null) {
      return reject('endDate is not defined');
    }

    needle.post(
      elasticPath + '/_count',
      {
        query: {
          bool: {
            must: [
              {
                match: {
                  businessId: {
                    query: businessId,
                    type: 'phrase',
                  },
                },
              },
              {
                range: {
                  creationDate: {
                    lt: endDate,
                  },
                },
              },
            ],
          },
        },
      },
      { json: true },
      function(error, response) {
        if (error) {
          log.error(error);
          return reject(error);
        }
        if (!response.body || !response.body.count) {
          log.error('can not get count of docs for business: ', businessId);
          return reject();
        }
        return resolve(response.body.count);
      },
    );
  });
}

// get docs from elasticSearch for specific businessId
function getDocs(businessId, elasticPath, endDate, limit, skip) {
  return Q.promise(function(resolve, reject) {
    if (!businessId) {
      return reject('businessId is not defined');
    }
    if (!elasticPath) {
      return reject('elasticPath is not defined');
    }
    if (typeof limit == 'undefined' || limit == null) {
      return reject('limit is not defined');
    }
    if (typeof skip == 'undefined' || skip == null) {
      return reject('skip is not defined');
    }
    if (typeof endDate == 'undefined' || endDate == null) {
      return reject('endDate is not defined');
    }
    needle.post(
      elasticPath + '/_search',
      {
        size: limit,
        from: skip,
        sort: [{ creationDate: { order: 'asc' } }],
        query: {
          bool: {
            must: [
              {
                match: {
                  businessId: {
                    query: businessId,
                    type: 'phrase',
                  },
                },
              },
              {
                range: {
                  creationDate: {
                    lt: endDate,
                  },
                },
              },
            ],
          },
        },
      },
      { json: true },
      function(error, response) {
        if (error) {
          log.error(error);
          return reject(error);
        }
        if (!response.body || !response.body.hits || !response.body.hits.hits) {
          log.error(response.body);
          return resolve([]);
        }
        var logs = [];
        var docs = response.body.hits.hits;
        for (var i = 0; i < docs.length; i++) {
          var hit = docs[i];
          logs.push(hit._source);
        }
        return resolve(logs);
      },
    );
  });
}

// delete docs from elasticSearch for specific businessId
function deleteLog(businessId, elasticPath, endDate) {
  return Q.promise(function(resolve, reject) {
    if (!businessId) {
      return reject('no businessId defined');
    }
    if (!elasticPath) {
      return reject('no elasticPath defined');
    }
    if (!endDate) {
      return reject('no endDate defined');
    }
    needle.post(
      elasticPath + '/_delete_by_query',
      {
        query: {
          bool: {
            must: [
              {
                match: {
                  businessId: {
                    query: businessId,
                    type: 'phrase',
                  },
                },
              },
              {
                range: {
                  creationDate: {
                    lt: endDate,
                  },
                },
              },
            ],
          },
        },
      },
      { json: true },
      function(error, response) {
        if (error) {
          log.error(error);
          return reject(error);
        }
        if (!response.body || !response.body.total || !response.body.deleted) {
          log.debug(
            '@ELASTIC_DELETE_BY_QUERY#####>>>>  no docs deleted for businessId: ',
            businessId,
          );
          return resolve();
        }
        log.debug(
          '@ELASTIC_DELETE_BY_QUERY#####>>>>  deleted',
          response.body.deleted,
          ' docs for businessId: ',
          businessId,
        );
        return resolve();
      },
    );
  });
}

// create file for logs and copy to dropbox
function transferToExternalStorage(logs, fileName, token) {
  return Q.promise(function(resolve, reject) {
    createCSVFile(logs)
      .then(function(create) {
        var result = { status: create.status };
        log.debug('file created');
        if (create.status) {
          log.debug('Data written to file');
          log.debug('Sending ... ', create.path, fileName, token);
          theDropbox
            .uploadFile(create.path, fileName, token)
            .then(function(upload) {
              result = { status: upload.status };
              log.debug(fileName + ' uploaded to dropbox');
              return resolve(result);
            })
            .fail(function(error) {
              log.error(error.status);
              log.error(error.error);
              result = { status: false };
              return resolve(result);
            });
        } else {
          return resolve(result);
        }
      })
      .fail(function(error) {
        return reject(error);
      });
  });
}

// create JSON file
function createJsonFile(logs) {
  return Q.promise(function(resolve, reject) {
    temp.open('JsonFile', function(error, info) {
      if (error) {
        return reject(error);
      }
      var data = JSON.stringify(logs);
      fs.write(info.fd, data, 'utf8');
      fs.close(info.fd, function(error) {
        if (error) {
          return reject(error);
        }
        return resolve({ status: true, path: info.path });
      });
    });
  });
}

// create JSON file

function createCSVFile(logs) {
  return Q.promise(function(resolve, reject) {
    temp.open('JsonFile', function(error, info) {
      if (error) {
        return reject(error);
      }

      var json2csvParser = new Json2csvParser();
      var csv = json2csvParser.parse(logs);
      fs.write(info.fd, csv, 'utf8');
      fs.close(info.fd, function(error) {
        if (error) {
          return reject(error);
        }
        return resolve({ status: true, path: info.path });
      });
    });
  });
}

// get dropbox token for business
function getDropBoxToken(businessId) {
  return Q.Promise(function(resolve, reject) {
    auth
      .serviceManLogin(10 * 1000)
      .then(function(accessToken) {
        needle.get(
          BUSINESS_GET_REST_API.replace('{0}', businessId).replace(
            '{1}',
            accessToken,
          ),
          { json: true },
          function(error, response) {
            if (error) {
              log.error('failed to load business', error);
              return reject(error);
            }
            var business = response.body;
            log.debug('Business dropbox Token ', business.dropboxToken);
            var result = { result: false, token: '' };
            if (business.dropboxToken) {
              result.result = true;
              result.keepLogs = business.keepLogs === true;
              result.token = business.dropboxToken;
            } else {
              log.debug('not dropbox Token ', business);
            }
            return resolve(result);
          },
        );
      })
      .fail(function(error) {
        log.error(error);
        return reject(error);
      });
  });
}

function archiveLogs(reportPath) {
  return Q.Promise(function(resolve, reject) {
    var endDate = new Date(); //.setHours ( 0, 0, 0, 0 );
    var queryOptions = {
      size: businessSize,
      elasticPath: reportPath,
      endDate: endDate,
    };
    log.debug('get business list', queryOptions);
    //get businesses list from elasticSearch for index
    getBusinessList(queryOptions)
      .then(function(allBusinesses) {
        log.debug('business loaded:', allBusinesses.length);
        var reportToFilesTasks = [];
        for (var i = 0; i < allBusinesses.length; i++) {
          log.debug('businessId added:   ', allBusinesses[i].key);
          reportToFilesTasks.push(
            (function(businessId) {
              return function() {
                processLogs({
                  size: businessSize,
                  elasticPath: reportPath,
                  endDate: endDate,
                  businessId: businessId,
                });
              };
            })(allBusinesses[i].key),
          );
        }
        var reportToFilesTasksResult = Q({});
        reportToFilesTasks.forEach(function(f) {
          reportToFilesTasksResult = reportToFilesTasksResult.then(f);
        });
        reportToFilesTasksResult
          .then(function() {
            log.debug(
              'Done, It seems all logs moved properly, Requested path:',
              reportPath,
            );
            return resolve();
          })
          .fail(function(error) {
            log.error(error);
            return reject(error);
          });
      })
      .fail(function(error) {
        log.error(error);
        return reject(error);
      });
  });
}
var job = new CronJob({
  cronTime: process.env.DROPBOX_DOCS_COPY_CRON_JOB_SCHEDULER,
  onTick: function() {
    log.debug('archiveLogs job started');
    return archiveLogs(ELASTIC_NETFLOW_REPORT).then(function() {
      return archiveLogs(ELASTIC_SYSLOG_REPORT);
    });
  },
  start: true,
  timeZone: 'Asia/Tehran',
});
job.start();
log.debug('Copy archive logs to Dropbox: ', job.running);
//Run on start up

setTimeout(function() {
  return archiveLogs(ELASTIC_NETFLOW_REPORT);
}, 3000);

process.on('uncaughtException', function(error) {
  console.error('Something bad happened here....');
  console.error(error);
  console.error(error.stack);
  log.error(error);
  log.error(error.stack);
});
