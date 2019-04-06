"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
//import dotenv from 'dotenv';
const routes_1 = __importDefault(require("../src/routes"));
const errorHandler_1 = __importDefault(require("./utils/errorHandler"));
const logger_1 = __importDefault(require("./utils/logger"));
const worker_1 = require("./worker");
const initElasticsearch_1 = require("./modules/initElasticsearch");
const initRabbitMq_1 = require("./modules/initRabbitMq");
const enrich_1 = require("./worker/enrich");
const enrichScheduler_1 = require("./worker/enrichScheduler");
const counterScheduler_1 = require("./worker/counterScheduler");
//require('date-utils');
const log = logger_1.default.createLogger();
//hey you
//dotenv.load();
const app = express_1.default();
app.set('port', process.env.PORT || 3000);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use('/', routes_1.default);
app.use(errorHandler_1.default);
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
    await initElasticsearch_1.addElasticIndexTemplates();
    await initRabbitMq_1.addDefaultQueue();
    await worker_1.processLogRequest();
    await enrich_1.enrichLogs();
    await enrichScheduler_1.startEnrichScheduler();
    await counterScheduler_1.startCounterScheduler();
    console.log(`App is running at http://localhost:${app.get('port')}`);
    //await testRunner();
    log.info(` App is running at http://localhost:${app.get('port')}`);
});
process.on('uncaughtException', function (error) {
    console.error('Something bad happened here....');
    console.error(error);
    console.error(error.stack);
    log.error(error);
    log.error(error.stack);
});
//# sourceMappingURL=index.js.map