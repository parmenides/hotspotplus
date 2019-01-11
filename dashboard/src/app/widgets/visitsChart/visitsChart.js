/**
 * Created by hamidehnouri on 10/10/2016 AD.
 */

app.directive( 'visitsChart', [ 'PREFIX', 'FootTraffic', '$log', 'translateNumberFilter', 'translateFilter',
	function ( PREFIX, FootTraffic, $log, translateNumberFilter, translateFilter ) {
		return {
			scope:       {
				params: '=options'
			},
			controller:  function ( $scope ) {
				$scope.loading = false
				showChart ()
				$scope.$on( $scope.params.reloadEvent, function ( event, data ) {
					$scope.params.fromDate = data.params.fromDate
					$scope.params.endDate = data.params.endDate
					$scope.params.offset = data.params.offset
					showChart ()
				} )
				function showChart () {
					var visitsChart = {}
					visitsChart.startDate = $scope.params.fromDate
					visitsChart.endDate = $scope.params.endDate
					visitsChart.businessId = $scope.params.businessId
					// time interval for one hour
					visitsChart.timeInterval = 3600000
					// offset for start date
					visitsChart.offset = $scope.params.offset
					/*
					 Returns daily visits and walkBys per hour.
					 If the selected time period on the dashboard is more than one day,
					 returns the average number .
					 */
					$scope.loading = true
					FootTraffic.getDailyVisitsChart( visitsChart )
						.$promise.then( function ( res ) {
						$scope.loading = false
						$scope.labels = []
						for ( var i = 0; i < res.visits.length; i++ ) {
							$scope.labels[ i ] = translateNumberFilter ( i )
						}
						$scope.series = [ translateFilter ( 'dashboard.visits' ), translateFilter ( 'dashboard.walkBys' ) ]
						$scope.data = [
							res.visits,
							res.walkBys
						]
						$scope.colors = [ '#7266ba', '#DDDDDD', '#3a3f51' ]
						$scope.options = {
							legend:   {
								display:   true,
								position:  'bottom',
								labels:    {
									fontColor: '#333'
								},
								fullWidth: true
							},
							tooltips: {
								enabled:       true,
								titleFontSize: 16,
								bodyFontSize:  16,
								mode:          'x-axis',
								callbacks:     {
									label: function ( tooltipItems, data ) {
										return data.datasets[ tooltipItems.datasetIndex ].label + ' : ' + translateNumberFilter ( tooltipItems.yLabel )
									}
								}
							},
							scales:   {
								xAxes: [
									{
										scaleLabel: {
											display:     true,
											labelString: translateFilter ( 'dashboard.xAxesLabelHourly' ),
											fontColor:   '#333'
										}
									}
								],
								yAxes: [
									{
										id:         'y-axis-1',
										type:       'linear',
										display:    true,
										position:   'left',
										scaleLabel: {
											display:     true,
											labelString: translateFilter ( 'dashboard.yAxesLabelQty' ),
											fontColor:   '#333'
										},
										ticks:      {
											beginAtZero: true,
											callback:    function ( value ) {
												return translateNumberFilter ( Number( value ) )
											}
										}
									}
								]
							}
						}
					} ), function ( error ) {
						$log.error( 'can not get visits chart info from data source: ' + error )
					}
				}
			},
			templateUrl: PREFIX + 'app/widgets/visitsChart/tpl/visitsChart.html'
		}
	} ] )
