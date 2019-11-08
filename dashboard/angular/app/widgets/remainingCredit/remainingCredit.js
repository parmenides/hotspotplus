/**
 * Created by rezanazari on 10/6/16.
 */
app.directive('remainingCredit', [
  'PREFIX',
  'Business',
  '$log',
  'appMessenger',
  function(PREFIX, Business, $log, appMessenger) {
    return {
      scope: {
        params: '=options'
      },

      controller: function($scope) {
        $scope.loading = false;
        $scope.balance = 0;
        var businessId = $scope.params.businessId;
        getRemainingCredit();
        $scope.$on($scope.params.reloadEvent, function(event, data) {
          $scope.params.fromDate = data.params.fromDate;
          $scope.params.endDate = data.params.endDate;
          getRemainingCredit();
        });

        function getRemainingCredit() {
          $scope.loading = true;
          Business.getBalance({ businessId: businessId }).$promise.then(
            function(res) {
              $scope.balance = res.balance;
              $scope.loading = false;
            },
            function(error) {
              appMessenger.showError('business.balanceLoadUnSuccessful');
              return error;
            }
          );
        }
      },
      templateUrl:
        PREFIX + 'app/widgets/remainingCredit/tpl/remainingCredit.html'
    };
  }
]);
