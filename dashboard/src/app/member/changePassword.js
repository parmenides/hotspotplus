/**
 * Created by rezanazari on 11/8/17.
 */

app.controller ( 'changePasswordCtrl', ['$scope', '$log', 'Session', 'appMessenger', '$uibModal', 'PREFIX', 'Member',
	function ( $scope, $log, Session, appMessenger, $uibModal, PREFIX, Member ) {

		if ( Session.member == null ) {
			return;
		}
		$scope.editPassword = function ( ) {
			var businessId = Session.member.businessId;
			var memberId = Session.member.id;
			Member.loadMemberPassword ( {
				businessId: businessId,
				memberId:   memberId
			} ).$promise.then ( function ( res ) {
				$uibModal.open ( {
					backdrop:      true,
					animation:     true,
					keyboard:      true,
					backdropClick: true,
					scope:         $scope,
					templateUrl:   PREFIX + 'app/member/tpl/passwordForm.html',
					controller:    [ '$scope', '$uibModalInstance', function ( $scope, $uibModalInstance ) {
						$scope.options = {
							title:               'member.editPassword',
							cancelBtnLabel:      'general.cancel',
							saveBtnLabel:        'general.save',
							saveAndSendBtnLabel: 'general.saveAndSendPass',
							sendBtnLabel:        'general.sendPass'
						}
						$scope.newPassword = null
						$scope.currentPassword = res.passwordText
						$scope.cancel = function () {
							$uibModalInstance.close ()
						}
						$scope.save = function ( sendMessage ) {
							$uibModalInstance.close ()
							if ( $scope.newPassword ) {
								Member.prototype$updateAttributes ( {
									id: memberId
								}, { passwordText: $scope.newPassword } ).$promise.then ( function ( res ) {
									appMessenger.showSuccess ( 'member.passwordChangeSuccessFull' )
									if ( sendMessage ) {
										$scope.sendPassword ( memberId )
									}
								}, function ( err ) {
									appMessenger.showError ( 'member.passwordChangeUnSuccessFull' )
								} )
							} else if ( sendMessage ) {
								$scope.sendPassword ( memberId )
							}
						}
					} ]
				} )
			}, function ( error ) {
				$log.error ( error )
				appMessenger.showError ( 'error.generalError' )
			} )
			$scope.sendPassword = function ( memberId ) {
				Member.sendPassword ( { memberId: memberId, businessId: businessId } ).$promise.then ( function ( result ) {
					appMessenger.showSuccess ( 'member.passwordSentSuccessFull' )
				}, function ( error ) {
					if ( error == 'memberNotFound' || error == 'noMobileNumber' || error == 'balanceNotEnough' ) {
						appMessenger.showError ( 'member.' + error )
						appMessenger.showError ( 'error.generalError' )
					} else {
						appMessenger.showError ( 'member.passwordSentUnSuccessFull' )
						appMessenger.showError ( 'error.generalError' )
					}
				} )
			};
		};
	}] );
