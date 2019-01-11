/**
 * Created by rezanazari on 7/4/17.
 */
app.directive ( 'planInfo', ['PREFIX', '$log', 'persianDateFilter', 'translateNumberFilter',
	function ( PREFIX, $log, persianDateFilter, translateNumberFilter ) {
		return {
			scope: {
				params: '=options'
			},

			controller:  function ( $scope ) {
				var dayMilliSecond = 24 * 60 * 60 * 1000;
				var monthDays = 31;
				var yearDays = 365;
				$scope.dateFormats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate']
				$scope.dateFormat = $scope.dateFormats[1]

				$scope.params.expireDate = translateNumberFilter ( persianDateFilter ( new Date ( $scope.params.startDate ), $scope.dateFormat ) );
				$scope.$watch ( 'params.package.duration', function ( newVal, oldVal ) {
					if ( typeof newVal !== 'undefined' ) {
						var days = 0;
						var duration = $scope.params.package.duration;
						switch ( $scope.params.package.type ) {
							case 'daily', 'dynamic':
								days = duration;
								break;
							case 'monthly':
								days = duration * monthDays;
								break;
							case 'yearly':
								days = duration * yearDays;
								break;
						}
						var expireDate = $scope.params.startDate + days * dayMilliSecond;
						$scope.params.expireDate = translateNumberFilter ( persianDateFilter ( new Date ( expireDate ), $scope.dateFormat ) );
					}
				} );

			},
			templateUrl: PREFIX + 'app/widgets/planInfo/tpl/planInfo.html'
		}
	}
] )
