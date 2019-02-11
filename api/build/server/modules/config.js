/**
 * Created by payamyousefi on 4/13/15.
 */

var path = require('path');
var templatesPath = path.join(__dirname, '/../../templates/');
var setup_script_path = path.join(__dirname, '/routers/mikrotik/');
var mikrotik_hotspot_script_path = path.join(
  __dirname,
  '/routers/mikrotik/html'
);
var elasticURL =
  'http://' + process.env.ELASTIC_IP + ':' + process.env.ELASTIC_PORT;
// "7A706844375A7964785A3452317054583841535548413D3D";
// "7A706844375A7964785A3452317054583841535548413D3D";
var SMS_API_KEY = process.env.SMS_API_KEY;
var mainPath = '/';
if (process.env.APP_STATUS === 'dev') {
  mainPath = '/src/index.html';
} else if (process.env.APP_STATUS === 'sandbox') {
  mainPath = '/index.html';
}
var hotspotTemplates = require('./hotspotTemplates');
var DEFAULT_ACCOUNTING_UPDATE_INTERVAL_SECONDS =
  process.env.DEFAULT_ACCOUNTING_UPDATE_INTERVAL_SECONDS || 600;
var FAST_ACCOUNTING_UPDATE_INTERVAL_SECONDS =
  process.env.FAST_ACCOUNTING_UPDATE_INTERVAL_SECONDS || 600;

var CONFIG_SERVER_URL = process.env.CONFIG_SERVER_URL;
module.exports = {
  VERSION: '1.3',
  SMS_SIGNATURE: process.env.SMS_SIGNATURE,
  PASSWORD_PREFIX: process.env.PASSWORD_PREFIX,
  SYSTEM_ID_PATH: process.env.SYSTEM_ID_PATH,
  PRIMARY_SHARED_SECRET: process.env.PRIMARY_SHARED_SECRET,
  ZARINPAL_SANDBOX: !!process.env.ZARINPAL_SANDBOX,
  TRIAL_DAYS: process.env.TRIAL_DAYS || 3,
  ADMIN_MOBILE: process.env.ADMIN_MOBILE,
  PAYMENT_API_KEY: process.env.PAYMENT_API_KEY,
  PAYMENT_SUPPORT_EMAIL: process.env.PAYMENT_SUPPORT_EMAIL,
  PAYMENT_SUPPORT_MOBILE: process.env.PAYMENT_SUPPORT_MOBILE,
  SUPPORT_MOBILE: process.env.PAYMENT_SUPPORT_MOBILE,
  NOTIFY_SUPPORT_TEMPLATE: 'ticketCreated',
  NOTIFY_CUSTOMER_TEMPLATE: 'ticketAnswered',
  BUSINESS_EMAIL_DOMAIN: '@' + process.env.BUSINESS_EMAIL_DOMAIN,
  ROUTER: {
    ROUTER_CONFIG: 'templates/router_config.lua'
  },
  STORAGES: {
    MONGODB: 'mongodb',
    ELASTICSEARCH: 'elasticsearch'
  },
  DEFAULT_LICENSE_DURATION_IN_DAYS: 365 * 2,
  DEFAULT_ONLINE_USER: 120,
  KAVEHNEGAR_DEFAULT_SMS_CREDIT: 0,
  KAVEHNEGAR_SMS_PLAN_ID: 'hotspotplus',
  KAVEHNEGAR_PANEL_DEFAULT_STATUS: '1',
  KAVEHNEGAR_ADD_CUSTOMER:
    'http://api.kavenegar.com/v1/' + SMS_API_KEY + '/client/add.json',
  KAVEHNEGAR_LOAD_CUSTOMER:
    'http://api.kavenegar.com/v1/' + SMS_API_KEY + '/client/fetch.json',
  GOOGLE_URL_SHORTNER_API: 'AIzaSyBP7KUMF-sRhDqhZC50_AA9oJ8GAeuiwnk',
  HOTSPOT_VERIFICATION_MESSAGE_TEMPLATE: 'sendVerificationCodeThenCall',
  HOTSPOT_VERIFICATION_MESSAGE_TEMPLATE_BY_CALL: 'sendVerificationCodeCallOnly',
  APP_VERIFICATION_CODE: 'appVerificationCode',
  ROUTER_OFFLINE_MESSAGE_TEMPLATE: 'routerOffline',
  SMS_CREDIT_RUNOUT_MESSAGE_TEMPLATE: 'smsCreditRunOut',
  PASSWORD_RESET_TEMPLATE: 'passwordReset',
  SUBSCRIPTION_IS_ENDING_MESSAGE_TEMPLATE: 'subscriptionIsEnding',
  HOTSPOT_CREDENTIALS_URL_MESSAGE_TEMPLATE: 'hotspotPlusHotspotCredentialsURL',
  HOTSPOT_CREDENTIALS_MESSAGE_TEMPLATE: 'hotspotPlusHotspotCredentials',
  REGISTRATION_MESSAGE_TEMPLATE: 'hotspotPlusRegistrationSMS',
  RESELLER_PURCHASE_PACKAGE_CONFIRMED: 'resellerPackagePurchaseConfirmed',
  BUSINESS_SMS_CHARGE_CONFIRM: 'businessSmsChargePurchaseConfirmed',
  PAYMENT_GATEWAY_INTERNET_PLAN_PAYMENT_DESC: 'خرید اینترنت',
  PAYMENT_GATEWAY_INTERNET_BULK_PAYMENT_DESC: 'خرید حجم اینترنت',
  PAYMENT_GATEWAY_DEFAULT_DESC: 'خرید اعتبار از سایت هات اسپات پلاس',
  couponCodeMessage:
    'برای دریافت هدیه ی خود لطفا به وای فای {wifi} متصل شوید و سپس بر روی لینک زیر کلیک کنید.',
  simpleMessage:
    'برای تایید عضویت خود لطفا به وای فای {wifi} متصل شوید و سپس بر روی لینک زیر کلیک کنید.',
  hotspotCredentialMessage:
    ' شما میتوانید با نام کاربری {username} و رمز عبور {password} به اینترنت متصل شوید و یا برای اتصال خودکار بر روی لینک زیر کلیک کنید.',
  HOTSPOT_HOME_URL: 'http://msn.com',
  DROPBOX_AUTHORISE_URL:
    'https://www.dropbox.com/1/oauth2/authorize?client_id={0}&response_type=code&redirect_uri={1}&state={2}',
  SHORT_VERIFICATION_URL_EXPIRES_AT: 60 * 60,
  SHORT_LOGIN_URL_EXPIRES_AT: 30 * 24 * 60 * 60,
  DEFAULT_ALLOWED_SINGLE_SESSION: 1,
  DEFAULT_ALLOWED_MULTI_SESSION: 3,
  DEFAULT_BURST_TIME_IN_SECONDS: 8,
  DEFAULT_UPLOAD_BURST_FACTOR: 4,
  DEFAULT_DOWNLOAD_BURST_FACTOR: 4,
  BUSINESS_GROUP_MEMBER_COUNTER_START: 1360,
  ENCRYPTION_KEY: process.env.DEFAULT_ENCRYPTION_KEY,
  DEFAULTS: {
    USERS_DOMAIN: 'hotspotplus.ir',
    ADMIN_USERNAME: process.env.DEFAULT_ADMIN_USERNAME,
    ADMIN_PASS: process.env.DEFAULT_ADMIN_PASSWORD,
    ADMIN_ROLES: ['admin'],
    SERVICE_MAN_ROLES: ['serviceMan'],
    SERVICE_MAN_USERNAME: process.env.SERVICE_MAN_USERNAME,
    SERVICE_MAN_PASSWORD: process.env.SERVICE_MAN_PASSWORD
  },
  ROLES: {
    BUSINESS: 'business',
    NETWORKADMIN: 'networkadmin',
    NAS: 'nas',
    HEADMASTER: 'headmaster',
    ADMIN: 'admin',
    RESELLER: 'reseller',
    SERVICEMAN: 'serviceMan',
    CUSTOMER: 'customer',
    SERVICEPROVIDER: 'serviceProvider',
    HOTSPOTMEMBER: 'member'
  },
  LC_PATH: process.env.LC_PATH,
  CONFIG_SERVER_LOGIN: CONFIG_SERVER_URL + '/Licenses/login',
  CONFIG_SERVER_CHARGE_SMS:
    CONFIG_SERVER_URL + '/Sms/buySmsCredit?access_token={token}',
  CONFIG_SERVER_BUY_PACKAGE:
    CONFIG_SERVER_URL + '/Licenses/buyLocalPackage?access_token={token}',
  CONFIG_SERVER_LOCAL_MODULES: CONFIG_SERVER_URL + '/Licenses/getPackages',
  CONFIG_SERVER_LOCAL_CHARGE:
    CONFIG_SERVER_URL + '/Sms/getLicenseBalance?access_token={token}',
  CONFIG_SERVER_NEW_LICENSE:
    CONFIG_SERVER_URL + '/Licenses/registerPublicLicense',
  DEFAULT_SYSTEM_CONFIG: {
    appTitle: 'هات اسپات پلاس',
    isDefault: true,
    dropBoxAppSecret: '',
    dropBoxAppKey: '',
    hotspotAddress: '',
    externalApiAddress: '',
    webAppAddress: '',
    apiProtocol: 'http',
    serviceStatus: 'local',
    numberOfAllowedBusiness: 1
  },
  LOG: {
    appName: 'PinFi',
    LOG_DIR: process.env.LOG_DIR
  },
  REDIS: {
    HOST: process.env.REDIS_IP,
    PORT: process.env.REDIS_PORT,
    PASS: null,
    OPTIONS: {}
  },
  ACCOUNTING_TOPIC: 'accountingTopic',
  SESSION_TOPIC: 'sessionTopic',
  ELASTIC_BULK_INSERT: 'ELASTIC_BULK_INSERT',
  REPORT_GET_LOGS: 'REPORT_GET_LOGS',
  DEFAULT_AGGREGATION_SIZE: 10,
  TSHARK_TRANSFORM_COMMAND:
    'tshark -r {1}  -T fields -e wlan.sa -e wlan.da -e frame.time_epoch -e radiotap.dbm_antsignal -e  wlan_mgt.ssid -E header=y -E separator=,   > {0}',
  AGGREGATE: {
    MINUTE_MILLISECONDS: 60 * 1000,
    MINUTE_SECONDS: 60,
    HOUR_MILLISECONDS: 60 * 60 * 1000,
    DAY_MINUTES: 24 * 60,
    DAY_MILLISECONDS: 24 * 60 * 60 * 1000,
    WEEK_MILLISECONDS: 7 * 24 * 60 * 60 * 1000,
    MONTH_FIRST_HALF_MILLISECONDS: 31 * 24 * 60 * 60 * 1000,
    MONTH_SECOND_HALF_MILLISECONDS: 30 * 24 * 60 * 60 * 1000,
    MONTH_MARCH_MILLISECONDS: 29 * 24 * 60 * 60 * 1000,
    QUARTER_FIRST_HALF_MILLISECONDS: 3 * 31 * 24 * 60 * 60 * 1000,
    QUARTER_SECOND_HALF_MILLISECONDS: 3 * 30 * 24 * 60 * 60 * 1000,
    QUARTER_WINTER_MILLISECONDS:
      2 * 30 * 24 * 60 * 60 * 1000 + 29 * 24 * 60 * 60 * 1000,
    YEAR_MILLISECONDS:
      6 * 31 * 24 * 60 * 60 * 1000 +
      5 * 30 * 24 * 60 * 60 * 1000 +
      29 * 24 * 60 * 60 * 1000,
    YEAR_LEAP_MILLISECONDS:
      6 * 31 * 24 * 60 * 60 * 1000 + 6 * 30 * 24 * 60 * 60 * 1000,
    WEEK_DAYS: 7,
    MONTH_DAYS: 30
  },
  NAS_SESSION_EXPIRES_AT: process.env.NAS_SESSION_EXPIRES_AT,

  THRESHOLD_BEFORE_BLOCKING_SERVICE_IN_DAYS: 1,
  ENGLISH_SMS_COST: 46,
  PERSIAN_SMS_COST: 19,
  ADMIN_CHARGE: 'adminCharge',
  BUY_CHARGE: 'buyCharge',
  BUY_SERVICE_CHARGE: 'serviceCharge',
  RESELLER_COMMISSION_CHARGE: 'commissionCharge',
  BUY_INTERNET_PLAN: 'buyInternetPlan',
  BUY_EXTRA_BULK: 'buyExtraBulk',
  DEFAULT_RESELLER_ONLINE_USERS: 0,
  DEFAULT_RESELLER_DURATION_MONTHS: 0,
  DEFAULT_RESELLER_PLAN_TYPE: 'static',
  ELASTIC_SESSION_REPORT_MAIN_CONTEXT:
    elasticURL + process.env.ELASTIC_INDEX_PREFIX + 'sessions',
  ELASTIC_SESSION_REPORT:
    elasticURL + process.env.ELASTIC_INDEX_PREFIX + 'sessions/report',
  ELASTIC_CHARGE_MAIN_CONTEXT:
    elasticURL + process.env.ELASTIC_INDEX_PREFIX + 'charge',
  ELASTIC_CHARGE_SEARCH:
    elasticURL + process.env.ELASTIC_INDEX_PREFIX + 'charge/charge/_search',
  ELASTIC_ACCOUNTING_MAIN_CONTEXT:
    elasticURL + process.env.ELASTIC_INDEX_PREFIX + 'accounting',
  ELASTIC_ACCOUNTING_USAGE:
    elasticURL + process.env.ELASTIC_INDEX_PREFIX + 'accounting/usagereport',
  ELASTIC_ACCOUNTING_USAGE_SEARCH:
    elasticURL +
    process.env.ELASTIC_INDEX_PREFIX +
    'accounting/usagereport/{0}{1}',
  ELASTIC_SYSLOG_MAIN_CONTEXT:
    elasticURL + process.env.ELASTIC_INDEX_PREFIX + 'syslog',
  ELASTIC_SYSLOG_REPORT:
    elasticURL + process.env.ELASTIC_INDEX_PREFIX + 'syslog/report',
  ELASTIC_NETFLOW_MAIN_CONTEXT:
    elasticURL + process.env.ELASTIC_INDEX_PREFIX + 'netflow',
  ELASTIC_NETFLOW_REPORT:
    elasticURL + process.env.ELASTIC_INDEX_PREFIX + 'netflow/report',
  ELASTIC_TEST_PATH:
    elasticURL + process.env.ELASTIC_INDEX_PREFIX + 'test/test/',
  ELASTIC_BULK: elasticURL + process.env.ELASTIC_INDEX_PREFIX + '{0}/{1}/_bulk',
  ELASTIC_DELETE_BY_QUERY:
    elasticURL + process.env.ELASTIC_INDEX_PREFIX + '{0}/{1}/_delete_by_query',
  VOUCHER_TEMPLATE_PATH: templatesPath + 'memberPrintTemplate.dust.html',
  SCRIPTS: {
    MIKROTIK_DYNAMIC_IP_SCRIPT:
      setup_script_path + 'mikrotik_dynamicip_setup.sh',
    MIKROTIK_SETUP_SCRIPT: setup_script_path + 'mikrotik_setup.sh',
    MIKROTIK_HOTSPOT_PAGES: [
      {
        path: mikrotik_hotspot_script_path + '/alogin.html',
        name: 'alogin.html'
      },
      {
        path: mikrotik_hotspot_script_path + '/fstatus.html',
        name: 'fstatus.html'
      },
      {
        path: mikrotik_hotspot_script_path + '/login.html',
        name: 'login.html'
      },
      {
        path: mikrotik_hotspot_script_path + '/logout.html',
        name: 'logout.html'
      },
      {
        path: mikrotik_hotspot_script_path + '/redirect.html',
        name: 'redirect.html'
      },
      {
        path: mikrotik_hotspot_script_path + '/rlogin.html',
        name: 'rlogin.html'
      },
      {
        path: mikrotik_hotspot_script_path + '/rstatus.html',
        name: 'rstatus.html'
      },
      {
        path: mikrotik_hotspot_script_path + '/status.html',
        name: 'status.html'
      }
    ]
  },
  RADIUS_IP: process.env.RADIUS_IP,
  SECOND_RADIUS_IP: process.env.SECOND_RADIUS_IP,
  RADIUS_ACC_PORT: process.env.RADIUS_ACC_PORT,
  RADIUS_AUTH_PORT: process.env.RADIUS_AUTH_PORT,
  ROUTER_TYPE: {
    MIKROTIK: 'mikrotik',
    COOVACHILLI: 'coovachilli',
    ENGENIUS: 'engenius'
  },
  MIN_WALKBY_TIME_DEFAULT: 3, // MINUTES
  MAX_WALKBY_TIME_DEFAULT: 6, // MINUTES
  MIN_VISIT_TIME_DEFAULT: 10, // MINUTES
  MAX_VISIT_TIME_DEFAULT: 60, // MINUTES
  TIME_ZONE_DEFAULT: {
    name: 'Iran Standard Time',
    abbr: 'IDT',
    offset: 4.5,
    isdst: true,
    text: '(UTC+03:30) Tehran',
    utc: ['Asia/Tehran']
  },
  ACCOUNTING_DC_THRESHHOLD: 100000000,
  DEFAULT_MEMBER_SESSION_EXPIRE_IN_SECONDS:
    DEFAULT_ACCOUNTING_UPDATE_INTERVAL_SECONDS + 10,
  NAS_STATUS_CHECK_IN_SECONDS: 60 * 10,
  DEFAULT_ACCOUNTING_UPDATE_INTERVAL_SECONDS: DEFAULT_ACCOUNTING_UPDATE_INTERVAL_SECONDS,
  FAST_ACCOUNTING_UPDATE_INTERVAL_SECONDS: FAST_ACCOUNTING_UPDATE_INTERVAL_SECONDS,
  MAX_VERIFICATION_COUNT: 5,
  MIN_REQUIRED_SMS_CREDIT: 100,
  DEFAULT_THEME_ID: 'alpha',
  DEFAULT_THEME_CONFIG: {
    alpha: {
      style: hotspotTemplates['alpha'].styles[0].id,
      showLogo: true,
      logo: {},
      background: {},
      isMultiLanguage: false,
      showPinCode: false,
      showTelegram: false,
      showInstagram: false,
      verificationMethod: 'mobile',
      formConfig: hotspotTemplates['alpha'].formConfig
    }
  },
  HOTEL_THEME_ID: 'hotel',
  PREVIOUS_HOTEL_THEME_ID: 'hotelTheme',
  PREVIOUS_DEFAULT_THEME_ID: 'defaultTheme',
  PUPLIC_INTERNET_PLAN: 'public',
  DEFAULT_ALLOWED_ONLINE_USERS: Number(process.env.ALLOWED_ONLINE_USERS) || 120,
  SERVICES: {
    RESELLERS_COMMISSION_RATE: 30 / 100,
    packages: [
      {
        id: 'demo',
        active: false,
        packageDesc: 'بسته آزمایشی',
        title: '۱ ماهه',
        price: 0,
        discount: 0,
        durationInDays: 15,
        service: {
          allowedOnlineUsers: 120
        },
        modules: {
          sms: {
            id: 'sms',
            title: 'ماژول پیامک'
          },
          log: {
            id: 'log',
            title: 'ثبت لاگ وب سایت و آی پی'
          }
        }
      },
      {
        id: 'economic',
        active: true,
        buyDisabled: false,
        oneTime: false,
        packageDesc: 'اشتراک ۳ ماهه',
        title: '۳ ماهه',
        price: 75000 * 3,
        discount: 0,
        duration: 3,
        buyMethod: 'pay',
        durationTitle: 'تومان/ ۳ ماهه',
        discountDesc: '۲۰٪ تخفیف',
        service: {
          allowedOnlineUsers: 120,
          features: [
            { title: 'قابلیت ثبت نامحدود کاربر' },
            { title: ' کابر آنلاین همزمان، ۱۲۰ کلاینت' },
            { title: 'اتصال به درگاه پرداخت مستقل' },
            { title: 'پنل مستقل کاربران' },
            { title: 'پشتیبانی از طریق تیکت' }
          ]
        },
        modules: {
          sms: {
            title: 'ارسال پیامک',
            features: [
              { title: 'ارسال پیامک تایید هویت' },
              { title: 'ارسال پیامک انبوه به کاربران' },
              { title: 'هزینه هر یک پیامک ۱۳ تومان' }
            ]
          },
          log: {
            title: 'ثبت لاگ وب سایت و آی پی',
            features: [
              { title: 'ثبت لاگ بر اساس آی پی و پورت' },
              { title: 'ثبت لاگ بازدید وب سایت' }
            ]
          },
          support: {
            title: 'پشتیبانی',
            features: [{ title: 'پشتیبانی از طریق تیکت' }]
          }
        }
      },
      {
        id: 'economic12',
        active: false,
        buyDisabled: false,
        oneTime: false,
        buyMethod: 'pay',
        durationTitle: 'تومان/ سالیانه',
        packageDesc: 'اشتراک سالیانه',
        title: '۱۲ ماهه',
        price: 75000 * 12,
        discount: 0,
        duration: 12,
        service: {
          allowedOnlineUsers: 120,
          features: [
            { title: 'قابلیت ثبت نامحدود کاربر' },
            { title: ' کابر آنلاین همزمان، ۱۲۰ کلاینت' },
            { title: 'اتصال به درگاه پرداخت مستقل' },
            { title: 'پنل مستقل کاربران' },
            { title: 'پشتیبانی از طریق تیکت' }
          ]
        },
        modules: {
          sms: {
            title: 'ارسال پیامک',
            features: [
              { title: 'ارسال پیامک تایید هویت' },
              { title: 'ارسال پیامک انبوه به کاربران' },
              { title: 'هزینه هر یک پیامک ۱۳ تومان' }
            ]
          },
          log: {
            title: 'ثبت لاگ وب سایت و آی پی',
            features: [
              { title: 'ثبت لاگ بر اساس آی پی و پورت' },
              { title: 'ثبت لاگ بازدید وب سایت' }
            ]
          },
          support: {
            title: 'پشتیبانی',
            features: [{ title: 'پشتیبانی از طریق تیکت' }]
          }
        }
      }
    ],
    features: [
      {
        title: 'کاربران آنلاین همزمان',
        desc: 'تعداد کاربرانی که میتوانند به صورت همزمان آنلاین شوند.',
        type: 'number',
        monthly: 120,
        semiAnnually: 120,
        annually: 120
      },
      {
        title: 'تعداد کاربران قابل ثبت',
        desc: 'تعداد کاربرانی که میتوانند در سامانه ثبت شوند',
        monthly: 'نامحدود',
        semiAnnually: 'نامحدود',
        annually: 'نامحدود',
        type: 'string'
      },
      {
        title: 'تعداد لاگ آی پی قابل ثبت',
        desc: 'تعداد لاگ هایی که در دراپ باکس شما ذخیره می شوند',
        monthly: 'نامحدود',
        semiAnnually: 'نامحدود',
        annually: 'نامحدود',
        type: 'string'
      },
      {
        title: 'قیمت هر پیامک',
        annually: 13,
        monthly: 13,
        semiAnnually: 13,
        type: 'price',
        desc: ''
      },

      {
        title: 'پشیبانی از طریق تیکت',
        annually: true,
        monthly: true,
        semiAnnually: true,
        type: 'boolean',
        desc: 'با ارسال تیکت‌ میتوانید از کمک کارشناسان فنی ما بهره‌مند شوید'
      },
      {
        title: 'مدیریت مصرف اینترنت',
        desc:
          'با استفاده از تعریف پلن‌های ماهانه و روزانه میتوان بر روی حجم، مدت زمان، و سرعت کاربر محدودیت اعمال کرد',
        type: 'boolean',
        monthly: true,
        semiAnnually: true,
        annually: true
      },
      {
        title: 'پنل مستقل برای ورود کاربران',
        annually: true,
        monthly: true,
        semiAnnually: true,
        type: 'boolean',
        desc:
          'کاربران میتوانند با نام کاربری و رمز عبور خود به پنل لاگین کنند و میزان مصرف خود را مشاهده کنند.'
      },
      {
        title: 'تغییر لوگو و فرم عضویت در صفحات هات‌اسپات',
        desc:
          'با استفاده از این امکان میتوانید لوگوی صفحه‌های هات‌اسپات را از طریق پنل کاربری به لوگوی مورد نظر خودتان تغییر دهید و فرم عضویت کاربران در هات اسپات را تغییر دهید و اطلاعات مورد نظر خود را مانند تاریخ تولد از کاربر دریافت کنید.',
        monthly: true,
        semiAnnually: true,
        annually: true,
        type: 'boolean'
      },
      {
        title: 'تایید هویت کاربر هات‌اسپات با پیامک و بدون فیلتر شدن',
        desc:
          'این پیامک‌ها به دلیل ارسال از طریق خطوط خدماتی، فیلتر نمی‌شوند و تا ۹۹٪ مواقع خیلی سریع به گوشی کاربر می‌رسند.',
        monthly: true,
        semiAnnually: true,
        annually: true,
        type: 'boolean'
      },
      {
        title: 'تایید هویت کاربر هات‌اسپات با تماس تلفنی خودکار',
        desc: 'کد تایید با یک تماس تلفنی خودکار به موبایل کاربر ارسال می‌شود.',
        monthly: true,
        semiAnnually: true,
        annually: true,
        type: 'boolean'
      },
      {
        title: 'دانلود شماره موبایل‌های مشتریان و ارسال پیامک تبلیغاتی',
        monthly: true,
        semiAnnually: true,
        annually: true,
        type: 'boolean',
        desc:
          'با استفاده از این امکان می‌توانید پروفایل مشتریان را دانلود کنید یا برای آنها پیامک‌های تبلیغاتی ارسال کنید.'
      },
      {
        title: 'متن انتهای پیامک',
        monthly: true,
        semiAnnually: true,
        annually: true,
        type: 'boolean',
        desc:
          'با استفاده از این امکان میتوانید متن انتهای پیامک (از طرف...) را به نام مورد نظر خودتان تغییر دهید.'
      }
    ]
  },
  RESELLERS_TARIFFS: [
    { from: 0, to: 1, free: 0, silver: 30000, gold: 50000, whiteLabel: 10000 },
    { from: 2, to: 5, free: 0, silver: 25000, gold: 40000, whiteLabel: 10000 },
    {
      from: 6,
      to: 100,
      free: 0,
      silver: 20000,
      gold: 30000,
      whiteLabel: 10000
    }
  ],
  DEFAULT_HOTSPOT_HELP:
    'برای اتصال به اینترنت، به شبکه وای فای متصل شوید. سپس با مرورگر کروم به سایت wifi.ir وارد شوید. پس از باز شدن صفحه با نام کاربری و رمز زیر به هات اسپات لاگین کنید.',
  ENABLE_SENTRY: process.env.ENABLE_SENTRY === 'false',
  SENTRY_RELEASE_TOKEN: process.env.SENTRY_RELEASE_TOKEN,
  SENTRY_URL: process.env.SENTRY_URL,
  ENABLE_DASHBOARD_SENTRY: process.env.ENABLE_DASHBOARD_SENTRY === 'true',
  SENTRY_DASHBOARD_RELEASE_TOKEN: process.env.SENTRY_DASHBOARD_RELEASE_TOKEN,
  SENTRY_DASHBOARD_URL: process.env.SENTRY_DASHBOARD_URL,
  DEFAULT_SENTRY_URL: 'http://api.hotspotplus.ir/5',
  ADMIN_OWNER_ID: 'Admin',
  PERCENT_UNIT: 'percent',
  TOMAN_UNIT: 'toman',
  PERSIAN_COUPON_MESSAGE: 'کد تخفیف شما: {0} \n ارزش: {1} {2}',
  PERSIAN_TOMAN_UNIT: 'تومان',
  PERSIAN_PERCENT_UNIT: 'درصد',
  ELASTIC_TYPE_USAGEREPORT: 'usagereport',
  ELASTIC_INDEX_ACCOUNTING: 'accounting',

  /**
   * @return {string}
   */
  BUSINESS_PAYMENT_RETURN_URL: function() {
    return (
      process.env.CALCULATED_EXTERNAL_API_ADDRESS +
      '/api/payment/business/return?{0}={1}'
    );
  },
  /**
   * @return {string}
   */
  EXTERNAL_PAYMENT_RETURN_URL: function() {
    return (
      process.env.CALCULATED_EXTERNAL_API_ADDRESS +
      '/api/payment/external/return?{0}={1}'
    );
  },
  /**
   * @return {string}
   */
  CHARGE_PAYMENT_RETURN_URL: function() {
    return (
      process.env.CALCULATED_EXTERNAL_API_ADDRESS +
      '/api/payment/charge/return?{0}={1}'
    );
  },
  /**
   * @return {string}
   */
  LOCAL_PAYMENT_RETURN_URL: function() {
    return (
      process.env.CALCULATED_EXTERNAL_API_ADDRESS +
      '/api/payment/local/return?{0}={1}'
    );
  },
  /**
   * @return {string}
   */
  MEMBER_PAYMENT_RETURN_URL: function() {
    return (
      process.env.CALCULATED_EXTERNAL_API_ADDRESS +
      '/api/payment/member/return?{0}={1}'
    );
  },
  /**
   * @return {string}
   */
  DROPBOX_REST_API: function() {
    return process.env.CALCULATED_EXTERNAL_API_ADDRESS + '/api/dropBox';
  },

  /**
   * @return {string}
   */
  BUY_LOCAL_SMS_CHARGE_RETURN: function() {
    return (
      process.env.CALCULATED_WEB_APP_ADDRESS +
      mainPath +
      '#/app/loading?payed={0}&desc={1}&license_updated=true'
    );
  },
  /**
   * @return {string}
   */
  BUY_LOCAL_PACKAGE_RETURN: function() {
    return (
      process.env.CALCULATED_WEB_APP_ADDRESS +
      mainPath +
      '#/app/loading?payed={0}&desc={1}&license_updated=true'
    );
  },
  /**
   * @return {string}
   */
  BUSINESS_PAYMENT_RESULT_URL: function() {
    return (
      process.env.CALCULATED_WEB_APP_ADDRESS +
      mainPath +
      '#/app/loading?payed={0}{1}'
    );
  },
  /**
   * @return {string}
   */
  LOCAL_PAYMENT_RESULT_URL: function() {
    return (
      process.env.CALCULATED_WEB_APP_ADDRESS +
      mainPath +
      '#/access/public/local'
    );
  },
  /**
   * @return {string}
   */
  MEMBER_PAYMENT_RESULT_URL: function() {
    return (
      process.env.CALCULATED_WEB_APP_ADDRESS +
      mainPath +
      '#/app/loading?payed={0}{1}'
    );
  },
  /**
   * @return {string}
   */
  DROPBOX_AUTHORISE_RESULT_URL: function() {
    return (
      process.env.CALCULATED_WEB_APP_ADDRESS +
      mainPath +
      '#/app/loading?dropbox={0}{1}'
    );
  },
  /**
   * @return {string}
   */
  HOTSPOT_PAYMENT_RETURN_URL: function() {
    return (
      process.env.CALCULATED_HOTSPOT_ADDRESS +
      '/api/payment/hotspot/return?{0}={1}&password={password}&username={username}&businessId={businessId}&nasId={nasId}&host={host}&memberId={memberId}'
    );
  },
  /**
   * @return {string}
   */
  HOTSPOT_PAYMENT_WEB_RETURN_URL: function() {
    return process.env.CALCULATED_HOTSPOT_ADDRESS + '/#!/home.html?{0}';
  },
  /**
   * @return {string}
   */
  HOTSPOT_VERIFICATION_URL: function() {
    return (
      process.env.CALCULATED_HOTSPOT_ADDRESS +
      '/#!/home.html?businessId={businessId}&nasId={nasId}&host={host}&verificationCode={verificationCode}&memberId={memberId}'
    );
  },
  /**
   * @return {string}
   */
  HOTSPOT_SIGNIN_URL: function() {
    return (
      process.env.CALCULATED_HOTSPOT_ADDRESS +
      '/#!/home.html?businessId={businessId}&nasId={nasId}&host={host}&username={username}&password={password}&memberId={memberId}'
    );
  },
  /**
   * @return {string}
   */
  SHORTNER_URL: function() {
    return process.env.CALCULATED_HOTSPOT_ADDRESS + '/a/';
  },
  /**
   * @return {string}
   */
  DROPBOX_APP_KEY: function() {
    return process.env.DROPBOX_APP_KEY;
  },
  /**
   * @return {string}
   */
  DROPBOX_APP_SECRET: function() {
    return process.env.DROPBOX_APP_SECRET;
  },
  LOG_WORKER_QUEUE: 'log-worker'
};
