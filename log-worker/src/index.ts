import express from 'express';
import dotenv from 'dotenv';
import router from '../src/routes';
import errorHandler from './utils/errorHandler';
import logger from './utils/logger';
import netflowService from './worker/netflow';
import sessionService from './worker/session';

//require('date-utils');
const log = logger.createLogger();

//hey you
dotenv.load();
const app = express();

app.set('port', process.env.PORT || 3000);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/', router);
app.use(errorHandler);

app.use((req, resp, next) => {
  log.debug('####### Request Log #######');
  log.debug('Path:', req.path);
  log.debug('Query:', req.query);
  log.debug('Methods:', req.method);
  log.debug('Body %j', req.body);
  next();
});

app.listen(app.get('port'), () => {
  /*tslint:disable*/
  console.log(` App is running at http://localhost:${app.get('port')}`);
  log.info(` App is running at http://localhost:${app.get('port')}`);
});

//services.processPaymentRequests();

const from = new Date('2019-01-21T00:00:00+03:30').getTime();
const to = new Date('2019-01-29T23:59:59+03:30').getTime();

sessionService.findSessions({
  businessId: '5c46c8694f9e8400d37c66b4',
  memberId: '5c472bc538a573001cb1ae2d',
  fromDate: from,
  toDate: to,
});

/*
services.getNetflowsByIndex(
  'netflow-2019.01.25',
  from,
  to,
  ['192.168.2.254'],
  ['172.20.0.1'],
);
*/

netflowService.getNetflowReports(from, to, {
  clientIpList: ['192.168.2.254'],
  nasIpList: ['172.20.0.1'],
});

process.on('uncaughtException', function(error) {
  console.error('Something bad happened here....');
  console.error(error);
  console.error(error.stack);
  log.error(error);
  log.error(error.stack);
});
