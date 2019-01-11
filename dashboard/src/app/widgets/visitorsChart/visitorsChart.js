/**
 * Created by rezanazari on 10/8/16.
 */
app.directive( 'visitorsChart', [ 'PREFIX', 'FootTraffic', '$log', 'translateFilter', 'persianDateFilter', 'translateNumberFilter',
	function ( PREFIX, FootTraffic, $log, translateFilter, persianDateFilter, translateNumberFilter ) {
		return {
			scope:       {
				params: '=options'
			},
			controller:  function ( $scope ) {
				$scope.loading = false
				showChart ()
				$scope.$on( $scope.params.reloadEvent, function ( event, data ) {
					if ( data.params.advanceTime ) {
						$scope.params.fromDate = data.params.advanceTime.startDate
						$scope.params.endDate = data.params.advanceTime.endDate
						$scope.params.monthDays = data.params.advanceTime.monthDays
					} else {
						$scope.params.fromDate = data.params.fromDate
						$scope.params.endDate = data.params.endDate
						$scope.params.monthDays = []
					}
					$scope.params.offset = data.params.offset
					showChart ()
				} )
				function showChart () {
					var visitorsChart = {}
					visitorsChart.startDate = $scope.params.fromDate
					visitorsChart.endDate = $scope.params.endDate
					visitorsChart.businessId = $scope.params.businessId
					visitorsChart.offset = $scope.params.offset
					visitorsChart.monthDays = $scope.params.monthDays
					$scope.loading = true
					FootTraffic.getVisitorsChart( visitorsChart )
						.$promise.then( function ( res ) {
						var DAY_MILLISECONDS = 24 * 60 * 60 * 1000
						$scope.loading = false
						var interval = res.result.date[ 1 ] - res.result.date[ 0 ]
						var xAxesLabel = 'dashboard.xAxesLabelDaily'
						for ( var date in res.result.date ) {
							res.result.date[ date ] = translateNumberFilter ( persianDateFilter ( new Date ( res.result.date[ date ] ), 'M/d' ) )
						}
						$scope.labels = res.result.date
						$scope.series = [ translateFilter ( 'dashboard.returningVisitors' ), translateFilter ( 'dashboard.newVisitors' ) ]
						$scope.data = [
							res.result.reVisitors,
							res.result.newVisitors
						]
						$scope.type = 'line'
						if ( interval > DAY_MILLISECONDS ) {
							$scope.type = 'bar'
							xAxesLabel = 'dashboard.xAxesLabelMonthly'
						}
						$scope.colors = [ '#5DA5DA', '#60BD68' ]
						$scope.options = {
							legend:   {
								display:  true,
								position: 'bottom',
								labels:   {
									fontColor: '#333'
								}
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
										scaleLabel:                 {
											display:     true,
											labelString: translateFilter ( xAxesLabel ),
											fontColor:   '#333'
										},
										afterTickToLabelConversion: function ( data ) {
											var xLabels = data.ticks
											if ( xLabels.length > 6 ) {
												xLabels.forEach( function ( labels, i ) {
													if ( i % 2 == 1 ) {
														xLabels[ i ] = ''
													}
												} )
											}
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
						$log.error( 'can not get visitors chart info from data source: ' + error )
					}
				};
			},
			templateUrl: PREFIX + 'app/widgets/visitorsChart/tpl/visitorsChart.html'
		}
	} ] )
