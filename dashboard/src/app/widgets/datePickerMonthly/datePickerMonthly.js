/**
 * Created by rezanazari on 3/16/18.
 */

app.directive ( 'datePickerMonthly', [ 'PREFIX', '$log', 'persianDateFilter', 'translateNumberFilter', 'translateFilter', 'dashboardTiming',
	function ( PREFIX, $log, persianDateFilter, translateNumberFilter, translateFilter, dashboardTiming ) {
		return {
			scope:       {
				updateDashboard: '&'
			},
			controller:  function ( $scope ) {
				$scope.dateFormats = [ 'dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate', 'MM' ]
				$scope.persianMonth = []
				for ( var i = 1; i <= 12; i++ ) {
					$scope.persianMonth.push ( { code: i, name: translateFilter ( 'persianMonth.' + i ) } )
				}
				$scope.month = parseInt ( persianDateFilter ( new Date (), $scope.dateFormats[ 4 ] ) )
				$scope.getDates = function () {
					var fromDate = new Date ( new Date ().getTime () ).setHours ( 0, 0, 0, 0 )
					var endDate = new Date ( new Date ().getTime () ).setHours ( 23, 59, 59, 0 )
					var monthTime = dashboardTiming.getMonthTiming ( $scope.month )
					if ( monthTime ) {
						fromDate = monthTime.stratDate
						endDate = monthTime.endDate
					}
					var result = {}
					result.fromDate = fromDate
					result.endDate = endDate
					$scope.updateDashboard ( { option: result } )
				}
			},
			templateUrl: PREFIX + 'app/widgets/datePickerMonthly/tpl/datePickerMonthly.html'
		}
	}
] )
