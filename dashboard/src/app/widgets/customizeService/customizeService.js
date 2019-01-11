/**
 * Created by Payam on 10/6/16.
 */
app.directive ( 'customizeService', [ 'PREFIX', '$log', 'uibButtonConfig', 'Business', '$uibModal', 'Session',
	function ( PREFIX, $log, uibButtonConfig, Business, $uibModal, Session ) {
		//uibButtonConfig.activeClass = 'btn-primary';
		return {
			scope: {
				public: '=public'
			},

			controller:  function ( $scope ) {

				Business.loadServiceInfo ().$promise.then ( function ( serviceInfo ) {
					$scope.serviceTemplatesName = serviceInfo.serviceTemplatesName;
					$scope.serviceTemplates = serviceInfo.serviceTemplates;
					var onlineUsersPrice = serviceInfo.onlineUsersPrice;

					$scope.service = {};
					$scope.service.onlineUsers = 20;
					$scope.service.serviceTemplate = "customize";
					$scope.service.duration = 1;
					$scope.service.cost = 0;

					$scope.$watch ( 'service.serviceTemplate', function ( newValue, oldValue ) {
						if ( oldValue != newValue ) {
							var template = $scope.serviceTemplates[ newValue ];
							$scope.service.onlineUsers = template.onlineUsers;
							$scope.service.cost = calculateOnlineUsersCost ();
						}
					} );
					$scope.$watch ( 'service.onlineUsers', function () {
						$scope.service.cost = calculateOnlineUsersCost ();
					} );
					$scope.$watch ( 'service.duration', function () {
						$scope.service.cost = calculateOnlineUsersCost ();
					} );

					function calculateOnlineUsersCost () {
						var onlineUsers = $scope.service.onlineUsers;
						var onlineUsersCost = 0;
						for ( var i = 0; i < onlineUsersPrice.length; i++ ) {
							var priceRange = onlineUsersPrice[ i ];
							if ( onlineUsers > priceRange.from && onlineUsers <= priceRange.to ) {
								onlineUsersCost = ((onlineUsers - priceRange.from) * priceRange.price) + onlineUsersCost;
								onlineUsers = onlineUsers - (onlineUsers - priceRange.from);
							}
						}
						$scope.service.monthlyCost = onlineUsersCost;
						return (onlineUsersCost * $scope.service.duration );
					}
				}, function ( error ) {
					$log.error ( error );
				} );

				$scope.goToSignUp = function () {
					window.location.href = 'http://my.hotspotplus.ir/#/access/signup' ;
				};
				$scope.showServiceSummery = function () {
					$uibModal.open ( {
						backdrop:      true,
						scope:         $scope,
						animation:     true,
						keyboard:      true,
						backdropClick: true,
						templateUrl:   PREFIX + 'app/business/tpl/confirmService.html',
						controller:    [ '$scope', '$uibModalInstance', 'appMessenger', '$state',
							function ( $scope, $uibModalInstance, appMessenger, $state ) {
								$scope.cancel = function () {
									$uibModalInstance.close ()
								}
								$scope.openPaymentGateway = function () {
									var businessId = Session.business.id
									Business.buyService ( {
										businessId:       businessId,
										onlineUsers:      $scope.service.onlineUsers,
										durationInMonths: $scope.service.duration
									} ).$promise.then ( function ( result ) {
										$log.debug ( result );
										if ( result.url ) {
											window.location.href = result.url
										} else if ( result.ok ) {
											appMessenger.showSuccess ( 'business.serviceActivatedSuccessfully' )
											$uibModalInstance.close ()
											$state.reload ()
										}
									}, function ( error ) {
										$log.error ( error );
									} )
								}
							} ]
					} )

				}
			},
			templateUrl: PREFIX + 'app/widgets/customizeService/tpl/customizeService.html'
		}
	} ] )
