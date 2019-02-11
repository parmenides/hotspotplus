/**
 * Created by hamidehnouri on 8/8/2016 AD.
 */

app.controller('businessSettings', [
  '$http',
  '$scope',
  '$log',
  '$state',
  'Business',
  'appMessenger',
  'genericService',
  'Session',
  'credit',
  'Charge',
  'englishNumberFilter',
  'translateNumberFilter',
  'Nas',
  'AclService',
  function(
    $http,
    $scope,
    $log,
    $state,
    Business,
    appMessenger,
    genericService,
    Session,
    credit,
    Charge,
    englishNumberFilter,
    translateNumberFilter,
    Nas,
    AclService
  ) {
    if (Session.business == null) {
      return;
    }
    var businessId = Session.business.id;
    $scope.urlHost = window.location.host;
    $scope.urlPath = '/#/access/public/';

    $scope.business = {};

    $scope.RADIUS_CONFIG = {};
    Nas.loadRadiusInfo().$promise.then(
      function(res) {
        $scope.RADIUS_CONFIG = res;
      },
      function(error) {
        appMessenger.showError('error.generalError');
      }
    );

    // load the business from the session
    Business.findById({ id: businessId }).$promise.then(
      function(business) {
        $scope.business = business;
        $scope.business.groupMemberHelps =
          $scope.business.groupMemberHelps || {};
        $scope.business.mobile = translateNumberFilter(business.mobile);
      },
      function(err) {
        appMessenger.showError('business.settingsLoadUnSuccessful');
      }
    );

    // load charges
    var startDate = new Date().setMonth(new Date().getMonth() - 1);
    Charge.loadCharges({
      businessId: businessId,
      startDate: startDate,
      skip: 0,
      limit: 1000
    }).$promise.then(
      function(res) {
        $scope.activities = [];
        angular.forEach(res.charges, function(value, index) {
          //response from elk has _source attribute
          $scope.activities[index] = value._source || value;
          /*if ( $scope.activities[ index ].forThe ) {
				 $scope.activities[ index ].forThe = $scope.activities[ index ].forThe.split ( ':' )
				 }*/
          if ($scope.activities[index].amount > 0) {
            $scope.activities[index].class = 'info';
            $scope.activities[index].icon = 'fa fa-arrow-up text-info';
            $scope.activities[index].forThe = 'increaseCharge';
          } else {
            $scope.activities[index].class = 'warning';
            $scope.activities[index].icon = 'fa fa-arrow-down text-warning';
            $scope.activities[index].forThe = 'decreaseCharge';
          }
        });
      },
      function(error) {
        appMessenger.showError('business.chargeLoadUnSuccessful');
        return error;
      }
    );

    Business.getBalance({ businessId: businessId }).$promise.then(
      function(res) {
        $scope.balance = res.balance;
      },
      function(error) {
        appMessenger.showError('business.balanceLoadUnSuccessful');
        return error;
      }
    );

    // get time zones from json
    $http.get('app/business/timeZones.json').then(function(res) {
      $scope.timeZones = res.data;
    });

    $scope.$watch('business.autoAssignInternetPlan', function(
      newValue,
      oldValue
    ) {
      if (
        newValue == true &&
        $scope.internetPlans &&
        $scope.internetPlans.length == 0
      ) {
        $scope.business.defaultInternetPlan = {};
        appMessenger.showWarning('member.pleaseCreateAnInternetPlan');
      }
    });

    // save the business settings
    $scope.save = function() {
      $scope.business.mobile = englishNumberFilter($scope.business.mobile);
      if ($scope.internetPlans && $scope.internetPlans.length == 0) {
        appMessenger.showWarning('business.autoAssignInternetPlanNotSaved');
        $scope.business.autoAssignInternetPlan = false;
      }
      if ($scope.business.autoAssignInternetPlan === false) {
        $scope.business.defaultInternetPlan = {};
      }
      Business.prototype$updateAttributes(
        { id: businessId },
        $scope.business
      ).$promise.then(
        function(res) {
          appMessenger.showSuccess('business.settingsUpdateSuccessful');
        },
        function(err) {
          appMessenger.showError('business.settingsUpdateUnSuccessful');
        }
      );
    };

    // change the business login password
    $scope.changePassword = function() {
      genericService.showPasswordForm({
        title: 'general.changePassword',
        cancelBtnLabel: 'general.cancel',
        saveBtnLabel: 'general.save',
        saveCallback: function(currentPassword, password) {
          var credential = {};
          credential.username = $scope.business.username;
          credential.password = currentPassword;
          Business.login(credential).$promise.then(
            function(result) {
              Business.prototype$updateAttributes(
                { id: businessId },
                { password: password }
              ).$promise.then(
                function(res) {
                  appMessenger.showSuccess('general.passwordChangeSuccessful');
                },
                function(err) {
                  appMessenger.showError('general.passwordChangeUnSuccessful');
                }
              );
            },
            function(errorResult) {
              $log.error(errorResult);
              appMessenger.showError('general.invalidPassword');
            }
          );
        }
      });
    };

    $scope.increaseCredit = function() {
      credit.showIncreaseCreditForm({
        title: 'business.smsCharge',
        cancelBtnLabel: 'general.cancel',
        submitBtnLabel: 'business.sendToBank',
        message: 'business.yourSMSCredit',
        balance: $scope.balance,
        description: 'smsCharge',
        chargedBy: 'business',
        businessId: businessId,
        saveCallback: function() {},
        cancelCallback: function() {}
      });
    };

    $scope.dropboxAccess = function() {
      Business.dropBoxAuthorization({ id: businessId }).$promise.then(
        function(dropBox) {
          if (dropBox.code == 302) {
            window.location.href = dropBox.returnUrl;
          } else {
            appMessenger.showError('business.dropboxAuthorizationFailed');
          }
        },
        function(error) {
          appMessenger.showError('business.dropboxConnectionFailed');
        }
      );
    };
  }
]);
