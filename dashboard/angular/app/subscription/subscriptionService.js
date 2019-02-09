/**
 * Created by hamidehnouri on 12/14/2016 AD.
 */
app.controller('subscriptionService', [
  '$scope',
  '$log',
  'Session',
  'Business',
  'appMessenger',
  '$uibModal',
  'PREFIX',
  'Coupon',
  'Invoice',
  function(
    $scope,
    $log,
    Session,
    Business,
    appMessenger,
    $uibModal,
    PREFIX,
    Coupon,
    Invoice,
  ) {
    if (Session.business == null) {
      return;
    }
    var businessId = Session.business.id;
    $scope.currentService = {};

    Business.findById({ id: businessId }).$promise.then(
      function(res) {
        if (res.services) {
          $scope.currentService = res.services;
          var currentTime = new Date();
          $scope.currentService.expired =
            currentTime.getTime() > $scope.currentService.expiresAt;
          $scope.currentService.isExpiring =
            currentTime.getTime() > $scope.currentService.expiresAt - 432000000;
          $scope.currentService.remainingDays =
            ($scope.currentService.expiresAt - currentTime.getTime()) /
            86400000;
        } else {
          $scope.currentService.id = 'free';
          $scope.currentService.expired = false;
        }
        if (res.resellerId) {
          $scope.hasReseller = true;
          Business.getResellerMobile({ businessId: businessId }).$promise.then(
            function(result) {
              $scope.resellerMobile = result.mobile;
            },
            function(error) {
              $log.error(error);
              appMessenger.showError('business.settingsLoadUnSuccessful');
            },
          );
        } else {
          $scope.hasReseller = false;
        }
        if (res.serviceType) {
          $scope.currentService.serviceType = res.serviceType;
        } else if (res.onlineUsers == 5) {
          $scope.currentService.serviceType = 'free';
        } else {
          $scope.currentService.serviceType = '-';
        }
        $scope.currentService.onlineUsers = res.onlineUsers;
        $scope.currentService.durationInMonths = res.durationInMonths;
      },
      function(error) {
        $log.error(error);
        appMessenger.showError('business.settingsLoadUnSuccessful');
      },
    );
  },
]);
