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
	'PersianDateService',
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
		appMessenger,
		PersianDateService
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
					width:            250,
					enableHiding:     false,
					enableSorting:    false,
					enableColumnMenu: false,
					headerCellFilter: 'translate',
					cellTemplate:
					                  '<div class="ui-grid-cell-contents">{{row.entity.from |  persianDate : "fullDate" | translateNumber }}{{"general.,"| translate}}&nbsp;{{"general.hour"| translate}}:&nbsp;{{row.entity.from |  date : "HH:mm" | translateNumber }}</div>',

				},
				{
					displayName:      'report.to',
					field:            'to',
					width:            250,
					enableHiding:     false,
					enableSorting:    false,
					enableColumnMenu: false,
					headerCellFilter: 'translate',
					cellTemplate:
					                  '<div class="ui-grid-cell-contents">{{row.entity.to |  persianDate : "fullDate" | translateNumber }}{{"general.,"| translate}}&nbsp;{{"general.hour"| translate}}:&nbsp;{{row.entity.to |  date : "HH:mm" | translateNumber }}</div>'
				},
				{
					displayName:      'report.status',
					field:            'status',
					enableHiding:     false,
					enableSorting:    false,
					enableColumnMenu: false,
					headerCellFilter: 'translate',
					cellTemplate:
					                  '<div class="ui-grid-cell-contents">{{"report." + row.entity.status  | translate }}</div>'
				},
				{
					displayName:      'general.download',
					field:            'download',
					width:            70,
					enableColumnMenu: false,
					headerCellFilter: 'translate',
					cellClass:        'center',
					headerCellClass:  'headerCenter',
					cellTemplate:     '<a class="btn btn-link" ng-class ="{\'disabled\': row.entity.status !== \'ready\' || !row.entity.fileStorageId  ,\'text-info\': row.entity.status === \'ready\' && row.entity.fileStorageId}" ' +
						                  'ng-click="grid.appScope.downloadReport(row)"><i class="fa  fa-download"></i></a>'
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

		$scope.modelOptions = {
			debounce:     {
				default: 500,
				blur:    250
			},
			getterSetter: true
		};

		$scope.addReport = function ( param ) {
			Business.loadMembersUsernames ( { businessId: businessId } ).$promise.then (
				function ( result ) {
					$scope.members = result.members;
					$scope.report = {
						status:       'scheduled',
						creationDate: new Date ().getTime (),
						from:         new Date ().getTime () - 7 * 24 * 60 * 60 * 1000,
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
									startingDay: 6
								};
								$scope.dateFormats = [
									'dd-MMMM-yyyy',
									'yyyy/MM/dd',
									'dd.MM.yyyy',
									'shortDate'
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
									if ( $scope.report.member && $scope.report.member.id ) {
										var memberId = $scope.report.member.id;
										var username = $scope.report.member.username;
										delete $scope.report.member;
										$scope.report.memberId = memberId;
										$scope.report.username = username;
										if ( $scope.report.from ) {
											var from = new Date ( $scope.report.from );
											$scope.report.from = from.getTime ();
										} else {
											$scope.report.from = new Date ().getTime () - 7 * 24 * 60 * 60 * 1000;
										}
										if ( $scope.report.to ) {
											var to = new Date ( $scope.report.to );
											$scope.report.to = to.getTime ();
										} else {
											$scope.report.to = new Date ().getTime ();
										}
										if ( !$scope.report.title ) {
											//todo:fix bug on date
											var time = new Date ( $scope.report.creationDate );
											var year = PersianDateService.getFullYear ( time );
											var month = PersianDateService.getMonth ( time ) + 1;
											var day = PersianDateService.getDate ( time );
											$scope.report.title = username + '_' + year + '_' + month + '_' + day;
										}
										Business.reports.create ( { id: businessId }, $scope.report ).$promise.then (
											function ( res ) {
												appMessenger.showSuccess ( 'report.createSuccessFull' );
												getPage ();
												$uibModalInstance.close ()
											},
											function ( err ) {
												appMessenger.showError ( 'report.createUnSuccessFull' );
											}
										);
									} else {
										appMessenger.showError ( 'report.enterUserName' );
									}
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
					Business.reports
						.destroyById ( { id: businessId }, { fk: reportId } )
						.$promise.then (
						function ( res ) {
							//todo: also delete related file
							if ( row.entity.fileStorageId ) {
								Business.files
									.destroyById ( { id: businessId }, { fk: fileStorageId } )
									.$promise.then (
									function ( res ) {
										appMessenger.showSuccess ( 'report.removeFileSuccessFull' );
									},
									function ( err ) {
										appMessenger.showError ( 'report.removeFileUnSuccessFull' );
									}
								);
							}
							$scope.gridOptions.data.splice ( index, 1 );
							appMessenger.showSuccess ( 'report.removeSuccessFull' );
						},
						function ( err ) {
							appMessenger.showError ( 'report.removeUnSuccessFull' );
						}
					);
				},
				NoCallback:  function () {
				}
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
			//todo: also delete related files
			if ( reportIds.length != 0 ) {
				genericService.showConfirmDialog ( {
					title:       'general.warning',
					message:     'general.areYouSure',
					noBtnLabel:  'general.no',
					yesBtnLabel: 'general.yes',
					yesCallback: function () {
						Business.destroyReportsById ( {
							businessId: businessId,
							reportIds:  reportIds
						} ).$promise.then (
							function ( result ) {
								$scope.gridApi.selection.clearSelectedRows ();
								getPage ();
								appMessenger.showSuccess ( 'report.removeSuccessFull' );
							},
							function ( err ) {
								appMessenger.showError ( 'report.removeUnSuccessFull' );
							}
						);
					},
					NoCallback:  function () {
					}
				} );
			} else {
				appMessenger.showInfo ( 'report.noReportToRemove' );
			}
		};

		$scope.downloadReport = function ( row ) {
			var reportId = row.entity.id;
			if ( row.entity.fileStorageId ) {
				var fileStorageId = row.entity.fileStorageId;

			} else {
				appMessenger.showError ( 'report.noReportsToDownload' )
			}
		};

		$scope.$watch ( 'paginationOptions.itemPerPage', function ( newValue, oldValue ) {
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
