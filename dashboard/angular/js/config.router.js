'use strict';

/**
 * Config for the router
 */
angular.module('app').run([
  '$rootScope',
  '$state',
  '$stateParams',
  function($rootScope, $state, $stateParams) {
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;
  },
]);

app.config([
  '$stateProvider',
  '$urlRouterProvider',
  'JQ_CONFIG',
  'MODULE_CONFIG',
  function($stateProvider, $urlRouterProvider, JQ_CONFIG, MODULE_CONFIG) {
    var PREFIX = (Window.PREFIX = '/src/');
    var TEMPLATE_PREFIX = (Window.TEMPLATE_PREFIX = '/src/');
    if (Window.appStatus === 'production' || Window.appStatus === 'sandbox') {
      PREFIX = Window.PREFIX = '/';
      TEMPLATE_PREFIX = Window.TEMPLATE_PREFIX = '';
    }
    app.constant('PREFIX', Window.PREFIX);
    app.constant('TEMPLATE_PREFIX', Window.TEMPLATE_PREFIX);

    var layout = 'tpl/app.html';
    $urlRouterProvider.otherwise('/app/loading');
    $stateProvider
      .state('app', {
        abstract: true,
        url: '/app',
        templateUrl: layout,
        resolve: load([]),
      })
      .state('app.networkAdminDashboard', {
        url: '/networkAdminDashboard',
        templateUrl:
          TEMPLATE_PREFIX + 'app/business/tpl/app_dashboard_networkAdmin.html',
        resolve: load([
          'moment',
          'chart.js',
          'ui.bootstrap.persian.datepicker',
          'ui.grid',
          'ui.grid.pagination',
          'ui.grid.selection',
          PREFIX + 'app/dashboard/dashboard.js',
          PREFIX + 'app/widgets/datePickerMonthly/datePickerMonthly.js',
          PREFIX + 'app/widgets/remainingCredit/remainingCredit.js',
          PREFIX + 'app/widgets/serviceStatus/serviceStatus.js',
          PREFIX + 'app/widgets/datePickerAdvance/datePickerAdvance.js',
          PREFIX + 'app/widgets/trafficUsage/trafficUsage.js',
          PREFIX + 'app/widgets/sessionsReport/sessionsReport.js',
          PREFIX + 'app/widgets/sessionsCount/sessionsCount.js',
          PREFIX + 'app/widgets/usageReport/usageReport.js',
          PREFIX + 'app/widgets/memberCount/memberCount.js',
          PREFIX + 'app/widgets/reportStatus/reportStatus.js',
          PREFIX + 'app/widgets/membersReport/membersReport.js',
          PREFIX + 'app/widgets/topMembers/topMembers.js',
          PREFIX + 'app/widgets/loading.js',
        ]),
      })
      .state('app.purchaseSubscription', {
        url: '/purchaseSubscription',
        controller: 'purchaseSubscriptionController',
        templateUrl:
          TEMPLATE_PREFIX + 'app/subscription/tpl/subscriptionPackages.html',
        resolve: load([PREFIX + 'app/subscription/purchaseSubscription.js']),
      })
      .state('app.loadDashboard', {
        url: '/loading',
        controller: 'loadDashboardController',
        template:
          '<div class="row wrapper-lg text-center" style="margin-top: 200px"><i class="fa fa-circle-o-notch fa-spin fa-5x"></i></div>',
        resolve: load([PREFIX + 'app/common/loadDashboard.js']),
      })
      .state('app.packages', {
        url: '/packages',
        controller: 'subscriptionPackages',
        templateUrl: TEMPLATE_PREFIX + 'app/package/tpl/buyLocalPackage.html',
        resolve: load([PREFIX + 'app/package/buyLocalPackage.js']),
      })
      .state('app.coupons', {
        url: '/coupons',
        templateUrl: TEMPLATE_PREFIX + 'app/coupon/tpl/couponList.html',
        resolve: load([
          'ui.grid',
          'ui.grid.pagination',
          'ui.grid.selection',
          'ui.bootstrap.persian.datepicker',
          PREFIX + 'app/coupon/couponList.js',
        ]),
      })
      .state('app.tickets', {
        url: '/tickets',
        templateUrl: TEMPLATE_PREFIX + 'app/ticket/tpl/ticketList.html',
        resolve: load([
          'ui.grid',
          'ui.grid.pagination',
          'ui.grid.selection',
          PREFIX + 'app/ticket/ticketList.js',
        ]),
      })
      .state('app.ticketDetails', {
        url: '/tickets/:ticketId',
        templateUrl: TEMPLATE_PREFIX + 'app/ticket/tpl/ticketDetails.html',
        resolve: load([
          'ui.grid',
          'ui.grid.pagination',
          'ui.grid.selection',
          PREFIX + 'app/ticket/ticketDetails.js',
        ]),
      })
      .state('app.campaigns', {
        url: '/campaigns',
        templateUrl: TEMPLATE_PREFIX + 'app/campaign/tpl/campaignList.html',
        resolve: load([
          'ui.grid',
          'ui.grid.pagination',
          'ui.grid.selection',
          'moment',
          'ui.bootstrap.persian.datepicker',
          'mgo-angular-wizard',
          'ui.grid.resizeColumns',
          PREFIX + 'app/campaign/campaignList.js',
          PREFIX + 'app/campaign/campaignService.js',
        ]),
      })
      .state('app.businesses', {
        url: '/businesses',
        templateUrl: TEMPLATE_PREFIX + 'app/business/tpl/businessesList.html',
        resolve: load([
          'ui.grid',
          'ui.grid.pagination',
          'ui.grid.selection',
          'ui.bootstrap.persian.datepicker',
          'ui.grid.resizeColumns',
          PREFIX + 'app/business/businessList.js',
        ]),
      })
      .state('app.resellers', {
        url: '/resellers',
        templateUrl: TEMPLATE_PREFIX + 'app/reseller/tpl/resellerList.html',
        resolve: load([
          'ui.grid',
          'ui.grid.pagination',
          'ui.grid.selection',
          'ui.bootstrap.persian.datepicker',
          'ui.grid.resizeColumns',
          PREFIX + 'app/reseller/resellerList.js',
        ]),
      })
      .state('app.resellersPackages', {
        url: '/resellersPackages',
        templateUrl: TEMPLATE_PREFIX + 'app/reseller/tpl/resellerPackages.html',
        resolve: load([PREFIX + 'app/reseller/resellerPackages.js']),
      })
      .state('app.resellerBusinessList', {
        url: '/businessList',
        templateUrl:
          TEMPLATE_PREFIX + 'app/reseller/tpl/resellerBusinessList.html',
        resolve: load([
          'ui.grid',
          'ui.grid.pagination',
          'ui.grid.selection',
          'ui.bootstrap.persian.datepicker',
          'ui.grid.resizeColumns',
          PREFIX + 'app/reseller/resellerBusinessList.js',
        ]),
      })
      .state('app.businessSettings', {
        url: '/businessSettings',
        templateUrl: TEMPLATE_PREFIX + 'app/business/tpl/businessSettings.html',
        resolve: load([
          'moment',
          'ui.bootstrap.persian.datepicker',
          'angularFileUpload',
          PREFIX + 'app/business/businessSettings.js',
          PREFIX + 'app/business/passwordVerify.js',
        ]),
      })
      .state('app.hotspotThemes', {
        url: '/hotspotThemes',
        templateUrl: TEMPLATE_PREFIX + 'app/theme/tpl/hotspotThemes.html',
        resolve: load([
          'moment',
          'ui.bootstrap.persian.datepicker',
          'angularFileUpload',
          PREFIX + 'app/theme/hotspotThemes.js',
        ]),
      })
      .state('app.customers', {
        url: '/customers',
        templateUrl: TEMPLATE_PREFIX + 'app/customer/tpl/customerList.html',
        resolve: load([
          'ui.grid',
          'ui.grid.pagination',
          'ui.grid.selection',
          'ui.grid.resizeColumns',
          PREFIX + 'app/customer/customerList.js',
        ]),
      })
      .state('app.nases', {
        url: '/nas',
        templateUrl: TEMPLATE_PREFIX + 'app/nas/tpl/nasList.html',
        resolve: load([
          'ui.grid',
          'oi.select',
          'ui.grid.pagination',
          'ui.grid.selection',
          'ui.grid.resizeColumns',
          PREFIX + 'app/nas/nasList.js',
        ]),
      })
      .state('app.departments', {
        url: '/departments',
        templateUrl: TEMPLATE_PREFIX + 'app/department/tpl/departmentList.html',
        resolve: load([
          'ui.grid',
          'ui.grid.pagination',
          'ui.grid.selection',
          'ui.grid.resizeColumns',
          PREFIX + 'app/department/departmentList.js',
        ]),
      })
      .state('app.wifi', {
        url: '/wifi',
        templateUrl: TEMPLATE_PREFIX + 'app/wifi/tpl/wifiSettings.html',
        resolve: load([
          'ui.grid',
          'ui.grid.pagination',
          'ui.grid.selection',
          PREFIX + 'app/wifi/wifiSettings.js',
        ]),
      })
      .state('app.internetPlans', {
        url: '/internetPlans',
        templateUrl:
          TEMPLATE_PREFIX + 'app/internetPlan/tpl/internetPlanList.html',
        resolve: load([
          'ui.grid',
          'ui.grid.pagination',
          'ui.grid.selection',
          'ui.grid.resizeColumns',
          PREFIX + 'app/internetPlan/internetPlanList.js',
        ]),
      })
      .state('app.members', {
        url: '/member',
        templateUrl: TEMPLATE_PREFIX + 'app/member/tpl/memberList.html',
        resolve: load([
          'ui.grid',
          'ui.grid.pagination',
          'ui.grid.selection',
          'oi.select',
          'ui.grid.resizeColumns',
          'ui.bootstrap.persian.datepicker',
          PREFIX + 'app/member/memberList.js',
          PREFIX + 'app/member/planHistoryList.js',
        ]),
      })
      .state('app.operators', {
        url: '/operator',
        templateUrl: TEMPLATE_PREFIX + 'app/operator/tpl/operatorList.html',
        resolve: load([
          'ui.grid',
          'ui.grid.pagination',
          'ui.grid.selection',
          'ui.grid.resizeColumns',
          'oi.select',
          PREFIX + 'app/operator/operatorList.js'
        ]),
      })
        .state('app.netflowReports', {
        url: '/report/netflow',
        templateUrl: TEMPLATE_PREFIX + 'app/report/tpl/netflowReport.html',
        resolve: load([
          'ui.grid',
          'ui.grid.pagination',
          'ui.grid.selection',
          'ui.grid.resizeColumns',
          'ui.bootstrap.persian.datepicker',
          'oi.select',
          PREFIX + 'app/report/netflowReport.js'
        ]),
      })
        .state('app.dnsReports', {
        url: '/report/dns',
        templateUrl: TEMPLATE_PREFIX + 'app/report/tpl/dnsReport.html',
        resolve: load([
          'ui.grid',
          'ui.grid.pagination',
          'ui.grid.selection',
          'ui.grid.resizeColumns',
          'ui.bootstrap.persian.datepicker',
          'oi.select',
          PREFIX + 'app/report/dnsReport.js'
        ]),
      })
        .state('app.webproxyReports', {
        url: '/report/webproxy',
        templateUrl: TEMPLATE_PREFIX + 'app/report/tpl/webproxyReport.html',
        resolve: load([
          'ui.grid',
          'ui.grid.pagination',
          'ui.grid.selection',
          'ui.grid.resizeColumns',
          'ui.bootstrap.persian.datepicker',
          'oi.select',
          PREFIX + 'app/report/webproxyReport.js'
        ]),
      })
      .state('access.signUp', {
        url: '/signup',
        templateUrl: TEMPLATE_PREFIX + 'app/business/tpl/signUp.html',
        resolve: load([PREFIX + 'app/business/auth.js']),
      })
      .state('access.createLocalLicense', {
        url: '/license',
        templateUrl: TEMPLATE_PREFIX + 'app/business/tpl/createLicense.html',
        resolve: load([PREFIX + 'app/business/lc.js']),
      })
      .state('access.signIn', {
        url: '/signin',
        templateUrl: TEMPLATE_PREFIX + 'app/business/tpl/signIn.html',
        resolve: load([PREFIX + 'app/business/auth.js']),
      })
      .state('access.operatorSignIn', {
        url: '/operator/:name/signin',
        templateUrl: TEMPLATE_PREFIX + 'app/operator/tpl/signIn.html',
        resolve: load([PREFIX + 'app/operator/auth.js']),
      })
      .state('access.publicCustomizeService', {
        url: '/public/customizeService',
        templateUrl:
          TEMPLATE_PREFIX + 'app/business/tpl/publicCustomizeService.html',
        resolve: load([
          'vr.directives.slider',
          PREFIX + 'app/widgets/customizeService/customizeService.js',
        ]),
      })
      .state('access.adminSignIn', {
        url: '/public/admin/signin',
        templateUrl: TEMPLATE_PREFIX + 'app/admin/tpl/signIn.html',
        resolve: load([PREFIX + 'app/admin/auth.js']),
      })
      .state('access.resellerSignUp', {
        url: '/public/reseller/signup',
        templateUrl: TEMPLATE_PREFIX + 'app/reseller/tpl/signUp.html',
        resolve: load([PREFIX + 'app/reseller/auth.js']),
      })
      .state('access.resellerSignIn', {
        url: '/public/reseller/signin',
        templateUrl: TEMPLATE_PREFIX + 'app/reseller/tpl/signIn.html',
        resolve: load([PREFIX + 'app/reseller/auth.js']),
      })
      .state('app.netflowReport', {
        url: '/ipReport',
        templateUrl: TEMPLATE_PREFIX + 'app/report/tpl/netflowReportList.html',
        resolve: load([
          'ui.grid',
          'ui.grid.pagination',
          'ui.grid.selection',
          'ui.bootstrap.persian.datepicker',
          'ui.grid.resizeColumns',
          PREFIX + 'app/report/netflowReport.js',
        ]),
      })
      .state('app.syslogReport', {
        url: '/urlReport',
        templateUrl: TEMPLATE_PREFIX + 'app/report/tpl/syslogReportsList.html',
        resolve: load([
          'ui.grid',
          'ui.grid.pagination',
          'ui.grid.selection',
          'ui.bootstrap.persian.datepicker',
          'ui.grid.resizeColumns',
          PREFIX + 'app/report/syslogReport.js',
        ]),
      })
      .state('app.memberDashboard', {
        url: '/memberDashboard',
        templateUrl:
          TEMPLATE_PREFIX + 'app/member/tpl/app_dashboard_member.html',
        resolve: load([
          'moment',
          'chart.js',
          'ui.bootstrap.persian.datepicker',
          PREFIX + 'app/member/dashboard.js',
          PREFIX + 'app/widgets/planInfo/planInfo.js',
          PREFIX + 'app/widgets/remainBulk/remainBulk.js',
          PREFIX + 'app/widgets/remainTime/remainTime.js',
          PREFIX + 'app/widgets/memberUsage/usageChart.js',
        ]),
      })
      .state('access.memberSignIn', {
        url: '/public/:name',
        templateUrl: TEMPLATE_PREFIX + 'app/member/tpl/hotspot/signIn.html',
        resolve: load([PREFIX + 'app/member/auth.js']),
      })
      // others
      .state('access', {
        url: '/access',
        template: '<div ui-view class="fade-in-right-big smooth"></div>',
      })
      .state('access.forgotpwd', {
        url: '/forgotpwd',
        templateUrl: 'tpl/page_forgotpwd.html',
      })
      .state('access.404', {
        url: '/404',
        templateUrl: 'tpl/page_404.html',
      });

    function load(srcs, callback) {
      return {
        deps: [
          '$ocLazyLoad',
          '$q',
          function($ocLazyLoad, $q) {
            var deferred = $q.defer();
            var promise = false;
            srcs = angular.isArray(srcs) ? srcs : srcs.split(/\s+/);
            if (!promise) {
              promise = deferred.promise;
            }
            angular.forEach(srcs, function(src) {
              promise = promise.then(function() {
                if (JQ_CONFIG[src]) {
                  return $ocLazyLoad.load(JQ_CONFIG[src]);
                }
                var name;
                angular.forEach(MODULE_CONFIG, function(module) {
                  if (module.name == src) {
                    name = module.name;
                  } else {
                    name = src;
                  }
                });
                return $ocLazyLoad.load(name);
              });
            });
            deferred.resolve();
            return callback
              ? promise.then(function() {
                  return callback();
                })
              : promise;
          },
        ],
      };
    }
  },
]);
