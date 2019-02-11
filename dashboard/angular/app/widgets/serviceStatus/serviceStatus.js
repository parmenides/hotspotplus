/**
 * Created by rezanazari on 10/6/16.
 */
app.directive('serviceStatus', [
  'PREFIX',
  'Business',
  '$log',
  'Session',
  'ClientSession',
  'translateNumberFilter',
  '$rootScope',
  'appMessenger',
  function(
    PREFIX,
    Business,
    $log,
    Session,
    ClientSession,
    translateNumberFilter,
    $rootScope,
    appMessenger
  ) {
    return {
      scope: {
        params: '=options'
      },

      controller: function($scope) {
        $scope.loading = false;
        loadService();
        $scope.$on($scope.params.reloadEvent, function(event, data) {
          $scope.params.fromDate = data.params.fromDate;
          $scope.params.endDate = data.params.endDate;
          loadService();
        });

        $scope.allowedOnlineUsers = 0;
        $scope.currentOnlineUsers = 0;
        $scope.accountingServiceStatus = 'disabled';
        $scope.accountingRemainingDays = 0;
        $scope.smsModulesStatus = 'disabled';
        $scope.smsRemainingDays = 0;
        $scope.logModulesStatus = 'disabled';
        $scope.logRemainingDays = 0;

        function loadService() {
          $scope.loading = true;
          var businessId = Session.business.id;
          Business.findById({ id: businessId }).$promise.then(
            function(res) {
              var currentService = res.services;
              var modules = res.modules;
              var now = new Date();
              $scope.allowedOnlineUsers = currentService.allowedOnlineUsers;
              if (now.getTime() > currentService.expiresAt) {
                $scope.accountingServiceStatus = 'expired';
              } else {
                $scope.accountingServiceStatus = 'disabled';
              }
              if ($rootScope.oneTimeLicense) {
                $scope.accountingChartOptions.options.elements.center.text =
                  '    فعال    ';
                $scope.accountingChartOptions.data = [100];
              } else {
                $scope.accountingRemainingDays = Math.round(
                  (currentService.expiresAt - now.getTime()) / 86400000
                );
                $scope.accountingTotalDays = Math.round(
                  (now.getTime() - currentService.subscriptionDate) / 86400000
                );
                $scope.accountingChartOptions.data = [
                  $scope.accountingRemainingDays,
                  $scope.accountingTotalDays
                ];
                $scope.accountingChartOptions.options.elements.center.text =
                  translateNumberFilter($scope.accountingRemainingDays) +
                  ' روز مانده';
                if ($scope.accountingRemainingDays <= 5) {
                  $scope.accountingChartOptions.colors = ['#f1c40f', '#ecf0f1'];
                }
              }

              if (modules.sms) {
                if ($rootScope.oneTimeLicense) {
                  $scope.smsModuleChartOptions.options.elements.center.text =
                    '    فعال    ';
                  $scope.smsModuleChartOptions.data = [100];
                } else {
                  $scope.smsRemainingDays = Math.round(
                    (modules.sms.expiresAt - now.getTime()) / 86400000
                  );
                  $scope.smsTotalDays = Math.round(
                    (now.getTime() - modules.sms.subscriptionDate) / 86400000
                  );
                  if ($scope.smsRemainingDays > 0) {
                    $scope.smsModuleChartOptions.data = [
                      $scope.smsRemainingDays,
                      $scope.smsTotalDays
                    ];
                    $scope.smsModuleChartOptions.options.elements.center.text =
                      translateNumberFilter($scope.smsRemainingDays) +
                      ' روز مانده';
                    if ($scope.smsRemainingDays <= 5) {
                      $scope.smsModuleChartOptions.colors = [
                        '#f1c40f',
                        '#ecf0f1'
                      ];
                    }
                  } else {
                    $scope.smsModuleChartOptions.data = [100];
                    $scope.smsModuleChartOptions.colors = ['#f1c40f'];
                    $scope.smsModuleChartOptions.options.elements.center.text =
                      'به اتمام رسیده';
                  }
                }
              }

              if (modules.log) {
                if ($rootScope.oneTimeLicense) {
                  $scope.logModuleChartOptions.options.elements.center.text =
                    '    فعال    ';
                  $scope.logModuleChartOptions.data = [100];
                } else {
                  $scope.logRemainingDays = Math.round(
                    (modules.log.expiresAt - now.getTime()) / 86400000
                  );
                  $scope.logTotalDays = Math.round(
                    (now.getTime() - modules.log.subscriptionDate) / 86400000
                  );
                  if ($scope.logRemainingDays > 0) {
                    $scope.logModuleChartOptions.data = [
                      $scope.logRemainingDays,
                      $scope.logTotalDays
                    ];
                    $scope.logModuleChartOptions.options.elements.center.text =
                      translateNumberFilter($scope.logRemainingDays) +
                      ' روز مانده';
                    if ($scope.logRemainingDays <= 5) {
                      $scope.logModuleChartOptions.colors = [
                        '#f1c40f',
                        '#ecf0f1'
                      ];
                    }
                  } else {
                    $scope.logModuleChartOptions.data = [100];
                    $scope.logModuleChartOptions.colors = ['#f1c40f'];
                    $scope.logModuleChartOptions.options.elements.center.text =
                      'به اتمام رسیده';
                  }
                }
              }
              $scope.loading = true;
              getSessionsCount();
            },
            function(error) {
              $log.error(error);
              appMessenger.showError('business.settingsLoadUnSuccessful');
            }
          );
        }

        function getSessionsCount() {
          $scope.loading = true;

          var session = {};
          session.businessId = $scope.params.businessId;
          ClientSession.getOnlineSessionCount({
            businessId: session.businessId
          }).$promise.then(
            function(result) {
              $scope.currentOnlineUsers = result.count;
              var remainingOnlineUsers =
                $scope.allowedOnlineUsers - $scope.currentOnlineUsers;
              $scope.onlineUsersChartOptions.data = [
                remainingOnlineUsers,
                $scope.currentOnlineUsers
              ];
              $scope.onlineUsersChartOptions.options.elements.center.text =
                translateNumberFilter($scope.currentOnlineUsers) +
                ' کاربر از ' +
                translateNumberFilter($scope.allowedOnlineUsers);
              $scope.loading = false;
              if (remainingOnlineUsers <= 10) {
                $scope.onlineUsersChartOptions.colors = ['#e67e22', '#ecf0f1'];
              }
            },
            function(error) {
              $log.error(error);
            }
          );
        }

        $scope.onlineUsersChartOptions = {
          colors: ['#23b7e5', '#ecf0f1'],
          data: [0, 100],
          labels: ['کابران آنلاین', 'کاربر باقی مانده'],
          options: {
            elements: {
              center: {
                text: '  غیر فعال  ',
                color: '#2c3e50', // Default is #000000
                fontStyle: 'IRANSans', // Default is Arial
                sidePadding: 10 // Defualt is 20 (as a percentage)
              }
            },
            title: {
              display: false,
              text: 'Custom Chart Title'
            },
            cutoutPercentage: 80,
            rotation: 0.5 * Math.PI,
            legend: {
              display: false,
              position: 'bottom',
              labels: {
                fontColor: 'rgb(255, 99, 132)'
              }
            }
          }
        };
        $scope.accountingChartOptions = {
          colors: ['#9b59b6', '#ecf0f1'],
          data: [0, 100],
          labels: ['روز گذشته', 'روز مانده'],
          options: {
            elements: {
              center: {
                text: '  غیر فعال  ',
                color: '#2c3e50', // Default is #000000
                fontStyle: 'IRANSans', // Default is Arial
                sidePadding: 20 // Defualt is 20 (as a percentage)
              }
            },
            title: {
              display: false,
              text: 'Custom Chart Title'
            },
            cutoutPercentage: 80,
            rotation: 0.5 * Math.PI,
            legend: {
              display: false,
              position: 'bottom',
              labels: {
                fontColor: 'rgb(255, 99, 132)'
              }
            }
          }
        };
        $scope.smsModuleChartOptions = {
          colors: ['#9b59b6', '#ecf0f1'],
          data: [0, 100],
          labels: ['روز گذشته', 'روز مانده'],
          options: {
            elements: {
              center: {
                text: '  غیر فعال  ',
                color: '#2c3e50', // Default is #000000
                fontStyle: 'IRANSans', // Default is Arial
                sidePadding: 20 // Defualt is 20 (as a percentage)
              }
            },
            title: {
              display: false,
              text: 'Custom Chart Title'
            },
            cutoutPercentage: 80,
            rotation: 0.5 * Math.PI,
            legend: {
              display: false,
              labels: {
                fontColor: 'rgb(255, 99, 132)'
              }
            }
          }
        };
        $scope.logModuleChartOptions = {
          colors: ['#9b59b6', '#ecf0f1'],
          data: [0, 100],
          labels: ['روز گذشته', 'روز مانده'],
          options: {
            elements: {
              center: {
                text: '  غیر فعال  ',
                color: '#2c3e50', // Default is #000000
                fontStyle: 'IRANSans', // Default is Arial
                sidePadding: 20 // Defualt is 20 (as a percentage)
              }
            },
            title: {
              display: false,
              text: 'Custom Chart Title'
            },
            cutoutPercentage: 80,
            rotation: 0.5 * Math.PI,
            legend: {
              display: false,
              labels: {
                fontColor: 'rgb(255, 99, 132)'
              }
            }
          }
        };
      },
      templateUrl: PREFIX + 'app/widgets/serviceStatus/tpl/serviceStatus.html'
    };
  }
]);
