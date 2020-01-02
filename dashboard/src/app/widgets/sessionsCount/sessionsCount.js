/**
 * Created by rezanazari on 10/6/16.
 */
app.directive('sessionsCount', [
  'PREFIX',
  'ClientSession',
  'Session',
  '$log',
  function (PREFIX, ClientSession, Session, $log) {
    return {
      scope: {
        params: '=options'
      },

      controller: function ($scope) {
        $scope.loading = false
        getSessionsCount()
        $scope.$on($scope.params.reloadEvent, function (event, data) {
          $scope.params.fromDate = data.params.fromDate
          $scope.params.endDate = data.params.endDate
          getSessionsCount()
        })

        function getSessionsCount () {
          $scope.loading = true
          $scope.count = 0

          var query = {}
          query.businessId = $scope.params.businessId
          query.departments = $scope.params.departmentId ? [$scope.params.departmentId] : Session.permittedDepartments

          ClientSession.getOnlineSessionCount(query).$promise.then(
            function (result) {
              $scope.count = result.count
              $scope.loading = false
            },
            function (error) {
              $log.error(error)
            }
          )
        }
      },
      templateUrl: PREFIX + 'app/widgets/sessionsCount/tpl/sessionsCount.html'
    }
  }
])
