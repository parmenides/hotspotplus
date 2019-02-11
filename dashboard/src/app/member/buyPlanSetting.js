/**
 * Created by rezanazari on 7/12/17.
 */
app.controller('buyPlan', [
  '$scope',
  '$log',
  'Session',
  'appMessenger',
  '$uibModal',
  'PREFIX',
  'InternetPlan',
  '$window',
  '$state',
  'Member',
  function(
    $scope,
    $log,
    Session,
    appMessenger,
    $uibModal,
    PREFIX,
    InternetPlan,
    $window,
    $state,
    Member
  ) {
    if (Session.member == null) {
      return;
    }
    var businessId = Session.member.businessId;
    var memberId = Session.member.id;
    $scope.showPlans = function() {
      InternetPlan.find({
        filter: {
          where: {
            businessId: businessId
          }
        }
      }).$promise.then(
        function(plans) {
          if (plans.length === 0) {
            appMessenger.showError('member.noInternetPlan');
            return;
          }
          $uibModal.open({
            backdrop: true,
            animation: true,
            keyboard: true,
            backdropClick: true,
            size: 'lg',
            templateUrl: PREFIX + 'app/member/tpl/hotspot/buyPlan.html',
            controller: [
              '$scope',
              '$uibModalInstance',
              'Member',
              function($scope, $uibModalInstance, Member) {
                $scope.planShow = 'public';
                $scope.plans = plans;
                $scope.bankWait = false;
                $scope.cancel = function() {
                  $uibModalInstance.close();
                };
                $scope.payment = function(planId, planPrice) {
                  var options = {
                    memberId: memberId
                  };
                  if (planPrice === 0) {
                    options.planId = planId;
                    InternetPlan.assignFreePlanToMember(options).$promise.then(
                      function(result) {
                        if (result.ok == true) {
                          $scope.cancel();
                          $state.go('app.loadDashboard');
                          appMessenger.showSuccess('member.addPlanSuccessFull');
                        } else {
                          appMessenger.showError('member.addPlanSuccessFull');
                        }
                      },
                      function error(error) {
                        $log.error(error);
                        if (
                          error.data.error.message ==
                          'default plan activated too many times'
                        ) {
                          appMessenger.showError(
                            'member.defaultPlanActivatedMax'
                          );
                        } else {
                          appMessenger.showError('member.addPlanUnSuccessFull');
                        }
                      }
                    );
                  } else {
                    options.businessId = businessId;
                    options.internetPlanId = planId;
                    $scope.bankWait = true;
                    Member.buyPlan(options).$promise.then(
                      function(res) {
                        if (res.url) {
                          $window.location.href = res.url;
                          appMessenger.showSuccess('member.paymentSuccessful');
                        } else {
                          appMessenger.showError('member.addPlanUnSuccessFull');
                        }
                      },
                      function(error) {
                        $log.error(error);
                        appMessenger.showError('error.generalError');
                      }
                    );
                  }
                };
              }
            ]
          });
        },
        function(error) {
          $log.error(error);
          appMessenger.showError('error.generalError');
        }
      );
    };
  }
]);
