/**
 * Created by hamidehnouri on 8/8/2016 AD.
 */

app.controller ( 'couponList', [ '$scope', '$state', '$log', 'translateFilter', 'Campaign', 'Coupon', 'uiGridConstants', '$http', 'genericService', 'Session', '$uibModal', 'PREFIX', 'appMessenger',
	function ( $scope, $state, $log, translateFilter, Campaign, Coupon, uiGridConstants, $http, genericService, Session, $uibModal, PREFIX, appMessenger ) {


		if ( Session.userType == 'Admin' ) {
			$scope.ownerId = 'Admin'
		} else if ( Session.userType == 'Business' ) {
			$scope.ownerId = Session.business.id;
		}

		$scope.paginationOptions = {
			pageNumber:  1,
			itemPerPage: 10,
			sort:        null
		};

		$scope.gridOptions = {
			enableSorting:            true,
			enablePaginationControls: false,
			enableRowSelection:       false,
			enableSelectAll:          false,
			selectionRowHeaderWidth:  35,
			rowHeight:                36,
			showGridFooter:           true,
			enableColumnResizing:     true,
			minRowsToShow:            11,
			columnDefs:               [
				{
					displayName:      'coupon.code',
					field:            'code',
					enableHiding:     false,
					enableSorting:    false,
					enableColumnMenu: false,
					headerCellFilter: 'translate',
					cellTemplate:     '<a class="btn btn-link" ng-click="grid.appScope.openCouponDetailsModal(row.entity.id)">{{row.entity.code}}</a>'
				},
				{
					displayName:      'coupon.value',
					field:            'value',
					enableHiding:     false,
					enableSorting:    false,
					enableColumnMenu: false,
					headerCellFilter: 'translate',
					cellTemplate:     '<div class="ui-grid-cell-contents">{{row.entity.value.amount | translateNumber }}&nbsp;{{"general."+row.entity.value.unit | translate }}</div>'
				},
				{
					displayName:      'coupon.count',
					field:            'count',
					enableHiding:     false,
					enableSorting:    false,
					enableColumnMenu: false,
					headerCellFilter: 'translate',
					cellTemplate:     '<div class="ui-grid-cell-contents">{{row.entity.count | translateNumber }}&nbsp;{{"general.count" | translate }}</div>'
				},
				{
					displayName:      'coupon.status',
					field:            'used',
					enableHiding:     false,
					enableSorting:    false,
					enableColumnMenu: false,
					headerCellFilter: 'translate',
					cellTemplate:     '<div class="ui-grid-cell-contents">' +
					                  '<span>' +
					                  '{{row.entity.used | translateNumber}}&nbsp;{{"general.count" | translate}}&nbsp;{{"coupon.redeemed" | translate}}' +
					                  '</span>' +
					                  '<a class="btn btn-link" ng-if="row.entity.used < row.entity.count" ng-click="grid.appScope.openCouponDetailsModal(row.entity.id)">' +
					                  '<i class="fa fa-money"></i></a></div>'
				},
				{
					displayName:      'coupon.creationDate',
					field:            'creationDate',
					width:            270,
					enableHiding:     false,
					enableSorting:    false,
					enableColumnMenu: false,
					headerCellFilter: 'translate',
					cellTemplate:     '<div class="ui-grid-cell-contents">{{row.entity.creationDate |  persianDate : "fullDate" | translateNumber }}{{"general.,"| translate}}&nbsp;{{"general.hour"| translate}}:&nbsp;{{row.entity.creationDate |  date : "HH:mm" | translateNumber }}</div>'
				},
				{
					displayName:      'coupon.redeemDate',
					field:            'redeemDate',
					width:            270,
					enableHiding:     false,
					enableSorting:    false,
					enableColumnMenu: false,
					headerCellFilter: 'translate',
					cellTemplate:     '<div class="ui-grid-cell-contents">' +
					                  '<span ng-if="row.entity.redeemDate">' +
					                  '{{row.entity.redeemDate |  persianDate : "fullDate" | translateNumber }}{{"general.,"| translate}}&nbsp;{{"general.hour"| translate}}:&nbsp;{{row.entity.redeemDate |  date : "HH:mm" | translateNumber }}' +
					                  '</span>' +
					                  '<span ng-if="!row.entity.redeemDate">-</span>' +
					                  '</div>'
				},
				{
					displayName:      'coupon.campaignName',
					field:            'campaignName',
					enableHiding:     false,
					enableSorting:    false,
					enableColumnMenu: false,
					headerCellFilter: 'translate'
				}
			],
			onRegisterApi:            function ( gridApi ) {
				$scope.gridApi = gridApi;
				$scope.gridApi.core.on.sortChanged ( $scope, function ( grid, sortColumns ) {
					if ( sortColumns.length == 0 ) {
						$scope.paginationOptions.sort = null
					} else {
						$scope.paginationOptions.sort = sortColumns[ 0 ].name + ' ' + sortColumns[ 0 ].sort.direction.toUpperCase ()
					}
					getPage ()
				} )
			}
		};

		$scope.addOrEditCoupon = function ( row ) {
			if ( row ) {
				var couponId = row.entity.id;
				Coupon.findById ( { id: couponId } ).$promise.then ( function ( res ) {
					$scope.openCouponForm ( res, {
						title:     'coupon.editCoupon',
						newCoupon: false
					} )
				}, function ( error ) {
					$log.error ( error );
					appMessenger.showError ( 'error.generalError' )
				} )
			} else {
				$scope.openCouponForm (
					{
						ownerId:      'Admin',
						used:         0,
						creationDate: new Date ().getTime (),
						value:        {
							amount: 10,
							unit:   'percent'
						}
					}, {
						title:     'coupon.addCoupon',
						newCoupon: true
					}
				);
			}
		};

		$scope.openCouponForm = function ( coupon, options ) {
			$uibModal.open ( {
				backdrop:      true,
				animation:     true,
				keyboard:      true,
				backdropClick: true,
				scope:         $scope,
				templateUrl:   PREFIX + 'app/coupon/tpl/couponForm.html',
				controller:    [ '$scope', '$uibModalInstance', function ( $scope, $uibModalInstance ) {
					$scope.coupon = coupon;
					$scope.options = options;
					$scope.options.cancelBtnLabel = 'general.cancel';
					$scope.options.saveBtnLabel = 'general.save';
					$scope.cancel = function () {
						$uibModalInstance.close ()
					};
					$scope.save = function ( error ) {
						var validationError = false;
						if ( !error && !validationError ) {
							if ( !$scope.coupon.id ) {
								Coupon.create ( $scope.coupon ).$promise.then ( function ( res ) {
									appMessenger.showSuccess ( 'coupon.createSuccessFull' );
									getPage ();
									$uibModalInstance.close ()
								}, function ( err ) {
									appMessenger.showError ( 'error.generalError' )
								} )
							} else {
								Coupon.prototype$updateAttributes ( { id: $scope.coupon.id }, $scope.coupon ).$promise.then ( function ( res ) {
										appMessenger.showSuccess ( 'coupon.updateSuccessFull' );
										getPage ();
										$uibModalInstance.close ();
									},
									function ( err ) {
										if ( err.status == 422 ) {
											appMessenger.showError ( 'coupon.duplicateCode' )
										} else {
											appMessenger.showError ( 'error.generalError' )
										}
									} )
							}
						} else if ( error ) {
							appMessenger.showError ( 'general.allFieldsRequired' )
						}
					}
				} ]
			} )
		};

		$scope.searchCoupon = function () {
			$uibModal.open ( {
				backdrop:      true,
				animation:     true,
				keyboard:      true,
				backdropClick: true,
				scope:         $scope,
				templateUrl:   PREFIX + 'app/coupon/tpl/searchCouponForm.html',
				controller:    [ '$scope', '$uibModalInstance', function ( $scope, $uibModalInstance ) {
					$scope.isSearchingCoupon = false;
					$scope.cancel = function () {
						$uibModalInstance.close ();
					};
					$scope.searchCoupon = function ( couponCode ) {
						if ( couponCode ) {
							$scope.isSearchingCoupon = true;
							$scope.noCouponFound = false;

							var options = { filter: {} };
							options.filter.where = { code: couponCode, ownerId: $scope.ownerId };
							Coupon.find ( options ).$promise.then ( function ( result ) {
								$scope.isSearchingCoupon = false;
								if ( result[ 0 ] ) {
									var couponId = result[ 0 ].id;
									$scope.noCouponFound = false;
									$uibModalInstance.close ();
									$scope.openCouponDetailsModal ( couponId );
								} else {
									$scope.noCouponFound = true;
								}
							}, function ( error ) {
								$log.error ( error )
							} );
						}
					}
				} ]
			} )
		};

		$scope.openCouponDetailsModal = function openCouponDetailsModal ( couponId ) {
			Coupon.findById ( { id: couponId } ).$promise.then ( function ( coupon ) {
				$uibModal.open ( {
					backdrop:      true,
					animation:     true,
					keyboard:      true,
					backdropClick: true,
					scope:         $scope,
					templateUrl:   PREFIX + 'app/coupon/tpl/couponDetails.html',
					controller:    [ '$scope', '$uibModalInstance', function ( $scope, $uibModalInstance ) {
						$scope.coupon = coupon;
						$scope.cancel = function () {
							$uibModalInstance.close ();
						};
						$scope.redeem = function (coupon) {
							$uibModalInstance.close ();
							$uibModal.open ( {
								backdrop:      true,
								animation:     true,
								keyboard:      true,
								backdropClick: true,
								templateUrl:   PREFIX + 'app/common/tpl/areYouSure.html',
								controller:    [ '$scope', '$uibModalInstance', function ( $scope, $uibModalInstance ) {
									$scope.options = {
										title:       'coupon.redeem',
										message:     'coupon.areYouSureRedeem',
										noBtnLabel:  'general.no',
										yesBtnLabel: 'general.yes'
									};
									$scope.no = function () {
										$uibModalInstance.close ();
									};
									$scope.yes = function () {
										Coupon.prototype$updateAttributes ( {
											id: couponId
										}, {
											used:       coupon.used+1,
											redeemDate: new Date ().getTime ()
										} ).$promise.then ( function ( res ) {
											appMessenger.showSuccess ( 'coupon.redeemedSuccessFull' );
											$uibModalInstance.close ();
											getPage ()
										}, function ( err ) {
											appMessenger.showError ( 'coupon.redeemedUnSuccessFull' )
										} );
									}
								} ]
							} );
						}
					} ]
				} )
			} )
		};

		$scope.$watch ( 'paginationOptions.itemPerPage', function ( oldValue, newValue ) {
			getPage ()
		} );

		$scope.pageChanges = function () {
			getPage ()
		};

		var getPage = function () {
			switch ( $scope.paginationOptions.sort ) {
				case uiGridConstants.ASC:
					break;
				case uiGridConstants.DESC:
					break;
				default:
					break
			}

			var options = { filter: {} };
			options.filter.where = { ownerId: $scope.ownerId };
			options.filter.sort = $scope.paginationOptions.sort;
			options.filter.skip = ($scope.paginationOptions.pageNumber - 1) * $scope.paginationOptions.itemPerPage;
			options.filter.limit = $scope.paginationOptions.itemPerPage;

			Coupon.count ( { where: { ownerId: $scope.ownerId } } ).$promise.then ( function ( result ) {
				$scope.gridOptions.totalItems = result.count;
				$scope.paginationOptions.totalItems = result.count
			}, function ( error ) {
				$log.error ( error )
			} );

			Coupon.find ( options ).$promise.then ( function ( coupons ) {
				$scope.gridOptions.data = coupons;
				angular.forEach ( coupons, function ( coupon, index ) {
					if ( coupon.campaignId ) {
						Campaign.findById ( { id: coupon.campaignId } ).$promise.then ( function ( campaign ) {
							$scope.gridOptions.data[ index ].campaignName = campaign.title
						}, function ( error ) {
							$log.error ( error );
							appMessenger.showError ( 'error.generalError' )
						} )
					} else {
						$scope.gridOptions.data[ index ].campaignName = '-'
					}
				} )
			}, function ( error ) {
				$log.error ( error )
			} )
		}
	}
] )
;
