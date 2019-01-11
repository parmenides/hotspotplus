/**
 * Created by rezanazari on 7/4/17.
 */
app.directive ( 'usageChart', ['PREFIX', 'Member', '$log', 'Session', 'translateFilter', 'persianDateFilter', 'translateNumberFilter',
	function ( PREFIX, Member, $log, Session, translateFilter, persianDateFilter, translateNumberFilter ) {
		return {
			scope: {
				params: '=options'
			},

			controller:  function ( $scope ) {
				var options = {};
				if ( !Session.member.businessId || !Session.member.id ) {
					appMessenger.showError ( 'generalError' );
				} else {
					options.businessId = Session.member.businessId;
					options.memberId = Session.member.id;
					options.startDate = Session.member.subscriptionDate;

					Member.getDailyUsage ( options ).$promise.then ( function ( data ) {
						var persianDate = [];
						if ( data.date.length > 0 && data.date.length == data.download.length && data.date.length == data.upload.length ) {
							var date = data.date;
							var download = data.download;
							var upload = data.upload;
							for ( var i = 0; i < date.length; i++ ) {
								persianDate[i] = translateNumberFilter ( persianDateFilter ( new Date ( date[i] ), 'M/d' ) );
							}
							var xAxesLabel = 'dashboard.xAxesLabelDaily';
							$scope.labels = persianDate;
							$scope.series = [translateFilter ( 'dashboard.download' ), translateFilter ( 'dashboard.upload' )];
							$scope.data = [download, upload];
							$scope.type = 'line'
							$scope.colors = [$scope.params.color.success, $scope.params.color.primary]
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
											return data.datasets[tooltipItems.datasetIndex].label + ' : ' + translateNumberFilter ( tooltipItems.yLabel ) +
												' ' + translateFilter ( 'dashboard.Mbps' ) + ' '
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
													xLabels.forEach ( function ( labels, i ) {
														if ( i % 2 == 1 ) {
															xLabels[i] = ''
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
												labelString: translateFilter ( 'dashboard.yAxesLabelAmount' ) + ' ( ' + translateFilter ( 'dashboard.Mbps' ) + ' )',
												fontColor:   '#333'
											},
											ticks:      {
												beginAtZero: true,
												callback:    function ( value ) {
													return translateNumberFilter ( Number ( value ) )
												}
											}
										}
									]
								}
							}
						}
					}, function ( error ) {
						appMessenger.showError ( 'generalError' );
					} );
				}
			},
			templateUrl: PREFIX + 'app/widgets/memberUsage/tpl/usageChart.html'
		}
	}
] )
