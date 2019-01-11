/**
 * Created by hamidehnouri on 8/8/2016 AD.
 */

app.controller ( 'ticketDetailsController', [ '$scope', '$state', '$log', 'translateFilter', 'Campaign', 'Ticket', 'uiGridConstants', '$http', 'genericService', 'Session', '$uibModal', 'PREFIX', 'appMessenger', 'Business', '$stateParams',
	function ( $scope, $state, $log, translateFilter, Campaign, Ticket, uiGridConstants, $http, genericService, Session, $uibModal, PREFIX, appMessenger, Business, $stateParams ) {

		var ticketId = $stateParams.ticketId;
		Ticket.findById ( { id: ticketId } ).$promise.then ( function ( ticket ) {
			$scope.ticket = ticket;
		} );

		$scope.sendReply = function () {
			$uibModal.open ( {
				backdrop:      true,
				animation:     true,
				keyboard:      true,
				backdropClick: true,
				scope:         $scope,
				templateUrl:   PREFIX + 'app/ticket/tpl/ticketReplyForm.html',
				controller:    [ '$scope', '$uibModalInstance', 'Business', 'Ticket', function ( $scope, $uibModalInstance, Business, Ticket ) {

					$scope.message = {
						creationDate: new Date ().getTime ()
					};
					$scope.cancel = function () {
						$uibModalInstance.close ()
					};
					$scope.save = function ( error ) {
						if ( Session.userType === 'Business' ) {
							$scope.message.sendBy = "customer";
						} else if ( Session.userType === 'Admin' ) {
							$scope.message.sendBy = "support";
						}
						Ticket.replyToTicket ( {
							ticketId: ticketId,
							message:  $scope.message
						} ).$promise.then ( function () {
							appMessenger.showSuccess ( 'ticket.replySent' );
							$state.reload();
						}, function ( error ) {
							$log.error ( error );
							appMessenger.showError ( 'error.generalError' );
							return;
						} );
					}
				} ]
			} )
		}
	}
] )
;
