/**
 * Created by rezanazari on 10/14/17.
 */
app.directive('usageReport', [
  'PREFIX',
  'Session',
  'Usage',
  '$log',
  function (PREFIX,Session, Usage, $log) {
    return {
      scope: {
        params: '=options'
      },

      controller: function ($scope) {
        $scope.loading = false
        $scope.download = 0
        $scope.sessionTime = 0
        $scope.upload = 0
        getMembersCount()
        $scope.$on($scope.params.reloadEvent, function (event, data) {
          $scope.params.fromDate = data.params.fromDate
          $scope.params.endDate = data.params.endDate
          $scope.params.departmentId = data.params.departmentId
          getMembersCount()
        })

        function getMembersCount () {
          $scope.loading = true
          $scope.count = 0

          var options = {}
          options.businessId = $scope.params.businessId
          options.startDate = $scope.params.fromDate
          options.endDate = $scope.params.endDate
          if ($scope.params.departmentId) {
            options.departmentId = $scope.params.departmentId
          }
          options.departments = $scope.params.departmentId?[$scope.params.departmentId]: Session.permittedDepartments;

          Usage.getUsage(options).$promise.then(
            function (result) {
              $scope.download = result.download
              $scope.upload = result.upload
              $scope.sessionTime = result.sessionTime
              $scope.loading = false
            },
            function (error) {
              $log.error(error)
            }
          )
        }
      },
      templateUrl: PREFIX + 'app/widgets/usageReport/tpl/usageReport.html'
    }
  }
])
