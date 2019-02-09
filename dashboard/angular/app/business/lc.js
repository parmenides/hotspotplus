/**
 * Created by payamyousefi on 7/16/16.
 */

app.controller('LcSignUpController', [
  '$scope',
  '$log',
  'Business',
  '$state',
  'appMessenger',
  'englishNumberFilter',
  '$timeout',
  function(
    $scope,
    $log,
    Business,
    $state,
    appMessenger,
    englishNumberFilter,
    $timeout,
  ) {
    $scope.lc = {};
    $scope.authError = null;
    if (!Window.isDefault) {
      $state.go('access.signUp');
      return;
    }
    $scope.loading = false;
    $scope.signUp = function() {
      $scope.lc.mobile = englishNumberFilter($scope.lc.mobile);
      $scope.loading = true;
      Business.registerNewLicense($scope.lc).$promise.then(
        function(result) {
          appMessenger.showSuccess('business.lcCreated');
          /*$state.go ( 'access.signUp' );*/
          $timeout(function() {
            $scope.loading = false;
            location.reload();
          }, 60000);
        },
        function(errorResult) {
          $log.error(errorResult);
          $scope.loading = false;
          if (!errorResult.data) {
            appMessenger.showError('error.generalError');
            return ($scope.authError = 'error.generalError');
          }
          if (errorResult.data.error && errorResult.data.error.status === 422) {
            $scope.authError = errorResult.data.error.message;
            appMessenger.showError(errorResult.data.error.message);
          } else {
            $scope.authError = 'error.generalError';
            appMessenger.showError('error.generalError');
          }
        },
      );
    };
  },
]);
