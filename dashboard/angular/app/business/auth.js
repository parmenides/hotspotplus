/**
 * Created by payamyousefi on 7/16/16.
 */

app.controller('BusinessSignUpController', [
  '$scope',
  '$log',
  'Business',
  '$state',
  'appMessenger',
  'englishNumberFilter',
  function($scope, $log, Business, $state, appMessenger, englishNumberFilter) {
    $scope.business = {};
    $scope.authError = null;

    $scope.signUp = function() {
      $scope.business.mobile = englishNumberFilter($scope.business.mobile);
      Business.create($scope.business).$promise.then(
        function(result) {
          appMessenger.showSuccess('business.signUpSuccessful');
          $state.go('access.signIn');
        },
        function(errorResult) {
          $log.error(errorResult);
          if (!errorResult.data) {
            appMessenger.showError('error.generalError');
            return ($scope.authError = 'error.generalError');
          }

          if (errorResult.data.error && errorResult.data.error.message) {
            $scope.authError = errorResult.data.error.message;
            appMessenger.showError(errorResult.data.error.message);
          } else {
            $scope.authError = 'error.generalError';
            appMessenger.showError('error.generalError');
          }
        }
      );
    };
  }
]);

app.controller('BusinessSignInController', [
  '$scope',
  '$log',
  'Business',
  '$state',
  'appMessenger',
  'Session',
  'LoopBackAuth',
  'roleService',
  'errorMessenger',
  function(
    $scope,
    $log,
    Business,
    $state,
    appMessenger,
    Session,
    LoopBackAuth,
    roleService,
    errorMessenger
  ) {
    $scope.credential = {};
    $scope.authError = null;
    $scope.signIn = function() {
      Business.login($scope.credential).$promise.then(
        function(result) {
          var SessionData = {};
          roleService.getRoles(LoopBackAuth.currentUserId).then(
            function(roles) {
              SessionData.userType = 'Business';
              SessionData.business = LoopBackAuth.currentUserData;
              SessionData.roles = roles;
              Session.setSession(SessionData);
              $state.go('app.loadDashboard');
              appMessenger.showSuccess('user.signInSuccessful');
            },
            function() {
              appMessenger.showError('auth.loadingRoleFailed');
            }
          );
        },
        function(errorResult) {
          $log.error(errorResult);
          appMessenger.showError('user.invalidLogin');
        }
      );
    };

    $scope.signOut = function() {
      Business.logout().$promise.then(
        function() {
          $state.go('access.signIn');
          Session.clearSession();
        },
        function(error) {
          Session.clearSession();
          appMessenger.showError('auth.logoutFailed');
        }
      );
    };
  }
]);
