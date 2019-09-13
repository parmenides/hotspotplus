/**
 * Created by rezanazari on 03/04/17.
 */
app.directive('membersReport', [
  'PREFIX',
  '$log',
  '$rootScope',
  'Business',
  'uiGridConstants',
  'translateFilter',
  'persianDateFilter',
  'translateNumberFilter',
  'appMessenger',
  'trimUsernameFilter',
  function(
    PREFIX,
    $log,
    $rootScope,
    Business,
    uiGridConstants,
    translateFilter,
    persianDateFilter,
    translateNumberFilter,
    appMessenger,
    trimUsernameFilter
  ) {
    return {
      scope: {
        params: '=options'
      },
      controller: function($scope) {
        $scope.localLang = $rootScope.localLang;
        $scope.direction = $rootScope.direction;
        $scope.loading = false;
        makeTable();
        $scope.$on($scope.params.reloadEvent, function(event, data) {
          if (data.params.advanceTime) {
            $scope.params.fromDate = data.params.advanceTime.startDate;
          } else {
            $scope.params.fromDate = data.params.fromDate;
          }
          makeTable();
        });
        function makeTable() {

          $scope.paginationOptions = {
            pageNumber: 1,
            itemPerPage: 10,
            sort: null
          };

          $scope.gridOptions = {
            enableSorting: false,
            enablePaginationControls: false,
            paginationPageSize: $scope.paginationOptions.itemPerPage,
            enableRowSelection: false,
            enableSelectAll: false,
            showGridFooter: false,
            enableColumnResizing: false,
            columnDefs: [
              {
                displayName: 'member.username',
                field: 'username',
                enableHiding: false,
                enableSorting: false,
                enableColumnMenu: false,
                headerCellFilter: 'translate',
                cellFilter: 'cleanupUsername',
              },
              {
                displayName: 'member.creationDate',
                field: 'creationDate',
                enableHiding: false,
                enableSorting: false,
                enableColumnMenu: false,
                headerCellFilter: 'translate',
                cellTemplate: '<div class="ui-grid-cell-contents" ng-if="row.entity.creationDate">{{row.entity.creationDate |  translateDate | translateNumber }}{{"general.,"| translate}}&nbsp;{{"general.hour"| translate}}:&nbsp;{{row.entity.creationDate |  date : "HH:mm" | translateNumber }}</div>'
              },
              {
                displayName: 'member.internetPlanName',
                field: 'internetPlanName',
                width: 150,
                enableHiding: false,
                enableSorting: false,
                enableColumnMenu: false,
                headerCellFilter: 'translate',
                cellTemplate:
                  '<div class="ui-grid-cell-contents">{{row.entity.internetPlanName}}</div>'
              },
              {
                displayName: 'member.status',
                field: 'active',
                width: 150,
                enableHiding: false,
                enableSorting: false,
                enableColumnMenu: false,
                headerCellFilter: 'translate',
                cellTemplate:
                  '<div class="ui-grid-cell-contents" ng-if="row.entity.active">{{"member.active"|translate}}</div>' +
                  '<div class="ui-grid-cell-contents" ng-if="!row.entity.active">{{"member.inActive"|translate}}</div>'
              },
            ],
            onRegisterApi: function(gridApi) {
              $scope.gridApi = gridApi;
              getPage();
            }
          };

          $scope.pageChanges = function() {
            $scope.loading = true;
            getPage();
          };

          var getPage = function() {
            var options = {};
            options.id = $scope.params.businessId;
            options.filter = {};
            options.filter.sort = 'creationDate DESC';
            options.filter.skip = 0
            options.filter.limit = 10;
            options.filter.fields = { internetPlanHistory: false };

            Business.members(options).$promise.then(
              function(members) {
                $scope.gridOptions.data = members;
                $scope.loading = false;
              },
              function(error) {
                $scope.loading = true;
                $log.error(error);
              }
            );
          };
        }
      },
      templateUrl: PREFIX + 'app/widgets/membersReport/tpl/membersReport.html'
    };
  }
]);
