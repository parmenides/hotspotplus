/**
 * Created by hamidehnouri on 8/8/2016 AD.
 */

app.controller('wifiSettings', [
  '$scope',
  '$log',
  '$state',
  'Business',
  'appMessenger',
  'Session',
  function($scope, $log, $state, Business, appMessenger, Session) {
    var businessId = Session.business.id;

    $scope.speeds = [128, 256, 512];
    Business.findById({ id: businessId }).$promise.then(
      function(res) {
        $scope.business = res;
      },
      function(err) {
        appMessenger.showError('wifi.settingsLoadUnSuccessful');
      },
    );

    $scope.save = function() {
      $scope.business.wifi.uploadSpeed = $scope.business.wifi.downloadSpeed;
      Business.prototype$updateAttributes(
        { id: businessId },
        $scope.business,
      ).$promise.then(
        function(res) {
          appMessenger.showSuccess('wifi.settingsSaveSuccessful');
          // $state.go("app.dashboard");
        },
        function(err) {
          appMessenger.showError('wifi.settingsSaveUnSuccessful');
          // $state.go("app.dashboard");
        },
      );
    };
    $scope.cancel = function() {
      $state.go('app.dashboard');
    };
  },
]);
