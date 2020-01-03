/**
 * Created by rezanazari on 7/1/17.
 */

app.controller('OperatorSignInController', [
  '$scope',
  '$log',
  'Operator',
  'Business',
  '$state',
  '$location',
  'appMessenger',
  'Session',
  'Member',
  'LoopBackAuth',
  'roleService',
  'errorMessenger',
  function(
    $scope,
    $log,
    Operator,
    Business,
    $state,
    $location,
    appMessenger,
    Session,
    Member,
    LoopBackAuth,
    roleService,
    errorMessenger
  ) {
    $scope.credential = {};
    $scope.authError = null;
    var businessName = '';
    var businessId = '';
    if ($location.search().username) {
      $scope.credential.username = $location.search().username;
    }
    if ($location.search().password) {
      $scope.credential.password = $location.search().password;
    }
    if ($location.search().name) {
      businessId = $location.search().name;
    } else if ($state.params.name) {
      businessName = $state.params.name;
    }

    $scope.signIn = function() {
      var loginData = {};
      loginData.password = $scope.credential.password;
      if (businessId && businessId != '') {
        loginData.username = $scope.credential.username + '@' + businessId;
        login(loginData);
      } else if (businessName && businessName != '') {
        var options = {
          businessUrl: businessName,
          username: $scope.credential.username
        };
        Member.getBusinessId(options).$promise.then(
          function(username) {
            loginData.username = username.username;
            loginData.urlPrefix = options.businessUrl;
            login(loginData);
          },
          function() {
            appMessenger.showError('business.settingsLoadUnSuccessful');
          }
        );
      }
    };

    var login = function(loginData) {
      Operator.login(loginData).$promise.then(
        function() {
          roleService.getRoles(LoopBackAuth.currentUserId).then(
            function(roles) {
              var SessionData = {};
              SessionData.userType = 'Operator';
              SessionData.business = {
                id:LoopBackAuth.currentUserData.businessId
              };
              SessionData.operator = LoopBackAuth.currentUserData;
              SessionData.operator.urlPrefix = loginData.urlPrefix;
              SessionData.roles = roles;
              Business.getMyDepartments().$promise.then(function (response) {
                SessionData.permittedDepartments = response.departments.map(function(dep){
                  return dep.id
                });
                Session.setSession(SessionData);
                $state.go('app.loadDashboard');
                appMessenger.showSuccess('user.signInSuccessful');
              })

            },
            function() {
              appMessenger.showError('auth.loadingRoleFailed');
            }
          );
        },
        function() {
          appMessenger.showError('user.invalidLogin');
        }
      );
    };
    $scope.signOut = function() {
      Operator.logout().$promise.then(
        function() {
          var urlPrefix = Session.operator.urlPrefix;
          $state.go('access.operatorSignIn', { name: urlPrefix });
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
