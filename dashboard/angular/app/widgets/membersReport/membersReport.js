/**
 * Created by rezanazari on 03/04/17.
 */
app.directive('membersReport', [
  'PREFIX',
  '$log',
  'Session',
  '$rootScope',
  'Business',
  function (
    PREFIX,
    $log,
    Session,
    $rootScope,
    Business,
  ) {
    return {
      scope: {
        params: '=options'
      },
      controller: function ($scope) {
        $scope.localLang = $rootScope.localLang
        $scope.direction = $rootScope.direction
        $scope.loading = false
        $scope.members = []
        getPage()
        $scope.$on($scope.params.reloadEvent, function (event, data) {
          $scope.params.fromDate = data.params.fromDate
          $scope.params.departmentId = data.params.departmentId
          getPage()
        })

        function getPage () {
          $scope.loading = true
          var options = {}
          options.id = $scope.params.businessId
          options.filter = {
            where: {}
          }
          options.filter.sort = 'creationDate DESC'
          options.filter.skip = 0
          options.filter.limit = 8
          options.filter.fields = {internetPlanHistory: false}
          if ($scope.params.departmentId) {
            options.filter.where.departments = {eq: $scope.params.departmentId}
          } else {
            options.filter.where.or = []
            for (const dep of Session.permittedDepartments) {
              options.filter.where.or.push({departments: {eq: dep}})
            }
          }
          Business.members(options).$promise.then(
            function (members) {
              $scope.members = members
              $scope.loading = false
            },
            function (error) {
              $scope.loading = true
              $log.error(error)
            }
          )
        }
      },
      templateUrl: PREFIX + 'app/widgets/membersReport/tpl/membersReport.html'
    }
  }
])
