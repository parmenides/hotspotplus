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
eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst express_1 = __importDefault(__webpack_require__(/*! express */ \"express\"));\nconst dotenv_1 = __importDefault(__webpack_require__(/*! dotenv */ \"dotenv\"));\nconst routes_1 = __importDefault(__webpack_require__(/*! ../src/routes */ \"./routes/index.ts\"));\nconst errorHandler_1 = __importDefault(__webpack_require__(/*! ./utils/errorHandler */ \"./utils/errorHandler.ts\"));\nconst logger_1 = __importDefault(__webpack_require__(/*! ./utils/logger */ \"./utils/logger.ts\"));\n//require('date-utils');\nconst log = logger_1.default.createLogger();\n//hey you\ndotenv_1.default.load();\nconst app = express_1.default();\napp.set('port', process.env.PORT || 3000);\napp.use(express_1.default.json());\napp.use(express_1.default.urlencoded({ extended: false }));\napp.use('/', routes_1.default);\napp.use(errorHandler_1.default);\napp.use((req, resp, next) => {\n    log.debug('####### Request Log #######');\n    log.debug('Path:', req.path);\n    log.debug('Query:', req.query);\n    log.debug('Methods:', req.method);\n    log.debug('Body %j', req.body);\n    next();\n});\napp.listen(app.get('port'), async () => {\n    /*tslint:disable*/\n    console.log('Add default queues...');\n    console.log('Add default queues...');\n    //addDefaultQueue();\n    //logWorker.processLogRequest();\n    console.log(`App is running at http://localhost:${app.get('port')}`);\n    log.info(` App is running at http://localhost:${app.get('port')}`);\n});\n//testRunner();\n//addSyslogIndexTemplates();\nprocess.on('uncaughtException', function (error) {\n    console.error('Something bad happened here....');\n    console.error(error);\n    console.error(error.stack);\n    log.error(error);\n    log.error(error.stack);\n});\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/index.ts");

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

/***/ "./utils/errorHandler.ts":
/*!*******************************!*\
  !*** ./utils/errorHandler.ts ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst logger_1 = __importDefault(__webpack_require__(/*! ./logger */ \"./utils/logger.ts\"));\nconst log = logger_1.default.createLogger();\n// tslint:disable-next-line\nconst isDev = process.env.DEV == 'true';\nconst errorHandler = (error, req, res, next) => {\n    if (isDev) {\n        if (!error.status || error.status > 499) {\n            // tslint:disable-next-line no-console\n            console.log(error.stack);\n            log.error('Error:', error);\n            //log.error('Main Error Handler:', error.stack);\n        }\n    }\n    res.status(error.status || 500);\n    res.send({ message: error.message });\n};\nexports.default = errorHandler;\n\n\n//# sourceURL=file:////Users/payamyousefi/projects/hotspotplus/log-worker/src/utils/errorHandler.ts");

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

/***/ })

/******/ })));