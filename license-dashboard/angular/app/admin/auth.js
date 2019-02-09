/**
 * Created by payamyousefi on 7/16/16.
 */

app.controller( 'AdminSignInController', [ '$scope', '$log', 'User', '$state', 'appMessenger','LoopBackAuth','RoleMapping','$q',
	function ( $scope, $log, User, $state, appMessenger,LoopBackAuth,RoleMapping,$q ) {
		$scope.credential = {}
		$scope.authError = null
		$scope.signIn = function () {
			User.login( $scope.credential ).$promise.then( function ( result ) {
				$state.go( 'app.licenses' );
				appMessenger.showSuccess( 'user.signInSuccessful' )
			}, function ( errorResult ) {
				$log.error( errorResult )
				appMessenger.showError( 'user.invalidLogin' )
			} )
		}

		$scope.signOut = function () {
			User.logout().$promise.then( function () {
				$state.go( 'access.adminSignIn' )
			}, function ( error ) {
				appMessenger.showError( 'auth.logoutFailed' )
			} )
		}
	} ] )
