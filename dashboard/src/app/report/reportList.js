/**
 * Created by hamidehnouri on 1/22/2019 AD.
 */

app.controller ( 'reportList', [
	'$scope',
	'$state',
	'$log',
	'translateFilter',
	'Business',
	'Member',
	'uiGridConstants',
	'$http',
	'genericService',
	'Session',
	'$uibModal',
	'PREFIX',
	'appMessenger',
	function (
		$scope,
		$state,
		$log,
		translateFilter,
		Business,
		Member,
		uiGridConstants,
		$http,
		genericService,
		Session,
		$uibModal,
		PREFIX,
		appMessenger
	) {
		var businessId = Session.business.id;

		$scope.paginationOptions = {
			pageNumber:  1,
			itemPerPage: 10,
			sort:        null,
		};
		$scope.gridOptions = {
			enableSorting:            true,
			enablePaginationControls: false,
			enableRowSelection:       true,
			enableSelectAll:          true,
			multiSelect:              true,
			selectionRowHeaderWidth:  35,
			rowHeight:                36,
			showGridFooter:           true,
			enableColumnResizing:     true,
			minRowsToShow:            11,
			columnDefs:               [
				{
					displayName:      'report.title',
					field:            'title',
					enableHiding:     false,
					enableSorting:    false,
					enableColumnMenu: false,
					headerCellFilter: 'translate',
				},
				{
					displayName:      'report.username',
					field:            'username',
					enableHiding:     false,
					enableSorting:    false,
					enableColumnMenu: false,
					headerCellFilter: 'translate',
				},
				{
					displayName:      'report.from',
					field:            'from',
					enableHiding:     false,
					enableSorting:    false,
					enableColumnMenu: false,
					headerCellFilter: 'translate',
				},
				{
					displayName:      'report.to',
					field:            'to',
					enableHiding:     false,
					enableSorting:    false,
					enableColumnMenu: false,
					headerCellFilter: 'translate',
				},
				{
					displayName:      'report.status',
					field:            'status',
					width:            90,
					enableHiding:     false,
					enableSorting:    false,
					enableColumnMenu: false,
					headerCellFilter: 'translate',
				},
				{
					displayName:      'general.download',
					field:            'download',
					width:            90,
					enableColumnMenu: false,
					headerCellFilter: 'translate',
					cellClass:        'center',
					headerCellClass:  'headerCenter',
					cellTemplate:
					                  '<a class="btn btn-link" ng-enabled ="row.entity.status === ready" ng-click="grid.appScope.downloadReport(row)"><i class="fa  fa-download"></i></a>',
				},
				{
					displayName:      'general.remove',
					field:            'delete',
					width:            70,
					enableColumnMenu: false,
					headerCellFilter: 'translate',
					cellClass:        'center',
					headerCellClass:  'headerCenter',
					cellTemplate:
					                  '<a class="btn btn-link" ng-click="grid.appScope.removeReport(row)"><i class="fa  fa-trash"></i></a>',
				},
			],
			onRegisterApi:            function ( gridApi ) {
				$scope.gridApi = gridApi;
				$scope.gridApi.core.on.sortChanged ( $scope, function ( grid, sortColumns ) {
					if ( sortColumns.length == 0 ) {
						$scope.paginationOptions.sort = null;
					} else {
						$scope.paginationOptions.sort =
							sortColumns[ 0 ].name +
							' ' +
							sortColumns[ 0 ].sort.direction.toUpperCase ();
					}
					getPage ();
				} );
			}
		};

		var _selected;
		$scope.ngModelOptionsSelected = function ( value ) {
			if ( arguments.length ) {
				_selected = value;
			} else {
				return _selected;
			}
		};

		$scope.modelOptions = {
			debounce:     {
				default: 500,
				blur:    250
			},
			getterSetter: true
		};

		//$scope.members = [{'username':'Alabama','flag':'5/5c/Flag_of_Alabama.svg/45px-Flag_of_Alabama.svg.png'},{'username':'Alaska','flag':'e/e6/Flag_of_Alaska.svg/43px-Flag_of_Alaska.svg.png'},{'username':'Arizona','flag':'9/9d/Flag_of_Arizona.svg/45px-Flag_of_Arizona.svg.png'},{'username':'Arkansas','flag':'9/9d/Flag_of_Arkansas.svg/45px-Flag_of_Arkansas.svg.png'},{'username':'California','flag':'0/01/Flag_of_California.svg/45px-Flag_of_California.svg.png'},{'username':'Colorado','flag':'4/46/Flag_of_Colorado.svg/45px-Flag_of_Colorado.svg.png'},{'username':'Connecticut','flag':'9/96/Flag_of_Connecticut.svg/39px-Flag_of_Connecticut.svg.png'},{'username':'Delaware','flag':'c/c6/Flag_of_Delaware.svg/45px-Flag_of_Delaware.svg.png'},{'username':'Florida','flag':'f/f7/Flag_of_Florida.svg/45px-Flag_of_Florida.svg.png'},{'username':'Georgia','flag':'5/54/Flag_of_Georgia_%28U.S._state%29.svg/46px-Flag_of_Georgia_%28U.S._state%29.svg.png'},{'username':'Hawaii','flag':'e/ef/Flag_of_Hawaii.svg/46px-Flag_of_Hawaii.svg.png'},{'username':'Idaho','flag':'a/a4/Flag_of_Idaho.svg/38px-Flag_of_Idaho.svg.png'},{'username':'Illinois','flag':'0/01/Flag_of_Illinois.svg/46px-Flag_of_Illinois.svg.png'},{'username':'Indiana','flag':'a/ac/Flag_of_Indiana.svg/45px-Flag_of_Indiana.svg.png'},{'username':'Iowa','flag':'a/aa/Flag_of_Iowa.svg/44px-Flag_of_Iowa.svg.png'},{'username':'Kansas','flag':'d/da/Flag_of_Kansas.svg/46px-Flag_of_Kansas.svg.png'},{'username':'Kentucky','flag':'8/8d/Flag_of_Kentucky.svg/46px-Flag_of_Kentucky.svg.png'},{'username':'Louisiana','flag':'e/e0/Flag_of_Louisiana.svg/46px-Flag_of_Louisiana.svg.png'},{'username':'Maine','flag':'3/35/Flag_of_Maine.svg/45px-Flag_of_Maine.svg.png'},{'username':'Maryland','flag':'a/a0/Flag_of_Maryland.svg/45px-Flag_of_Maryland.svg.png'},{'username':'Massachusetts','flag':'f/f2/Flag_of_Massachusetts.svg/46px-Flag_of_Massachusetts.svg.png'},{'username':'Michigan','flag':'b/b5/Flag_of_Michigan.svg/45px-Flag_of_Michigan.svg.png'},{'username':'Minnesota','flag':'b/b9/Flag_of_Minnesota.svg/46px-Flag_of_Minnesota.svg.png'},{'username':'Mississippi','flag':'4/42/Flag_of_Mississippi.svg/45px-Flag_of_Mississippi.svg.png'},{'username':'Missouri','flag':'5/5a/Flag_of_Missouri.svg/46px-Flag_of_Missouri.svg.png'},{'username':'Montana','flag':'c/cb/Flag_of_Montana.svg/45px-Flag_of_Montana.svg.png'},{'username':'Nebraska','flag':'4/4d/Flag_of_Nebraska.svg/46px-Flag_of_Nebraska.svg.png'},{'username':'Nevada','flag':'f/f1/Flag_of_Nevada.svg/45px-Flag_of_Nevada.svg.png'},{'username':'New Hampshire','flag':'2/28/Flag_of_New_Hampshire.svg/45px-Flag_of_New_Hampshire.svg.png'},{'username':'New Jersey','flag':'9/92/Flag_of_New_Jersey.svg/45px-Flag_of_New_Jersey.svg.png'},{'username':'New Mexico','flag':'c/c3/Flag_of_New_Mexico.svg/45px-Flag_of_New_Mexico.svg.png'},{'username':'New York','flag':'1/1a/Flag_of_New_York.svg/46px-Flag_of_New_York.svg.png'},{'username':'North Carolina','flag':'b/bb/Flag_of_North_Carolina.svg/45px-Flag_of_North_Carolina.svg.png'},{'username':'North Dakota','flag':'e/ee/Flag_of_North_Dakota.svg/38px-Flag_of_North_Dakota.svg.png'},{'username':'Ohio','flag':'4/4c/Flag_of_Ohio.svg/46px-Flag_of_Ohio.svg.png'},{'username':'Oklahoma','flag':'6/6e/Flag_of_Oklahoma.svg/45px-Flag_of_Oklahoma.svg.png'},{'username':'Oregon','flag':'b/b9/Flag_of_Oregon.svg/46px-Flag_of_Oregon.svg.png'},{'username':'Pennsylvania','flag':'f/f7/Flag_of_Pennsylvania.svg/45px-Flag_of_Pennsylvania.svg.png'},{'username':'Rhode Island','flag':'f/f3/Flag_of_Rhode_Island.svg/32px-Flag_of_Rhode_Island.svg.png'},{'username':'South Carolina','flag':'6/69/Flag_of_South_Carolina.svg/45px-Flag_of_South_Carolina.svg.png'},{'username':'South Dakota','flag':'1/1a/Flag_of_South_Dakota.svg/46px-Flag_of_South_Dakota.svg.png'},{'username':'Tennessee','flag':'9/9e/Flag_of_Tennessee.svg/46px-Flag_of_Tennessee.svg.png'},{'username':'Texas','flag':'f/f7/Flag_of_Texas.svg/45px-Flag_of_Texas.svg.png'},{'username':'Utah','flag':'f/f6/Flag_of_Utah.svg/45px-Flag_of_Utah.svg.png'},{'username':'Vermont','flag':'4/49/Flag_of_Vermont.svg/46px-Flag_of_Vermont.svg.png'},{'username':'Virginia','flag':'4/47/Flag_of_Virginia.svg/44px-Flag_of_Virginia.svg.png'},{'username':'Washington','flag':'5/54/Flag_of_Washington.svg/46px-Flag_of_Washington.svg.png'},{'username':'West Virginia','flag':'2/22/Flag_of_West_Virginia.svg/46px-Flag_of_West_Virginia.svg.png'},{'username':'Wisconsin','flag':'2/22/Flag_of_Wisconsin.svg/45px-Flag_of_Wisconsin.svg.png'},{'username':'Wyoming','flag':'b/bc/Flag_of_Wyoming.svg/43px-Flag_of_Wyoming.svg.png'}];
		$scope.addReport = function ( param ) {
			Business.loadMembersUsernames ( { businessId: businessId } ).$promise.then (
				function ( result ) {
					$scope.members = result.members;
					$scope.report = {
						status:       'scheduled',
						creationDate: new Date ().getTime (),
						from:         new Date ().getTime (),
						to:           new Date ().getTime (),
						businessId:   businessId
					};
					$uibModal.open ( {
						backdrop:      true,
						animation:     true,
						keyboard:      true,
						backdropClick: true,
						size:          'md',
						scope:         $scope,
						templateUrl:   PREFIX + 'app/report/tpl/reportForm.html',
						controller:    [
							'$scope',
							'$uibModalInstance',
							function ( $scope, $uibModalInstance ) {
								$scope.options = {
									cancelBtnLabel: 'general.cancel',
									saveBtnLabel:   'general.save'
								};
								if ( param === 'ip' ) {
									$scope.options.title = 'report.addIpReport';
									$scope.options.reportType = 'ip';
								} else {
									$scope.options.title = 'report.addSiteReport';
									$scope.options.reportType = 'site';
								}
								// Persian date picker methods
								$scope.dateOptions = {
									formatYear:  'yy',
									startingDay: 6,
								};
								$scope.dateFormats = [
									'dd-MMMM-yyyy',
									'yyyy/MM/dd',
									'dd.MM.yyyy',
									'shortDate',
								];
								$scope.dateFormat = $scope.dateFormats[ 0 ];
								$scope.disabled = function ( date, mode ) {
									return mode === 'day' && date.getDay () === 5;
								};
								$scope.startDateCalendar = function ( $event ) {
									$event.preventDefault ();
									$event.stopPropagation ();
									$scope.startDateCalendarIsOpen = true;
									$scope.endDateCalendarIsOpen = false;
								};
								$scope.endDateCalendar = function ( $event ) {
									$event.preventDefault ();
									$event.stopPropagation ();
									$scope.endDateCalendarIsOpen = true;
									$scope.startDateCalendarIsOpen = false;
								};
								//$scope.report.to = new Date ( $scope.report.from.getTime () + 7 * 24 * 60 * 60 * 1000 );

								// --> for calendar bug
								$scope.$watch ( 'report.from', function ( newValue, oldValue ) {
									$scope.startDateCalendarIsOpen = false;
								} );
								$scope.$watch ( 'report.to', function ( newValue, oldValue ) {
									$scope.endDateCalendarIsOpen = false;
								} );
								$scope.resetCalendar = function () {
									$scope.endDateCalendarIsOpen = false;
									$scope.startDateCalendarIsOpen = false;
								};
								$scope.cancel = function () {
									$uibModalInstance.close ();
								};
								$scope.save = function () {
									if ( $scope.report.username ) {
										//Business.members({where:[{useranme: $scope.report.username}]})
									}
									if ( $scope.report.from ) {
										var from = new Date ( $scope.report.from );
										$scope.report.from = from.getTime ();
									}
									if ( $scope.report.to ) {
										var to = new Date ( $scope.report.to );
										$scope.report.to = to.getTime ();
									}
									/*Member.reports
										.create ( { id: memberId }, $scope.report )
										.$promise.then (
										function ( res ) {
											appMessenger.showSuccess (
												'report.createSuccessFull'
											);
											getPage ();
											$uibModalInstance.close ()
										},
										function ( err ) {
											appMessenger.showError ( 'report.createUnSuccessFull' );

										}
									);*/
								};
							}
						]
					} );
				},
				function ( error ) {
					$log.error ( error );
				}
			);
		};

		$scope.removeReport = function ( row ) {
			genericService.showConfirmDialog ( {
				title:       'general.warning',
				message:     'general.areYouSure',
				noBtnLabel:  'general.no',
				yesBtnLabel: 'general.yes',
				yesCallback: function () {
					var reportId = row.entity.id;
					var index = $scope.gridOptions.data.indexOf ( row.entity );
					Member.reports
						.destroyById ( { id: memberId }, { fk: reportId } )
						.$promise.then (
						function ( member ) {
							$scope.gridOptions.data.splice ( index, 1 );
							appMessenger.showSuccess ( 'report.removeSuccessFull' );
						},
						function ( err ) {
							appMessenger.showError ( 'report.removeUnSuccessFull' );
						},
					);
				},
				NoCallback:  function () {
				},
			} );
		};
		$scope.removeReports = function () {
			var reportIds = [];
			var selectedRows = $scope.gridApi.selection.getSelectedRows ();
			angular.forEach ( selectedRows, function ( selectedRow ) {
				if ( selectedRow.id ) {
					reportIds.push ( selectedRow.id );
				}
			} );
			if ( reportIds.length != 0 ) {
				genericService.showConfirmDialog ( {
					title:       'general.warning',
					message:     'general.areYouSure',
					noBtnLabel:  'general.no',
					yesBtnLabel: 'general.yes',
					yesCallback: function () {
						Member.destroyReportsById ( {
							memberId:  memberId,
							reportIds: reportIds,
						} ).$promise.then (
							function ( result ) {
								$scope.gridApi.selection.clearSelectedRows ();
								getPage ();
								appMessenger.showSuccess ( 'report.removeSuccessFull' );
							},
							function ( err ) {
								appMessenger.showError ( 'report.removeUnSuccessFull' );
							},
						);
					},
					NoCallback:  function () {
					},
				} );
			} else {
				appMessenger.showInfo ( 'report.noReportToRemove' );
			}
		};

		$scope.$watch ( 'paginationOptions.itemPerPage', function ( newValue, oldValue, ) {
			getPage ();
		} );

		$scope.pageChanges = function () {
			getPage ();
		};

		var getPage = function ( inputFilter ) {
			$scope.gridApi.selection.clearSelectedRows ();
			switch ( $scope.paginationOptions.sort ) {
				case uiGridConstants.ASC:
					break;
				case uiGridConstants.DESC:
					break;
				default:
					break;
			}
			var options = { filter: {} };
			if ( inputFilter ) {
				options.filter.where = inputFilter;
			}
			options.id = businessId;
			options.filter.sort = $scope.paginationOptions.sort;
			options.filter.skip =
				($scope.paginationOptions.pageNumber - 1) *
				$scope.paginationOptions.itemPerPage;
			options.filter.limit = $scope.paginationOptions.itemPerPage;
			options.filter.fields = { internetPlanHistory: false };
			Business.reports
				.count ( { id: businessId, where: inputFilter } )
				.$promise.then (
				function ( result ) {
					$scope.gridOptions.totalItems = result.count;
					$scope.paginationOptions.totalItems = result.count;
				},
				function ( error ) {
					$log.error ( error );
				},
			);
			Business.reports ( options ).$promise.then (
				function ( reports ) {
					$scope.gridOptions.data = reports;
				},
				function ( error ) {
					$log.error ( error );
				},
			);
		};
	},
] );
