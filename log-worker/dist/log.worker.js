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
eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst express_1 = __importDefault(__webpack_require__(/*! express */ \"express\"));\n//import dotenv from 'dotenv';\nconst routes_1 = __importDefault(__webpack_require__(/*! ../src/routes */ \"./routes/index.ts\"));\nconst errorHandler_1 = __importDefault(__webpack_require__(/*! ./utils/errorHandler */ \"./utils/errorHandler.ts\"));\nconst logger_1 = __importDefault(__webpack_require__(/*! ./utils/logger */ \"./utils/logger.ts\"));\nconst initElasticsearch_1 = __webpack_require__(/*! ./modules/initElasticsearch */ \"./modules/initElasticsearch.ts\");\nconst initRabbitMq_1 = __webpack_require__(/*! ./modules/initRabbitMq */ \"./modules/initRabbitMq.ts\");\nconst logBuilder_1 = __webpack_require__(/*! ./worker/logBuilder */ \"./worker/logBuilder.ts\");\n/*import { testRunner } from './test';*/\n//require('date-utils');\nconst log = logger_1.default.createLogger();\n//hey you\n//dotenv.load();\nconst app = express_1.default();\napp.set('port', process.env.PORT || 3000);\napp.use(express_1.default.json());\napp.use(express_1.default.urlencoded({ extended: false }));\napp.use('/', routes_1.default);\napp.use(errorHandler_1.default);\napp.use((req, resp, next) => {\n    log.debug('####### Request Log #######');\n    log.debug('Path:', req.path);\n    log.debug('Query:', req.query);\n    log.debug('Methods:', req.method);\n    log.debug('Body %j', req.body);\n    next();\n});\napp.listen(app.get('port'), async () => {\n    /*tslint:disable*/\n    console.log('Add default queues...');\n    await initElasticsearch_1.addElasticIndexTemplates();\n    await initElasticsearch_1.addDefaultIndex();\n    await initRabbitMq_1.addDefaultQueue();\n    await logBuilder_1.processLogRequest();\n    /*\n    ================\n      await enrichLogs();\n      await startEnrichScheduler();\n      await startCounterScheduler();\n    */\n    /*\n    await clickHouse.queryNetflow({\n      type: REPORT_TYPE.NETFLOW,\n      id: '123',\n    });*/\n    console.log(`App is running at http://localhost:${app.get('port')}`);\n    //await testRunner();\n    log.info(` App is running at http://localhost:${app.get('port')}`);\n});\nprocess.on('uncaughtException', function (error) {\n    console.error('Something bad happened here....');\n    console.error(error);\n    console.error(error.stack);\n    log.error(error);\n    log.error(error.stack);\n    //utility.sendMessage ( error, { fileName: 'server.js', source: 'boot' } );\n});\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/index.ts");

/***/ }),

/***/ "./modules/clickhouse.ts":
/*!*******************************!*\
  !*** ./modules/clickhouse.ts ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\n// @ts-ignore\nconst clickhouse_1 = __importDefault(__webpack_require__(/*! @apla/clickhouse */ \"@apla/clickhouse\"));\nconst logger_1 = __webpack_require__(/*! ../utils/logger */ \"./utils/logger.ts\");\nconst typings_1 = __webpack_require__(/*! ../typings */ \"./typings/index.ts\");\nconst moment_1 = __importDefault(__webpack_require__(/*! moment */ \"moment\"));\nconst moment_jalaali_1 = __importDefault(__webpack_require__(/*! moment-jalaali */ \"moment-jalaali\"));\nconst reportDateFormat = 'YYYY-MM-DD HH:mm:ss';\nconst log = logger_1.createLogger();\nif (!process.env.CLICK_NETFLOW_REPORT_DB) {\n    throw new Error('CLICK_NETFLOW_REPORT_DB is empty');\n}\nif (!process.env.CLICK_HOST) {\n    throw new Error('CLICK_HOST is empty');\n}\nif (!process.env.CLICK_USER) {\n    throw new Error('CLICK_USER is empty');\n}\nif (!process.env.CLICK_PASSWORD) {\n    throw new Error('CLICK_PASSWORD is empty');\n}\nconst clickHouse = new clickhouse_1.default({\n    host: process.env.CLICK_HOST,\n    port: process.env.CLICK_PORT || 8123,\n    user: process.env.CLICK_USER,\n    password: process.env.CLICK_PASSWORD,\n});\nconst createNetflowQuery = (netflowReportRequestTask) => {\n    let mainQuery = ` SELECT * from ${process.env.CLICK_NETFLOW_REPORT_DB} `;\n    const whereParts = [];\n    if (netflowReportRequestTask.fromDate) {\n        whereParts.push(` TimeRecvd>=toDateTime('${netflowReportRequestTask.fromDate.format(reportDateFormat)}') `);\n    }\n    if (netflowReportRequestTask.toDate) {\n        whereParts.push(` TimeRecvd<=toDateTime('${netflowReportRequestTask.toDate.format(reportDateFormat)}') `);\n    }\n    if (netflowReportRequestTask.username) {\n        whereParts.push(` username='${netflowReportRequestTask.username}' `);\n    }\n    if (netflowReportRequestTask.dstPort &&\n        netflowReportRequestTask.dstPort.length > 0) {\n        const dstPortQueries = [];\n        for (const dstPort of netflowReportRequestTask.dstPort) {\n            dstPortQueries.push(` DstPort='${dstPort}' `);\n        }\n        whereParts.push(` (${dstPortQueries.join(' OR ')}) `);\n    }\n    if (netflowReportRequestTask.srcPort &&\n        netflowReportRequestTask.srcPort.length > 0) {\n        const srcPortQueries = [];\n        for (const srcPort of netflowReportRequestTask.srcPort) {\n            srcPortQueries.push(` SrcPort='${srcPort}' `);\n        }\n        whereParts.push(` (${srcPortQueries.join(' OR ')}) `);\n    }\n    if (netflowReportRequestTask.businessId) {\n        whereParts.push(` businessId='${netflowReportRequestTask.businessId}' `);\n    }\n    if (netflowReportRequestTask.nas && netflowReportRequestTask.nas.length > 0) {\n        const nasIdQueries = [];\n        for (const nas of netflowReportRequestTask.nas) {\n            nasIdQueries.push(` nasId='${nas.id}' `);\n        }\n        whereParts.push(` (${nasIdQueries.join(' OR ')}) `);\n    }\n    if (netflowReportRequestTask.srcAddress) {\n        whereParts.push(` ( SrcIP='${netflowReportRequestTask.srcAddress}' OR NextHop='${netflowReportRequestTask.srcAddress}' ) `);\n    }\n    if (netflowReportRequestTask.dstAddress) {\n        whereParts.push(` ( DstIP='${netflowReportRequestTask.dstAddress}' OR NextHop='${netflowReportRequestTask.dstAddress}' ) `);\n    }\n    if (netflowReportRequestTask.protocol) {\n        if (netflowReportRequestTask.protocol === typings_1.PROTOCOLS.TCP) {\n            whereParts.push(` Proto=6 `);\n        }\n        else if (netflowReportRequestTask.protocol === typings_1.PROTOCOLS.UPD) {\n            whereParts.push(` Proto=17 `);\n        }\n    }\n    if (whereParts.length > 0) {\n        mainQuery = `${mainQuery} WHERE  ${whereParts.join(' AND ')}`;\n    }\n    return mainQuery;\n};\nconst queryNetflow = async (netflowReportRequestTask) => {\n    return new Promise((resolve, reject) => {\n        const mainQuery = createNetflowQuery(netflowReportRequestTask);\n        log.debug(mainQuery);\n        const stream = clickHouse.query(mainQuery);\n        let columns = [];\n        stream.on('metadata', (columnsInfo) => {\n            log.debug(`row meta:`, columnsInfo);\n            columns = columnsInfo;\n        });\n        const rows = [];\n        stream.on('data', (row) => {\n            rows.push(new ClickNetflowRow(row));\n        });\n        stream.on('error', (error) => {\n            reject(error);\n        });\n        stream.on('end', () => {\n            resolve({ rows, columns });\n        });\n    });\n};\nclass ClickNetflowRow {\n    constructor(row) {\n        this.RouterAddr = row[0] && row[0].toString();\n        this.SrcIP = row[1] && row[1].toString();\n        this.DstIP = row[2] && row[2].toString();\n        this.SrcPort = row[3] && row[3].toString();\n        this.DstPort = row[4] && row[4].toString();\n        this.NextHop = row[5] && row[5].toString();\n        this.TimeRecvd = row[6] && row[6].toString();\n        this.Proto = row[7] && row[7];\n        this.businessId = row[8] && row[8].toString();\n        this.memberId = row[9] && row[9].toString();\n        this.nasId = row[10] && row[10].toString();\n        this.nasTitle = row[11] && row[11].toString();\n        this.nasIp = row[12] && row[12].toString();\n        this.username = row[13] && row[13].toString();\n        this.framedIpAddress = row[14] && row[14].toString();\n        this.mac = row[15] && row[15].toString();\n        this.creationDate = row[16] && row[16].toString();\n    }\n    getJalaliDate() {\n        return moment_jalaali_1.default(moment_1.default.tz(this.TimeRecvd, '').tz(typings_1.LOCAL_TIME_ZONE)).format('jYYYY/jM/jD HH:MM');\n    }\n    getGregorianDate() {\n        return moment_1.default\n            .tz(this.TimeRecvd, '')\n            .tz(typings_1.LOCAL_TIME_ZONE)\n            .format('YYYY/MM/DD HH:mm');\n    }\n    getProtocolString() {\n        let protocolString = '';\n        if (this.Proto === 6) {\n            protocolString = typings_1.PROTOCOLS.TCP;\n        }\n        if (this.Proto === 17) {\n            protocolString = typings_1.PROTOCOLS.UPD;\n        }\n        return protocolString;\n    }\n}\nexports.ClickNetflowRow = ClickNetflowRow;\nexports.default = {\n    queryNetflow,\n};\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/modules/clickhouse.ts");

/***/ }),

/***/ "./modules/initElasticsearch.ts":
/*!**************************************!*\
  !*** ./modules/initElasticsearch.ts ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst logger_1 = __importDefault(__webpack_require__(/*! ../utils/logger */ \"./utils/logger.ts\"));\nconst elastic_1 = __importDefault(__webpack_require__(/*! ../utils/elastic */ \"./utils/elastic.ts\"));\nconst log = logger_1.default.createLogger();\nconst CHARGE_INDEX_NAME = 'charge';\nconst ACCOUNTING_INDEX_NAME = 'accounting';\nconst NETFLOW_INDEX_NAME = 'netflow';\nconst SYSLOG_INDEX_NAME = 'syslog';\nconst SESSION_INDEX_NAME = 'session';\nexports.addDefaultIndex = async () => {\n    if (!process.env.ELASTIC_INDEX_PREFIX ||\n        !process.env.ELASTIC_LICENSE_INDEX_PREFIX) {\n        throw new Error('ELASTIC_INDEX_PREFIX is empty');\n    }\n    try {\n        const defaultIndexNames = [\n            process.env.ELASTIC_INDEX_PREFIX + 'accounting',\n            process.env.ELASTIC_INDEX_PREFIX + 'charge',\n            process.env.ELASTIC_INDEX_PREFIX + 'licensecharge',\n            process.env.ELASTIC_LICENSE_INDEX_PREFIX + 'licensecharge',\n            process.env.ELASTIC_INDEX_PREFIX + 'session',\n        ];\n        for (const index of defaultIndexNames) {\n            const indexExist = await elastic_1.default.indices.exists({\n                index,\n            });\n            if (!indexExist) {\n                await elastic_1.default.indices.create({\n                    index,\n                });\n                log.debug(`${index} index added`);\n            }\n        }\n    }\n    catch (error) {\n        log.error('failed to add default indexes');\n        log.error(error);\n        throw error;\n    }\n};\nexports.addElasticIndexTemplates = async () => {\n    try {\n        const chargeResult = await elastic_1.default.indices.putTemplate({\n            name: CHARGE_INDEX_NAME,\n            body: getChargeIndexTemplate(),\n        });\n        log.debug('Charge index template added:', chargeResult);\n        const accountingResult = await elastic_1.default.indices.putTemplate({\n            name: ACCOUNTING_INDEX_NAME,\n            body: getAccountingIndexTemplate(),\n        });\n        log.debug('Accounting index template added:', accountingResult);\n        const sessionResult = await elastic_1.default.indices.putTemplate({\n            name: SESSION_INDEX_NAME,\n            body: getSessionIndexTemplate(),\n        });\n        log.debug('Session index template added:', sessionResult);\n        const syslogResult = await elastic_1.default.indices.putTemplate({\n            name: SYSLOG_INDEX_NAME,\n            body: getSyslogIndexTemplate(),\n        });\n        log.debug('Syslog index template added:', syslogResult);\n        const netflowResult = await elastic_1.default.indices.putTemplate({\n            name: NETFLOW_INDEX_NAME,\n            body: getNetflowIndexTemplate(),\n        });\n        log.debug('Netflow index template added:', netflowResult);\n    }\n    catch (error) {\n        log.error(error);\n        throw error;\n    }\n};\nconst getNetflowIndexTemplate = () => {\n    return {\n        index_patterns: ['netflow*'],\n        settings: {\n            analysis: {\n                normalizer: {\n                    lowercase_normalizer: {\n                        type: 'custom',\n                        char_filter: [],\n                        filter: ['lowercase'],\n                    },\n                },\n                analyzer: {\n                    full_text_ngram: {\n                        tokenizer: 'ngram_tokenizer',\n                    },\n                    domain_name_analyzer: {\n                        filter: 'lowercase',\n                        tokenizer: 'domain_name_tokenizer',\n                        type: 'custom',\n                    },\n                    path_analyzer: {\n                        tokenizer: 'path_tokenizer',\n                    },\n                },\n                tokenizer: {\n                    ngram_tokenizer: {\n                        type: 'nGram',\n                        min_gram: 3,\n                        max_gram: 12,\n                        token_chars: ['letter', 'digit', 'punctuation', 'symbol'],\n                    },\n                    domain_name_tokenizer: {\n                        type: 'PathHierarchy',\n                        delimiter: '.',\n                        reverse: true,\n                    },\n                    path_tokenizer: {\n                        type: 'path_hierarchy',\n                        delimiter: '-',\n                        replacement: '/',\n                        skip: 2,\n                    },\n                },\n            },\n        },\n        mappings: {\n            doc: {\n                properties: {\n                    username: {\n                        type: 'keyword',\n                        normalizer: 'lowercase_normalizer',\n                    },\n                    nasId: {\n                        type: 'keyword',\n                    },\n                    nasTitle: {\n                        enabled: false,\n                    },\n                    mac: {\n                        type: 'keyword',\n                        normalizer: 'lowercase_normalizer',\n                    },\n                    status: {\n                        type: 'keyword',\n                    },\n                    enrichDate: {\n                        type: 'date',\n                    },\n                    memberId: {\n                        type: 'keyword',\n                    },\n                    businessId: {\n                        type: 'keyword',\n                    },\n                    '@timestamp': {\n                        type: 'date',\n                    },\n                    host: {\n                        type: 'keyword',\n                    },\n                    netflow: {\n                        properties: {\n                            bytes: {\n                                enabled: false,\n                            },\n                            version: {\n                                enabled: false,\n                            },\n                            dst_addr: {\n                                type: 'keyword',\n                            },\n                            dst_port: {\n                                type: 'long',\n                            },\n                            protocol: {\n                                type: 'long',\n                            },\n                            src_addr: {\n                                type: 'keyword',\n                            },\n                            ipv4_next_hop: {\n                                type: 'keyword',\n                            },\n                            src_port: {\n                                type: 'long',\n                            },\n                        },\n                    },\n                    tags: {\n                        type: 'text',\n                        fields: {\n                            keyword: {\n                                type: 'keyword',\n                                ignore_above: 256,\n                            },\n                        },\n                    },\n                    type: {\n                        type: 'text',\n                        fields: {\n                            keyword: {\n                                type: 'keyword',\n                                ignore_above: 256,\n                            },\n                        },\n                    },\n                },\n            },\n        },\n    };\n};\nconst getChargeIndexTemplate = () => {\n    return {\n        index_patterns: ['*charge*'],\n        mappings: {\n            doc: {\n                properties: {\n                    timestamp: { type: 'date' },\n                    businessId: { type: 'keyword' },\n                    forThe: { type: 'keyword' },\n                    type: { type: 'keyword' },\n                    amount: { type: 'integer' },\n                    date: { type: 'long' },\n                },\n            },\n        },\n    };\n};\nconst getAccountingIndexTemplate = () => {\n    return {\n        index_patterns: ['*accounting*'],\n        mappings: {\n            doc: {\n                properties: {\n                    timestamp: { type: 'date' },\n                    businessId: { type: 'keyword' },\n                    memberId: { type: 'keyword' },\n                    sessionId: { type: 'keyword' },\n                    nasId: { type: 'keyword' },\n                    mac: { type: 'keyword' },\n                    creationDate: { type: 'long' },\n                    sessionTime: { type: 'long' },\n                    totalUsage: { type: 'long' },\n                    download: { type: 'long' },\n                    upload: { type: 'long' },\n                },\n            },\n        },\n    };\n};\nconst getSessionIndexTemplate = () => {\n    return {\n        index_patterns: ['*session*'],\n        settings: {\n            analysis: {\n                analyzer: {\n                    full_text_ngram: {\n                        tokenizer: 'ngram_tokenizer',\n                    },\n                    domain_name_analyzer: {\n                        filter: 'lowercase',\n                        tokenizer: 'domain_name_tokenizer',\n                        type: 'custom',\n                    },\n                    path_analyzer: {\n                        tokenizer: 'path_tokenizer',\n                    },\n                },\n                tokenizer: {\n                    ngram_tokenizer: {\n                        type: 'nGram',\n                        min_gram: 3,\n                        max_gram: 12,\n                        token_chars: ['letter', 'digit', 'punctuation', 'symbol'],\n                    },\n                    domain_name_tokenizer: {\n                        type: 'PathHierarchy',\n                        delimiter: '.',\n                        reverse: true,\n                    },\n                    path_tokenizer: {\n                        type: 'path_hierarchy',\n                        delimiter: '-',\n                        replacement: '/',\n                        skip: 2,\n                    },\n                },\n            },\n        },\n        mappings: {\n            doc: {\n                properties: {\n                    timestamp: { type: 'date' },\n                    creationDate: { type: 'long' },\n                    businessId: { type: 'keyword' },\n                    memberId: { type: 'keyword' },\n                    nasId: { type: 'keyword' },\n                    nasTitle: { enabled: false },\n                    nasIp: { type: 'keyword' },\n                    groupIdentity: { type: 'keyword' },\n                    groupIdentityId: { type: 'keyword' },\n                    groupIdentityType: { type: 'keyword' },\n                    mac: { type: 'keyword' },\n                    username: { type: 'keyword' },\n                    framedIpAddress: { type: 'keyword' },\n                },\n            },\n        },\n    };\n};\nconst getSyslogIndexTemplate = () => {\n    return {\n        index_patterns: ['syslog*'],\n        settings: {\n            analysis: {\n                normalizer: {\n                    lowercase_normalizer: {\n                        type: 'custom',\n                        char_filter: [],\n                        filter: ['lowercase'],\n                    },\n                },\n                analyzer: {\n                    full_text_ngram: {\n                        tokenizer: 'ngram_tokenizer',\n                        type: 'custom',\n                        filter: ['lowercase'],\n                    },\n                    domain_name_analyzer: {\n                        filter: 'lowercase',\n                        tokenizer: 'domain_name_tokenizer',\n                        type: 'custom',\n                    },\n                    path_analyzer: {\n                        tokenizer: 'path_tokenizer',\n                    },\n                },\n                tokenizer: {\n                    ngram_tokenizer: {\n                        type: 'nGram',\n                        min_gram: 3,\n                        max_gram: 12,\n                        token_chars: ['letter', 'digit', 'punctuation', 'symbol'],\n                    },\n                    domain_name_tokenizer: {\n                        type: 'PathHierarchy',\n                        delimiter: '.',\n                        reverse: true,\n                    },\n                    path_tokenizer: {\n                        type: 'path_hierarchy',\n                        delimiter: '-',\n                        replacement: '/',\n                        skip: 2,\n                    },\n                },\n            },\n        },\n        mappings: {\n            doc: {\n                properties: {\n                    timestamp: {\n                        type: 'date',\n                    },\n                    nasIp: {\n                        type: 'keyword',\n                    },\n                    username: {\n                        type: 'keyword',\n                        normalizer: 'lowercase_normalizer',\n                    },\n                    status: {\n                        type: 'keyword',\n                    },\n                    enrichDate: {\n                        type: 'date',\n                    },\n                    nasId: {\n                        type: 'keyword',\n                    },\n                    nasTitle: {\n                        enabled: false,\n                    },\n                    memberId: {\n                        type: 'keyword',\n                    },\n                    businessId: {\n                        type: 'keyword',\n                    },\n                    path: {\n                        enabled: false,\n                    },\n                    query: {\n                        enabled: false,\n                    },\n                    params: {\n                        enabled: false,\n                    },\n                    message: {\n                        enabled: false,\n                    },\n                    protocol: {\n                        type: 'keyword',\n                        normalizer: 'lowercase_normalizer',\n                    },\n                    memberIp: {\n                        type: 'keyword',\n                    },\n                    method: {\n                        type: 'keyword',\n                        normalizer: 'lowercase_normalizer',\n                    },\n                    url: {\n                        type: 'keyword',\n                        normalizer: 'lowercase_normalizer',\n                    },\n                    domain: {\n                        type: 'keyword',\n                        normalizer: 'lowercase_normalizer',\n                    },\n                    hostGeoIp: {\n                        enabled: false,\n                        properties: {\n                            location: {\n                                enabled: false,\n                            },\n                            timezone: {\n                                enabled: false,\n                            },\n                            city_name: {\n                                enabled: false,\n                            },\n                            country_name: {\n                                enabled: false,\n                            },\n                        },\n                    },\n                },\n            },\n        },\n    };\n};\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/modules/initElasticsearch.ts");

/***/ }),

/***/ "./modules/initRabbitMq.ts":
/*!*********************************!*\
  !*** ./modules/initRabbitMq.ts ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst typings_1 = __webpack_require__(/*! ../typings */ \"./typings/index.ts\");\nconst rabbitmq_1 = __webpack_require__(/*! ../utils/rabbitmq */ \"./utils/rabbitmq.ts\");\nconst logger_1 = __importDefault(__webpack_require__(/*! ../utils/logger */ \"./utils/logger.ts\"));\nconst log = logger_1.default.createLogger();\nconst LOG_REQUEST_RETRY_MS = Number(process.env.LOG_REQUEST_RETRY_MS);\nexports.addDefaultQueue = async () => {\n    try {\n        const channel = await rabbitmq_1.getRabbitMqChannel();\n        // Add log worker queue\n        await channel.assertExchange(typings_1.QUEUES.LOG_WORKER_EXCHANGE, 'fanout', {\n            durable: true,\n        });\n        await channel.assertQueue(typings_1.QUEUES.LOG_WORKER_QUEUE, {\n            deadLetterExchange: typings_1.QUEUES.RETRY_LOG_WORKER_EXCHANGE,\n            durable: true,\n        });\n        await channel.bindQueue(typings_1.QUEUES.LOG_WORKER_QUEUE, typings_1.QUEUES.LOG_WORKER_EXCHANGE, '');\n        // Add retry queue\n        await channel.assertExchange(typings_1.QUEUES.RETRY_LOG_WORKER_EXCHANGE, 'fanout', {\n            durable: true,\n        });\n        await channel.assertQueue(typings_1.QUEUES.RETRY_LOG_WORKER_QUEUE, {\n            deadLetterExchange: typings_1.QUEUES.LOG_WORKER_EXCHANGE,\n            durable: true,\n            messageTtl: LOG_REQUEST_RETRY_MS,\n        });\n        await channel.bindQueue(typings_1.QUEUES.RETRY_LOG_WORKER_QUEUE, typings_1.QUEUES.RETRY_LOG_WORKER_EXCHANGE, '');\n        log.debug('Default report queues added');\n        await channel.assertExchange(typings_1.QUEUES.LOG_ENRICHMENT_WORKER_QUEUE_EXCHANGE, 'fanout', {\n            durable: true,\n        });\n        await channel.assertQueue(typings_1.QUEUES.LOG_ENRICHMENT_WORKER_QUEUE, {\n            deadLetterExchange: typings_1.QUEUES.RETRY_LOG_ENRICHMENT_WORKER_QUEUE_EXCHANGE,\n            durable: true,\n        });\n        await channel.bindQueue(typings_1.QUEUES.LOG_ENRICHMENT_WORKER_QUEUE, typings_1.QUEUES.LOG_ENRICHMENT_WORKER_QUEUE_EXCHANGE, '');\n        // Add retry queue\n        await channel.assertExchange(typings_1.QUEUES.RETRY_LOG_ENRICHMENT_WORKER_QUEUE_EXCHANGE, 'fanout', {\n            durable: true,\n        });\n        await channel.assertQueue(typings_1.QUEUES.RETRY_LOG_ENRICHMENT_WORKER_QUEUE, {\n            deadLetterExchange: typings_1.QUEUES.LOG_ENRICHMENT_WORKER_QUEUE_EXCHANGE,\n            durable: true,\n            messageTtl: LOG_REQUEST_RETRY_MS,\n        });\n        await channel.bindQueue(typings_1.QUEUES.RETRY_LOG_ENRICHMENT_WORKER_QUEUE, typings_1.QUEUES.RETRY_LOG_ENRICHMENT_WORKER_QUEUE_EXCHANGE, '');\n    }\n    catch (error) {\n        log.error(error);\n        log.error('failed to add default queue');\n        throw error;\n    }\n};\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/modules/initRabbitMq.ts");

/***/ }),

/***/ "./modules/netflow.ts":
/*!****************************!*\
  !*** ./modules/netflow.ts ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst logger_1 = __importDefault(__webpack_require__(/*! ../utils/logger */ \"./utils/logger.ts\"));\nconst lodash_1 = __importDefault(__webpack_require__(/*! lodash */ \"lodash\"));\nconst clickhouse_1 = __importDefault(__webpack_require__(/*! ./clickhouse */ \"./modules/clickhouse.ts\"));\nconst log = logger_1.default.createLogger();\nconst getNetflowReports = async (reportRequestTask) => {\n    const { rows, columns } = await clickhouse_1.default.queryNetflow(reportRequestTask);\n    return formatReports({ rows, columns });\n};\nconst formatReports = (options) => {\n    const { rows, columns } = options;\n    const formatted = rows.map((clickRow) => {\n        return {\n            Router: clickRow.nasTitle,\n            Username: clickRow.username,\n            Mac: clickRow.mac,\n            Jalali_Date: clickRow.getJalaliDate(),\n            Src_Addr: clickRow.SrcIP,\n            Src_Port: clickRow.SrcPort,\n            Dst_Addr: clickRow.DstIP,\n            Dst_Port: clickRow.DstPort,\n            Protocol: clickRow.getProtocolString(),\n            Gregorian_Date: clickRow.getGregorianDate(),\n        };\n    });\n    return lodash_1.default.sortBy(formatted, ['Router', 'Username', 'Jalali_Date']);\n};\nexports.default = {\n    getNetflowReports,\n};\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/modules/netflow.ts");

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
eval("\nObject.defineProperty(exports, \"__esModule\", { value: true });\nexports.LOGGER_TIME_ZONE = '';\nexports.LOCAL_TIME_ZONE = 'Asia/Tehran';\nvar QUEUES;\n(function (QUEUES) {\n    QUEUES[\"LOG_ENRICHMENT_WORKER_QUEUE\"] = \"log-enrichment\";\n    QUEUES[\"LOG_ENRICHMENT_WORKER_QUEUE_EXCHANGE\"] = \"log-enrichment-ex\";\n    QUEUES[\"RETRY_LOG_ENRICHMENT_WORKER_QUEUE\"] = \"retry-log-enrichment\";\n    QUEUES[\"RETRY_LOG_ENRICHMENT_WORKER_QUEUE_EXCHANGE\"] = \"retry-log-enrichment-ex\";\n    QUEUES[\"LOG_WORKER_QUEUE\"] = \"log-worker\";\n    QUEUES[\"LOG_WORKER_EXCHANGE\"] = \"log-worker-ex\";\n    QUEUES[\"RETRY_LOG_WORKER_QUEUE\"] = \"retry-log-worker\";\n    QUEUES[\"RETRY_LOG_WORKER_EXCHANGE\"] = \"retry-log-worker-ex\";\n})(QUEUES = exports.QUEUES || (exports.QUEUES = {}));\nvar REPORT_TYPE;\n(function (REPORT_TYPE) {\n    REPORT_TYPE[\"NETFLOW\"] = \"netflow\";\n    REPORT_TYPE[\"SYSLOG\"] = \"syslog\";\n})(REPORT_TYPE = exports.REPORT_TYPE || (exports.REPORT_TYPE = {}));\nvar PROTOCOLS;\n(function (PROTOCOLS) {\n    PROTOCOLS[\"TCP\"] = \"TCP\";\n    PROTOCOLS[\"UPD\"] = \"UDP\";\n})(PROTOCOLS = exports.PROTOCOLS || (exports.PROTOCOLS = {}));\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/typings/index.ts");

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
eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst elasticsearch_1 = __importDefault(__webpack_require__(/*! elasticsearch */ \"elasticsearch\"));\nconst elastic = new elasticsearch_1.default.Client({\n    // @ts-ignore\n    hosts: `${process.env.ELASTIC_IP}:${process.env.ELASTIC_PORT}`,\n    apiVersion: '6.7',\n    log: process.env.ELASTICSEARCH_LOG_LEVEL || 'info',\n});\nexports.default = elastic;\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/utils/elastic.ts");

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
eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst amqplib_1 = __importDefault(__webpack_require__(/*! amqplib */ \"amqplib\"));\nif (!process.env.RABBITMQ_USERNAME || !process.env.RABBITMQ_PASSWORD) {\n    throw new Error('invalid rabbit credentials');\n}\nlet connection;\nexports.getRabbitMqConnection = async () => {\n    connection = await amqplib_1.default.connect(`amqp://${process.env.RABBITMQ_USERNAME}:${process.env.RABBITMQ_PASSWORD}@rabbitmq`);\n    return connection;\n};\nexports.getRabbitMqChannel = async () => {\n    const amqpConnection = await exports.getRabbitMqConnection();\n    return amqpConnection.createConfirmChannel();\n};\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/utils/rabbitmq.ts");

/***/ }),

/***/ "./worker/logBuilder.ts":
/*!******************************!*\
  !*** ./worker/logBuilder.ts ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst logger_1 = __importDefault(__webpack_require__(/*! ../utils/logger */ \"./utils/logger.ts\"));\nconst rabbitmq_1 = __webpack_require__(/*! ../utils/rabbitmq */ \"./utils/rabbitmq.ts\");\nconst netflow_1 = __importDefault(__webpack_require__(/*! ../modules/netflow */ \"./modules/netflow.ts\"));\nconst httpClient_1 = __webpack_require__(/*! ../utils/httpClient */ \"./utils/httpClient.ts\");\nconst { Transform } = __webpack_require__(/*! json2csv */ \"json2csv\");\nconst { Readable } = __webpack_require__(/*! stream */ \"stream\");\nconst fs_1 = __importDefault(__webpack_require__(/*! fs */ \"fs\"));\nconst request_promise_1 = __importDefault(__webpack_require__(/*! request-promise */ \"request-promise\"));\nconst auth_1 = __webpack_require__(/*! ../utils/auth */ \"./utils/auth.ts\");\nconst tmp_promise_1 = __webpack_require__(/*! tmp-promise */ \"tmp-promise\");\nconst util_1 = __importDefault(__webpack_require__(/*! util */ \"util\"));\n/*import syslog from '../modules/syslog';*/\nconst typings_1 = __webpack_require__(/*! ../typings */ \"./typings/index.ts\");\nconst momentTz = __webpack_require__(/*! moment-timezone */ \"moment-timezone\");\n// Convert fs.readFile into Promise version of same\nconst log = logger_1.default.createLogger();\nconst REPORT_CONTAINER = process.env.REPORT_CONTAINER || 'reports';\nconst UPLOAD_API = `${process.env.API_ADDRESS}/api/BigFiles/${REPORT_CONTAINER}/upload`;\nconst REPORT_API = `${process.env.API_ADDRESS}/api/Reports`;\nif (!process.env.SERVICE_MAN_USERNAME ||\n    !process.env.SERVICE_MAN_PASSWORD ||\n    !process.env.API_ADDRESS) {\n    throw new Error('invalid auth env variables');\n}\nexports.processLogRequest = async () => {\n    log.debug('At processing log requests');\n    const channel = await rabbitmq_1.getRabbitMqChannel();\n    channel.prefetch(4, true);\n    process.once('SIGINT', async () => {\n        await channel.close();\n    });\n    channel.consume(typings_1.QUEUES.LOG_WORKER_QUEUE, async (message) => {\n        if (!message) {\n            log.debug('empty message:', message);\n            throw new Error('empty message');\n        }\n        const body = message.content.toString();\n        log.debug(\" [x] Received Log Request '%s'\", body);\n        const generalReportRequestTask = JSON.parse(body);\n        if (!generalReportRequestTask.to) {\n            generalReportRequestTask.toDate = momentTz.tz(typings_1.LOGGER_TIME_ZONE);\n            generalReportRequestTask.to = momentTz(generalReportRequestTask.toDate, typings_1.LOCAL_TIME_ZONE).valueOf();\n        }\n        else {\n            generalReportRequestTask.toDate = momentTz.tz(generalReportRequestTask.to, typings_1.LOGGER_TIME_ZONE);\n        }\n        // create fromDate 1 year before from Date\n        if (!generalReportRequestTask.from) {\n            generalReportRequestTask.fromDate = momentTz.tz(generalReportRequestTask.toDate.valueOf() - 31539999 * 1000, typings_1.LOGGER_TIME_ZONE);\n            generalReportRequestTask.from = momentTz(generalReportRequestTask.fromDate, typings_1.LOCAL_TIME_ZONE).valueOf();\n        }\n        else {\n            generalReportRequestTask.fromDate = momentTz.tz(generalReportRequestTask.from, typings_1.LOGGER_TIME_ZONE);\n        }\n        log.debug(`Create ${generalReportRequestTask.type} report from ${generalReportRequestTask.fromDate} to ${generalReportRequestTask.toDate}`, JSON.stringify(generalReportRequestTask));\n        try {\n            let reports;\n            let fields;\n            if (generalReportRequestTask.type === typings_1.REPORT_TYPE.NETFLOW) {\n                reports = await netflow_1.default.getNetflowReports(generalReportRequestTask);\n                fields = getNetflowFields();\n            } /* else if (generalReportRequestTask.type === REPORT_TYPE.SYSLOG) {\n              reports = await syslog.getSyslogReports(\n                generalReportRequestTask as SyslogReportRequestTask,\n              );\n              fields = getSyslogFields();\n            } else {\n              channel.ack(message);\n              throw new Error('invalid report type');\n            }*/\n            log.debug(`index one of result size: ${reports.length}`);\n            jsonToCsv(fields, reports, async (csv) => {\n                log.debug(`csv created`);\n                await uploadReport(generalReportRequestTask, csv);\n                log.debug(`uploaded`);\n                channel.ack(message);\n            });\n        }\n        catch (error) {\n            log.error(error);\n            channel.nack(message, false, false);\n        }\n    }, { noAck: false });\n};\nconst getNetflowFields = () => {\n    return [\n        'Router',\n        'Username',\n        'Mac',\n        'Jalali_Date',\n        'Src_Addr',\n        'Src_Port',\n        'Dst_Addr',\n        'Dst_Port',\n        'Protocol',\n        'Gregorian_Date',\n        'Proto',\n    ];\n};\nconst getSyslogFields = () => {\n    return [\n        'Router',\n        'Username',\n        'IP',\n        'Mac',\n        'Jalali_Date',\n        'Http_Method',\n        'Domain',\n        'Url',\n        'Gregorian_Date',\n    ];\n};\nconst jsonToCsv = (fields, jsonData, cb) => {\n    try {\n        const opts = { fields, defaultValue: 'N/A' };\n        const input = new Readable({ objectMode: true });\n        input._read = () => { };\n        for (const row of jsonData) {\n            input.push(row);\n        }\n        // Pushing a null close the stream\n        input.push(null);\n        const transformOpts = { objectMode: true };\n        const json2csv = new Transform(opts, transformOpts);\n        const processor = input.pipe(json2csv);\n        let csv = '';\n        processor.on('data', (chunk) => {\n            csv = csv + chunk;\n        });\n        processor.on('end', () => {\n            log.debug('write csv finished');\n            cb && cb(csv);\n        });\n    }\n    catch (error) {\n        log.error(error);\n        throw error;\n    }\n};\nconst writeFile = util_1.default.promisify(fs_1.default.writeFile);\nconst closeFile = util_1.default.promisify(fs_1.default.close);\nconst unlink = util_1.default.promisify(fs_1.default.unlink);\nconst uploadReport = async (reportRequest, csv) => {\n    try {\n        const reportFile = await tmp_promise_1.file();\n        await writeFile(reportFile.path, csv, 'utf8');\n        await closeFile(reportFile.fd);\n        log.debug(reportFile.path);\n        const token = await auth_1.login(\n        // @ts-ignore\n        process.env.SERVICE_MAN_USERNAME, process.env.SERVICE_MAN_PASSWORD);\n        const fileName = `${Date.now().toString()}.csv`;\n        const options = {\n            method: 'POST',\n            url: UPLOAD_API,\n            timeout: 600000,\n            headers: {\n                authorization: token,\n                Accept: 'application/json',\n                'cache-control': 'no-cache',\n                'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',\n            },\n            formData: {\n                businessId: reportRequest.businessId,\n                myfile: {\n                    value: fs_1.default.createReadStream(reportFile.path),\n                    options: { filename: fileName, contentType: 'text/csv' },\n                },\n            },\n        };\n        const response = await request_promise_1.default(options);\n        log.debug('uploaded');\n        log.debug(response);\n        await unlink(reportFile.path);\n        await updateReportRequest(reportRequest, {\n            container: REPORT_CONTAINER,\n            fileName: fileName,\n        });\n    }\n    catch (error) {\n        log.error('upload failed');\n        log.error(error);\n        throw error;\n    }\n};\nconst updateReportRequest = async (reportRequest, fileInfo) => {\n    log.debug('updating report request', fileInfo);\n    log.debug('updating report request', reportRequest);\n    const token = await auth_1.login(\n    // @ts-ignore\n    process.env.SERVICE_MAN_USERNAME, process.env.SERVICE_MAN_PASSWORD);\n    log.debug('report:', reportRequest.id);\n    log.debug('file:', fileInfo);\n    const update = {\n        status: 'ready',\n        container: fileInfo.container,\n        fileName: fileInfo.fileName,\n        from: reportRequest.from,\n        to: reportRequest.to,\n    };\n    const httpClient = httpClient_1.createHttpClient(`${REPORT_API}`);\n    await httpClient.patch(`/${reportRequest.id}`, update, {\n        headers: {\n            authorization: token,\n        },\n    });\n};\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/worker/logBuilder.ts");

/***/ }),

/***/ "@apla/clickhouse":
/*!***********************************!*\
  !*** external "@apla/clickhouse" ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"@apla/clickhouse\");\n\n//# sourceURL=file:///external%2520%2522@apla/clickhouse%2522");

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

/***/ "lodash":
/*!*************************!*\
  !*** external "lodash" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"lodash\");\n\n//# sourceURL=file:///external%2520%2522lodash%2522");

/***/ }),

/***/ "moment":
/*!*************************!*\
  !*** external "moment" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"moment\");\n\n//# sourceURL=file:///external%2520%2522moment%2522");

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

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"stream\");\n\n//# sourceURL=file:///external%2520%2522stream%2522");

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