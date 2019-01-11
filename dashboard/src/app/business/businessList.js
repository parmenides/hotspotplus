/**
 * Created by hamidehnouri on 8/8/2016 AD.
 */

app.controller ( 'businessList', [ '$state', '$scope', '$log', 'translateFilter', 'Business', 'Reseller', 'uiGridConstants', 'genericService', 'persianDateFilter', 'translateNumberFilter', 'credit', 'appMessenger', '$uibModal', 'PREFIX', 'englishNumberFilter',
	function ( $state, $scope, $log, translateFilter, Business, Reseller, uiGridConstants, genericService, persianDateFilter, translateNumberFilter, credit, appMessenger, $uibModal, PREFIX, englishNumberFilter ) {
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
			enableFiltering:          true,
			minRowsToShow:            12,
			columnDefs:               [
				{
					displayName:      'general.title',
					field:            'title',
					enableHiding:     false,
					enableSorting:    false,
					width:            120,
					enableColumnMenu: false,
					headerCellFilter: 'translate',
					cellTemplate:     '<a class="btn btn-link" ng-click="grid.appScope.showBusinessInfo(row)">{{row.entity.title}}</a>'
				},

				{
					displayName:      'general.routerActivated',
					field:            'routerActivated',
					enableHiding:     false,
					width:            100,
					enableSorting:    false,
					enableColumnMenu: false,
					headerCellFilter: 'translate',
					cellTemplate:     '<div class="ui-grid-cell-contents"><span ng-if="row.entity.mobile"> <span ng-if="row.entity.routerActivated">Active</span> </span></div>'
				},

				{
					displayName:      'reseller.title',
					field:            'resellerTitle',
					width:            100,
					enableHiding:     false,
					enableSorting:    false,
					enableColumnMenu: false,
					headerCellFilter: 'translate'
				},
				{
					displayName:      'business.creationDate',
					field:            'creationDate',
					enableHiding:     false,
					enableSorting:    false,
					enableColumnMenu: false,
					headerCellFilter: 'translate',
					cellTemplate:     '<div class="ui-grid-cell-contents">{{row.entity.creationDate |  persianDate : "fullDate" | translateNumber }}</div>'
				},
				{
					displayName:      'general.package',
					field:            'title',
					enableHiding:     false,
					enableSorting:    false,
					width:            85,
					enableColumnMenu: false,
					cellClass:        'center',
					headerCellFilter: 'translate',
					cellTemplate:     '<a class="btn btn-link" ng-click="grid.appScope.manageBusinessPackage(row)"><i class="fa fa-fw fa-rocket"></i></a>'
				},
				{
					displayName:      'business.reseller',
					field:            'title',
					enableHiding:     false,
					enableSorting:    false,
					width:            85,
					enableColumnMenu: false,
					cellClass:        'center',
					headerCellFilter: 'translate',
					cellTemplate:     '<a class="btn btn-link" ng-click="grid.appScope.openAssignBusinessToResellerForm(row)"><i class="fa fa-fw fa-support"></i></a>'
				},
				{
					displayName:      'business.smsCredit',
					field:            'addCharge',
					width:            85,
					enableHiding:     false,
					enableSorting:    false,
					enableColumnMenu: false,
					enableFiltering:  false,
					headerCellFilter: 'translate',
					cellTemplate:     '<a class="btn btn-link" ng-click="grid.appScope.increaseCredit(row)"><i class="fa fa-fw fa-credit-card"></i>&nbsp;{{row.entity.balance | translateNumber }}&nbsp;{{"general.toman"|translate}}</a>'
				}, {
					displayName:      'general.changePassword',
					field:            'changePassword',
					width:            85,
					enableHiding:     false,
					enableSorting:    false,
					enableColumnMenu: false,
					enableFiltering:  false,
					headerCellFilter: 'translate',
					cellClass:        'center',
					cellTemplate:     '<a class="btn btn-link" ng-click="grid.appScope.changePassword(row)"><i class="fa fa-fw fa-key"></i></a>'
				},
				{
					displayName:      'general.invoices',
					field:            'invoices',
					width:            85,
					enableHiding:     false,
					enableSorting:    false,
					enableColumnMenu: false,
					enableFiltering:  false,
					headerCellFilter: 'translate',
					cellClass:        'center',
					cellTemplate:     '<a class="btn btn-link" ng-click="grid.appScope.showInvoices(row)" ><i class="fa fa-fw fa-binoculars"></i></a>'
				},
				{
					displayName:      'general.remove',
					field:            'delete',
					width:            85,
					enableHiding:     false,
					enableSorting:    false,
					enableColumnMenu: false,
					enableFiltering:  false,
					headerCellFilter: 'translate',
					cellClass:        'center',
					cellTemplate:     '<a class="btn btn-link" ng-click="grid.appScope.deleteBusiness(row)" ><i class="fa fa-fw fa-trash"></i></a>'
				}
			],
			onRegisterApi:            function ( gridApi ) {
				$scope.gridApi = gridApi
				$scope.gridApi.core.on.sortChanged ( $scope, function ( grid, sortColumns ) {
					if ( sortColumns.length == 0 ) {
						$scope.paginationOptions.sort = null
					} else {
						$scope.paginationOptions.sort = sortColumns[ 0 ].name + ' ' + sortColumns[ 0 ].sort.direction.toUpperCase ()
					}
					getPage ()
				} )
			}
		}

		$scope.businessId = '';
		$scope.businessMobile = '';
		$scope.isSearching = false;

		$scope.increaseCredit = function ( row ) {
			var businessId = row.entity.id
			Business.getBalance ( { businessId: businessId } ).$promise.then (
				function ( result ) {
					var balance = result.balance
					credit.showIncreaseCreditForm ( {
							title:          'business.smsCharge',
							cancelBtnLabel: 'general.cancel',
							submitBtnLabel: 'business.increaseCredit',
							message:        'business.smsCredit',
							balance:        balance,
							description:    'smsCharge',
							chargedBy:      'admin',
							businessId:     businessId,
							saveCallback:   function ( error, message ) {
								if ( error ) {
									appMessenger.showError ( message )
								} else {
									appMessenger.showSuccess ( message )
									$state.reload ()
								}
							},
							cancelCallback: function () {
							}
						}
					)
				},
				function ( error ) {
					appMessenger.showError ( 'business.balanceLoadUnSuccessful' );
					return error
				}
			)
		};

		$scope.changePassword = function ( row ) {
			$uibModal.open ( {
				backdrop:      true,
				animation:     true,
				keyboard:      true,
				backdropClick: true,
				scope:         $scope,
				templateUrl:   PREFIX + 'app/business/tpl/changePasswordForm.html',
				controller:    [ '$scope', '$uibModalInstance', 'Business', function ( $scope, $uibModalInstance, Business ) {
					var business = row.entity
					$scope.data = {};
					$scope.data.businessId = business.id;
					$scope.cancel = function () {
						$uibModalInstance.close ()
					};
					$scope.save = function () {
						Business.resetPasswordByAdmin ( $scope.data ).$promise.then ( function ( result ) {
							$log.debug ( result );
							appMessenger.showSuccess ( result.password );
						}, function ( error ) {
							$log.error ( error );
							appMessenger.showError ( 'error.generalError' );
						} )
					}
				} ]
			} )
		};

		$scope.deleteBusiness = function ( row ) {
			genericService.showConfirmDialog ( {
				title:       'general.warning',
				message:     'general.areYouSure',
				noBtnLabel:  'general.no',
				yesBtnLabel: 'general.yes',
				yesCallback: function () {
					var businessId = row.entity.id
					var index = $scope.gridOptions.data.indexOf ( row.entity )

					Business.destroyById ( { id: businessId } ).$promise.then ( function ( res ) {
						$scope.gridOptions.data.splice ( index, 1 )
					}, function ( err ) {
					} )
				},
				NoCallback:  function () {
				}
			} )
		};

		$scope.showBusinessInfo = function ( row ) {
			if ( row ) {
				var businessId = row.entity.id;
				Business.findById ( { id: businessId } ).$promise.then ( function ( res ) {
					var business = res;
					$uibModal.open ( {
						backdrop:      true,
						animation:     true,
						keyboard:      true,
						size:          'lg',
						backdropClick: true,
						scope:         $scope,
						templateUrl:   PREFIX + 'app/business/tpl/businessInfo.html',
						controller:    [ '$scope', '$uibModalInstance', function ( $scope, $uibModalInstance ) {
							$scope.business = business;
							$scope.cancel = function () {
								$uibModalInstance.close ()
							};
						} ]
					} )
				}, function ( error ) {
					$log.error ( error );
					appMessenger.showError ( 'error.generalError' )
				} )
			}
		}
		$scope.manageBusinessPackage = function ( row ) {
			var businessId = row.entity.id;
			Business.findById ( { id: businessId } ).$promise.then ( function ( res ) {
				var business = res;
				var options = {
					title:       'reseller.editBusiness',
					newBusiness: false
				}
				$uibModal.open ( {
					backdrop:      true,
					animation:     true,
					keyboard:      true,
					backdropClick: true,
					scope:         $scope,
					templateUrl:   PREFIX + 'app/business/tpl/businessForm.html',
					controller:    [ '$scope', '$uibModalInstance', function ( $scope, $uibModalInstance ) {
						if ( business.services && business.services.duration ) {
							business.services.durationInMonths = business.services.duration
						}
						$scope.serviceOption = {};
						$scope.serviceItem = business.services || {};
						$scope.options = options;
						$scope.options.cancelBtnLabel = 'general.cancel';
						$scope.options.saveBtnLabel = 'general.save';
						// Persian date picker methods
						$scope.dateOptions = {
							formatYear:  'yy',
							startingDay: 6
						};
						$scope.dateFormats = [ 'dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate' ];
						$scope.dateFormat = $scope.dateFormats[ 0 ];
						$scope.disabled = function ( date, mode ) {
							return (mode === 'day' && date.getDay () === 5)
						};
						$scope.selectDate = function ( $event ) {
							$event.preventDefault ();
							$event.stopPropagation ();
							$scope.calendarIsOpen = true
						};
						$scope.cancel = function () {
							$uibModalInstance.close ()
						};
						$scope.save = function () {
							if ( $scope.serviceOption.subscriptionDate ) {
								$scope.serviceOption.subscriptionDate = new Date ( $scope.serviceOption.subscriptionDate ).getTime ();
							}
							if ( $scope.serviceOption.duration ) {
								$scope.serviceOption.duration = Number(englishNumberFilter ( $scope.serviceOption.duration ));
							}
							if ( $scope.serviceOption.allowedOnlineUsers ) {
								$scope.serviceOption.allowedOnlineUsers = Number(englishNumberFilter ( $scope.serviceOption.allowedOnlineUsers ));
							}

							Business.assignPackageToBusiness ( {
								businessId: business.id,
								packageId:  $scope.serviceItem.id,
								options:    $scope.serviceOption
							} ).$promise.then ( function ( res ) {
									appMessenger.showSuccess ( 'business.updateSuccessFull' );
									getPage ();
									$uibModalInstance.close ()
								},
								function ( err ) {
									appMessenger.showError ( 'error.generalError' )
								} )

						}
					} ]
				} )
			}, function ( error ) {
				$log.error ( error );
				appMessenger.showError ( 'error.generalError' )
			} )
		}

		$scope.openAssignBusinessToResellerForm = function ( row ) {
			var businessId = row.entity.id;
			Business.findById ( { id: businessId } ).$promise.then ( function ( business ) {
				$uibModal.open ( {
					backdrop:      true,
					animation:     true,
					keyboard:      true,
					backdropClick: true,
					scope:         $scope,
					templateUrl:   PREFIX + 'app/business/tpl/assignBusinessToResellerForm.html',
					controller:    [ '$scope', '$uibModalInstance', function ( $scope, $uibModalInstance ) {
						$scope.data = {
							businessId:    businessId,
							resellerId:    business.resellerId
						}
						$scope.options = {};
						$scope.options.saveBtnLabel = 'general.save';
						$scope.cancel = function () {
							$uibModalInstance.close ()
						};
						$scope.save = function () {
							Reseller.assignBusinessToReseller ( $scope.data ).$promise.then ( function () {
								appMessenger.showSuccess ( 'business.updateSuccessFull' );
								getPage ();
								$uibModalInstance.close ()
							}, function ( error ) {
								appMessenger.showError ( 'error.generalError' )
							} )
						}
					} ]
				} )

			}, function ( error ) {
				$log.error ( error );
				appMessenger.showError ( 'error.generalError' )
			} )
		};

		$scope.showInvoices = function ( row ) {
			var businessId = row.entity.id;
			var options = { filter: {} }
			options.id = businessId

			Business.invoices ( options ).$promise.then ( function ( invoices ) {
				$uibModal.open ( {
					backdrop:      true,
					animation:     true,
					keyboard:      true,
					backdropClick: true,
					size:          'lg',
					scope:         $scope,
					templateUrl:   PREFIX + 'app/common/tpl/invoices.html',
					controller:    [ '$scope', '$uibModalInstance', function ( $scope, $uibModalInstance ) {
						$scope.options = {
							title:      'general.invoices',
							okBtnLabel: 'general.ok',
							invoices:   invoices
						};
						$scope.ok = function () {
							$uibModalInstance.close ()
						}
					} ]
				} )
			}, function ( error ) {
				$log.error ( error )
			} );
		};

		$scope.$watch ( 'paginationOptions.itemPerPage', function ( oldValue, newValue ) {
			getPage ()
		} );

		$scope.pageChanges = function () {
			getPage ()
		};

		$scope.searchBusiness = function () {
			var filter = {};
			if ( $scope.businessId ) {
				filter.id = $scope.businessId;
			}
			if ( $scope.businessMobile ) {
				var mobilePattern = '/' + englishNumberFilter ( $scope.businessMobile ) + '/i';
				filter.mobile = { "regexp": mobilePattern };
			}
			$scope.isSearching = true;
			getPage ( filter );
		};

		$scope.$watchGroup ( [ 'businessId', 'businessMobile' ], function ( newValues, oldValues, scope ) {
			if ( newValues != oldValues && newValues[ 0 ].length == 0 && newValues[ 1 ].length == 0 ) {
				getPage ();
			}
		} );

		$scope.clearSearch = function () {
			if ( $scope.businessId ) {
				$scope.businessId = '';
			}
			if ( $scope.businessMobile ) {
				$scope.businessMobile = '';
			}
			$scope.isSearching = false;
			getPage ();
		};

		var getPage = function ( inputFilter ) {
			switch ( $scope.paginationOptions.sort ) {
				case uiGridConstants.ASC:
					break
				case uiGridConstants.DESC:
					break
				default:
					break
			}
			var options = { filter: {} }
			if ( inputFilter ) {
				options.filter.where = inputFilter;
			}
			options.filter.sort = $scope.paginationOptions.sort
			options.filter.skip = ($scope.paginationOptions.pageNumber - 1) * $scope.paginationOptions.itemPerPage
			options.filter.limit = $scope.paginationOptions.itemPerPage

			Business.count ( { where: inputFilter } ).$promise.then ( function ( result ) {
				$scope.gridOptions.totalItems = result.count
				$scope.paginationOptions.totalItems = result.count
			}, function ( error ) {
				$log.error ( error )
			} )
			Business.find ( options ).$promise.then ( function ( businesses ) {
				$scope.gridOptions.data = businesses
				$scope.isSearching = false;
				angular.forEach ( businesses, function ( business, index ) {
					Business.getBalance ( { businessId: business.id } ).$promise.then (
						function ( res ) {
							$scope.gridOptions.data[ index ].balance = res.balance
							if ( business.resellerId ) {
								Reseller.findById ( { id: business.resellerId } ).$promise.then ( function ( reseller ) {
									$scope.gridOptions.data[ index ].resellerTitle = reseller.title
								}, function ( error ) {
									$log.error ( error )
									appMessenger.showError ( 'error.generalError' )
								} )
							}
						},
						function ( error ) {
							appMessenger.showError ( 'business.balanceLoadUnSuccessful' )
							return error
						}
					)
				} )
			}, function ( error ) {
				$log.error ( error )
			} )
		}
	} ] )
