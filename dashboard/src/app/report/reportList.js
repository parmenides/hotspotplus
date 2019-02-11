/**
 * Created by hamidehnouri on 1/22/2019 AD.
 */

app.controller('reportList', [
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
  function(
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
      pageNumber: 1,
      itemPerPage: 10,
      sort: null
    };
    $scope.gridOptions = {
      enableSorting: true,
      enablePaginationControls: false,
      enableRowSelection: true,
      enableSelectAll: true,
      multiSelect: true,
      selectionRowHeaderWidth: 35,
      rowHeight: 36,
      showGridFooter: true,
      enableColumnResizing: true,
      minRowsToShow: 11,
      columnDefs: [
        {
          displayName: 'report.title',
          field: 'title',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate'
        },
        {
          displayName: 'report.username',
          field: 'username',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate'
        },
        {
          displayName: 'report.startDate',
          field: 'startDate',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate'
        },
        {
          displayName: 'report.endDate',
          field: 'endDate',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate'
        },
        {
          displayName: 'report.status',
          field: 'status',
          width: 90,
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate'
        },
        {
          displayName: 'general.download',
          field: 'download',
          width: 90,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellClass: 'center',
          headerCellClass: 'headerCenter',
          cellTemplate:
            '<a class="btn btn-link" ng-enabled ="row.entity.status === ready" ng-click="grid.appScope.downloadReport(row)"><i class="fa  fa-download"></i></a>'
        },
        {
          displayName: 'general.remove',
          field: 'delete',
          width: 70,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellClass: 'center',
          headerCellClass: 'headerCenter',
          cellTemplate:
            '<a class="btn btn-link" ng-click="grid.appScope.removeReport(row)"><i class="fa  fa-trash"></i></a>'
        }
      ],
      onRegisterApi: function(gridApi) {
        $scope.gridApi = gridApi;
        $scope.gridApi.core.on.sortChanged($scope, function(grid, sortColumns) {
          if (sortColumns.length == 0) {
            $scope.paginationOptions.sort = null;
          } else {
            $scope.paginationOptions.sort =
              sortColumns[0].name +
              ' ' +
              sortColumns[0].sort.direction.toUpperCase();
          }
          getPage();
        });
      }
    };

    var _selected;
    $scope.ngModelOptionsSelected = function(value) {
      if (arguments.length) {
        _selected = value;
      } else {
        return _selected;
      }
    };

    $scope.modelOptions = {
      debounce: {
        default: 500,
        blur: 250
      },
      getterSetter: true
    };

    Business.loadMembersUsernames({ businessId: businessId }).$promise.then(
      function(members) {
        $scope.members = members;
        console.log($scope.members);
      },
      function(error) {
        $log.error(error);
      }
    );

    $scope.addReport = function(param) {
      $scope.report = {
        status: 'scheduled',
        creationDate: new Date().getTime(),
        startDate: new Date().getTime(),
        endDate: new Date().getTime(),
        businessId: businessId
      };
      $uibModal.open({
        backdrop: true,
        animation: true,
        keyboard: true,
        backdropClick: true,
        size: 'md',
        scope: $scope,
        templateUrl: PREFIX + 'app/report/tpl/reportForm.html',
        controller: [
          '$scope',
          '$uibModalInstance',
          function($scope, $uibModalInstance) {
            $scope.options = {
              cancelBtnLabel: 'general.cancel',
              saveBtnLabel: 'general.save'
            };
            if (param === 'ip') {
              $scope.options.title = 'report.addIpReport';
              $scope.options.reportType = 'ip';
            } else {
              $scope.options.title = 'report.addSiteReport';
              $scope.options.reportType = 'site';
            }
            // Persian date picker methods
            $scope.dateOptions = {
              formatYear: 'yy',
              startingDay: 6
            };
            $scope.dateFormats = [
              'dd-MMMM-yyyy',
              'yyyy/MM/dd',
              'dd.MM.yyyy',
              'shortDate'
            ];
            $scope.dateFormat = $scope.dateFormats[0];
            $scope.disabled = function(date, mode) {
              return mode === 'day' && date.getDay() === 5;
            };
            $scope.startDateCalendar = function($event) {
              $event.preventDefault();
              $event.stopPropagation();
              $scope.startDateCalendarIsOpen = true;
              $scope.endDateCalendarIsOpen = false;
            };
            $scope.endDateCalendar = function($event) {
              $event.preventDefault();
              $event.stopPropagation();
              $scope.endDateCalendarIsOpen = true;
              $scope.startDateCalendarIsOpen = false;
            };
            //$scope.report.endDate = new Date ( $scope.report.startDate.getTime () + 7 * 24 * 60 * 60 * 1000 );

            // --> for calendar bug
            $scope.$watch('report.startDate', function(newValue, oldValue) {
              $scope.startDateCalendarIsOpen = false;
            });
            $scope.$watch('report.endDate', function(newValue, oldValue) {
              $scope.endDateCalendarIsOpen = false;
            });
            $scope.resetCalendar = function() {
              $scope.endDateCalendarIsOpen = false;
              $scope.startDateCalendarIsOpen = false;
            };
            $scope.cancel = function() {
              $uibModalInstance.close();
            };
            $scope.save = function(sendMessage) {
              if ($scope.report.startDate) {
                var startDate = new Date($scope.report.startDate);
                $scope.report.startDate = startDate.getTime();
              }
              if ($scope.report.endDate) {
                var endDate = new Date($scope.report.endDate);
                $scope.report.endDate = endDate.getTime();
              }
              Member.reports
                .create({ id: memberId }, $scope.report)
                .$promise.then(
                  function(res) {
                    appMessenger.showSuccess('report.createSuccessFull');
                    getPage();
                    $uibModalInstance.close();
                  },
                  function(err) {
                    appMessenger.showError('report.createUnSuccessFull');
                  }
                );
            };
          }
        ]
      });
    };
    $scope.removeReport = function(row) {
      genericService.showConfirmDialog({
        title: 'general.warning',
        message: 'general.areYouSure',
        noBtnLabel: 'general.no',
        yesBtnLabel: 'general.yes',
        yesCallback: function() {
          var reportId = row.entity.id;
          var index = $scope.gridOptions.data.indexOf(row.entity);
          Member.reports
            .destroyById({ id: memberId }, { fk: reportId })
            .$promise.then(
              function(member) {
                $scope.gridOptions.data.splice(index, 1);
                appMessenger.showSuccess('report.removeSuccessFull');
              },
              function(err) {
                appMessenger.showError('report.removeUnSuccessFull');
              }
            );
        },
        NoCallback: function() {}
      });
    };
    $scope.removeReports = function() {
      var reportIds = [];
      var selectedRows = $scope.gridApi.selection.getSelectedRows();
      angular.forEach(selectedRows, function(selectedRow) {
        if (selectedRow.id) {
          reportIds.push(selectedRow.id);
        }
      });
      if (reportIds.length != 0) {
        genericService.showConfirmDialog({
          title: 'general.warning',
          message: 'general.areYouSure',
          noBtnLabel: 'general.no',
          yesBtnLabel: 'general.yes',
          yesCallback: function() {
            Member.destroyReportsById({
              memberId: memberId,
              reportIds: reportIds
            }).$promise.then(
              function(result) {
                $scope.gridApi.selection.clearSelectedRows();
                getPage();
                appMessenger.showSuccess('report.removeSuccessFull');
              },
              function(err) {
                appMessenger.showError('report.removeUnSuccessFull');
              }
            );
          },
          NoCallback: function() {}
        });
      } else {
        appMessenger.showInfo('report.noReportToRemove');
      }
    };

    $scope.$watch('paginationOptions.itemPerPage', function(
      newValue,
      oldValue
    ) {
      getPage();
    });

    $scope.pageChanges = function() {
      getPage();
    };

    var getPage = function(inputFilter) {
      $scope.gridApi.selection.clearSelectedRows();
      switch ($scope.paginationOptions.sort) {
        case uiGridConstants.ASC:
          break;
        case uiGridConstants.DESC:
          break;
        default:
          break;
      }
      var options = { filter: {} };
      if (inputFilter) {
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
        .count({ id: businessId, where: inputFilter })
        .$promise.then(
          function(result) {
            $scope.gridOptions.totalItems = result.count;
            $scope.paginationOptions.totalItems = result.count;
          },
          function(error) {
            $log.error(error);
          }
        );
      Business.reports(options).$promise.then(
        function(reports) {
          $scope.gridOptions.data = reports;
        },
        function(error) {
          $log.error(error);
        }
      );
    };
  }
]);
