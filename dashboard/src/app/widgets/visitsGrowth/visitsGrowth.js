/**
 * Created by hamidehnouri on 10/1/2016 AD.
 */

app.directive( 'visitGrowth', [ '$log', 'PREFIX', 'FootTraffic',
	function ( $log, PREFIX, FootTraffic ) {
		return {
			scope: {
				params: '=options'
			},

			controller:  function ( $scope ) {
				$scope.loading = false
				growthWidget ()
				$scope.$on( $scope.params.reloadEvent, function ( event, data ) {
					$scope.params.fromDate = data.params.fromDate
					$scope.params.endDate = data.params.endDate
					growthWidget ()
				} )

				function growthWidget () {
					$scope.visits = 0
					$scope.mirrorVisits = 0
					$scope.percent = 0
					$scope.textClass = 'muted'
					$scope.iconClass = ''

					var visitGrowth = {}
					var cssClass = 'muted'
					var iconClass = ''
					var posCss = 'growth-positive'
					var posIcon = 'fa-long-arrow-up'
					var negCss = 'danger-lter'
					var negIcon = 'fa-long-arrow-down'
					visitGrowth.startDate = $scope.params.fromDate
					visitGrowth.endDate = $scope.params.endDate
					visitGrowth.businessId = $scope.params.businessId
					$scope.loading = true
					FootTraffic.getVisitsPercent( visitGrowth )
						.$promise.then( function ( res ) {
						$scope.loading = false
						if ( res ) {
							$scope.visits = res.visits
							$scope.mirrorVisits = res.mirrorVisits
							$scope.percent = res.percent
							if ( $scope.percent > 0 ) {
								cssClass = posCss
								iconClass = posIcon
							}
							if ( $scope.percent < 0 ) {
								cssClass = negCss
								iconClass = negIcon
							}
							$scope.textClass = cssClass
							$scope.iconClass = iconClass
						}
					}, function ( error ) {
						$log.error( 'can not get visits count and growth rate from data source: ', error )
					} )
				};
			},
			templateUrl: PREFIX + 'app/widgets/visitsGrowth/tpl/visitsGrowth.html'
		}
	} ] )
