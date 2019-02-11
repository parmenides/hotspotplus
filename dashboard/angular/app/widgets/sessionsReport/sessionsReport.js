/**
 * Created by rezanazari on 03/04/17.
 */
app.directive('sessionsReport', [
  'PREFIX',
  '$log',
  '$rootScope',
  'ClientSession',
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
    ClientSession,
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
          $scope.loading = true;

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
            selectionRowHeaderWidth: 35,
            rowHeight: 35,
            showGridFooter: true,
            enableColumnResizing: true,
            columnDefs: [
              {
                displayName: 'dashboard.username',
                field: 'username',
                enableColumnMenu: false,
                enableHiding: false,
                enableSorting: false,
                cellClass: 'center',
                headerCellClass: 'headerCenter',
                headerCellFilter: 'translate'
              },
              {
                displayName: 'dashboard.framedIpAddress',
                field: 'framedIpAddress',
                enableColumnMenu: false,
                enableHiding: false,
                enableSorting: false,
                cellClass: 'center',
                headerCellClass: 'headerCenter',
                headerCellFilter: 'translate'
              } /*{
								displayName:      'dashboard.connectedAt',
								field:            'creationDate',
								enableColumnMenu: false,
								enableHiding:     false,
								enableSorting:    false,
								headerCellClass:  'headerCenter',
								headerCellFilter: 'translate',
								cellTemplate:     '<div style="padding: 8px 15px;">{{row.entity.creationDate |  persianDate : "dd-MMMM-yyyy" | translateNumber }}</div>'
							},*/,
              {
                displayName: 'dashboard.sessionTimeMin',
                field: 'sessionTime',
                width: 140,
                enableColumnMenu: false,
                enableHiding: false,
                enableSorting: false,
                headerCellClass: 'headerCenter',
                headerCellFilter: 'translate',
                cellClass: 'center',
                cellFilter: 'translateNumber'
              },
              {
                displayName: 'dashboard.downloadMbps',
                field: 'download',
                width: 140,
                enableColumnMenu: false,
                enableHiding: false,
                enableSorting: false,
                headerCellClass: 'headerCenter',
                headerCellFilter: 'translate',
                cellClass: 'center',
                cellFilter: 'translateNumber'
              },
              {
                displayName: 'dashboard.uploadMbps',
                width: 140,
                field: 'upload',
                enableColumnMenu: false,
                enableHiding: false,
                enableSorting: false,
                headerCellClass: 'headerCenter',
                headerCellFilter: 'translate',
                cellClass: 'center',
                cellFilter: 'translateNumber'
              },
              {
                displayName: 'dashboard.killOnlineSession',
                width: 140,
                field: 'killSession',
                enableColumnMenu: false,
                enableHiding: false,
                enableSorting: false,
                headerCellClass: 'headerCenter',
                headerCellFilter: 'translate',
                cellClass: 'center',
                cellFilter: 'translateNumber',
                cellTemplate:
                  '<a class="btn btn-link" ng-click="grid.appScope.killOnlineSession(row)"><i class="fa fa-power-off"></i></a>'
              }
            ],
            onRegisterApi: function(gridApi) {
              $scope.gridApi = gridApi;
              /*							$scope.gridApi.core.on.sortChanged ( $scope, function ( grid, sortColumns ) {
							 if ( sortColumns.length == 0 ) {
							 $scope.paginationOptions.sort = null
							 } else {
							 $scope.paginationOptions.sort = sortColumns[0].name + ' ' + sortColumns[0].sort.direction.toUpperCase ()
							 }
							 getPage ()
							 } )*/
            }
          };

          $scope.killOnlineSession = function(row) {
            if (row && row.entity) {
              ClientSession.killOnlineSession({
                session: row.entity
              }).$promise.then(
                function(result) {
                  /*$scope.gridOptions.data.splice ( index, 1 )*/
                  appMessenger.showSuccess(
                    'dashboard.killOnlineSessionSuccessFull'
                  );
                },
                function(error) {
                  $log.error(error);
                  appMessenger.showError(
                    'dashboard.killOnlineSessionUnSuccessFull'
                  );
                }
              );
            }
          };

          $scope.$watch('paginationOptions.itemPerPage', function(
            oldValue,
            newValue
          ) {
            $scope.loading = true;
            getPage();
          });

          $scope.pageChanges = function() {
            $scope.loading = true;
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
            var query = {};
            query.startDate = $scope.params.fromDate;
            query.businessId = $scope.params.businessId;
            query.skip =
              ($scope.paginationOptions.pageNumber - 1) *
              $scope.paginationOptions.itemPerPage;
            query.limit = $scope.paginationOptions.itemPerPage;

            ClientSession.getOnlineSessionCount({
              businessId: query.businessId
            }).$promise.then(
              function(result) {
                $scope.gridOptions.totalItems = result.count;
                $scope.paginationOptions.totalItems = result.count;

                ClientSession.getOnlineUsers(query).$promise.then(function(
                  onlineUsers
                ) {
                  switch (onlineUsers.result.data) {
                    case 'noSession':
                      $scope.result = translateFilter(
                        'dashboard.noSessionOnlineUsers'
                      );
                      $scope.loading = false;
                      break;
                    default:
                      $scope.gridOptions.data = onlineUsers.result.data;
                      $scope.loading = false;
                      break;
                  }
                }),
                  function(error) {
                    $log.error(
                      'can not get online user info from data source: ' + error
                    );
                  };
              },
              function(error) {
                $log.error(error);
              }
            );
          };
        }
      },
      templateUrl: PREFIX + 'app/widgets/sessionsReport/tpl/sessionsReport.html'
    };
  }
]);
