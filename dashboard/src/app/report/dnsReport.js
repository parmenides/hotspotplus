/**
 * Created by rezanazari on 03/04/17.
 */
app.controller('dnsReport', [
  'PREFIX',
  '$scope',
  '$log',
  '$rootScope',
  'ClientSession',
  'Business',
  'Report',
  'uiGridConstants',
  'translateFilter',
  'persianDateFilter',
  'translateNumberFilter',
  'appMessenger',
  'trimUsernameFilter',
  function (
    PREFIX,
    $scope,
    $log,
    $rootScope,
    ClientSession,
    Business,
    Report,
    uiGridConstants,
    translateFilter,
    persianDateFilter,
    translateNumberFilter,
    appMessenger,
    trimUsernameFilter
  ) {
    $scope.loading = true
    $scope.waitingForDwl = false;
    $scope.waitingForResponse = false;

    $scope.localLang = $rootScope.localLang
    $scope.direction = $rootScope.direction
    $scope.dateFormats = [
      'dd-MMMM-yyyy',
      'yyyy/MM/dd',
      'dd.MM.yyyy',
      'shortDate'
    ]
    $scope.dateFormat = $scope.dateFormats[0]
    $scope.startDateCalendar = function ($event) {
      $event.preventDefault()
      $event.stopPropagation()
      $scope.startDateCalendarIsOpen = true
      $scope.endDateCalendarIsOpen = false
    }
    $scope.endDateCalendar = function ($event) {
      $event.preventDefault()
      $event.stopPropagation()
      $scope.endDateCalendarIsOpen = true
      $scope.startDateCalendarIsOpen = false
    }

    $scope.searchFilter = {}
    $scope.searchFilter.from = Date.now()
    $scope.searchFilter.to = Date.now()
    $scope.searchFilter.departments = []

    $scope.members = []
    Business.loadMembersUsernames({businessId: businessId}).$promise.then(function (result) {
      $scope.members = result.members
    })

    $scope.departments = []
    Business.getMyDepartments().$promise.then(function (response) {
      $scope.departments = response.departments
    })

    $scope.paginationOptions = {
      pageNumber: 1,
      itemPerPage: 15,
      sort: null
    }

    $scope.gridOptions = {
      enableSorting: true,
      enablePaginationControls: false,
      paginationPageSize: $scope.paginationOptions.itemPerPage,
      enableRowSelection: false,
      enableSelectAll: false,
      showGridFooter: false,
      enableColumnResizing: true,
      columnDefs: [
        {
          displayName: 'report.department',
          field: 'department',
          enableColumnMenu: false,
          enableHiding: false,
          enableSorting: false,
          cellClass: 'center',
          headerCellClass: 'headerCenter',
          headerCellFilter: 'translate'
        },
        {
          displayName: 'report.username',
          field: 'username',
          enableColumnMenu: false,
          enableHiding: false,
          enableSorting: false,
          cellClass: 'center',
          headerCellClass: 'headerCenter',
          headerCellFilter: 'translate'
        },

        {
          displayName: 'report.domain',
          field: 'domain',
          enableColumnMenu: false,
          enableHiding: false,
          enableSorting: false,
          cellClass: 'center',
          headerCellClass: 'headerCenter',
          headerCellFilter: 'translate',
          cellTemplate: '<div class="ui-grid-cell-contents ltr-text">{{row.entity.domain}}</div>'
        },
        {
          displayName: 'report.date',
          field: 'jalaliDate',
          enableColumnMenu: false,
          enableHiding: false,
          enableSorting: false,
          cellClass: 'center',
          headerCellClass: 'headerCenter',
          headerCellFilter: 'translate'
        },
      ],
      onRegisterApi: function (gridApi) {
        $log.debug(gridApi.grid.isScrollingVertically)
        $scope.gridApi = gridApi
      }
    }

    $scope.pageChanges = function () {
      $scope.loading = true
      $scope.search()
    }

    $scope.search = function (type) {
      $log.debug($scope.searchFilter)
      type = type || 'json'
      var query = {
        report: 'dns',
        type,
        from: new Date($scope.searchFilter.from).getTime(),
        to: new Date($scope.searchFilter.to).getTime(),
        domain: $scope.searchFilter.domain,
        departments: $scope.searchFilter.departments.map(function (dep) {
          return dep.id
        }),
        username: $scope.searchFilter.member ? $scope.searchFilter.member.username : undefined,
        businessId: businessId,
      }
      if (type === 'json') {
        query.sort = $scope.searchFilter.sort
        query.skip = ($scope.paginationOptions.pageNumber - 1) * $scope.paginationOptions.itemPerPage
        query.limit = $scope.paginationOptions.itemPerPage
        $scope.waitingForResponse = true;
        Report.searchDns(query).$promise.then(
          function (result) {
            $scope.waitingForResponse = false;
            $scope.gridOptions.totalItems = result.size
            $scope.paginationOptions.totalItems = result.size
            $scope.gridOptions.data = result.data
          },
          function (error) {
            $log.error(error)
          }
        )
      } else if (type === 'excel') {
        $scope.waitingForDwl = true;
        Report.searchDns(query).$promise.then(
          function (report) {
            $scope.waitingForDwl = false;
            var fileName = report.fileName
            var container = report.container
            if (fileName && container) {
              window.location.href =
                Window.API_URL +
                '/api/BigFiles/{0}/download/{1}'
                  .replace('{0}', container)
                  .replace('{1}', fileName)
            } else {
              appMessenger.showError('report.noReportsToDownload')
            }
          },
          function (error) {
            $log.error(error)
          }
        )
      }
    }
  }
])
