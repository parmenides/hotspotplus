/**
 * Created by payamyousefi on 7/16/16.
 */

app.controller('ResellerSignUpController', [
  '$scope',
  '$log',
  'Reseller',
  '$state',
  'appMessenger',
  'englishNumberFilter',
  function($scope, $log, Reseller, $state, appMessenger, englishNumberFilter) {
    $scope.reseller = {};
    $scope.authError = null;
    $scope.signUp = function() {
      $scope.reseller.mobile = englishNumberFilter($scope.reseller.mobile);
      Reseller.create($scope.reseller).$promise.then(
        function(result) {
          appMessenger.showSuccess('reseller.signUpSuccessful');
          $state.go('access.resellerSignIn');
        },
        function(errorResult) {
          $log.error(errorResult);
          if (!errorResult.data) {
            appMessenger.showError('error.generalError');
            return ($scope.authError = 'error.generalError');
          }
          if (errorResult.data.error.status == 422) {
            $scope.authError = 'error.invalidMobile';
            appMessenger.showError('error.invalidMobile');
          } else {
            $scope.authError = 'error.generalError';
            appMessenger.showError('error.generalError');
          }
        }
      );
    };
  }
]);

app.controller('ResellerSignInController', [
  '$scope',
  '$log',
  'Reseller',
  '$state',
  'appMessenger',
  'Session',
  'LoopBackAuth',
  'roleService',
  'englishNumberFilter',
  'errorMessenger',
  function(
    $scope,
    $log,
    Reseller,
    $state,
    appMessenger,
    Session,
    LoopBackAuth,
    roleService,
    englishNumberFilter,
    errorMessenger
  ) {
    $scope.credential = {};
    $scope.authError = null;
    $scope.signIn = function() {
      $scope.credential.username = englishNumberFilter(
        $scope.credential.username
      );
      Reseller.login($scope.credential).$promise.then(
        function(result) {
          var SessionData = {};
          roleService.getRoles(LoopBackAuth.currentUserId).then(
            function(roles) {
              SessionData.userType = 'Reseller';
              SessionData.reseller = LoopBackAuth.currentUserData;
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
      Reseller.logout().$promise.then(
        function() {
          $state.go('access.resellerSignIn');
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
