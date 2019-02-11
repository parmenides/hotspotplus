(function(e, a) { for(var i in a) e[i] = a[i]; }(exports, /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./index.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./controllers/index.ts":
/*!******************************!*\
  !*** ./controllers/index.ts ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst controller = {\n    health: (request, response) => {\n        response.send({ ok: true });\n    },\n};\nexports.default = controller;\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/controllers/index.ts");

/***/ }),

/***/ "./index.ts":
/*!******************!*\
  !*** ./index.ts ***!
  \******************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst express_1 = __importDefault(__webpack_require__(/*! express */ \"express\"));\nconst dotenv_1 = __importDefault(__webpack_require__(/*! dotenv */ \"dotenv\"));\nconst routes_1 = __importDefault(__webpack_require__(/*! ../src/routes */ \"./routes/index.ts\"));\nconst errorHandler_1 = __importDefault(__webpack_require__(/*! ./utils/errorHandler */ \"./utils/errorHandler.ts\"));\nconst logger_1 = __importDefault(__webpack_require__(/*! ./utils/logger */ \"./utils/logger.ts\"));\nconst worker_1 = __importDefault(__webpack_require__(/*! ./worker */ \"./worker/index.ts\"));\nconst initRabbitMq_1 = __webpack_require__(/*! ./modules/initRabbitMq */ \"./modules/initRabbitMq.ts\");\n//require('date-utils');\nconst log = logger_1.default.createLogger();\n//hey you\ndotenv_1.default.load();\nconst app = express_1.default();\napp.set('port', process.env.PORT || 3000);\napp.use(express_1.default.json());\napp.use(express_1.default.urlencoded({ extended: false }));\napp.use('/', routes_1.default);\napp.use(errorHandler_1.default);\napp.use((req, resp, next) => {\n    log.debug('####### Request Log #######');\n    log.debug('Path:', req.path);\n    log.debug('Query:', req.query);\n    log.debug('Methods:', req.method);\n    log.debug('Body %j', req.body);\n    next();\n});\napp.listen(app.get('port'), async () => {\n    /*tslint:disable*/\n    console.log('Add default queues...');\n    await initRabbitMq_1.addDefaultQueue();\n    await worker_1.default.processLogRequest();\n    console.log(`App is running at http://localhost:${app.get('port')}`);\n    //await testRunner();\n    log.info(` App is running at http://localhost:${app.get('port')}`);\n});\n//addSyslogIndexTemplates();\nprocess.on('uncaughtException', function (error) {\n    console.error('Something bad happened here....');\n    console.error(error);\n    console.error(error.stack);\n    log.error(error);\n    log.error(error.stack);\n});\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/index.ts");

/***/ }),

/***/ "./modules/initRabbitMq.ts":
/*!*********************************!*\
  !*** ./modules/initRabbitMq.ts ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst typings_1 = __webpack_require__(/*! ../typings */ \"./typings/index.ts\");\nconst rabbitmq_1 = __webpack_require__(/*! ../utils/rabbitmq */ \"./utils/rabbitmq.ts\");\nconst logger_1 = __importDefault(__webpack_require__(/*! ../utils/logger */ \"./utils/logger.ts\"));\nconst log = logger_1.default.createLogger();\nconst LOG_REQUEST_RETRY_MS = Number(process.env.LOG_REQUEST_RETRY_MS);\nexports.addDefaultQueue = async () => {\n    try {\n        const channel = await rabbitmq_1.getRabbitMqChannel();\n        // Add card to accountNumber Queue\n        await channel.assertExchange(typings_1.QUEUES.LOG_WORKER_EXCHANGE, 'fanout', {\n            durable: true,\n        });\n        await channel.assertQueue(typings_1.QUEUES.LOG_WORKER_QUEUE, {\n            deadLetterExchange: typings_1.QUEUES.RETRY_LOG_WORKER_EXCHANGE,\n            durable: true,\n        });\n        await channel.bindQueue(typings_1.QUEUES.LOG_WORKER_QUEUE, typings_1.QUEUES.LOG_WORKER_EXCHANGE, '');\n        // Add Retry card to accountNumber Queue\n        await channel.assertExchange(typings_1.QUEUES.RETRY_LOG_WORKER_EXCHANGE, 'fanout', {\n            durable: true,\n        });\n        await channel.assertQueue(typings_1.QUEUES.RETRY_LOG_WORKER_QUEUE, {\n            deadLetterExchange: typings_1.QUEUES.LOG_WORKER_EXCHANGE,\n            durable: true,\n            messageTtl: LOG_REQUEST_RETRY_MS,\n        });\n        await channel.bindQueue(typings_1.QUEUES.RETRY_LOG_WORKER_QUEUE, typings_1.QUEUES.RETRY_LOG_WORKER_EXCHANGE, '');\n        log.debug('Default queues added');\n    }\n    catch (error) {\n        log.error(error);\n        log.error('failed to add default queue');\n        throw error;\n    }\n};\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/modules/initRabbitMq.ts");

/***/ }),

/***/ "./routes/index.ts":
/*!*************************!*\
  !*** ./routes/index.ts ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst express_promise_router_1 = __importDefault(__webpack_require__(/*! express-promise-router */ \"express-promise-router\"));\nconst controllers_1 = __importDefault(__webpack_require__(/*! ../controllers */ \"./controllers/index.ts\"));\nconst router = express_promise_router_1.default();\nrouter.get('/health', controllers_1.default.health);\nexports.default = router;\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/routes/index.ts");

/***/ }),

/***/ "./typings/index.ts":
/*!**************************!*\
  !*** ./typings/index.ts ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nObject.defineProperty(exports, \"__esModule\", { value: true });\n//\nvar QUEUES;\n(function (QUEUES) {\n    QUEUES[\"LOG_WORKER_QUEUE\"] = \"log-worker\";\n    QUEUES[\"LOG_WORKER_EXCHANGE\"] = \"log-worker-ex\";\n    QUEUES[\"RETRY_LOG_WORKER_QUEUE\"] = \"retry-log-worker\";\n    QUEUES[\"RETRY_LOG_WORKER_EXCHANGE\"] = \"retry-log-worker-ex\";\n})(QUEUES = exports.QUEUES || (exports.QUEUES = {}));\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/typings/index.ts");

/***/ }),

/***/ "./utils/auth.ts":
/*!***********************!*\
  !*** ./utils/auth.ts ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n/**\n * Created by hamidehnouri on 9/21/2016 AD.\n */\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst logger_1 = __importDefault(__webpack_require__(/*! ./logger */ \"./utils/logger.ts\"));\nconst httpClient_1 = __webpack_require__(/*! ./httpClient */ \"./utils/httpClient.ts\");\nif (!process.env.SERVICE_MAN_USERNAME ||\n    !process.env.SERVICE_MAN_PASSWORD ||\n    !process.env.API_ADDRESS) {\n    throw new Error('invalid auth env variables');\n}\nconst API_ADDRESS = process.env.API_ADDRESS;\nconst log = logger_1.default.createLogger();\nexports.login = async (username, password) => {\n    const httpClient = httpClient_1.createHttpClient(API_ADDRESS);\n    const response = await httpClient.post('/api/Users/login', {\n        username,\n        password,\n    });\n    return response.data.id;\n};\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/utils/auth.ts");

/***/ }),

/***/ "./utils/elastic.ts":
/*!**************************!*\
  !*** ./utils/elastic.ts ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst elasticsearch_1 = __importDefault(__webpack_require__(/*! elasticsearch */ \"elasticsearch\"));\nconst elastic = new elasticsearch_1.default.Client({\n    // @ts-ignore\n    hosts: `${process.env.ELASTIC_IP}:${process.env.ELASTIC_PORT}`,\n    apiVersion: '6.5',\n    log: process.env.ELASTICSEARCH_LOG_LEVEL || 'info',\n});\nexports.default = elastic;\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/utils/elastic.ts");

/***/ }),

/***/ "./utils/errorHandler.ts":
/*!*******************************!*\
  !*** ./utils/errorHandler.ts ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst logger_1 = __importDefault(__webpack_require__(/*! ./logger */ \"./utils/logger.ts\"));\nconst log = logger_1.default.createLogger();\n// tslint:disable-next-line\nconst isDev = process.env.DEV == 'true';\nconst errorHandler = (error, req, res, next) => {\n    if (isDev) {\n        if (!error.status || error.status > 499) {\n            // tslint:disable-next-line no-console\n            console.log(error.stack);\n            log.error('Error:', error);\n            //log.error('Main Error Handler:', error.stack);\n        }\n    }\n    res.status(error.status || 500);\n    res.send({ message: error.message });\n};\nexports.default = errorHandler;\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/utils/errorHandler.ts");

/***/ }),

/***/ "./utils/httpClient.ts":
/*!*****************************!*\
  !*** ./utils/httpClient.ts ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst axios_1 = __importDefault(__webpack_require__(/*! axios */ \"axios\"));\nconst http_1 = __importDefault(__webpack_require__(/*! http */ \"http\"));\nconst https_1 = __importDefault(__webpack_require__(/*! https */ \"https\"));\nconst HTTP_KEEP_ALIVE_TIME = 5 * 60 * 1000;\nconst HTTP_TIME_OUT = 8000;\nexports.createHttpClient = (apiBaseUrl) => {\n    return axios_1.default.create({\n        baseURL: apiBaseUrl,\n        timeout: HTTP_TIME_OUT,\n        httpAgent: new http_1.default.Agent({\n            keepAlive: true,\n            keepAliveMsecs: HTTP_KEEP_ALIVE_TIME,\n        }),\n        httpsAgent: new https_1.default.Agent({\n            keepAlive: true,\n            keepAliveMsecs: HTTP_KEEP_ALIVE_TIME,\n        }),\n    });\n};\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/utils/httpClient.ts");

/***/ }),

/***/ "./utils/logger.ts":
/*!*************************!*\
  !*** ./utils/logger.ts ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst bunyan_1 = __importDefault(__webpack_require__(/*! bunyan */ \"bunyan\"));\nexports.createLogger = () => {\n    const level = process.env.LOG_LEVEL;\n    let streams;\n    if (process.env.LOG_LEVEL && process.env.LOG_PATH) {\n        streams = [\n            {\n                path: process.env.LOG_PATH,\n            },\n        ];\n    }\n    return bunyan_1.default.createLogger({\n        name: 'log-worker',\n        streams,\n        level,\n    });\n};\nexports.default = {\n    createLogger: exports.createLogger,\n};\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/utils/logger.ts");

/***/ }),

/***/ "./utils/rabbitmq.ts":
/*!***************************!*\
  !*** ./utils/rabbitmq.ts ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst amqplib_1 = __importDefault(__webpack_require__(/*! amqplib */ \"amqplib\"));\nif (!process.env.RABBITMQ_USERNAME || !process.env.RABBITMQ_PASSWORD) {\n    throw new Error('invalid rabbit credentials');\n}\nlet connection;\nexports.getRabbitMqConnection = async () => {\n    if (connection !== undefined) {\n        return connection;\n    }\n    connection = await amqplib_1.default.connect(`amqp://${process.env.RABBITMQ_USERNAME}:${process.env.RABBITMQ_PASSWORD}@rabbitmq`);\n    return connection;\n};\nexports.getRabbitMqChannel = async () => {\n    const amqpConnection = await exports.getRabbitMqConnection();\n    return amqpConnection.createConfirmChannel();\n};\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/utils/rabbitmq.ts");

/***/ }),

/***/ "./worker/index.ts":
/*!*************************!*\
  !*** ./worker/index.ts ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst logger_1 = __importDefault(__webpack_require__(/*! ../utils/logger */ \"./utils/logger.ts\"));\nconst rabbitmq_1 = __webpack_require__(/*! ../utils/rabbitmq */ \"./utils/rabbitmq.ts\");\nconst netflow_1 = __importDefault(__webpack_require__(/*! ./netflow */ \"./worker/netflow.ts\"));\nconst session_1 = __importDefault(__webpack_require__(/*! ./session */ \"./worker/session.ts\"));\nconst httpClient_1 = __webpack_require__(/*! ../utils/httpClient */ \"./utils/httpClient.ts\");\nconst json2csv_1 = __webpack_require__(/*! json2csv */ \"json2csv\");\nconst fs_1 = __importDefault(__webpack_require__(/*! fs */ \"fs\"));\nconst request_promise_1 = __importDefault(__webpack_require__(/*! request-promise */ \"request-promise\"));\nconst auth_1 = __webpack_require__(/*! ../utils/auth */ \"./utils/auth.ts\");\nconst tmp_promise_1 = __webpack_require__(/*! tmp-promise */ \"tmp-promise\");\nconst util_1 = __importDefault(__webpack_require__(/*! util */ \"util\"));\nconst syslog_1 = __importDefault(__webpack_require__(/*! ./syslog */ \"./worker/syslog.ts\"));\nconst typings_1 = __webpack_require__(/*! ../typings */ \"./typings/index.ts\");\n// Convert fs.readFile into Promise version of same\nconst log = logger_1.default.createLogger();\nconst UPLOAD_API = `${process.env.API_ADDRESS}/api/file/upload`;\nconst REPORT_API = `${process.env.API_ADDRESS}/api/Reports`;\nif (!process.env.SERVICE_MAN_USERNAME ||\n    !process.env.SERVICE_MAN_PASSWORD ||\n    !process.env.API_ADDRESS) {\n    throw new Error('invalid auth env variables');\n}\nvar ReportType;\n(function (ReportType) {\n    ReportType[\"NETFLOW\"] = \"netflow\";\n    ReportType[\"SYSLOG\"] = \"syslog\";\n})(ReportType = exports.ReportType || (exports.ReportType = {}));\nconst processLogRequest = async () => {\n    log.debug('At processing log requests');\n    const channel = await rabbitmq_1.getRabbitMqChannel();\n    process.once('SIGINT', async () => {\n        await channel.close();\n    });\n    channel.consume(typings_1.QUEUES.LOG_WORKER_QUEUE, async (message) => {\n        if (!message) {\n            log.debug('empty message:', message);\n            throw new Error('empty message');\n        }\n        const body = message.content.toString();\n        log.debug(\" [x] Received '%s'\", body);\n        const reportRequestTask = JSON.parse(body);\n        try {\n            const sessionData = await session_1.default.findSessions(reportRequestTask);\n            log.debug(`Sessions: nasIps: ${sessionData.nasIpList} memberIps: ${sessionData.memberIpList}`);\n            let reports;\n            let fields;\n            if (reportRequestTask.reportType === ReportType.NETFLOW) {\n                reports = await netflow_1.default.getNetflowReports(reportRequestTask.username, reportRequestTask.fromDate, reportRequestTask.toDate, {\n                    nasIpList: sessionData.nasIpList,\n                    memberIpList: sessionData.memberIpList,\n                });\n                fields = getNetflowFields();\n            }\n            else if (reportRequestTask.reportType === ReportType.SYSLOG) {\n                reports = await syslog_1.default.getSyslogReports(reportRequestTask.username, reportRequestTask.fromDate, reportRequestTask.toDate, {\n                    nasIpList: sessionData.nasIpList,\n                    memberIpList: sessionData.memberIpList,\n                });\n                fields = getSyslogFields();\n            }\n            else {\n                throw new Error('invalid report type');\n            }\n            log.debug(reports);\n            const csvReport = jsonToCsv(fields, reports);\n            log.debug(csvReport);\n            await uploadReport(reportRequestTask.reportRequestId, reportRequestTask.businessId, csvReport);\n            channel.ack(message);\n        }\n        catch (error) {\n            log.error(error);\n            channel.nack(message, false, false);\n        }\n    }, { noAck: false });\n};\nconst getNetflowFields = () => {\n    return [\n        'username',\n        'date',\n        'src_addr',\n        'src_port',\n        'src_port_name',\n        'src_mac',\n        'dst_addr',\n        'dst_port',\n        'dst_port_name',\n        'dst_mac',\n        'protocol_name',\n        '@timestamp',\n    ];\n};\nconst getSyslogFields = () => {\n    return ['username', 'date', 'domain', 'method', 'url', '@timestamp'];\n};\nconst jsonToCsv = (fields, jsonData) => {\n    try {\n        const opts = { fields };\n        const json2CsvParser = new json2csv_1.Parser(opts);\n        const csvReport = json2CsvParser.parse(jsonData);\n        return csvReport;\n    }\n    catch (error) {\n        log.error(error);\n        throw error;\n    }\n};\nconst writeFile = util_1.default.promisify(fs_1.default.writeFile);\nconst closeFile = util_1.default.promisify(fs_1.default.close);\nconst unlink = util_1.default.promisify(fs_1.default.unlink);\nconst uploadReport = async (reportId, businessId, csv) => {\n    const reportFile = await tmp_promise_1.file();\n    await writeFile(reportFile.path, csv, 'utf8');\n    await closeFile(reportFile.fd);\n    log.debug(reportFile.path);\n    log.debug(reportFile.path);\n    const token = await auth_1.login(\n    // @ts-ignore\n    process.env.SERVICE_MAN_USERNAME, process.env.SERVICE_MAN_PASSWORD);\n    const options = {\n        method: 'POST',\n        url: UPLOAD_API,\n        headers: {\n            authorization: token,\n            Accept: 'application/json',\n            'cache-control': 'no-cache',\n            'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',\n        },\n        formData: {\n            businessId,\n            myfile: {\n                value: fs_1.default.createReadStream(reportFile.path),\n                options: { filename: 'report.csv', contentType: 'text/csv' },\n            },\n        },\n    };\n    const response = await request_promise_1.default(options);\n    await unlink(reportFile.path);\n    const data = JSON.parse(response);\n    await updateReportRequest(reportId, data.fileId);\n};\nconst updateReportRequest = async (reportId, fileStorageId) => {\n    const token = await auth_1.login(\n    // @ts-ignore\n    process.env.SERVICE_MAN_USERNAME, process.env.SERVICE_MAN_PASSWORD);\n    log.debug('report:', reportId);\n    log.debug('file:', fileStorageId);\n    const httpClient = httpClient_1.createHttpClient(`${REPORT_API}`);\n    await httpClient.patch(`/${reportId}`, {\n        status: 'ready',\n        fileStorageId,\n    }, {\n        headers: {\n            authorization: token,\n        },\n    });\n};\nexports.default = {\n    processLogRequest,\n};\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/worker/index.ts");

/***/ }),

/***/ "./worker/netflow.ts":
/*!***************************!*\
  !*** ./worker/netflow.ts ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst logger_1 = __importDefault(__webpack_require__(/*! ../utils/logger */ \"./utils/logger.ts\"));\nconst elastic_1 = __importDefault(__webpack_require__(/*! ../utils/elastic */ \"./utils/elastic.ts\"));\nconst moment_timezone_1 = __importDefault(__webpack_require__(/*! moment-timezone */ \"moment-timezone\"));\nconst moment_jalaali_1 = __importDefault(__webpack_require__(/*! moment-jalaali */ \"moment-jalaali\"));\nconst NETFLOW_LOG_INDEX_PREFIX = `netflow-`;\nconst log = logger_1.default.createLogger();\nconst getNetflowReports = async (username, from, to, netflowIpQueryData) => {\n    const fromDate = moment_timezone_1.default.tz(from, 'Europe/London');\n    const fromDateCounter = moment_timezone_1.default.tz(from, 'Europe/London');\n    const toDate = moment_timezone_1.default.tz(to, 'Europe/London');\n    const daysBetweenInMs = toDate.diff(fromDateCounter);\n    const days = Math.ceil(daysBetweenInMs / 86400000);\n    const indexNames = [createNetflowIndexName(fromDateCounter)];\n    for (let i = 0; i < days; i++) {\n        fromDateCounter.add(1, 'days');\n        indexNames.push(createNetflowIndexName(fromDateCounter));\n    }\n    let data = [];\n    log.debug('INDEXES:', indexNames);\n    for (const indexName of indexNames) {\n        try {\n            const result = await getNetflowsByIndex(indexName, fromDate, toDate, netflowIpQueryData);\n            data = data.concat(result);\n        }\n        catch (error) {\n            if (error.status === 404) {\n                log.warn(`${indexName} index not found`);\n            }\n            else {\n                log.error(error.status);\n                throw error;\n            }\n        }\n    }\n    //log.debug('log', data);\n    log.debug(data.length);\n    //log.debug(formattedResult);\n    return formatReports(username, data);\n};\nconst formatReports = (username, rawNetflowReports) => {\n    return rawNetflowReports.map((rawReport) => {\n        const localDate = moment_timezone_1.default.tz(rawReport._source['@timestamp'], 'Asia/Tehran');\n        const jalaaliDate = moment_jalaali_1.default(localDate);\n        return {\n            username,\n            date: getJalaaliDate(jalaaliDate),\n            src_addr: rawReport._source.netflow.src_addr,\n            src_port: rawReport._source.netflow.src_port,\n            src_port_name: rawReport._source.netflow.src_port_name,\n            src_mac: rawReport._source.netflow.src_mac,\n            dst_addr: rawReport._source.netflow.dst_addr,\n            dst_port: rawReport._source.netflow.dst_port,\n            dst_port_name: rawReport._source.netflow.dst_port_name,\n            dst_mac: rawReport._source.netflow.dst_mac,\n            protocol_name: rawReport._source.netflow.protocol_name,\n            '@timestamp': rawReport._source['@timestamp'],\n        };\n    });\n};\nconst getJalaaliDate = (date) => {\n    return date.format('jYYYY/jM/jD HH:MM');\n};\nconst createNetflowIndexName = (fromDate) => {\n    return `${NETFLOW_LOG_INDEX_PREFIX}${fromDate.format('YYYY.MM.DD')}`;\n};\nconst getNetflowsByIndex = async (netflowIndex, fromDate, toDate, netflowIpQueryData) => {\n    const countResponse = await countNetflowReportByIndex(netflowIndex, fromDate, toDate, netflowIpQueryData);\n    const totalLogs = countResponse.count;\n    log.debug(totalLogs);\n    const maxResultSize = 500;\n    log.debug(Math.ceil(totalLogs / maxResultSize));\n    const partsLen = totalLogs > maxResultSize ? Math.ceil(totalLogs / maxResultSize) : 1;\n    const parts = new Array(partsLen);\n    let from = 0;\n    let result = [];\n    for (const i of parts) {\n        try {\n            const queryResult = await queryNetflowReports(netflowIndex, from, maxResultSize, fromDate, toDate, netflowIpQueryData);\n            if (queryResult.hits) {\n                result = result.concat(queryResult.hits.hits);\n            }\n            else {\n                log.warn(queryResult);\n            }\n            from = from + maxResultSize;\n        }\n        catch (error) {\n            log.error(error);\n            throw error;\n        }\n    }\n    return result;\n};\nconst countNetflowReportByIndex = async (indexName, fromDate, toDate, netflowIpQueryData) => {\n    const result = await elastic_1.default.count({\n        index: indexName,\n        body: createNetflowQuery(fromDate, toDate, netflowIpQueryData),\n    });\n    return result;\n};\nconst queryNetflowReports = async (indexName, fromIndex, size, fromDate, toDate, netflowIpQueryData) => {\n    const result = await elastic_1.default.search({\n        index: indexName,\n        from: fromIndex,\n        size,\n        body: createNetflowQuery(fromDate, toDate, netflowIpQueryData),\n    });\n    return result;\n};\nconst createNetflowQuery = (fromDate, toDate, netflowIpQueryData) => {\n    return {\n        query: {\n            bool: {\n                must: [\n                    {\n                        terms: {\n                            host: netflowIpQueryData.nasIpList,\n                        },\n                    },\n                    {\n                        terms: {\n                            'netflow.src_addr': netflowIpQueryData.memberIpList,\n                        },\n                    },\n                    {\n                        range: {\n                            '@timestamp': {\n                                gte: fromDate.format(),\n                                lte: toDate.format(),\n                            },\n                        },\n                    },\n                ],\n            },\n        },\n    };\n};\nexports.default = {\n    getNetflowsByIndex,\n    getNetflowReports,\n};\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/worker/netflow.ts");

/***/ }),

/***/ "./worker/session.ts":
/*!***************************!*\
  !*** ./worker/session.ts ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst logger_1 = __importDefault(__webpack_require__(/*! ../utils/logger */ \"./utils/logger.ts\"));\nconst elastic_1 = __importDefault(__webpack_require__(/*! ../utils/elastic */ \"./utils/elastic.ts\"));\nconst SESSION_LOG_INDEX = `${process.env.ELASTIC_INDEX_PREFIX}sessions`;\nconst log = logger_1.default.createLogger();\nconst countSessions = async (sessionQuery) => {\n    const result = await elastic_1.default.count({\n        index: SESSION_LOG_INDEX,\n        body: createSearchSessionQuery(sessionQuery),\n    });\n    return result;\n};\nconst findSessions = async (reportRequestTask) => {\n    const countResponse = await countSessions(reportRequestTask);\n    const totalSessions = countResponse.count;\n    const maxResultSize = 500;\n    log.debug(Math.ceil(totalSessions / maxResultSize));\n    const partsLen = totalSessions > maxResultSize\n        ? Math.ceil(totalSessions / maxResultSize)\n        : 1;\n    const parts = new Array(partsLen);\n    let from = 0;\n    let result = [];\n    for (const i of parts) {\n        try {\n            const queryResult = await querySessions(from, maxResultSize, reportRequestTask);\n            if (queryResult.hits) {\n                result = result.concat(queryResult.hits.hits);\n            }\n            else {\n                log.warn(queryResult);\n            }\n            from = from + maxResultSize;\n        }\n        catch (error) {\n            log.error(error);\n            throw error;\n        }\n    }\n    const clientIpList = new Set();\n    const nasIpList = new Set();\n    result.map((item) => {\n        clientIpList.add(item._source.framedIpAddress);\n        nasIpList.add(item._source.nasIp);\n    });\n    log.debug(Array.from(clientIpList));\n    log.debug(Array.from(nasIpList));\n    return {\n        memberIpList: Array.from(clientIpList),\n        nasIpList: Array.from(nasIpList),\n    };\n};\nconst querySessions = async (from, size, sessionQuery) => {\n    log.debug(`session query %j`, createSearchSessionQuery(sessionQuery));\n    const result = await elastic_1.default.search({\n        index: SESSION_LOG_INDEX,\n        from,\n        size,\n        filterPath: [\n            'hits.hits._source.framedIpAddress',\n            'hits.hits._source.nasIp',\n        ],\n        body: createSearchSessionQuery(sessionQuery),\n    });\n    return result;\n};\nconst createSearchSessionQuery = (sessionQuery) => {\n    return {\n        query: {\n            bool: {\n                must: [\n                    {\n                        term: {\n                            memberId: sessionQuery.memberId,\n                        },\n                    },\n                    {\n                        term: {\n                            businessId: sessionQuery.businessId,\n                        },\n                    },\n                    {\n                        range: {\n                            creationDate: {\n                                gte: sessionQuery.fromDate,\n                                lte: sessionQuery.toDate,\n                            },\n                        },\n                    },\n                ],\n            },\n        },\n    };\n};\nexports.default = {\n    findSessions,\n};\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/worker/session.ts");

/***/ }),

/***/ "./worker/syslog.ts":
/*!**************************!*\
  !*** ./worker/syslog.ts ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst logger_1 = __importDefault(__webpack_require__(/*! ../utils/logger */ \"./utils/logger.ts\"));\nconst elastic_1 = __importDefault(__webpack_require__(/*! ../utils/elastic */ \"./utils/elastic.ts\"));\nconst moment_timezone_1 = __importDefault(__webpack_require__(/*! moment-timezone */ \"moment-timezone\"));\nconst moment_jalaali_1 = __importDefault(__webpack_require__(/*! moment-jalaali */ \"moment-jalaali\"));\nconst SYSLOG_LOG_INDEX_PREFIX = `syslog-`;\nconst log = logger_1.default.createLogger();\nconst getSyslogReports = async (username, from, to, syslogIpQueryData) => {\n    const fromDateCounter = moment_timezone_1.default.tz(from, 'Europe/London');\n    const fromDate = moment_timezone_1.default.tz(from, 'Europe/London');\n    const toDate = moment_timezone_1.default.tz(to, 'Europe/London');\n    const daysBetweenInMs = toDate.diff(fromDateCounter);\n    const days = Math.ceil(daysBetweenInMs / 86400000);\n    const indexNames = [exports.createSyslogIndexName(fromDateCounter)];\n    for (let i = 0; i < days; i++) {\n        fromDateCounter.add(1, 'days');\n        indexNames.push(exports.createSyslogIndexName(fromDateCounter));\n    }\n    let data = [];\n    log.debug('indexes: ', indexNames);\n    for (const indexName of indexNames) {\n        try {\n            const result = await getSyslogByIndex(indexName, fromDate, toDate, syslogIpQueryData);\n            data = data.concat(result);\n        }\n        catch (error) {\n            if (error.status === 404) {\n                log.warn(`${indexName} index not found`);\n            }\n            else {\n                log.error(error.status);\n                throw error;\n            }\n        }\n    }\n    //log.debug('log', data);\n    log.debug('Result size:', data.length);\n    //log.debug(formattedResult);\n    return formatReports(username, data);\n};\nconst formatReports = (username, rawSyslogReports) => {\n    return rawSyslogReports.map((rawReport) => {\n        const localDate = moment_timezone_1.default.tz(rawReport._source['@timestamp'], 'Asia/Tehran');\n        const jalaaliDate = moment_jalaali_1.default(localDate);\n        return {\n            username,\n            date: getJalaaliDate(jalaaliDate),\n            domain: rawReport._source.domain,\n            memberIp: rawReport._source.memberIp,\n            nasIp: rawReport._source.nasIp,\n            method: rawReport._source.method,\n            url: rawReport._source.url,\n            '@timestamp': rawReport._source['@timestamp'],\n        };\n    });\n};\nconst getJalaaliDate = (date) => {\n    return date.format('jYYYY/jM/jD HH:MM');\n};\nexports.createSyslogIndexName = (fromDate) => {\n    return `${SYSLOG_LOG_INDEX_PREFIX}${fromDate.format('YYYY.MM.DD')}`;\n};\nconst getSyslogByIndex = async (syslogIndex, fromDate, toDate, syslogIpQueryData) => {\n    log.debug(`query from ${syslogIndex} from ${fromDate.format()} to ${toDate.format()} for %j`, syslogIpQueryData);\n    const countResponse = await countSyslogReportByIndex(syslogIndex, fromDate, toDate, syslogIpQueryData);\n    const totalLogs = countResponse.count;\n    log.debug(`total logs ${totalLogs}`);\n    const maxResultSize = 500;\n    log.debug(Math.ceil(totalLogs / maxResultSize));\n    const partsLen = totalLogs > maxResultSize ? Math.ceil(totalLogs / maxResultSize) : 1;\n    const parts = new Array(partsLen);\n    let from = 0;\n    let result = [];\n    for (const i of parts) {\n        try {\n            const queryResult = await querySyslogReports(syslogIndex, from, maxResultSize, fromDate, toDate, syslogIpQueryData);\n            if (queryResult.hits) {\n                result = result.concat(queryResult.hits.hits);\n            }\n            else {\n                log.warn(queryResult);\n            }\n            log.warn(queryResult);\n            from = from + maxResultSize;\n        }\n        catch (error) {\n            log.error(error);\n            throw error;\n        }\n    }\n    return result;\n};\nconst countSyslogReportByIndex = async (indexName, fromDate, toDate, syslogIpQueryData) => {\n    const result = await elastic_1.default.count({\n        index: indexName,\n        body: createCountSyslogQuery(fromDate, toDate, syslogIpQueryData),\n    });\n    return result;\n};\nconst querySyslogReports = async (indexName, fromIndex, size, fromDate, toDate, syslogIpQueryData) => {\n    const result = await elastic_1.default.search({\n        index: indexName,\n        from: fromIndex,\n        size,\n        body: createSyslogQuery(fromDate, toDate, syslogIpQueryData),\n    });\n    return result;\n};\nconst createSyslogQuery = (fromDate, toDate, syslogIpQueryData) => {\n    return {\n        query: {\n            bool: {\n                must: [\n                    {\n                        terms: {\n                            nasIp: syslogIpQueryData.nasIpList,\n                        },\n                    },\n                    {\n                        terms: {\n                            memberIp: syslogIpQueryData.memberIpList,\n                        },\n                    },\n                    {\n                        range: {\n                            '@timestamp': {\n                                gte: fromDate.format(),\n                                lte: toDate.format(),\n                            },\n                        },\n                    },\n                ],\n            },\n        },\n        aggs: {\n            group_by_domain: {\n                terms: {\n                    field: 'domain',\n                },\n            },\n        },\n    };\n};\nconst createCountSyslogQuery = (fromDate, toDate, syslogIpQueryData) => {\n    return {\n        query: {\n            bool: {\n                must: [\n                    {\n                        terms: {\n                            nasIp: syslogIpQueryData.nasIpList,\n                        },\n                    },\n                    {\n                        terms: {\n                            memberIp: syslogIpQueryData.memberIpList,\n                        },\n                    },\n                    {\n                        range: {\n                            '@timestamp': {\n                                gte: fromDate.format(),\n                                lte: toDate.format(),\n                            },\n                        },\n                    },\n                ],\n            },\n        },\n    };\n};\nexports.default = {\n    getSyslogByIndex,\n    getSyslogReports,\n};\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/worker/syslog.ts");

/***/ }),

/***/ "amqplib":
/*!**************************!*\
  !*** external "amqplib" ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"amqplib\");\n\n//# sourceURL=file:///external%2520%2522amqplib%2522");

/***/ }),

/***/ "axios":
/*!************************!*\
  !*** external "axios" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"axios\");\n\n//# sourceURL=file:///external%2520%2522axios%2522");

/***/ }),

/***/ "bunyan":
/*!*************************!*\
  !*** external "bunyan" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"bunyan\");\n\n//# sourceURL=file:///external%2520%2522bunyan%2522");

/***/ }),

/***/ "dotenv":
/*!*************************!*\
  !*** external "dotenv" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"dotenv\");\n\n//# sourceURL=file:///external%2520%2522dotenv%2522");

/***/ }),

/***/ "elasticsearch":
/*!********************************!*\
  !*** external "elasticsearch" ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"elasticsearch\");\n\n//# sourceURL=file:///external%2520%2522elasticsearch%2522");

/***/ }),

/***/ "express":
/*!**************************!*\
  !*** external "express" ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"express\");\n\n//# sourceURL=file:///external%2520%2522express%2522");

/***/ }),

/***/ "express-promise-router":
/*!*****************************************!*\
  !*** external "express-promise-router" ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"express-promise-router\");\n\n//# sourceURL=file:///external%2520%2522express-promise-router%2522");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"fs\");\n\n//# sourceURL=file:///external%2520%2522fs%2522");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"http\");\n\n//# sourceURL=file:///external%2520%2522http%2522");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"https\");\n\n//# sourceURL=file:///external%2520%2522https%2522");

/***/ }),

/***/ "json2csv":
/*!***************************!*\
  !*** external "json2csv" ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"json2csv\");\n\n//# sourceURL=file:///external%2520%2522json2csv%2522");

/***/ }),

/***/ "moment-jalaali":
/*!*********************************!*\
  !*** external "moment-jalaali" ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"moment-jalaali\");\n\n//# sourceURL=file:///external%2520%2522moment-jalaali%2522");

/***/ }),

/***/ "moment-timezone":
/*!**********************************!*\
  !*** external "moment-timezone" ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"moment-timezone\");\n\n//# sourceURL=file:///external%2520%2522moment-timezone%2522");

/***/ }),

/***/ "request-promise":
/*!**********************************!*\
  !*** external "request-promise" ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"request-promise\");\n\n//# sourceURL=file:///external%2520%2522request-promise%2522");

/***/ }),

/***/ "tmp-promise":
/*!******************************!*\
  !*** external "tmp-promise" ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"tmp-promise\");\n\n//# sourceURL=file:///external%2520%2522tmp-promise%2522");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"util\");\n\n//# sourceURL=file:///external%2520%2522util%2522");

/***/ })

/******/ })));