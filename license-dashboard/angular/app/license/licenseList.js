/**
 * Created by hamidehnouri on 8/8/2016 AD.
 */

app.controller ( 'licenseList', [ '$state', '$scope', '$log', 'translateFilter', 'License', 'uiGridConstants', 'genericService', 'persianDateFilter', 'translateNumberFilter', 'appMessenger', '$uibModal', 'PREFIX', 'englishNumberFilter',
	function ( $state, $scope, $log, translateFilter, License, uiGridConstants, genericService, persianDateFilter, translateNumberFilter, appMessenger, $uibModal, PREFIX, englishNumberFilter ) {
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
			enableFiltering:          false,
			minRowsToShow:            12,
			columnDefs:               [
				{
					displayName:      'general.mobile',
					field:            'mobile',
					enableHiding:     false,
					enableSorting:    false,
					width:            130,
					enableColumnMenu: false,
					headerCellFilter: 'translate',
					cellTemplate:     '<a class="btn btn-link" ng-click="grid.appScope.showLicenseInfo(row)">{{row.entity.mobile}}</a>'
				},
				{
					displayName:      'license.status',
					field:            'active',
					width:            85,
					enableColumnMenu: false,
					enableHiding:     false,
					enableSorting:    false,
					headerCellFilter: 'translate',
					cellClass:        'center',
					headerCellClass:  'headerCenter',
					cellTemplate:     '<a class="btn btn-link" ng-click="grid.appScope.activateLicense(row)" uib-popover={{grid.appScope.activateMemberHelpText}} popover-trigger="mouseenter"' +
					                  'popover-placement="right"><i class="fa fa-circle-o" ng-if="!row.entity.active"></i>' +
					                  '<i class="fa fa-dot-circle-o text-info" ng-if="row.entity.active"></i></a>'
				},
				{
					displayName:      'general.creationDate',
					field:            'creationDate',
					enableHiding:     false,
					enableSorting:    false,
					enableColumnMenu: false,
					headerCellFilter: 'translate',
				}, {
					displayName:      'license.serviceStatus',
					field:            'serviceStatus',
					enableHiding:     false,
					enableSorting:    false,
					enableColumnMenu: false,
					headerCellFilter: 'translate',
				},
				{
					displayName:      'license.assignService',
					field:            'delete',
					width:            100,
					enableHiding:     false,
					enableSorting:    false,
					enableColumnMenu: false,
					enableFiltering:  false,
					headerCellFilter: 'translate',
					cellClass:        'center',
					cellTemplate:     '<a class="btn btn-link" ng-click="grid.appScope.openAssignServiceForm(row)" ><i class="fa fa-fw fa-gear"></i></a>'
				},
				{
					displayName:      'license.assignModule',
					field:            'delete',
					width:            100,
					enableHiding:     false,
					enableSorting:    false,
					enableColumnMenu: false,
					enableFiltering:  false,
					headerCellFilter: 'translate',
					cellClass:        'center',
					cellTemplate:     '<a class="btn btn-link" ng-click="grid.appScope.openAssignModuleForm(row)" ><i class="fa fa-fw fa-puzzle-piece"></i></a>'
				},
				{
					displayName:      'general.remove',
					field:            'delete',
					width:            100,
					enableHiding:     false,
					enableSorting:    false,
					enableColumnMenu: false,
					enableFiltering:  false,
					headerCellFilter: 'translate',
					cellClass:        'center',
					cellTemplate:     '<a class="btn btn-link" ng-click="grid.appScope.deleteLicense(row)" ><i class="fa fa-fw fa-trash"></i></a>'
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

		$scope.licenseId = '';
		$scope.serviceProviderId = '';
		$scope.isSearching = false;

		$scope.deleteLicense = function ( row ) {
			genericService.showConfirmDialog ( {
				title:       'general.warning',
				message:     'general.areYouSure',
				noBtnLabel:  'general.no',
				yesBtnLabel: 'general.yes',
				yesCallback: function () {
					var licenseId = row.entity.id
					var index = $scope.gridOptions.data.indexOf ( row.entity )

					License.destroyById ( { id: licenseId } ).$promise.then ( function ( res ) {
						$scope.gridOptions.data.splice ( index, 1 )
					}, function ( err ) {
					} )
				},
				NoCallback:  function () {
				}
			} )
		};

		$scope.showLicenseInfo = function ( row ) {
			if ( row ) {
				var licenseId = row.entity.id;
				License.findById ( { id: licenseId } ).$promise.then ( function ( res ) {
					var license = res;
					$uibModal.open ( {
						backdrop:      true,
						animation:     true,
						keyboard:      true,
						size:          'lg',
						backdropClick: true,
						scope:         $scope,
						templateUrl:   PREFIX + 'app/license/tpl/licenseInfo.html',
						controller:    [ '$scope', '$uibModalInstance', function ( $scope, $uibModalInstance ) {
							$scope.license = license;
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

		$scope.openAssignModuleForm = function ( row ) {
			$uibModal.open ( {
				backdrop:      true,
				animation:     true,
				keyboard:      true,
				backdropClick: true,
				scope:         $scope,
				templateUrl:   PREFIX + 'app/license/tpl/licenseModuleForm.html',
				controller:    [ '$scope', '$uibModalInstance', function ( $scope, $uibModalInstance ) {
					var licenseId = row.entity.id;
					$scope.moduleItem = {};
					$scope.options = {};
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
						$scope.moduleItem.subscriptionDate = new Date ( $scope.moduleItem.subscriptionDate ).getTime ();
						$scope.moduleItem.durationInMonths = englishNumberFilter ( $scope.moduleItem.durationInMonths );
						$log.info ( $scope.moduleItem );
						if ( $scope.moduleItem.id === 'sms' ) {
							License.assignSmsModule ( {
								licenseId:        licenseId,
								subscriptionDate: $scope.moduleItem.subscriptionDate,
								duration:         Number ( $scope.moduleItem.durationInMonths )
							} ).$promise.then ( function ( res ) {
								appMessenger.showSuccess ( 'business.updateSuccessFull' );
								getPage ();
								$uibModalInstance.close ()
							}, function ( err ) {
								appMessenger.showError ( 'error.generalError' )
							} )
						} else if ( $scope.moduleItem.id === 'log' ) {
							License.assignLogModule ( {
								licenseId:        licenseId,
								subscriptionDate: $scope.moduleItem.subscriptionDate,
								duration:         Number ( $scope.moduleItem.durationInMonths )
							} ).$promise.then ( function ( res ) {
								appMessenger.showSuccess ( 'business.updateSuccessFull' );
								getPage ();
								$uibModalInstance.close ()
							}, function ( err ) {
								appMessenger.showError ( 'error.generalError' )
							} )
						}
					}
				} ]
			} )
		};

		$scope.openAssignServiceForm = function ( row ) {
			$uibModal.open ( {
				backdrop:      true,
				animation:     true,
				keyboard:      true,
				backdropClick: true,
				scope:         $scope,
				templateUrl:   PREFIX + 'app/license/tpl/licenseServiceForm.html',
				controller:    [ '$scope', '$uibModalInstance', function ( $scope, $uibModalInstance ) {
					var licenseId = row.entity.id;
					$scope.moduleItem = {};
					$scope.options = {};
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
						$scope.moduleItem.subscriptionDate = new Date ( $scope.moduleItem.subscriptionDate ).getTime ();
						$scope.moduleItem.durationInMonths = englishNumberFilter ( $scope.moduleItem.durationInMonths );
						$log.info ( $scope.moduleItem );
							License.assignAccountingService ( {
								licenseId:          licenseId,
								subscriptionDate:   $scope.moduleItem.subscriptionDate,
								allowedOnlineUsers: Number ( $scope.moduleItem.allowedOnlineUsers ),
								duration:           Number ( $scope.moduleItem.durationInMonths )
							} ).$promise.then ( function ( res ) {
								appMessenger.showSuccess ( 'business.updateSuccessFull' );
								getPage ();
								$uibModalInstance.close ()
							}, function ( err ) {
								appMessenger.showError ( 'error.generalError' )
							} )

					}
				} ]
			} )
		};

		$scope.activateLicense = function ( row ) {
			var licenseId = row.entity.id;
			License.findById ( { id: licenseId } ).$promise.then ( function ( license ) {
				$uibModal.open ( {
					backdrop:      true,
					animation:     true,
					keyboard:      true,
					backdropClick: true,
					templateUrl:   PREFIX + 'app/common/tpl/areYouSure.html',
					controller:    [ '$scope', '$uibModalInstance', function ( $scope, $uibModalInstance ) {
						$scope.options = {
							title:       'license.status',
							message:     'general.areYouSure',
							noBtnLabel:  'general.no',
							yesBtnLabel: 'general.yes'
						};
						$scope.no = function () {
							$uibModalInstance.close ()
						};
						$scope.yes = function () {
							var active = license.active;
							active = !active;
							License.prototype$updateAttributes( {
								id: licenseId
							}, { active: active } ).$promise.then ( function ( res ) {
								appMessenger.showSuccess ( 'general.changeStatusSuccessFull' )
								getPage ()
							}, function ( error ) {
								appMessenger.showError ( 'general.changeStatusUnSuccessFull' )
							} );
							$uibModalInstance.close ()
						}
					} ]
				} )
			} )
		};

		$scope.showLicenseInfo = function ( row ) {
			if ( row ) {
				var licenseId = row.entity.id;
				License.findById ( { id: licenseId } ).$promise.then ( function ( res ) {
					var license = res;
					$uibModal.open ( {
						backdrop:      true,
						animation:     true,
						keyboard:      true,
						size:          'lg',
						backdropClick: true,
						scope:         $scope,
						templateUrl:   PREFIX + 'app/license/tpl/licenseInfo.html',
						controller:    [ '$scope', '$uibModalInstance', function ( $scope, $uibModalInstance ) {
							$scope.license = license;
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
		};

		$scope.$watch ( 'paginationOptions.itemPerPage', function ( oldValue, newValue ) {
			getPage ()
		} );

		$scope.pageChanges = function () {
			getPage ()
		};

		$scope.searchLicense = function () {
			var filter = {};
			if ( $scope.licenseId ) {
				filter.id = $scope.licenseId;
			}
			filter.serviceProviderId = $scope.serviceProviderId;
			$scope.isSearching = true;
			getPage ( filter );
		};

		$scope.$watchGroup ( [ 'licenseId', 'serviceProviderId' ], function ( newValues, oldValues, scope ) {
			if ( newValues != oldValues && newValues[ 0 ].length == 0 && newValues[ 1 ].length == 0 ) {
				getPage ();
			}
		} );

		$scope.clearSearch = function () {
			if ( $scope.licenseId ) {
				$scope.licenseId = '';
			}
			if ( $scope.serviceProviderId ) {
				$scope.serviceProviderId = '';
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
			var options = { filter: {} };
			if ( inputFilter ) {
				options.filter.where = inputFilter;
			}
			options.filter.sort = $scope.paginationOptions.sort
			options.filter.skip = ($scope.paginationOptions.pageNumber - 1) * $scope.paginationOptions.itemPerPage
			options.filter.limit = $scope.paginationOptions.itemPerPage

			License.count ( { where: inputFilter } ).$promise.then ( function ( result ) {
				$scope.gridOptions.totalItems = result.count;
				$scope.paginationOptions.totalItems = result.count;
			}, function ( error ) {
				$log.error ( error )
			} );
			License.find ( options ).$promise.then ( function ( licensees ) {
				$scope.gridOptions.data = licensees;
				$scope.isSearching = false;
			}, function ( error ) {
				$log.error ( error )
			} )
		}
	} ] );
