app.directive('reportStatus', [
  'PREFIX',
  'Usage',
  '$log',
  function(PREFIX, Usage, $log) {
    return {
      scope: {
        params: '=options'
      },

      controller: function($scope) {
        $scope.loading = false;
        $scope.download = 0;
        $scope.sessionTime = 0;
        $scope.upload = 0;
        getMembersCount();
        $scope.$on($scope.params.reloadEvent, function(event, data) {
          $scope.params.fromDate = data.params.fromDate;
          $scope.params.endDate = data.params.endDate;
          getMembersCount();
        });

        function getMembersCount() {
          $scope.loading = true;
          $scope.count = 0;

          var options = {};
          options.businessId = $scope.params.businessId;
          options.startDate = $scope.params.fromDate;
          options.endDate = $scope.params.endDate;
          Usage.reportStatus(options).$promise.then(
            function(result) {
              $scope.dns = result.db.Dns ?result.db.Dns.size : 0;
              $scope.session = result.db.Session ?result.db.Session.size : 0;
              $scope.netflow = result.db.Netflow ?result.db.Netflow.size : 0;
              $scope.webproxy = result.db.Webproxy ?result.db.Webproxy.size : 0;
              $scope.loading = false;
            },
            function(error) {
              $log.error(error);
            }
          );
        }
      },
      templateUrl: PREFIX + 'app/widgets/reportStatus/tpl/reportStatus.html'
    };
  }
]);
