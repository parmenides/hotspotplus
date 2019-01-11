/**
 * Created by payamyousefi on 7/16/16.
 */

app.controller('AdminSignInController', [
  '$scope',
  '$log',
  'User',
  '$state',
  'appMessenger',
  'Session',
  'LoopBackAuth',
  'roleService',
  'errorMessenger',
  function(
    $scope,
    $log,
    User,
    $state,
    appMessenger,
    Session,
    LoopBackAuth,
    roleService,
    errorMessenger,
  ) {
    $scope.credential = {};
    $scope.authError = null;
    $scope.signIn = function() {
      User.login($scope.credential).$promise.then(
        function(result) {
          var SessionData = {};
          roleService.getRoles(LoopBackAuth.currentUserId).then(
            function(roles) {
              SessionData.userType = 'Admin';
              SessionData.user = LoopBackAuth.currentUserData;
              SessionData.roles = roles;
              Session.setSession(SessionData);
              $state.go('app.businesses');
              appMessenger.showSuccess('user.signInSuccessful');
            },
            function() {
              appMessenger.showError('auth.loadingRoleFailed');
            },
          );
        },
        function(errorResult) {
          $log.error(errorResult);
          appMessenger.showError('user.invalidLogin');
        },
      );
    };

    $scope.signOut = function() {
      User.logout().$promise.then(
        function() {
          $state.go('access.adminSignIn');
          Session.clearSession();
        },
        function(error) {
          Session.clearSession();
          appMessenger.showError('auth.logoutFailed');
        },
      );
    };
  },
]);
