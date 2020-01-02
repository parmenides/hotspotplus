/**
 * Created by rezanazari on 03/04/17.
 */
app.directive('trafficUsage', [
  'PREFIX',
  'Session',
  '$log',
  'Business',
  'translateFilter',
  'persianDateFilter',
  'translateNumberFilter',
  'humanSizeFilter',
  function (
    PREFIX,
    Session,
    $log,
    Business,
    translateFilter,
    persianDateFilter,
    translateNumberFilter,
    humanSizeFilter
  ) {
    return {
      scope: {
        params: '=options'
      },
      controller: function ($scope) {
        $scope.loading = false
        makeChart()
        $scope.$on($scope.params.reloadEvent, function (event, data) {
          $scope.params.fromDate = data.params.fromDate
          $scope.params.endDate = data.params.endDate
          $scope.params.departmentId = data.params.departmentId
          $scope.params.monthDays = []
          $scope.params.offset = data.params.offset

          makeChart()
        })

        function makeChart () {
          var trafficUsageChart = {}
          trafficUsageChart.startDate = $scope.params.fromDate
          trafficUsageChart.endDate = $scope.params.endDate
          trafficUsageChart.businessId = $scope.params.businessId
          trafficUsageChart.departments = $scope.params.departmentId?[$scope.params.departmentId]: Session.permittedDepartments;

          trafficUsageChart.offset = $scope.params.offset
          trafficUsageChart.monthDays = $scope.params.monthDays
          $scope.loading = true
          Business.getTrafficUsage(trafficUsageChart).$promise.then(function (
            res
          ) {
            var DAY_MILLISECONDS = 24 * 60 * 60 * 1000
            $scope.loading = false
            var interval = res.result.date[1] - res.result.date[0]
            var xAxesLabel = 'dashboard.xAxesLabelDaily'
            for (var date in res.result.date) {
              res.result.date[date] = translateNumberFilter(
                persianDateFilter(new Date(res.result.date[date]), 'M/d')
              )
            }
            $scope.labels = res.result.date
            $scope.series = [
              translateFilter('dashboard.download'),
              translateFilter('dashboard.upload')
            ]
            $scope.data = [res.result.download, res.result.upload]
            $scope.type = 'line'
            if (interval > DAY_MILLISECONDS) {
              $scope.type = 'bar'
              xAxesLabel = 'dashboard.xAxesLabelMonthly'
            }
            $scope.colors = ['#6254b2', '#23b7e5']
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
                  label: function (tooltipItems, data) {
                    return (
                      humanSizeFilter(tooltipItems.yLabel)
                    )
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
                    afterTickToLabelConversion: function (data) {
                      var xLabels = data.ticks
                      if (xLabels.length > 6) {
                        xLabels.forEach(function (labels, i) {
                          if (i % 2 == 1) {
                            xLabels[i] = ''
                          }
                        })
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
                      callback: function (value) {
                        return humanSizeFilter(Number(value))
                      }
                    }
                  }
                ]
              }
            }
          }),
            function (error) {
              $log.error(
                'can not get traffic usage chart info from data source: ' +
                error
              )
            }
        }
      },
      templateUrl: PREFIX + 'app/widgets/trafficUsage/tpl/trafficUsage.html'
    }
  }
])
