/**
 * Created by hamidehnouri on 8/8/2016 AD.
 */

app.controller('departmentList', [
  '$scope',
  '$state',
  '$log',
  'translateFilter',
  'Business',
  'Department',
  'uiGridConstants',
  '$http',
  'genericService',
  '$uibModal',
  'PREFIX',
  'Session',
  'appMessenger',
  function (
    $scope,
    $state,
    $log,
    translateFilter,
    Business,
    Department,
    uiGridConstants,
    $http,
    genericService,
    $uibModal,
    PREFIX,
    Session,
    appMessenger
  ) {
    var businessId = Session.business.id

    $scope.paginationOptions = {
      pageNumber: 1,
      itemPerPage: 10,
      sort: null
    }
    $scope.gridOptions = {
      enableSorting: true,
      enablePaginationControls: false,
      enableRowSelection: false,
      enableSelectAll: false,
      selectionRowHeaderWidth: 35,
      rowHeight: 35,
      showGridFooter: true,
      enableColumnResizing: true,
      columnDefs: [
        {
          displayName: 'department.title',
          field: 'title',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellTemplate:
            '<a class="btn btn-link" ng-click="grid.appScope.editDepartment(row)">{{row.entity.title}}</a>'
        },
        {
          displayName: 'general.edit',
          field: 'edit',
          width: 100,
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          cellClass: 'center',
          headerCellClass: 'headerCenter',
          headerCellFilter: 'translate',
          cellTemplate:
            '<a  class=\'btn btn-link btn-block\' ng-click=\'grid.appScope.editDepartment(row)\' ><i class=\'fa fa-fw fa-pencil\'></i></a>'
        },
        {
          displayName: 'general.remove',
          field: 'delete',
          width: 100,
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          cellClass: 'center',
          headerCellClass: 'headerCenter',
          headerCellFilter: 'translate',
          cellTemplate:
            '<a class="btn btn-link btn-block" ng-click="grid.appScope.removeDepartment(row)" ><i class="fa fa-fw fa-trash"></i></a>'
        }
      ],
      onRegisterApi: function (gridApi) {
        $scope.gridApi = gridApi
        $scope.gridApi.core.on.sortChanged($scope, function (grid, sortColumns) {
          if (sortColumns.length == 0) {
            $scope.paginationOptions.sort = null
          } else {
            $scope.paginationOptions.sort =
              sortColumns[0].name +
              ' ' +
              sortColumns[0].sort.direction.toUpperCase()
          }
          getPage()
        })
      }
    }

    $scope.removeDepartment = function (row) {
      genericService.showConfirmDialog({
        title: 'general.warning',
        message: 'general.areYouSure',
        noBtnLabel: 'general.no',
        yesBtnLabel: 'general.yes',
        yesCallback: function () {
          var departmentId = row.entity.id
          var index = $scope.gridOptions.data.indexOf(row.entity)
          Business.departments
            .destroyById({id: businessId}, {fk: departmentId})
            .$promise.then(
            function (res) {
              $scope.gridOptions.data.splice(index, 1)
            },
            function (err) {
              appMessenger.showError('department.removeUnSuccessFull')
            }
          )
        },
        NoCallback: function () {}
      })
    }

    $scope.addDepartment = function () {
      $uibModal.open({
        backdrop: true,
        animation: true,
        keyboard: true,
        backdropClick: true,
        templateUrl: PREFIX + 'app/department/tpl/departmentForm.html',
        controller: [
          '$scope',
          '$uibModalInstance',
          function ($scope, $uibModalInstance) {
            $scope.options = {
              title: 'department.addDepartment',
              cancelBtnLabel: 'general.cancel',
              saveBtnLabel: 'general.save'
            }
            $scope.department = {
              port: '3799',
              sessionStatus: 'singleSession',
              accessPointType: 'mikrotik'
            }
            $scope.cancel = function () {
              $uibModalInstance.close()
            }
            $scope.save = function () {
              delete $scope.department.ip

              if (
                $scope.department.accessPointType !== 'mikrotik' &&
                (!$scope.department.mac || !verifyMac($scope.department.mac))
              ) {
                appMessenger.showError('department.departmentMacIsRequired')
                return
              }
              if ($scope.department.mac) {
                $scope.department.mac = trimMac($scope.department.mac)
                $scope.department.id = $scope.department.mac
              }
              Business.departments
                .create({id: businessId}, $scope.department)
                .$promise.then(
                function (res) {
                  appMessenger.showSuccess('department.createSuccessFull')
                  $uibModalInstance.close()
                  getPage()
                },
                function (error) {
                  appMessenger.showError('department.createUnSuccessFull')
                }
              )
            }
          }
        ]
      })
    }

    $scope.editDepartment = function (row) {
      var departmentId = row.entity.id
      Business.departments.findById({id: businessId, fk: departmentId}).$promise.then(
        function (department) {
          $uibModal.open({
            backdrop: true,
            animation: true,
            keyboard: true,
            backdropClick: true,
            templateUrl: PREFIX + 'app/department/tpl/departmentForm.html',
            controller: [
              '$scope',
              '$uibModalInstance',
              function ($scope, $uibModalInstance) {
                $scope.options = {
                  title: 'department.editDepartment',
                  cancelBtnLabel: 'general.cancel',
                  saveBtnLabel: 'general.save'
                }
                var departmentId = row.entity.id
                department.sessionStatus = department.sessionStatus || 'singleSession'
                $scope.department = department
                $scope.cancel = function () {
                  $uibModalInstance.close()
                }
                $scope.save = function () {
                  $uibModalInstance.close()
                  delete $scope.department.ip
                  $scope.department.port = $scope.department.port || null
                  Business.departments
                    .updateById(
                      {
                        id: businessId,
                        fk: departmentId
                      },
                      $scope.department
                    )
                    .$promise.then(
                    function (res) {
                      appMessenger.showSuccess('department.updateSuccessFull')
                      getPage()
                    },
                    function (err) {
                      appMessenger.showError('department.updateUnSuccessFull')
                    }
                  )

                }
              }
            ]
          })
        },
        function (error) {
          $log.error(error)
        }
      )
    }

    $scope.$watch('paginationOptions.itemPerPage', function (
      oldValue,
      newValue
    ) {
      getPage()
    })

    $scope.pageChanges = function () {
      getPage()
    }

    function trimMac (mac) {
      return mac
        .replace(/-/g, '')
        .replace(/:/g, '')
        .replace(/\./g, '')
    }

    function verifyMac (mac) {
      var tester = /^[0-9a-f]{1,2}([\.:-])(?:[0-9a-f]{1,2}\1){4}[0-9a-f]{1,2}$/i
      return tester.test(mac)
    }

    var getPage = function () {
      switch ($scope.paginationOptions.sort) {
        case uiGridConstants.ASC:
          break
        case uiGridConstants.DESC:
          break
        default:
          break
      }
      var options = {filter: {}}
      options.id = businessId
      options.filter.sort = $scope.paginationOptions.sort
      options.filter.skip =
        ($scope.paginationOptions.pageNumber - 1) *
        $scope.paginationOptions.itemPerPage
      options.filter.limit = $scope.paginationOptions.itemPerPage

      Business.departments.count({id: businessId}).$promise.then(
        function (result) {
          $scope.gridOptions.totalItems = result.count
          $scope.paginationOptions.totalItems = result.count
        },
        function (error) {
          $log.error(error)
        }
      )
      Business.departments(options).$promise.then(
        function (departments) {
          $scope.gridOptions.data = departments
        },
        function (error) {
          $log.error(error)
        }
      )
    }
  }
])
