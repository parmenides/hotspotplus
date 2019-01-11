var env = {
	LOG_DIR:                   "/Users/hamidehnouri/myProjects/HotspotPlus/pinfi/log",
	LC_PATH:                   "/Users/hamidehnouri/myProjects/HotspotPlus/pinfi/keys",
	AGGREGATE_LOG:             "/Users/hamidehnouri/myProjects/HotspotPlus/pinfi/log",
	AUTH_LOG:                  "/Users/hamidehnouri/myProjects/HotspotPlus/pinfi/log",
	UTILITY_LOG:               "/Users/hamidehnouri/myProjects/HotspotPlus/pinfi/log",
	COMMON_LOG:                "/Users/hamidehnouri/myProjects/HotspotPlus/pinfi/log",
	CUSTOM_HOST:               "0.0.0.0",
	CUSTOM_PORT:               3000,
	WEB_APP_DOMAIN:            "127.0.0.1",
	SENTRY_PREFIX:             11,
	SENTRY_TOKEN:              "69b3ce360cbc437bb8c7531677258738:7feb066c12cd4f789d8c6b8eca2ee7bb",
	DROPBOX_APP_KEY:           "r8y1igligza683f",
	DROPBOX_APP_SECRET:        "0tb29s84njzzgx4",
	ADMIN_MOBILE:              "09120243628",
	BUSINESS_EMAIL_DOMAIN:     'hotspotplus.ir',
	API_PORT:                  3000,
	WEB_APP_PORT:              8080,
	API_DOMAIN:                "127.0.0.1",
	HOTSPOT_DOMAIN:            "captiveportal.ir",
	MONGO_IP:                  "127.0.0.1",
	MONGO_DB_NAME:             "spotiodb",
	ELASTIC_IP:                "127.0.0.1",
	ELASTIC_PORT:              9200,
	ELASTIC_INDEX_PREFIX:      "/localspotio",
	SMS_API_KEY:               "7A706844375A7964785A3452317054583841535548413D3D",
	REDIS_HOST_NAME:           "sandBoxRedis",
	NETFLOW_REDIS_CHANNEL:     "sandboxNetflow",
	SYSLOG_REDIS_CHANNEL:      "sandboxSyslog",
	REDIS_PORT:                6379,
	NET_FLOW_PORT:             8001,
	RADIUS_IP:                 "127.0.0.1",
	RADIUS_ACC_PORT:           1813,
	RADIUS_AUTH_PORT:          1812,
	APP_STATUS:                'dev',
	PAYMENT_API_KEY:           'test',
	PAYMENT_SUPPORT_EMAIL:     'payam.yousefii@gmail.com',
	PAYMENT_SUPPORT_MOBILE:    '09120243628',
	SERVICE_MAN_USERNAME:      'pinTimeServiceMan',
	SERVICE_MAN_PASSWORD:      '#123aaa)',
	PERSIAN_SMS_COST:          19,
	ENGLISH_SMS_COST:          46,
	DAY_MILLISECONDS:          86400000,
	MINUTE_MILLISECONDS:       60000,
	REDIS_IP:                  "127.0.0.1",
	APP_NAME:                  "hotspotplus",
	STORAGE:                   "mongodb",
	PRIMARY_SHARED_SECRET:     "JHsjfHAADFGhjahj",
	NAS_SESSION_EXPIRES_AT:    1200,
	DASHBOARD_WEB_SERVER_IP:   "172.20.0.101",
	HOTSPOT_WEB_SERVER_IP:     "172.20.0.102",
	API_SERVER_IP:             "172.20.0.100",
	SECOND_RADIUS_IP:          "185.208.175.57",
	BACKUP_RADIUS_ACC_PORT:    1713,
	BACKUP_RADIUS_AUTH_PORT:   1712,
	ENABLE_SENTRY:             false,
	SENTRY_SERVER:             "go.hotspotplus.ir",
	PROTOCOL:                  "http",

	LOG_LEVEL:                            "debug",
	TZ:                                   "Asia/Tehran",
	SMS_QUEUE:                            "SMS_QUEUE",
	CHARGE_QUEUE:                         "CHARGE_QUEUE",
	NOTIFICATIONS_QUEUE:                  "NOTIFICATIONS_QUEUE",
	SYSLOG_REPORT_QUEUE:                  "SYSLOG_REPORT_QUEUE",
	MIN_REQUIRED_SMS_CREDIT:              100,
	SMS_SIGNATURE:                        "هات اسپات پلاس",
	RADIUS_DISCONNECT_REQUEST_QUEUE:      "RADIUS_DISCONNECT_REQUEST_QUEUE",
	ACCOUNTING_USAGE_REPORT_QUEUE:        "ACCOUNTING_USAGE_REPORT_QUEUE",
	NETFLOW_REPORT_QUEUE:                 "NETFLOW_REPORT_QUEUE",
	BUSINESS_SMS_CHARGE_CONFIRM:          "businessSmsChargePurchaseConfirmed",
	ADD_MEMBER_QUEUE:                     "ADD_MEMBER_QUEUE",
	DROPBOX_DOCS_COPY_CRON_JOB_SCHEDULER: "33 20 * * *",
	REPORT_GET_LOGS_QUEUE:                "REPORT_GET_LOGS_QUEUE",
	BUSINESS_SIZE:                        100,
	FILES_ROWS:                           100000
};

module.exports = {
	apps: [
		{
			name:   "ApiService",
			script: "/Users/hamidehnouri/myProjects/HotspotPlus/pinfi/server/server.js",
			watch:  true,
			env:    env
		},
		{
			name:   "Dashboard",
			cwd:    "/Users/hamidehnouri/myProjects/HotspotPlus/HotspotplusDashboard",
			script: "npm",
			args:   "start",
			env:    env
		},
		{
			name:   "Hotspot",
			cwd:    "/Users/hamidehnouri/myProjects/HotspotPlus/HotspotplusHotspot",
			script: "npm",
			args:   "start",
			env:    env
		}/*,
		{
			name:   "SMS Service",
			cwd:    "/Users/hamidehnouri/myProjects/HotspotPlus/HspSmsService",
			script: "npm",
			args:   "start",
			env:    env
		},
		{
			name:   "Bulk Member Import",
			cwd:    "/Users/hamidehnouri/myProjects/HotspotPlus/HspBulkMemberImportService",
			script: "npm",
			args:   "start",
			env:    env
		},
		{
			name:   "Accounting Service",
			cwd:    "/Users/hamidehnouri/myProjects/HotspotPlus/HspAccountingService",
			script: "npm",
			args:   "start",
			env:    env
		},
		{
			name:   "Charge Service",
			cwd:    "/Users/hamidehnouri/myProjects/HotspotPlus/HspChargeService",
			script: "npm",
			args:   "start",
			env:    env
		},
		{
			name:   "Netflow Service",
			cwd:    "/Users/hamidehnouri/myProjects/HotspotPlus/HspNetflowService",
			script: "npm",
			args:   "start",
			env:    env
		},
		{
			name:   "Syslog Service",
			cwd:    "/Users/hamidehnouri/myProjects/HotspotPlus/HspSyslogService",
			script: "npm",
			args:   "start",
			env:    env
		}*/
	]
};
