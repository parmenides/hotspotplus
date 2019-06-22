import express from 'express';
//import dotenv from 'dotenv';
import router from '../src/routes';
import errorHandler from './utils/errorHandler';
import logger from './utils/logger';
import { processLogRequest } from './worker/logBuilder';
import { testRunner } from './test';
import {
  addElasticIndexTemplates,
  addDefaultIndex,
} from './modules/initElasticsearch';
import { addDefaultQueue } from './modules/initRabbitMq';
import { enrichLogs } from './worker/enrich';
import { startEnrichScheduler } from './schedulers/enrichScheduler';
import { startCounterScheduler } from './schedulers/counterScheduler';

//require('date-utils');
const log = logger.createLogger();
//hey you
//dotenv.load();
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

app.listen(app.get('port'), async () => {
  /*tslint:disable*/
  console.log('Add default queues...');
  await addElasticIndexTemplates();
  await addDefaultIndex();
  await addDefaultQueue();
  await processLogRequest();
  await enrichLogs();
  await startEnrichScheduler();
  await startCounterScheduler();
  console.log(`App is running at http://localhost:${app.get('port')}`);
  //await testRunner();
  log.info(` App is running at http://localhost:${app.get('port')}`);
});

process.on('uncaughtException', function(error) {
  console.error('Something bad happened here....');
  console.error(error);
  console.error(error.stack);
  log.error(error);
  log.error(error.stack);
  //utility.sendMessage ( error, { fileName: 'server.js', source: 'boot' } );
});
