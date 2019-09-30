/**
 * Created by rezanazari on 10/14/17.
 */
app.directive('memberCount', [
  'PREFIX',
  'Member',
  '$log',
  function(PREFIX, Member, $log) {
    return {
      scope: {
        params: '=options'
      },

      controller: function($scope) {
        $scope.loading = false;
        $scope.newMembers = 0;
        $scope.allMembers = 0;
        getMembersCount();
        $scope.$on($scope.params.reloadEvent, function(event, data) {
          $scope.params.fromDate = data.params.fromDate;
          $scope.params.endDate = data.params.endDate;
          $scope.params.departmentId = data.params.departmentId
          getMembersCount();
        });

        function getMembersCount() {
          $scope.loading = true;
          $scope.count = 0;

          var options = {};
          options.businessId = $scope.params.businessId;
          options.fromDate = $scope.params.fromDate;
          options.endDate = $scope.params.endDate;
          options.departmentId = $scope.params.departmentId;
          Member.getAllMembersCount(options).$promise.then(
            function(result) {
              $scope.allMembers = result.allMembers;
              Member.getNewMembersCount(options).$promise.then(
                function(result) {
                  $scope.newMembers = result.newMembers;
                  $scope.loading = false;
                },
                function(error) {
                  $log.error(error);
                }
              );
            },
            function(error) {
              $log.error(error);
            }
          );
        }
      },
      templateUrl: PREFIX + 'app/widgets/memberCount/tpl/memberCount.html'
    };
  }
]);
