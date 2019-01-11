/**
 * Created by rezanazari on 10/6/16.
 */
app.directive ( 'routersCount', ['PREFIX', 'Nas', '$log',
	function ( PREFIX, Nas, $log ) {
		return {
			scope: {
				params: '=options'
			},

			controller: function ( $scope ) {
				$scope.loading = false
				getRoutersCount ()
				$scope.$on ( $scope.params.reloadEvent, function ( event, data ) {
					$scope.params.fromDate = data.params.fromDate
					$scope.params.endDate = data.params.endDate
					$scope.params.businessId = data.params.businessId
					$scope.onLineNas = 0
					$scope.offLineNas = 0
					getRoutersCount ()
				} )

				function getRoutersCount () {
					$scope.loading = true
					var query = {}
					query.businessId = $scope.params.businessId
					Nas.getStatus( query )
						.$promise.then ( function ( nasStatus ) {
								$scope.onLineNas = nasStatus.onLine
								$scope.offLine = nasStatus.offLine
								$scope.loading = false
					} ), function ( error ) {
						$log.error ( 'can not get routers status from data source: ' + error )
					}
				};
			}

			,
			templateUrl: PREFIX + 'app/widgets/routersCount/tpl/routersCount.html'
		}
	}
] )
