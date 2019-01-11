/**
 * Created by rezanazari on 7/25/17.
 */
app.controller('sysLogReport', [
  '$scope',
  '$state',
  'Business',
  '$log',
  'translateFilter',
  'uiGridConstants',
  '$http',
  'genericService',
  'Session',
  'persianDateFilter',
  'translateNumberFilter',
  'englishNumberFilter',
  function(
    $scope,
    $state,
    Business,
    $log,
    translateFilter,
    uiGridConstants,
    $http,
    genericService,
    Session,
    persianDateFilter,
    translateNumberFilter,
    englishNumberFilter,
  ) {
    var businessId = Session.business.id;
    // Date filter
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
    $scope.dateOptions = {
      formatYear: 'yy',
      startingDay: 6,
    };
    $scope.dateFormats = [
      'dd-MMMM-yyyy',
      'yyyy/MM/dd',
      'dd.MM.yyyy',
      'shortDate',
    ];
    $scope.dateFormat = $scope.dateFormats[0];
    loadController();
    $scope.show = function() {
      getPage();
    };
    $scope.refresh = function() {
      loadController();
      getPage();
    };
    function loadController() {
      var today = new Date();
      $scope.fromDate = today.setHours(0, 0, 0, 0);
      $scope.toDate = today.setHours(23, 59, 59, 0);
      $scope.username = '';
    }

    // Set options for grid and show it
    $scope.paginationOptions = {
      pageNumber: 1,
      itemPerPage: 10,
      sort: null,
    };
    $scope.gridOptions = {
      enableSorting: false,
      enablePaginationControls: false,
      enableRowSelection: false,
      enableSelectAll: false,
      selectionRowHeaderWidth: 35,
      rowHeight: 35,
      showGridFooter: true,
      enableColumnResizing: true,
      columnDefs: [
        {
          displayName: 'report.username',
          field: 'username',
          enableColumnMenu: false,
          enableHiding: false,
          enableSorting: false,
          headerCellFilter: 'translate',
          headerCellClass: 'headerCenter',
        },
        {
          displayName: 'report.date',
          field: 'creationDate',
          enableColumnMenu: false,
          enableHiding: false,
          enableSorting: false,
          headerCellClass: 'headerCenter',
          cellClass: 'center',
          headerCellFilter: 'translate',
          cellTemplate:
            '<div style="padding: 8px 15px;">{{row.entity.creationDate |  persianDate : "dd-MMMM-yyyy" | translateNumber }} </div>',
        },
        {
          displayName: 'report.url',
          field: 'url',
          enableColumnMenu: false,
          enableHiding: false,
          enableSorting: false,
          headerCellFilter: 'translate',
          headerCellClass: 'headerCenter',
          cellClass: 'text-right',
          cellTemplate:
            '<div style="padding: 8px 15px;">{{row.entity.url}}</div>',
        },
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
      },
    };
    $scope.$watch('paginationOptions.itemPerPage', function(
      oldValue,
      newValue,
    ) {
      getPage();
    });
    $scope.pageChanges = function() {
      getPage();
    };
    var getPage = function() {
      switch ($scope.paginationOptions.sort) {
        case uiGridConstants.ASC:
          break;
        case uiGridConstants.DESC:
          break;
        default:
          break;
      }
      var options = {};
      options.businessId = businessId;
      options.fromDate = new Date($scope.fromDate).getTime();
      options.toDate = new Date($scope.toDate).getTime();
      options.username = englishNumber($scope.username);
      //options.filters.sort = $scope.paginationOptions.sort;
      options.skip =
        ($scope.paginationOptions.pageNumber - 1) *
        $scope.paginationOptions.itemPerPage;
      options.limit = $scope.paginationOptions.itemPerPage;

      //get result from elastic and assign to grid
      Business.getSyslogReport(options).$promise.then(function(syslogReport) {
        $scope.gridOptions.totalItems = syslogReport.count;
        $scope.paginationOptions.totalItems = syslogReport.count;
        $scope.gridOptions.data = syslogReport.data;
      }),
        function(error) {
          $log.error(error);
        };
    };
  },
]);
