/**
 * Created by rezanazari on 03/04/17.
 */
app.directive('topMembers', [
  'PREFIX',
  '$log',
  'Usage',
  'translateFilter',
  'persianDateFilter',
  'translateNumberFilter',
  'humanSizeFilter',
  function(
    PREFIX,
    $log,
    Usage,
    translateFilter,
    persianDateFilter,
    translateNumberFilter,
    humanSizeFilter
  ) {
    return {
      scope: {
        params: '=options'
      },
      controller: function($scope) {
        $scope.loading = false;
        makeChart();
        $scope.$on($scope.params.reloadEvent, function(event, data) {
          if (data.params.advanceTime) {
            $scope.params.fromDate = data.params.advanceTime.startDate;
            $scope.params.endDate = data.params.advanceTime.endDate;
            $scope.params.monthDays = data.params.advanceTime.monthDays;
          } else {
            $scope.params.fromDate = data.params.fromDate;
            $scope.params.endDate = data.params.endDate;
            $scope.params.monthDays = [];
          }
          $scope.params.offset = data.params.offset;

          makeChart();
        });
        function makeChart() {
          var query = {};
          query.startDate = $scope.params.fromDate;
          query.endDate = $scope.params.endDate;
          query.businessId = $scope.params.businessId;
          query.offset = 0;
          $scope.loading = true;
          Usage.getTopMembers(query).$promise.then(function(
            res
          ) {
            $scope.loading = false;

            $scope.labels = res.username;
            $scope.series = [
              translateFilter('dashboard.download'),
              translateFilter('dashboard.upload')
            ];
            $scope.data = [res.download, res.upload];

            var xAxesLabel = 'dashboard.xAxesLabelDaily';

            $scope.type = 'bar';
            $scope.colors = ['#6254b2', '#23b7e5'];
            $scope.options = {
              legend: {
                display: true,
                position: 'bottom',
                labels: {
                  fontColor: '#333'
                }
              },
              tooltips: {
                enabled: true,
                titleFontSize: 16,
                bodyFontSize: 16,
                mode: 'x-axis',
                callbacks: {
                  label: function(tooltipItems, data) {
                    return (
                      humanSizeFilter(tooltipItems.yLabel)
                    );
                  }
                }
              },
              scales: {
                xAxes: [
                  {
                    scaleLabel: {
                      display: true,
                      labelString: translateFilter(xAxesLabel),
                      fontColor: '#333'
                    },
                    afterTickToLabelConversion: function(data) {
                      var xLabels = data.ticks;
                      if (xLabels.length > 6) {
                        xLabels.forEach(function(labels, i) {
                          if (i % 2 == 1) {
                            xLabels[i] = '';
                          }
                        });
                      }
                    }
                  }
                ],
                yAxes: [
                  {
                    id: 'y-axis-1',
                    type: 'linear',
                    display: true,
                    position: 'left',
                    scaleLabel: {
                      display: false,
                    },
                    ticks: {
                      beginAtZero: true,
                      callback: function(value) {
                        return humanSizeFilter(Number(value));
                      }
                    }
                  }
                ]
              }
            };
          }),
            function(error) {
              $log.error(
                'can not get traffic usage chart info from data source: ' +
                  error
              );
            };
        }
      },
      templateUrl: PREFIX + 'app/widgets/topMembers/tpl/topMembers.html'
    };
  }
]);
