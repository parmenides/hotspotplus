/**
 * Created by rezanazari on 3/16/18.
 */

app.directive ( 'datePickerAdvance', [ 'PREFIX', '$log', 'persianDateFilter', 'translateNumberFilter', 'translateFilter', 'dashboardTiming',
	function ( PREFIX, $log, persianDateFilter, translateNumberFilter, translateFilter, dashboardTiming ) {
		return {
			scope:       {
				updateDashboard: '&'
			},
			controller:  function ( $scope ) {
				var DAY_MILLISECONDS = 24 * 60 * 60 * 1000
				$scope.dateFormats = [ 'dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate', 'MM' ]
				$scope.isAdvance = true
				$scope.isBasic = false
				$scope.radioModel = 'monthly'
				$scope.showAdvance = function () {
					$scope.isAdvance = false
					$scope.isBasic = true
				}
				$scope.showBasic = function () {
					$scope.isAdvance = true
					$scope.isBasic = false
				}

				$scope.startDateCalendar = function ( $event ) {
					$event.preventDefault ()
					$event.stopPropagation ()
					$scope.startDateCalendarIsOpen = true
					$scope.endDateCalendarIsOpen = false
				}
				$scope.endDateCalendar = function ( $event ) {
					$event.preventDefault ()
					$event.stopPropagation ()
					$scope.endDateCalendarIsOpen = true
					$scope.startDateCalendarIsOpen = false
				}
				$scope.dateOptions = {
					formatYear:  'yy',
					startingDay: 6
				}
				$scope.dateFormat = $scope.dateFormats[ 0 ]

				$scope.getDates = function () {
					var today = new Date ()
					var fromDate = today
					var endDate = today.setHours ( 23, 59, 59, 0 )
					switch ( $scope.radioModel ) {
						case 'daily' :
							fromDate = new Date ( today.getTime () - DAY_MILLISECONDS ).setHours ( 0, 0, 0, 0 )
							if ( $scope.advanceTime ) {
								delete $scope.advanceTime
							}
							break
						case 'weekly' :
							fromDate = dashboardTiming.startOfWeek ( today )
							if ( $scope.advanceTime ) {
								delete $scope.advanceTime
							}
							break
						case 'monthly' :
							fromDate = dashboardTiming.startOfMonth ( today )
							if ( $scope.advanceTime ) {
								delete $scope.advanceTime
							}
							break
						case 'advance' : {
							fromDate = new Date ( $scope.fromDate ).setHours ( 0, 0, 0, 0 )
							endDate = new Date ( $scope.endDate ).setHours ( 0, 0, 0, 0 )
							if ( endDate <= fromDate ) {
								appMessenger.showError ( 'dashboard.endDateIncorrect' )
								fromDate = new Date ( $scope.fromDate ).setHours ( 0, 0, 0, 0 )
								endDate = new Date ( new Date ( $scope.fromDate ).getTime () + DAY_MILLISECONDS ).setHours ( 23, 59, 59, 0 )
							}
							$scope.advanceTime = dashboardTiming.advanceTime ( fromDate, endDate )
						}
							break
					}
					var result = {}
					result.fromDate = fromDate
					result.endDate = endDate
					result.advanceTime = $scope.advanceTime
					$scope.updateDashboard ( { option: result } )
				}
			},
			templateUrl: PREFIX + 'app/widgets/datePickerAdvance/tpl/datePickerAdvance.html'
		}
	}
] )