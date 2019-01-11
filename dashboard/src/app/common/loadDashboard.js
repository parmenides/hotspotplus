/**
 * Created by payamyousefi on 7/16/16.
 */

app.controller ( 'loadDashboardController', [ '$scope', '$log', 'Session', '$state', 'appMessenger', '$location', '$uibModal', 'PREFIX','Business',
	function ( $scope, $log, Session, $state, appMessenger, $location, $uibModal, PREFIX,Business ) {
		if ( $location.search ().license_updated ) {
			Business.reloadLicense();
		}
		if ( $location.search ().payed != undefined && $location.search ().payed != null ) {
			$uibModal.open ( {
				backdrop:      'static',
				animation:     true,
				keyboard:      true,
				backdropClick: true,
				scope:         $scope,
				templateUrl:   PREFIX + 'app/common/tpl/paymentResult.html',
				controller:    [ '$scope', '$uibModalInstance', function ( $scope, $uibModalInstance ) {
					$scope.options = {
						payed: $location.search ().payed
					}
					if ( $location.search ().error ) {
						$log.info ( 'error:', $location.search ().error )
					}
					$scope.ok = function () {
						$uibModalInstance.close ()
						//$state.go ( $state.$current, null, { reload: true } )
						$state.go ( 'access.signIn' );
						Session.clearSession ();
					}
				} ]
			} )
		} else if ( $location.search ().dropbox != undefined && $location.search ().dropbox != null ) {
			$uibModal.open ( {
				backdrop:      'static',
				animation:     true,
				keyboard:      true,
				backdropClick: true,
				scope:         $scope,
				templateUrl:   PREFIX + 'app/common/tpl/paymentResult.html',
				controller:    [ '$scope', '$uibModalInstance', function ( $scope, $uibModalInstance ) {
					$scope.options = {
						payed: $location.search ().dropbox
					}
					if ( $location.search ().error ) {
						$log.info ( 'error:', $location.search ().error )
					}
					$scope.ok = function () {
						$uibModalInstance.close ()
						$state.go ( $state.$current, null, { reload: true } )
					}
				} ]
			} )
		} else {
			if ( Session.isBusinessUser () && !Session.business ) {
				return $state.go ( 'access.signIn' )
			} else if ( Session.isResellerUser () && !Session.reseller ) {
				return $state.go ( 'access.resellerSignIn' )
			} else if ( Session.isAdminUser () && !Session.user ) {
				return $state.go ( 'access.adminSignIn' )
			} else if ( Session.isMemberUser () && !Session.member ) {
				return $state.go ( 'access.memberSignIn' )
			} else if ( Session.roles ) {
				if ( hasRole ( 'networkadmin' ) ) {
					// go to network admin dashboard
					$state.go ( 'app.networkAdminDashboard' )
				} else if ( hasRole ( 'headmaster' ) ) {
					// go to school head master dashboard
					$state.go ( 'app.headMasterDashboard' )
				} else if ( hasRole ( 'reseller' ) ) {
					// go to school head master dashboard
					$state.go ( 'app.resellerBusinessList' );
				} else if ( hasRole ( 'member' ) ) {
					// go to member dashboard
					$state.go ( 'app.memberDashboard' );
				} else if ( hasRole ( 'business' ) ) {
					return $state.go ( 'access.signIn' );
				} else if ( hasRole ( 'admin' ) ) {
					return $state.go ( 'access.adminSignIn' );
				} else {
					return $state.go ( 'access.signIn' )
				}
			} else {
				return $state.go ( 'access.signIn' )
			}
		}

		function hasRole ( role ) {
			$log.debug ( Session.roles.indexOf ( role ) !== -1 )
			return Session.roles.indexOf ( role ) !== -1
		};
	} ] )
