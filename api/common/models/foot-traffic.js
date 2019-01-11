import aggregate from '../../server/modules/aggregates';
import logger from '../../server/modules/logger';
import config from '../../server/modules/config';
import app from '../../server/server';

const log = logger.createLogger();
module.exports = function(FootTraffic) {
  /* return array of new , return & total count of visitors base on interval date from aggregates.js
	 startDate: number
	 endDate: number
	 businessId: String
	 */
  FootTraffic.getVisitorsChart = function(
    startDate,
    endDate,
    businessId,
    offset,
    monthDays,
    cb,
  ) {
    var Business = app.models.Business;
    var fromDate = Number.parseInt(startDate);
    var toDate = Number.parseInt(endDate);
    var oneDay = config.AGGREGATE.DAY_MILLISECONDS;
    var intervalMili = oneDay;

    Business.findById(businessId, function(error, business) {
      if (error) {
        return cb(error);
      }
      if (!business) {
        return cb('invalid business id');
      }

      offset = -offset * config.AGGREGATE.HOUR_MILLISECONDS;
      // converting visitDuration to milli seconds
      var minVisitTime =
        (business.minVisitTime || config.MIN_VISIT_TIME_DEFAULT) *
        config.AGGREGATE.MINUTE_MILLISECONDS;
      var maxVisitTime =
        (business.maxVisitTime || config.MAX_VISIT_TIME_DEFAULT) *
        config.AGGREGATE.MINUTE_MILLISECONDS;

      aggregate
        .visitorsInterval(
          fromDate,
          toDate,
          intervalMili,
          minVisitTime,
          maxVisitTime,
          offset,
          businessId,
        )
        .then(function(returnDoc) {
          var response = { date: [], reVisitors: [], newVisitors: [] };
          if (monthDays.length == 0) {
            // calculate daily interval docs
            for (var reVisitors in returnDoc) {
              response.date[reVisitors] = returnDoc[reVisitors].key;
              response.reVisitors[reVisitors] =
                returnDoc[reVisitors].reVisitors;
              response.newVisitors[reVisitors] =
                returnDoc[reVisitors].newVisitors;
            }
          } else {
            // sum of persian month days
            var days = 0;
            var daysCounter = 0;
            for (var month in monthDays) {
              var returnVisitors = 0;
              var newVisitors = 0;
              days += monthDays[month];
              for (daysCounter; daysCounter < days; daysCounter++) {
                returnVisitors += returnDoc[daysCounter].reVisitors;
                newVisitors += returnDoc[daysCounter].newVisitors;
              }
              // add calculated month to response
              response.date[month] = returnDoc[days].key;
              response.reVisitors[month] = returnVisitors;
              response.newVisitors[month] = newVisitors;
            }
          }
          log.debug(
            'process of getting visitors info completed successfully' +
              JSON.stringify(response),
          );
          return cb(null, response);
        })
        .fail(function(error) {
          log.error(error);
          return cb(error);
        });
    });
  };
  FootTraffic.remoteMethod('getVisitorsChart', {
    description: 'Find data for chart of visitors from data source.',
    accepts: [
      {
        arg: 'startDate',
        type: 'string',
        required: true,
        description: 'Start Date',
      },
      {
        arg: 'endDate',
        type: 'string',
        required: true,
        description: 'End Date',
      },
      {
        arg: 'businessId',
        type: 'string',
        required: true,
        description: 'business ID',
      },
      {
        arg: 'offset',
        type: 'number',
        required: false,
        description: 'Time Zone',
      },
      {
        arg: 'monthDays',
        type: 'array',
        required: false,
        description: 'Days Of Month',
      },
    ],
    returns: { arg: 'result', type: 'Object' },
  });

  /* return total count of new visitors and growth rate from aggregates.js
	 startDate: number
	 endDate: number
	 businessId: String
	 */
  FootTraffic.getVisitorsPercent = function(
    startDate,
    endDate,
    businessId,
    cb,
  ) {
    var fromDate = Number.parseInt(startDate);
    var toDate = Number.parseInt(endDate);
    var Business = app.models.Business;
    // calculate mirror date
    var fromDateMirror =
      2 * Number.parseInt(startDate) - Number.parseInt(endDate);
    var toDateMirror = fromDate;

    Business.findById(businessId, function(error, business) {
      if (error) {
        return cb(error);
      }
      if (!business) {
        return cb('invalid business id');
      }
      // converting visitDuration to milli seconds
      var minVisitTime =
        (business.minVisitTime || config.MIN_VISIT_TIME_DEFAULT) *
        config.AGGREGATE.MINUTE_MILLISECONDS;
      var maxVisitTime =
        (business.maxVisitTime || config.MAX_VISIT_TIME_DEFAULT) *
        config.AGGREGATE.MINUTE_MILLISECONDS;

      aggregate
        .newVisitors(fromDate, toDate, minVisitTime, maxVisitTime, businessId)
        .then(function(visitors) {
          aggregate
            .newVisitors(
              fromDateMirror,
              toDateMirror,
              minVisitTime,
              maxVisitTime,
              businessId,
            )
            .then(function(mirrorVisitors) {
              var response = {};
              var percent = 0;

              // calculate growth percent
              if (mirrorVisitors == 0 && visitors == 0) {
                percent = 0;
              } else if (mirrorVisitors == 0) {
                percent = 100;
              } else {
                percent = (100 * (visitors - mirrorVisitors)) / mirrorVisitors;
                percent = Number(percent.toFixed(1));
              }
              response.visitors = visitors;
              response.mirrorVisitors = mirrorVisitors;
              response.percent = percent;

              log.debug(
                'process of getting visitors growth Rate completed successfully' +
                  JSON.stringify(response),
              );
              return cb(null, response);
            })
            .fail(function(error) {
              log.error(error);
              return cb(error);
            });
        })
        .fail(function(error) {
          log.error(error);
          return cb(error);
        });
    });
  };
  FootTraffic.remoteMethod('getVisitorsPercent', {
    description:
      'Find total count of new visitors and growth rate from data source.',
    accepts: [
      {
        arg: 'startDate',
        type: 'string',
        required: true,
        description: 'Start Date',
      },
      {
        arg: 'endDate',
        type: 'string',
        required: true,
        description: 'End Date',
      },
      {
        arg: 'businessId',
        type: 'string',
        required: true,
        description: 'business ID',
      },
    ],
    returns: { arg: 'result', type: 'Object' },
  });

  FootTraffic.findFootTraffic = function(deviceId, nasId, from, to, cb) {
    FootTraffic.findOne(
      {
        where: {
          and: [
            { deviceId: deviceId },
            { nasId: nasId },
            { creationDate: { gte: from } },
            { creationDate: { lt: to } },
          ],
        },
      },
      function(error, ft) {
        if (error) {
          return cb(error);
        }
        return cb(null, ft);
      },
    );
  };

  FootTraffic.remoteMethod('findFootTraffic', {
    description:
      'Find total count of new visitors and growth rate from data source.',
    accepts: [
      {
        arg: 'deviceId',
        type: 'string',
        required: true,
      },
      {
        arg: 'nasId',
        type: 'string',
        required: true,
      },
      {
        arg: 'from',
        type: 'number',
        required: true,
      },
      {
        arg: 'to',
        type: 'number',
        required: true,
      },
    ],
    returns: { root: true },
  });

  /*
	 Returns daily visits and walkBys due to the time interval.
	 If the selected time period on the dashboard is more than one day,
	 returns the average visits and walk bys per time interval.
	 startDate: number
	 endDate: number
	 timeInterval: number
	 businessId: String
	 */

  FootTraffic.getDailyVisitsChart = function(
    startDate,
    endDate,
    timeInterval,
    offset,
    businessId,
    cb,
  ) {
    var fromDate = Number.parseInt(startDate);
    var toDate = Number.parseInt(endDate);
    var numOfDays = Number.parseInt(
      (endDate - startDate) / config.AGGREGATE.DAY_MILLISECONDS,
    );
    var Business = app.models.Business;
    // log.debug("business id:", businessId);
    Business.findById(businessId, function(error, business) {
      if (error) {
        return cb(error);
      }
      if (!business) {
        return cb('invalid business id');
      }
      // log.debug("business:", business);

      // converting walkByDuration and visitDuration to milli seconds
      var minWalkByTime =
        (business.minWalkByTime || config.MIN_WALKBY_TIME_DEFAULT) *
        config.AGGREGATE.MINUTE_MILLISECONDS;
      var maxWalkByTime =
        (business.maxWalkByTime || config.MAX_WALKBY_TIME_DEFAULT) *
        config.AGGREGATE.MINUTE_MILLISECONDS;
      var minVisitTime =
        (business.minVisitTime || config.MIN_VISIT_TIME_DEFAULT) *
        config.AGGREGATE.MINUTE_MILLISECONDS;
      var maxVisitTime =
        (business.maxVisitTime || config.MAX_VISIT_TIME_DEFAULT) *
        config.AGGREGATE.MINUTE_MILLISECONDS;

      offset = -offset * config.AGGREGATE.HOUR_MILLISECONDS;

      aggregate
        .visitsInterval(
          fromDate,
          toDate,
          timeInterval,
          minWalkByTime,
          maxWalkByTime,
          offset,
          businessId,
        )
        .then(function(walkBysDoc) {
          aggregate
            .visitsInterval(
              fromDate,
              toDate,
              timeInterval,
              minVisitTime,
              maxVisitTime,
              offset,
              businessId,
            )
            .then(function(visitsDoc) {
              var response = { walkBys: [], visits: [] };
              // log.debug("walkBysDoc:", walkBysDoc);
              // log.debug("visitsDoc:", visitsDoc);

              for (var i = 0; i < walkBysDoc.length; i++) {
                var walkBysHour = Number.parseInt(
                  new Date(walkBysDoc[i].key).getHours(),
                );
                if (i < 24) {
                  response.walkBys[walkBysHour] = walkBysDoc[i].doc_count;
                } else {
                  response.walkBys[walkBysHour] =
                    response.walkBys[walkBysHour] + walkBysDoc[i].doc_count;
                }
                // log.debug("walkByHour:", walkBysHour, walkBysDoc[i].key, " num:", response.walkBys[walkBysHour]);
              }
              // log.debug("walkBys before average:", response.walkBys, "days:", numOfDays);
              for (var walkBy in response.walkBys) {
                response.walkBys[walkBy] = Number.parseInt(
                  response.walkBys[walkBy] / numOfDays,
                );
              }
              // log.debug("walkBys after average:", response.walkBys);

              for (var j = 0; j < visitsDoc.length; j++) {
                var visitsHour = Number.parseInt(
                  new Date(visitsDoc[j].key).getHours(),
                );
                if (j < 24) {
                  response.visits[visitsHour] = visitsDoc[j].doc_count;
                } else {
                  response.visits[visitsHour] =
                    response.visits[visitsHour] + visitsDoc[j].doc_count;
                }
                // log.debug("visitsHour:", visitsHour, " num:", response.visits[visitsHour]);
              }
              // log.debug("visits before average:", response.visits, "days:", numOfDays);
              for (var visit in response.visits) {
                response.visits[visit] = Number.parseInt(
                  response.visits[visit] / numOfDays,
                );
              }
              // log.debug("visits after average:", response.visits);

              log.debug(
                'process of getting average visits and walk-bys info completed successfully' +
                  JSON.stringify(response),
              );
              return cb(null, response);
            })
            .fail(function(error) {
              log.error(error);
              return cb(error);
            });
        })
        .fail(function(error) {
          log.error(error);
          return cb(error);
        });
    });
  };
  FootTraffic.remoteMethod('getDailyVisitsChart', {
    description: 'Find data for chart of visits from data source.',
    accepts: [
      {
        arg: 'startDate',
        type: 'string',
        required: true,
        description: 'Start Date',
      },
      {
        arg: 'endDate',
        type: 'string',
        required: true,
        description: 'End Date',
      },
      {
        arg: 'timeInterval',
        type: 'string',
        required: true,
        description: 'Time Intervals',
      },
      {
        arg: 'offset',
        type: 'number',
        required: false,
        description: 'Time Zone',
      },
      {
        arg: 'businessId',
        type: 'string',
        required: true,
        description: 'business ID',
      },
    ],
    returns: { root: true },
  });

  /* return total count visits and growth rate from aggregates.js
	 startDate: number
	 endDate: number
	 businessId: String
	 */

  FootTraffic.getVisitsPercent = function(startDate, endDate, businessId, cb) {
    var fromDate = Number.parseInt(startDate);
    var toDate = Number.parseInt(endDate);
    // calculate mirror date
    var fromDateMirror =
      2 * Number.parseInt(startDate) - Number.parseInt(endDate);
    var toDateMirror = fromDate;
    var Business = app.models.Business;

    Business.findById(businessId, function(error, business) {
      if (error) {
        return cb(error);
      }
      if (!business) {
        return cb('invalid business id');
      }
      // converting visitDuration to milli seconds
      var minVisitTime =
        (business.minVisitTime || config.MIN_VISIT_TIME_DEFAULT) *
        config.AGGREGATE.MINUTE_MILLISECONDS;
      var maxVisitTime =
        (business.maxVisitTime || config.MAX_VISIT_TIME_DEFAULT) *
        config.AGGREGATE.MINUTE_MILLISECONDS;

      aggregate
        .totalVisits(fromDate, toDate, minVisitTime, maxVisitTime, businessId)
        .then(function(visits) {
          aggregate
            .totalVisits(
              fromDateMirror,
              toDateMirror,
              minVisitTime,
              maxVisitTime,
              businessId,
            )
            .then(function(mirrorVisits) {
              var response = {};
              var percent = 0;
              // calculate growth percent
              if (mirrorVisits == 0 && visits == 0) {
                percent = 0;
              } else if (mirrorVisits == 0) {
                percent = 100;
              } else {
                percent = (100 * (visits - mirrorVisits)) / mirrorVisits;
                percent = Number(percent.toFixed(1));
              }
              response.visits = visits;
              response.mirrorVisits = mirrorVisits;
              response.percent = percent;

              log.debug(
                'process of getting visits growth Rate completed successfully' +
                  JSON.stringify(response),
              );
              return cb(null, response);
            })
            .fail(function(error) {
              log.error(error);
              return cb(error);
            });
        })
        .fail(function(error) {
          log.error(error);
          return cb(error);
        });
    });
  };
  FootTraffic.remoteMethod('getVisitsPercent', {
    description: 'Find total count of visits and growth rate from data source.',
    accepts: [
      {
        arg: 'startDate',
        type: 'string',
        required: true,
        description: 'Start Date',
      },
      {
        arg: 'endDate',
        type: 'string',
        required: true,
        description: 'End Date',
      },
      {
        arg: 'businessId',
        type: 'string',
        required: true,
        description: 'business ID',
      },
    ],
    returns: { root: true },
  });

  // add foot traffic to the task queue to be posted on elastic search:
  FootTraffic.observe('after save', function(ctx, next) {
    if (ctx.instance) {
      // FOOT_TRAFFIC_QUEUE.add(ctx.instance);
    }
    next();
  });
};
