/**
 * Created by hamidehnouri on 10/14/2017 AD.
 */
app.controller('planHistoryList', [
  '$scope',
  '$log',
  'translateFilter',
  '$uibModalInstance',
  'InternetPlan',
  'Member',
  'uiGridConstants',
  'Session',
  'PREFIX',
  'appMessenger',
  function(
    $scope,
    $log,
    translateFilter,
    $uibModalInstance,
    InternetPlan,
    Member,
    uiGridConstants,
    Session,
    PREFIX,
    appMessenger
  ) {
    $scope.daily = 'daily';
    $scope.monthly = 'monthly';
    $scope.paginationOptions = {
      pageNumber: 1,
      itemPerPage: 10,
      sort: null
    };
    $scope.gridOptions = {
      enableSorting: true,
      enablePaginationControls: false,
      selectionRowHeaderWidth: 35,
      rowHeight: 36,
      showGridFooter: true,
      enableColumnResizing: true,
      minRowsToShow: 11,
      columnDefs: [
        {
          displayName: 'internetPlan.name',
          field: 'name',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate'
        },
        {
          displayName: 'internetPlan.assignDate',
          field: 'assignDate',
          enableHiding: false,
          width:130,
          enableSorting: true,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellTemplate:
            '<div class="ui-grid-cell-contents"><span ng-if="row.entity.assignDate">' +
            '{{row.entity.assignDate |  translateDate  | translateNumber }}&nbsp;{{row.entity.assignDate |  date : "HH:mm" | translateNumber }}' +
            '</span><span ng-if="!row.entity.assignDate">-</span>' +
            '</div>'
        },
        {
          displayName: 'internetPlan.duration',
          field: 'duration',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellTemplate:
            '<div class="ui-grid-cell-contents"><span ng-if="row.entity.duration">{{row.entity.duration | translateNumber }} ' +
            '<span ng-if="row.entity.type == grid.appScope.daily">{{"internetPlan.day" | translate }}</span>' +
            '<span ng-if="row.entity.type == grid.appScope.monthly">{{"internetPlan.month" | translate }}</span></span>' +
            '<span ng-if="!row.entity.duration">-</span>' +
            '</div>'
        },
        {
          displayName: 'internetPlan.totalUsage',
          field: 'totalUsage',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellFilter: 'translate',
          cellTemplate: '<div class="ui-grid-cell-contents"><span ng-if="row.entity.totalUsage">{{row.entity.totalUsage | number | humanSize | translateNumber }}</span> <span ng-if="!row.entity.totalUsage">-</span></div>'
        },
       /* {
          displayName: 'internetPlan.type',
          field: 'type',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellTemplate:
            '<div class="ui-grid-cell-contents"><span ng-if="row.entity.type">{{row.entity.type | translate}}</span><span ng-if="!row.entity.type">-</span></div>'
        },*/
       /* {
          displayName: 'internetPlan.accessType',
          field: 'accessType',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellTemplate:
            '<div class="ui-grid-cell-contents"><span ng-if="row.entity.accessType">{{row.entity.accessType | translate}}</span><span ng-if="!row.entity.accessType">-</span></div>'
        },*/
        {
          displayName: 'internetPlan.price',
          field: 'price',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellFilter: 'translate',
          cellTemplate:
            '<div class="ui-grid-cell-contents">' +
            '<span ng-if="row.entity.price != null">' +
            '<span ng-if="row.entity.price != 0">{{row.entity.price | translateNumber }} {{"general.toman" | translate }}</span>' +
            '<span ng-if="row.entity.price === 0">{{"general.free" | translate}}</span>' +
            '</span>' +
            '<span ng-if="row.entity.price == null">-</span>' +
            '</div>'
        },
        {
          displayName: 'internetPlan.bulk',
          field: 'bulk',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellFilter: 'translate',
          cellTemplate:
            '<div class="ui-grid-cell-contents">' +
            '<span ng-if="row.entity.bulk">{{row.entity.bulk.value | translateNumber }} {{"internetPlan."+row.entity.bulk.type | translate }}</span>' +
            '<span ng-if="!row.entity.bulk">-</span>' +
            '</div>'
        },
        {
          displayName: 'internetPlan.speed',
          field: 'speed',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellFilter: 'translate',
          cellTemplate:
            '<div class="ui-grid-cell-contents">' +
            '<span ng-if="row.entity.speed">{{row.entity.speed.value | translateNumber }} {{"internetPlan."+row.entity.speed.type | translate }}</span>' +
            '<span ng-if="!row.entity.speed">-</span>' +
            '</div>'
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
    $scope.$watch('paginationOptions.itemPerPage', function(
      newValue,
      oldValue
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
      Member.loadMemberInternetPlans({
        businessId: $scope.businessId,
        memberId: $scope.memberId
      }).$promise.then(
        function(res) {
          if (res.internetPlanHistory && res.internetPlanHistory.length != 0) {
            $scope.gridOptions.totalItems = res.internetPlanHistory.length;
            $scope.paginationOptions.totalItems =
              res.internetPlanHistory.length;
            $scope.gridOptions.data = res.internetPlanHistory;
          } else {
            $scope.gridOptions.totalItems = 1;
            $scope.paginationOptions.totalItems = 1;
            $scope.gridOptions.data.push({
              name: $scope.member.internetPlanName
            });
          }
        },
        function(error) {
          $log.error(error);
          appMessenger.showError('error.generalError');
        }
      );
    };
    $scope.ok = function() {
      $uibModalInstance.close();
    };
  }
]);
