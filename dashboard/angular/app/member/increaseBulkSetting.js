/**
 * Created by rezanazari on 7/12/17.
 */
app.controller('increaseBulk', [
  '$scope',
  '$log',
  'Session',
  'appMessenger',
  '$uibModal',
  'PREFIX',
  'InternetPlan',
  'englishNumberFilter',
  'translateNumberFilter',
  '$window',
  function(
    $scope,
    $log,
    Session,
    appMessenger,
    $uibModal,
    PREFIX,
    InternetPlan,
    englishNumberFilter,
    translateNumberFilter,
    $window,
  ) {
    if (Session.member == null) {
      return;
    }
    $scope.addBulk = function() {
      var businessId = Session.member.businessId;
      var memberId = Session.member.id;
      var planId = Session.member.internetPlanId;
      InternetPlan.find({
        filter: {
          where: {
            id: planId,
          },
        },
      }).$promise.then(
        function(plan) {
          if (!plan[0].extraBulkPrice || plan[0].extraBulkPrice === 0) {
            appMessenger.showWarning('member.noExtraBulk');
            return;
          }
          $uibModal.open({
            backdrop: true,
            animation: true,
            keyboard: true,
            backdropClick: true,
            templateUrl: PREFIX + 'app/member/tpl/hotspot/increaseBulk.html',
            controller: [
              '$scope',
              '$uibModalInstance',
              'Member',
              function($scope, $uibModalInstance, Member) {
                $scope.bankWait = false;
                $scope.bulk = {};
                var totalPrice = 0;
                var amount = 0;
                var price = 0;
                $scope.bulk.price = translateNumberFilter(
                  plan[0].extraBulkPrice * 10,
                );
                $scope.bulk.totalPrice = translateNumberFilter(0);
                $scope.$watch('bulk.amount', function(newVal, oldVal) {
                  if (typeof newVal !== 'undefined') {
                    amount = Number(englishNumberFilter($scope.bulk.amount));
                    price = Number(englishNumberFilter($scope.bulk.price));
                    totalPrice = amount * price;
                    $scope.bulk.totalPrice = translateNumberFilter(totalPrice);
                    $scope.bulk.amount = translateNumberFilter(
                      $scope.bulk.amount,
                    );
                  } else if (typeof newVal === 'undefined') {
                    $scope.bulk.totalPrice = translateNumberFilter(0);
                  }
                });

                $scope.cancel = function() {
                  $uibModalInstance.close();
                };

                $scope.payment = function() {
                  var options = {
                    memberId: memberId,
                    businessId: businessId,
                    internetPlanId: planId,
                    amount: amount,
                  };
                  $scope.bankWait = true;
                  $log.error(options);

                  Member.buyBulk(options).$promise.then(
                    function(res) {
                      if (res.url) {
                        $window.location.href = res.url;
                        appMessenger.showSuccess('member.paymentSuccessful');
                      } else {
                        appMessenger.showError('error.addPlanUnSuccessFull');
                      }
                    },
                    function(error) {
                      $log.error(error);
                      appMessenger.showError('error.generalError');
                    },
                  );
                };
              },
            ],
          });
        },
        function(error) {
          $log.error(error);
          appMessenger.showError('error.generalError');
        },
      );
    };
  },
]);
