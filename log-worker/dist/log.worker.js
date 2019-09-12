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
eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nvar __importStar = (this && this.__importStar) || function (mod) {\n    if (mod && mod.__esModule) return mod;\n    var result = {};\n    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];\n    result[\"default\"] = mod;\n    return result;\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst logger_1 = __importDefault(__webpack_require__(/*! ../utils/logger */ \"./utils/logger.ts\"));\nconst typings_1 = __webpack_require__(/*! ../typings */ \"./typings/index.ts\");\nconst netflow_1 = __importDefault(__webpack_require__(/*! ../modules/netflow */ \"./modules/netflow.ts\"));\nconst webproxyLog_1 = __importDefault(__webpack_require__(/*! ../modules/webproxyLog */ \"./modules/webproxyLog.ts\"));\nconst log = logger_1.default.createLogger();\nconst momentTz = __webpack_require__(/*! moment-timezone */ \"moment-timezone\");\nconst reportEngine_1 = __importDefault(__webpack_require__(/*! ../reportEngine */ \"./reportEngine/index.ts\"));\nconst reportTypes_1 = __webpack_require__(/*! ../reportEngine/reportTypes */ \"./reportEngine/reportTypes.ts\");\nconst sendReport_1 = __webpack_require__(/*! ../modules/sendReport */ \"./modules/sendReport.ts\");\nconst fs = __importStar(__webpack_require__(/*! fs */ \"fs\"));\nconst tmp_promise_1 = __webpack_require__(/*! tmp-promise */ \"tmp-promise\");\nconst controller = {\n    health: (request, response) => {\n        response.send({ ok: true });\n    },\n    createReport: async (request, response) => {\n        const generalReportRequestTask = request.body;\n        log.debug(request.body);\n        if (!generalReportRequestTask.to) {\n            generalReportRequestTask.toDate = momentTz.tz(typings_1.LOGGER_TIME_ZONE);\n            generalReportRequestTask.to = momentTz(generalReportRequestTask.toDate, typings_1.LOCAL_TIME_ZONE).valueOf();\n        }\n        else {\n            generalReportRequestTask.toDate = momentTz.tz(generalReportRequestTask.to, typings_1.LOGGER_TIME_ZONE);\n        }\n        // create fromDate 1 year before from Date\n        if (!generalReportRequestTask.from) {\n            generalReportRequestTask.fromDate = momentTz.tz(generalReportRequestTask.toDate.valueOf() - 31539999 * 1000, typings_1.LOGGER_TIME_ZONE);\n            generalReportRequestTask.from = momentTz(generalReportRequestTask.fromDate, typings_1.LOCAL_TIME_ZONE).valueOf();\n        }\n        else {\n            generalReportRequestTask.fromDate = momentTz.tz(generalReportRequestTask.from, typings_1.LOGGER_TIME_ZONE);\n        }\n        log.debug(`Create ${generalReportRequestTask.type} report from ${generalReportRequestTask.fromDate} to ${generalReportRequestTask.toDate}`, JSON.stringify(generalReportRequestTask));\n        try {\n            let data;\n            if (generalReportRequestTask.type === typings_1.REPORT_TYPE.NETFLOW) {\n                data = await netflow_1.default.queryNetflow(generalReportRequestTask);\n            }\n            else if (generalReportRequestTask.type === typings_1.REPORT_TYPE.WEBPROXY) {\n                data = await webproxyLog_1.default.queryWebproxyLog(generalReportRequestTask);\n            }\n            else if (generalReportRequestTask.type === typings_1.REPORT_TYPE.DNS) {\n                throw new Error('not implemented');\n            }\n            else {\n                throw new Error('invalid report type');\n            }\n            const reportConfig = reportTypes_1.getReportConfig(generalReportRequestTask.type);\n            const report = await reportEngine_1.default(reportConfig, { data });\n            const reportFile = await tmp_promise_1.file();\n            await report.stream.pipe(fs.createWriteStream(reportFile.path));\n            await sendReport_1.sendReport(generalReportRequestTask, reportFile.path, reportConfig);\n            // fs.unlink(reportFile.path, () => {\n            //   log.debug('file cleared up');\n            // });\n            //log.debug(report.content);\n            log.debug(`report created and uploaded`);\n            response.send({ ok: true });\n        }\n        catch (error) {\n            log.error(error);\n            throw error;\n        }\n    },\n};\nexports.default = controller;\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/controllers/index.ts");

/***/ }),

/***/ "./index.ts":
/*!******************!*\
  !*** ./index.ts ***!
  \******************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst express_1 = __importDefault(__webpack_require__(/*! express */ \"express\"));\nconst routes_1 = __importDefault(__webpack_require__(/*! ../src/routes */ \"./routes/index.ts\"));\nconst errorHandler_1 = __importDefault(__webpack_require__(/*! ./utils/errorHandler */ \"./utils/errorHandler.ts\"));\nconst logger_1 = __importDefault(__webpack_require__(/*! ./utils/logger */ \"./utils/logger.ts\"));\nconst log = logger_1.default.createLogger();\nconst app = express_1.default();\napp.set('port', process.env.PORT || 3000);\napp.use(express_1.default.json());\napp.use(express_1.default.urlencoded({ extended: false }));\napp.use('/', routes_1.default);\napp.use(errorHandler_1.default);\napp.use((req, resp, next) => {\n    log.debug('####### Request Log #######');\n    log.debug('Path:', req.path);\n    log.debug('Query:', req.query);\n    log.debug('Methods:', req.method);\n    log.debug('Body %j', req.body);\n    next();\n});\napp.listen(app.get('port'), async () => {\n    /*tslint:disable*/\n    console.log('Add default queues...');\n    /*\n    await clickHouse.queryNetflow({\n      type: REPORT_TYPE.NETFLOW,\n      id: '123',\n    });*/\n    console.log(`App is running at http://localhost:${app.get('port')}`);\n    //await testRunner();\n    log.info(` App is running at http://localhost:${app.get('port')}`);\n});\nprocess.on('uncaughtException', function (error) {\n    console.error('Something bad happened here....');\n    console.error(error);\n    console.error(error.stack);\n    log.error(error);\n    log.error(error.stack);\n    process.exit(1);\n});\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/index.ts");

/***/ }),

/***/ "./modules/netflow.ts":
/*!****************************!*\
  !*** ./modules/netflow.ts ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst logger_1 = __webpack_require__(/*! ../utils/logger */ \"./utils/logger.ts\");\nconst lodash_1 = __importDefault(__webpack_require__(/*! lodash */ \"lodash\"));\nconst typings_1 = __webpack_require__(/*! ../typings */ \"./typings/index.ts\");\nconst moment_1 = __importDefault(__webpack_require__(/*! moment */ \"moment\"));\nconst moment_jalaali_1 = __importDefault(__webpack_require__(/*! moment-jalaali */ \"moment-jalaali\"));\nconst clickClient_1 = __webpack_require__(/*! ../utils/clickClient */ \"./utils/clickClient.ts\");\nconst log = logger_1.createLogger();\nconst clickHouse = clickClient_1.createClickConnection();\nconst formatReports = (rows) => {\n    const formatted = rows.map((clickRow) => {\n        return {\n            Router: clickRow.nasTitle,\n            Username: clickRow.username,\n            Mac: clickRow.mac,\n            Jalali_Date: clickRow.getJalaliDate(),\n            Src_Addr: clickRow.SrcIP,\n            Src_Port: clickRow.SrcPort,\n            Dst_Addr: clickRow.DstIP,\n            Dst_Port: clickRow.DstPort,\n            Protocol: clickRow.getProtocolString(),\n            Gregorian_Date: clickRow.getGregorianDate(),\n        };\n    });\n    return lodash_1.default.sortBy(formatted, ['Router', 'Username', 'Jalali_Date']);\n};\nconst createNetflowQuery = (netflowReportRequestTask) => {\n    let mainQuery = ` SELECT * FROM hotspotplus.Session JOIN hotspotplus.Netflow ON Session.nasIp=Netflow.RouterAddr \n AND toStartOfInterval(Session.creationDate, INTERVAL 5 minute)=toStartOfInterval(Netflow.TimeRecvd,INTERVAL 5 minute ) `;\n    const whereParts = [\n        ` (Session.framedIpAddress=Netflow.DstIP OR Session.framedIpAddress=Netflow.SrcIP OR Session.framedIpAddress=Netflow.NextHop) `,\n    ];\n    if (netflowReportRequestTask.fromDate) {\n        whereParts.push(` TimeRecvd>=toDateTime('${netflowReportRequestTask.fromDate.format(typings_1.DATABASE_DATE_FORMAT)}') `);\n    }\n    if (netflowReportRequestTask.toDate) {\n        whereParts.push(` TimeRecvd<=toDateTime('${netflowReportRequestTask.toDate.format(typings_1.DATABASE_DATE_FORMAT)}') `);\n    }\n    if (netflowReportRequestTask.username) {\n        whereParts.push(` username='${netflowReportRequestTask.username}' `);\n    }\n    if (netflowReportRequestTask.dstPort &&\n        netflowReportRequestTask.dstPort.length > 0) {\n        const dstPortQueries = [];\n        for (const dstPort of netflowReportRequestTask.dstPort) {\n            dstPortQueries.push(` DstPort='${dstPort}' `);\n        }\n        whereParts.push(` (${dstPortQueries.join(' OR ')}) `);\n    }\n    if (netflowReportRequestTask.srcPort &&\n        netflowReportRequestTask.srcPort.length > 0) {\n        const srcPortQueries = [];\n        for (const srcPort of netflowReportRequestTask.srcPort) {\n            srcPortQueries.push(` SrcPort='${srcPort}' `);\n        }\n        whereParts.push(` (${srcPortQueries.join(' OR ')}) `);\n    }\n    if (netflowReportRequestTask.businessId) {\n        whereParts.push(` businessId='${netflowReportRequestTask.businessId}' `);\n    }\n    if (netflowReportRequestTask.nas && netflowReportRequestTask.nas.length > 0) {\n        const nasIdQueries = [];\n        for (const nas of netflowReportRequestTask.nas) {\n            nasIdQueries.push(` nasId='${nas.id}' `);\n        }\n        whereParts.push(` (${nasIdQueries.join(' OR ')}) `);\n    }\n    if (netflowReportRequestTask.srcAddress) {\n        whereParts.push(` ( SrcIP='${netflowReportRequestTask.srcAddress}' OR NextHop='${netflowReportRequestTask.srcAddress}' ) `);\n    }\n    if (netflowReportRequestTask.dstAddress) {\n        whereParts.push(` ( DstIP='${netflowReportRequestTask.dstAddress}' OR NextHop='${netflowReportRequestTask.dstAddress}' ) `);\n    }\n    if (netflowReportRequestTask.protocol) {\n        if (netflowReportRequestTask.protocol === typings_1.PROTOCOLS.TCP) {\n            whereParts.push(` Proto=6 `);\n        }\n        else if (netflowReportRequestTask.protocol === typings_1.PROTOCOLS.UPD) {\n            whereParts.push(` Proto=17 `);\n        }\n    }\n    if (whereParts.length > 0) {\n        mainQuery = `${mainQuery} WHERE  ${whereParts.join(' AND ')}`;\n    }\n    return mainQuery;\n};\nconst queryNetflow = async (netflowReportRequestTask) => {\n    const mainQuery = await createNetflowQuery(netflowReportRequestTask);\n    log.debug(mainQuery);\n    const { rows } = await clickClient_1.executeClickQuery(mainQuery);\n    const netflowRows = rows.map((row) => {\n        return new ClickNetflowRow(row);\n    });\n    return formatReports(netflowRows);\n};\nclass ClickNetflowRow {\n    constructor(row) {\n        this.RouterAddr = row[0] && row[0].toString();\n        this.SrcIP = row[1] && row[1].toString();\n        this.DstIP = row[2] && row[2].toString();\n        this.SrcPort = row[3] && row[3].toString();\n        this.DstPort = row[4] && row[4].toString();\n        this.NextHop = row[5] && row[5].toString();\n        this.TimeRecvd = row[6] && row[6].toString();\n        this.Proto = row[7] && row[7];\n        this.businessId = row[8] && row[8].toString();\n        this.memberId = row[9] && row[9].toString();\n        this.nasId = row[10] && row[10].toString();\n        this.nasTitle = row[11] && row[11].toString();\n        this.nasIp = row[12] && row[12].toString();\n        this.username = row[13] && row[13].toString();\n        this.framedIpAddress = row[14] && row[14].toString();\n        this.mac = row[15] && row[15].toString();\n        this.creationDate = row[16] && row[16].toString();\n    }\n    getJalaliDate() {\n        return moment_jalaali_1.default(moment_1.default.tz(this.TimeRecvd, '').tz(typings_1.LOCAL_TIME_ZONE)).format(typings_1.REPORT_PERSIAN_DATE_FORMAT);\n    }\n    getGregorianDate() {\n        return moment_1.default\n            .tz(this.TimeRecvd, '')\n            .tz(typings_1.LOCAL_TIME_ZONE)\n            .format(typings_1.REPORT_GREGORIAN_DATE_FORMAT);\n    }\n    getProtocolString() {\n        let protocolString = '';\n        if (this.Proto === 6) {\n            protocolString = typings_1.PROTOCOLS.TCP;\n        }\n        if (this.Proto === 17) {\n            protocolString = typings_1.PROTOCOLS.UPD;\n        }\n        return protocolString;\n    }\n}\nexports.ClickNetflowRow = ClickNetflowRow;\nexports.default = {\n    queryNetflow,\n};\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/modules/netflow.ts");

/***/ }),

/***/ "./modules/sendReport.ts":
/*!*******************************!*\
  !*** ./modules/sendReport.ts ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nvar __importStar = (this && this.__importStar) || function (mod) {\n    if (mod && mod.__esModule) return mod;\n    var result = {};\n    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];\n    result[\"default\"] = mod;\n    return result;\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst logger_1 = __importDefault(__webpack_require__(/*! ../utils/logger */ \"./utils/logger.ts\"));\nconst httpClient_1 = __webpack_require__(/*! ../utils/httpClient */ \"./utils/httpClient.ts\");\nconst request_promise_1 = __importDefault(__webpack_require__(/*! request-promise */ \"request-promise\"));\nconst auth_1 = __webpack_require__(/*! ../utils/auth */ \"./utils/auth.ts\");\nconst fs = __importStar(__webpack_require__(/*! fs */ \"fs\"));\nconst log = logger_1.default.createLogger();\nconst REPORT_CONTAINER = process.env.REPORT_CONTAINER || 'reports';\nconst UPLOAD_API = `${process.env.API_ADDRESS}/api/BigFiles/${REPORT_CONTAINER}/upload`;\nconst REPORT_API = `${process.env.API_ADDRESS}/api/Reports`;\nif (!process.env.SERVICE_MAN_USERNAME ||\n    !process.env.SERVICE_MAN_PASSWORD ||\n    !process.env.API_ADDRESS) {\n    throw new Error('invalid auth env variables');\n}\n//const writeFile = util.promisify(fs.writeFile);\n//const closeFile = util.promisify(fs.close);\n//const unlink = util.promisify(fs.unlink);\nconst sendReport = async (reportRequest, path, reportConfig) => {\n    try {\n        const token = await auth_1.login(\n        // @ts-ignore\n        process.env.SERVICE_MAN_USERNAME, process.env.SERVICE_MAN_PASSWORD);\n        const fileName = `${Date.now().toString()}.${reportConfig.fileSuffix}`;\n        const options = {\n            method: 'POST',\n            url: UPLOAD_API,\n            timeout: 600000,\n            headers: {\n                authorization: token,\n                Accept: 'application/json',\n                'cache-control': 'no-cache',\n                'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',\n            },\n            formData: {\n                businessId: reportRequest.businessId,\n                myfile: {\n                    value: fs.createReadStream(path),\n                    options: {\n                        filename: fileName,\n                        contentType: reportConfig.fileMimeType,\n                    },\n                },\n            },\n        };\n        const response = await request_promise_1.default(options);\n        log.debug(`uploaded: ${response.status}`);\n        await updateReportStatus(reportRequest, reportConfig, {\n            container: REPORT_CONTAINER,\n            fileName,\n        });\n    }\n    catch (error) {\n        log.error('upload failed');\n        log.error(error);\n        throw error;\n    }\n};\nexports.sendReport = sendReport;\nconst updateReportStatus = async (reportRequest, reportConfig, fileInfo) => {\n    log.debug('updating report request', fileInfo);\n    log.debug('updating report request', reportRequest);\n    const token = await auth_1.login(\n    // @ts-ignore\n    process.env.SERVICE_MAN_USERNAME, process.env.SERVICE_MAN_PASSWORD);\n    log.debug('report:', reportRequest.id);\n    log.debug({ fileInfo });\n    const update = {\n        status: 'ready',\n        container: fileInfo.container,\n        fileName: fileInfo.fileName,\n        reportType: reportConfig.type,\n        from: reportRequest.from,\n        to: reportRequest.to,\n    };\n    log.debug({ update });\n    const httpClient = httpClient_1.createHttpClient(`${REPORT_API}`);\n    await httpClient.patch(`/${reportRequest.id}`, update, {\n        headers: {\n            authorization: token,\n        },\n    });\n};\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/modules/sendReport.ts");

/***/ }),

/***/ "./modules/webproxyLog.ts":
/*!********************************!*\
  !*** ./modules/webproxyLog.ts ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst logger_1 = __importDefault(__webpack_require__(/*! ../utils/logger */ \"./utils/logger.ts\"));\nconst moment_1 = __importDefault(__webpack_require__(/*! moment */ \"moment\"));\nconst moment_jalaali_1 = __importDefault(__webpack_require__(/*! moment-jalaali */ \"moment-jalaali\"));\nconst typings_1 = __webpack_require__(/*! ../typings */ \"./typings/index.ts\");\nconst lodash_1 = __importDefault(__webpack_require__(/*! lodash */ \"lodash\"));\nconst clickClient_1 = __webpack_require__(/*! ../utils/clickClient */ \"./utils/clickClient.ts\");\nconst log = logger_1.default.createLogger();\nconst clickHouse = clickClient_1.createClickConnection();\nconst queryWebproxyLog = async (webproxyReportRequestTask) => {\n    log.debug('### queryWebproxy ###');\n    log.debug({ webproxyReportRequestTask });\n    const query = await createWebproxyQuery(webproxyReportRequestTask);\n    log.debug({ query });\n    const { rows } = await clickClient_1.executeClickQuery(query);\n    const webproxyRows = rows.map((row) => {\n        return new ClickWebproxyLogRow(row);\n    });\n    return formatWebproxyReports(webproxyRows);\n};\nconst createWebproxyQuery = (webproxyReportRequestTask) => {\n    let mainQuery = `  \n  SELECT * FROM hotspotplus.Session JOIN hotspotplus.WebProxy  ON Session.nasIp=WebProxy.nasIp \n  AND toStartOfInterval(Session.creationDate, INTERVAL 5 minute)=toStartOfInterval(WebProxy.receivedAt, INTERVAL 5 minute ) \n  `;\n    const whereParts = [' Session.framedIpAddress=WebProxy.memberIp '];\n    if (webproxyReportRequestTask.fromDate) {\n        whereParts.push(` receivedAt>=toDateTime('${webproxyReportRequestTask.fromDate.format(typings_1.DATABASE_DATE_FORMAT)}') `);\n    }\n    if (webproxyReportRequestTask.toDate) {\n        whereParts.push(` receivedAt<=toDateTime('${webproxyReportRequestTask.toDate.format(typings_1.DATABASE_DATE_FORMAT)}') `);\n    }\n    if (webproxyReportRequestTask.username) {\n        whereParts.push(` username='${webproxyReportRequestTask.username}' `);\n    }\n    if (webproxyReportRequestTask.domain) {\n        whereParts.push(` domain='${webproxyReportRequestTask.domain}' `);\n    }\n    if (webproxyReportRequestTask.url) {\n        whereParts.push(` url='${webproxyReportRequestTask.url}' `);\n    }\n    if (webproxyReportRequestTask.method &&\n        webproxyReportRequestTask.method.length > 0) {\n        const methodQueries = [];\n        for (const method of webproxyReportRequestTask.method) {\n            methodQueries.push(` method='${method}' `);\n        }\n        whereParts.push(` (${methodQueries.join(' OR ')}) `);\n    }\n    if (webproxyReportRequestTask.businessId) {\n        whereParts.push(` businessId='${webproxyReportRequestTask.businessId}' `);\n    }\n    if (webproxyReportRequestTask.nas &&\n        webproxyReportRequestTask.nas.length > 0) {\n        const nasIdQueries = [];\n        for (const nas of webproxyReportRequestTask.nas) {\n            nasIdQueries.push(` nasId='${nas.id}' `);\n        }\n        whereParts.push(` (${nasIdQueries.join(' OR ')}) `);\n    }\n    if (whereParts.length > 0) {\n        mainQuery = `${mainQuery} WHERE  ${whereParts.join(' AND ')}`;\n    }\n    return mainQuery;\n};\nconst formatWebproxyReports = (rows) => {\n    const formatted = rows.map((clickRow) => {\n        return {\n            Router: clickRow.nasTitle,\n            Username: clickRow.username,\n            IP: clickRow.memberIp,\n            Mac: clickRow.mac,\n            Jalali_Date: clickRow.getJalaliDate(),\n            Http_Method: clickRow.method,\n            Domain: clickRow.domain,\n            Url: clickRow.url,\n            Gregorian_Date: clickRow.getGregorianDate(),\n        };\n    });\n    return lodash_1.default.sortBy(formatted, ['Router', 'Username', 'Jalali_Date', 'Domain']);\n};\nclass ClickWebproxyLogRow {\n    constructor(row) {\n        this.memberIp = row[0] && row[0].toString();\n        this.nasIp = row[1] && row[1].toString();\n        this.protocol = row[2] && row[2].toString();\n        this.url = row[3] && row[3].toString();\n        this.method = row[4] && row[4].toString();\n        this.domain = row[5] && row[5].toString();\n        this.receivedAt = row[6] && row[6].toString();\n        this.businessId = row[7] && row[7].toString();\n        this.memberId = row[8] && row[8].toString();\n        this.nasId = row[9] && row[9].toString();\n        this.nasTitle = row[10] && row[10].toString();\n        //this.nasIp = row[11] && row[11].toString();\n        this.username = row[12] && row[12].toString();\n        this.framedIpAddress = row[13] && row[13].toString();\n        this.mac = row[14] && row[14].toString();\n        this.creationDate = row[15] && row[15].toString();\n    }\n    getJalaliDate() {\n        return moment_jalaali_1.default(moment_1.default.tz(this.receivedAt, '').tz(typings_1.LOCAL_TIME_ZONE)).format(typings_1.REPORT_PERSIAN_DATE_FORMAT);\n    }\n    getGregorianDate() {\n        return moment_1.default\n            .tz(this.receivedAt, '')\n            .tz(typings_1.LOCAL_TIME_ZONE)\n            .format(typings_1.REPORT_GREGORIAN_DATE_FORMAT);\n    }\n}\nexports.ClickWebproxyLogRow = ClickWebproxyLogRow;\nexports.default = {\n    queryWebproxyLog,\n};\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/modules/webproxyLog.ts");

/***/ }),

/***/ "./reportEngine/excel.ts":
/*!*******************************!*\
  !*** ./reportEngine/excel.ts ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nvar __importStar = (this && this.__importStar) || function (mod) {\n    if (mod && mod.__esModule) return mod;\n    var result = {};\n    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];\n    result[\"default\"] = mod;\n    return result;\n};\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst fs = __importStar(__webpack_require__(/*! fs */ \"fs\"));\nconst jsreport = __webpack_require__(/*! jsreport-core */ \"jsreport-core\")();\nconst logger_1 = __webpack_require__(/*! ../utils/logger */ \"./utils/logger.ts\");\nconst util_1 = __importDefault(__webpack_require__(/*! util */ \"util\"));\nconst log = logger_1.createLogger();\njsreport.use(__webpack_require__(/*! jsreport-xlsx */ \"jsreport-xlsx\")());\njsreport.use(__webpack_require__(/*! jsreport-handlebars */ \"jsreport-handlebars\")());\njsreport.init();\nconst writeFile = util_1.default.promisify(fs.writeFile);\nconst readFile = util_1.default.promisify(fs.readFile);\nconst closeFile = util_1.default.promisify(fs.close);\nconst unlink = util_1.default.promisify(fs.unlink);\nconst render = async (reportConfig, data) => {\n    const { templateName, helperName } = reportConfig;\n    const template = await readFile(`${process.env.REPORT_TEMPLATES_PAHT}/${templateName}`);\n    const helpers = await readFile(`${process.env.REPORT_TEMPLATES_PAHT}/${helperName}`);\n    const report = await jsreport.render({\n        template: {\n            recipe: 'xlsx',\n            engine: 'handlebars',\n            content: helpers.toString('utf8'),\n            xlsxTemplate: {\n                content: template.toString('base64'),\n            },\n        },\n        data,\n    });\n    return report;\n};\nexports.default = render;\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/reportEngine/excel.ts");

/***/ }),

/***/ "./reportEngine/index.ts":
/*!*******************************!*\
  !*** ./reportEngine/index.ts ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst excel_1 = __importDefault(__webpack_require__(/*! ./excel */ \"./reportEngine/excel.ts\"));\nconst render = async (reportConfig, data) => {\n    switch (reportConfig.type) {\n        case \"excel\" /* EXCEL */:\n            const report = await excel_1.default(reportConfig, data);\n            return report;\n        default:\n            throw new Error('unknown report type');\n    }\n};\nexports.default = render;\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/reportEngine/index.ts");

/***/ }),

/***/ "./reportEngine/reportTypes.ts":
/*!*************************************!*\
  !*** ./reportEngine/reportTypes.ts ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst typings_1 = __webpack_require__(/*! ../typings */ \"./typings/index.ts\");\nconst netflow = {\n    name: 'Connections',\n    helperName: 'netflowReportHelper.txt',\n    fileMimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',\n    fileSuffix: 'xlsx',\n    templateName: 'netflowReportTemplate.xlsx',\n    type: \"excel\" /* EXCEL */,\n};\nconst webproxy = {\n    name: 'Web Proxy',\n    helperName: 'webproxyReportHelper.txt',\n    templateName: 'webproxyReportTemplate.xlsx',\n    fileMimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',\n    fileSuffix: 'xlsx',\n    type: \"excel\" /* EXCEL */,\n};\nconst dns = {\n    name: 'DNS',\n    helperName: 'dnsReportHelper.txt',\n    templateName: 'dnsReportTemplate.xlsx',\n    fileMimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',\n    fileSuffix: 'xlsx',\n    type: \"excel\" /* EXCEL */,\n};\nconst getReportConfig = (reportType) => {\n    switch (reportType) {\n        case typings_1.REPORT_TYPE.DNS:\n            return dns;\n        case typings_1.REPORT_TYPE.NETFLOW:\n            return netflow;\n        case typings_1.REPORT_TYPE.WEBPROXY:\n            return webproxy;\n        default:\n            throw new Error('invalid report type');\n    }\n};\nexports.getReportConfig = getReportConfig;\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/reportEngine/reportTypes.ts");

/***/ }),

/***/ "./routes/index.ts":
/*!*************************!*\
  !*** ./routes/index.ts ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst express_promise_router_1 = __importDefault(__webpack_require__(/*! express-promise-router */ \"express-promise-router\"));\nconst controllers_1 = __importDefault(__webpack_require__(/*! ../controllers */ \"./controllers/index.ts\"));\nconst router = express_promise_router_1.default();\nrouter.get('/health', controllers_1.default.health);\nrouter.post('/api/report/create', controllers_1.default.createReport);\nexports.default = router;\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/routes/index.ts");

/***/ }),

/***/ "./typings/index.ts":
/*!**************************!*\
  !*** ./typings/index.ts ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nObject.defineProperty(exports, \"__esModule\", { value: true });\nexports.LOGGER_TIME_ZONE = '';\nexports.LOCAL_TIME_ZONE = 'Asia/Tehran';\nexports.DATABASE_DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';\nexports.REPORT_GREGORIAN_DATE_FORMAT = 'YYYY/MM/DD HH:mm';\nexports.REPORT_PERSIAN_DATE_FORMAT = 'jYYYY/jM/jD HH:MM';\nvar REPORT_TYPE;\n(function (REPORT_TYPE) {\n    REPORT_TYPE[\"NETFLOW\"] = \"netflow\";\n    REPORT_TYPE[\"WEBPROXY\"] = \"webproxy\";\n    REPORT_TYPE[\"DNS\"] = \"dns\";\n})(REPORT_TYPE = exports.REPORT_TYPE || (exports.REPORT_TYPE = {}));\nvar PROTOCOLS;\n(function (PROTOCOLS) {\n    PROTOCOLS[\"TCP\"] = \"TCP\";\n    PROTOCOLS[\"UPD\"] = \"UDP\";\n})(PROTOCOLS = exports.PROTOCOLS || (exports.PROTOCOLS = {}));\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/typings/index.ts");

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

/***/ "./utils/clickClient.ts":
/*!******************************!*\
  !*** ./utils/clickClient.ts ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst clickhouse_1 = __importDefault(__webpack_require__(/*! @apla/clickhouse */ \"@apla/clickhouse\"));\nconst logger_1 = __webpack_require__(/*! ./logger */ \"./utils/logger.ts\");\nconst log = logger_1.createLogger();\nif (!process.env.CLICK_HOST) {\n    throw new Error('CLICK_HOST is empty');\n}\nif (!process.env.CLICK_USER) {\n    throw new Error('CLICK_USER is empty');\n}\nif (!process.env.CLICK_PASSWORD) {\n    throw new Error('CLICK_PASSWORD is empty');\n}\nconst createClickConnection = () => {\n    return new clickhouse_1.default({\n        host: process.env.CLICK_HOST,\n        port: process.env.CLICK_PORT || 8123,\n        user: process.env.CLICK_USER,\n        password: process.env.CLICK_PASSWORD,\n    });\n};\nexports.createClickConnection = createClickConnection;\nconst executeClickQuery = async (mainQuery) => {\n    return new Promise((resolve, reject) => {\n        const clickHouseClient = createClickConnection();\n        const stream = clickHouseClient.query(mainQuery);\n        let columns = [];\n        stream.on('metadata', (columnsInfo) => {\n            log.debug(`row meta:`, columnsInfo);\n            columns = columnsInfo;\n        });\n        const rows = [];\n        stream.on('data', (row) => {\n            rows.push(row);\n        });\n        stream.on('error', (error) => {\n            reject(error);\n        });\n        stream.on('end', () => {\n            resolve({ rows, columns });\n        });\n    });\n};\nexports.executeClickQuery = executeClickQuery;\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/utils/clickClient.ts");

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

/***/ "@apla/clickhouse":
/*!***********************************!*\
  !*** external "@apla/clickhouse" ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"@apla/clickhouse\");\n\n//# sourceURL=file:///external%2520%2522@apla/clickhouse%2522");

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

/***/ "jsreport-core":
/*!********************************!*\
  !*** external "jsreport-core" ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"jsreport-core\");\n\n//# sourceURL=file:///external%2520%2522jsreport-core%2522");

/***/ }),

/***/ "jsreport-handlebars":
/*!**************************************!*\
  !*** external "jsreport-handlebars" ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"jsreport-handlebars\");\n\n//# sourceURL=file:///external%2520%2522jsreport-handlebars%2522");

/***/ }),

/***/ "jsreport-xlsx":
/*!********************************!*\
  !*** external "jsreport-xlsx" ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"jsreport-xlsx\");\n\n//# sourceURL=file:///external%2520%2522jsreport-xlsx%2522");

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