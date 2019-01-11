/**
 * Created by rezanazari on 10/25/16.
 */
app.directive( 'membersChart', [ 'PREFIX', '$log', 'Member', 'translateFilter', 'persianDateFilter', 'translateNumberFilter',
	function ( PREFIX, $log, Member, translateFilter, persianDateFilter, translateNumberFilter ) {
		return {
			scope:       {
				params: '=options'
			},
			controller:  function ( $scope ) {
				$scope.loading = false
				makeChart ()
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

					makeChart ()
				} )
				function makeChart () {
					var membersChart = {}
					membersChart.startDate = $scope.params.fromDate
					membersChart.endDate = $scope.params.endDate
					membersChart.businessId = $scope.params.businessId
					membersChart.offset = $scope.params.offset
					membersChart.monthDays = $scope.params.monthDays
					$scope.loading = true
					Member.getMembersChart( membersChart )
						.$promise.then( function ( res ) {
						var DAY_MILLISECONDS = 24 * 60 * 60 * 1000
						$scope.loading = false
						var interval = res.result.date[ 1 ] - res.result.date[ 0 ]
						var xAxesLabel = 'dashboard.xAxesLabelDaily'
						for ( var date in res.result.date ) {
							res.result.date[ date ] = translateNumberFilter ( persianDateFilter ( new Date ( res.result.date[ date ] ), 'yyyy/M/dd' ) )
						}
						$scope.labels = res.result.date
						$scope.series = [ translateFilter ( 'dashboard.newMembers' ), translateFilter ( 'dashboard.failedMembers' ) ]
						$scope.data = [
							res.result.verified,
							res.result.failed
						]
						$scope.type = 'line'
						if ( interval > DAY_MILLISECONDS ) {
							$scope.type = 'bar'
							xAxesLabel = 'dashboard.xAxesLabelMonthly'
						}
						$scope.colors = [ '#60BD68', '#cc0000' ]
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
						$log.error( 'can not get members chart info from data source: ' + error )
					}
				};
			},
			templateUrl: PREFIX + 'app/widgets/membersChart/tpl/membersChart.html'
		}
	} ] )
