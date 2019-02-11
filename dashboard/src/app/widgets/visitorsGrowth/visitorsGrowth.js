/**
 * Created by rezanazari on 10/6/16.
 */
app.directive('visitorGrowth', [
  'PREFIX',
  'FootTraffic',
  '$log',
  function(PREFIX, FootTraffic, $log) {
    return {
      scope: {
        params: '=options'
      },

      controller: function($scope) {
        $scope.loading = false;
        growthWidget();
        $scope.$on($scope.params.reloadEvent, function(event, data) {
          $scope.params.fromDate = data.params.fromDate;
          $scope.params.endDate = data.params.endDate;
          growthWidget();
        });

        function growthWidget() {
          $scope.newVisitors = 0;
          $scope.mirrorVisitors = 0;
          $scope.percent = 0;
          $scope.textClass = 'muted';
          $scope.iconClass = '';

          var visitorGrowth = {};
          var cssClass = 'muted';
          var iconClass = '';
          var posCss = 'growth-positive';
          var posIcon = 'fa-long-arrow-up';
          var negCss = 'danger-lter';
          var negIcon = 'fa-long-arrow-down';
          visitorGrowth.startDate = $scope.params.fromDate;
          visitorGrowth.endDate = $scope.params.endDate;
          visitorGrowth.businessId = $scope.params.businessId;
          $scope.loading = true;
          FootTraffic.getVisitorsPercent(visitorGrowth).$promise.then(
            function(res) {
              $scope.loading = false;
              if (res.result) {
                $scope.newVisitors = res.result.visitors;
                $scope.mirrorVisitors = res.result.mirrorVisitors;
                $scope.percent = res.result.percent;
                if ($scope.percent > 0) {
                  cssClass = posCss;
                  iconClass = posIcon;
                }
                if ($scope.percent < 0) {
                  cssClass = negCss;
                  iconClass = negIcon;
                }
                $scope.textClass = cssClass;
                $scope.iconClass = iconClass;
              }
            },
            function(error) {
              $log.error(
                'can not get visitors count and growth rate from data source: ',
                error
              );
            }
          );
        }
      },
      templateUrl: PREFIX + 'app/widgets/visitorsGrowth/tpl/visitorsGrowth.html'
    };
  }
]);
