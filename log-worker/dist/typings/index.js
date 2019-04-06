"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOGGER_TIME_ZONE = 'Europe/London';
exports.LOCAL_TIME_ZONE = 'Asia/Tehran';
var QUEUES;
(function (QUEUES) {
    QUEUES["LOG_ENRICHMENT_WORKER_QUEUE"] = "log-enrichment";
    QUEUES["LOG_ENRICHMENT_WORKER_QUEUE_EXCHANGE"] = "log-enrichment-ex";
    QUEUES["RETRY_LOG_ENRICHMENT_WORKER_QUEUE"] = "retry-log-enrichment";
    QUEUES["RETRY_LOG_ENRICHMENT_WORKER_QUEUE_EXCHANGE"] = "retry-log-enrichment-ex";
    QUEUES["LOG_WORKER_QUEUE"] = "log-worker";
    QUEUES["LOG_WORKER_EXCHANGE"] = "log-worker-ex";
    QUEUES["RETRY_LOG_WORKER_QUEUE"] = "retry-log-worker";
    QUEUES["RETRY_LOG_WORKER_EXCHANGE"] = "retry-log-worker-ex";
})(QUEUES = exports.QUEUES || (exports.QUEUES = {}));
var REPORT_TYPE;
(function (REPORT_TYPE) {
    REPORT_TYPE["NETFLOW"] = "netflow";
    REPORT_TYPE["SYSLOG"] = "syslog";
})(REPORT_TYPE = exports.REPORT_TYPE || (exports.REPORT_TYPE = {}));
//# sourceMappingURL=index.js.map