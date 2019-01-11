/**
 * Created by rezanazari on 7/4/17.
 */
app.directive ( 'remainTime', ['PREFIX', '$log',
	function ( PREFIX, $log ) {
		return {
			scope: {
				params: '=options'
			},

			controller:  function ( $scope ) {
				$scope.percent = 0;
				checkTime ();
				$scope.$watch ( 'params.remainTime', function ( newVal, oldVal ) {
					if ( typeof newVal !== 'undefined' ) {
						checkTime ();
					}
				} );
				function checkTime () {
					if ( $scope.params.remainTime === 'undefined' || $scope.params.timeDuration === 'undefined' ) {
						$scope.params.remainTime = '';
						$scope.percent = 0;
					} else if ( $scope.params.remainTime === -1 ) {
						$scope.params.remainTime = 'unlimited';
						$scope.percent = 100;
					} else if ( $scope.params.remainTime !== -1 && $scope.params.timeDuration !== 0 ) {
						$scope.percent = Math.round ( ($scope.params.remainTime / $scope.params.timeDuration) * 100 );
					}
					$scope.chartOption = {
						percent:    $scope.percent,
						lineWidth:  5,
						trackColor: $scope.params.color.light,
						barColor:   $scope.params.color.info,
						scaleColor: false,
						size:       115,
						rotate:     0,
						lineCap:    'butt'
					};
				};
			},
			templateUrl: PREFIX + 'app/widgets/remainTime/tpl/remainTime.html'
		}
	}
] )
