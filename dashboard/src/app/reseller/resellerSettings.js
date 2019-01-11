/**
 * Created by hamidehnouri on 8/8/2016 AD.
 */

app.controller ( 'resellerSettings', [ '$scope', '$log', '$state', 'Reseller', 'appMessenger', 'Session',
	function ( $scope, $log, $state, Reseller, appMessenger, Session ) {
		if ( Session.reseller == null ) {
			return
		}
		$scope.resellerBalance = 0;
		var resellerId = Session.reseller.id;
		Reseller.getBalance ( { resellerId: resellerId } ).$promise.then ( function ( res ) {
			$scope.resellerBalance = res.balance;
		}, function ( error ) {
			$log.error ( error );
			appMessenger.showError ( 'error.generalError' )
		} );
		/*
		 Reseller.getOnlineUsers ( { resellerId: resellerId } ).$promise.then ( function ( res ) {
		 $scope.allowedOnlineUsers = res.allowedOnlineUsers;
		 $scope.usedOnlineUsers = res.usedOnlineUsers
		 }, function ( err ) {
		 appMessenger.showError ( 'error.generalError' )
		 } );*/

		/*$scope.buyPackage = function () {
		 $state.go('app.resellersPackages');
		 }*/
	} ] );
