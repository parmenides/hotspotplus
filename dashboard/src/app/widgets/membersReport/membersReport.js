/**
 * Created by rezanazari on 03/04/17.
 */
app.directive('membersReport', [
  'PREFIX',
  '$log',
  '$rootScope',
  'Business',
  'uiGridConstants',
  'translateFilter',
  'persianDateFilter',
  'translateNumberFilter',
  'appMessenger',
  'trimUsernameFilter',
  function (
    PREFIX,
    $log,
    $rootScope,
    Business,
    uiGridConstants,
    translateFilter,
    persianDateFilter,
    translateNumberFilter,
    appMessenger,
    trimUsernameFilter
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
            where:{}
          }
          options.filter.sort = 'creationDate DESC'
          options.filter.skip = 0
          options.filter.limit = 8
          options.filter.fields = {internetPlanHistory: false}
          if ($scope.params.departmentId && $scope.params.departmentId !=='all') {
            options.filter.where.departments = {eq: $scope.params.departmentId}
          } else if(!$scope.params.departmentId){
            options.filter.where.departments = {eq: '--'}
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
