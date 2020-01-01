import express from 'express';
import router from '../src/routes';
import errorHandler from './utils/errorHandler';
import logger from './utils/logger';

const log = logger.createLogger();
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
  /*
  await clickHouse.queryNetflow({
    type: REPORT_TYPE.NETFLOW,
    id: '123',
  });*/
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
  process.exit(1);
});
