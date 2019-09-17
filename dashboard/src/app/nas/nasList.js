/**
 * Created by hamidehnouri on 8/8/2016 AD.
 */

app.controller('nasList', [
  '$scope',
  '$state',
  '$log',
  'translateFilter',
  'Business',
  'Nas',
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
    Nas,
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
          displayName: 'nas.title',
          field: 'title',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellTemplate:
            '<a class="btn btn-link" ng-click="grid.appScope.editNas(row)">{{row.entity.title}}</a>'
        },
        {
          displayName: 'nas.type',
          field: 'accessPointType',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellFilter: 'translate'
        },
        {
          displayName: 'ip.address',
          field: 'nas.ip',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate'
        },
        {
          displayName: 'nas.downloadHotspotTemplate',
          field: 'downloadHotspotTemplate',
          width: 270,
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          cellClass: 'center',
          headerCellClass: 'headerCenter',
          headerCellFilter: 'translate',
          cellTemplate:
            '<a class="btn btn-warning btn-block" ng-click="grid.appScope.downloadScript(row)" ><i class="fa fa-fw fa-download"></i></a>'
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
            '<a  class=\'btn btn-link btn-block\' ng-click=\'grid.appScope.editNas(row)\' ><i class=\'fa fa-fw fa-pencil\'></i></a>'
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
            '<a class="btn btn-link btn-block" ng-click="grid.appScope.removeNas(row)" ><i class="fa fa-fw fa-trash"></i></a>'
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

    $scope.removeNas = function (row) {
      genericService.showConfirmDialog({
        title: 'general.warning',
        message: 'general.areYouSure',
        noBtnLabel: 'general.no',
        yesBtnLabel: 'general.yes',
        yesCallback: function () {
          var nasId = row.entity.id
          var index = $scope.gridOptions.data.indexOf(row.entity)
          Business.nas
            .destroyById({id: businessId}, {fk: nasId})
            .$promise.then(
            function (res) {
              $scope.gridOptions.data.splice(index, 1)
            },
            function (err) {
              appMessenger.showError('nas.removeUnSuccessFull')
            }
          )
        },
        NoCallback: function () {}
      })
    }

    $scope.addNas = function () {

      Business.departments({id: businessId}).$promise.then(
        function (allDepartments) {
          $uibModal.open({
            backdrop: true,
            animation: true,
            keyboard: true,
            backdropClick: true,
            templateUrl: PREFIX + 'app/nas/tpl/nasForm.html',
            controller: [
              '$scope',
              '$uibModalInstance',
              function ($scope, $uibModalInstance) {
                $scope.options = {
                  title: 'nas.addNas',
                  cancelBtnLabel: 'general.cancel',
                  saveBtnLabel: 'general.save'
                }
                $scope.departments = allDepartments

                $scope.nas = {
                  port: '3799',
                  department: null,
                  sessionStatus: 'singleSession',
                  accessPointType: 'mikrotik'
                }
                $scope.cancel = function () {
                  $uibModalInstance.close()
                }
                $scope.save = function () {
                  if (verifyNas($scope.nas)) {
                    delete $scope.nas.ip
                    $scope.nas.department = $scope.nas.department.id
                    if (
                      $scope.nas.accessPointType !== 'mikrotik' &&
                      (!$scope.nas.mac || !verifyMac($scope.nas.mac))
                    ) {
                      appMessenger.showError('nas.nasMacIsRequired')
                      return
                    }
                    if ($scope.nas.mac) {
                      $scope.nas.mac = trimMac($scope.nas.mac)
                      $scope.nas.id = $scope.nas.mac
                    }
                    Business.nas
                      .create({id: businessId}, $scope.nas)
                      .$promise.then(
                      function (res) {
                        appMessenger.showSuccess('nas.createSuccessFull')
                        $uibModalInstance.close()
                        getPage()
                      },
                      function (error) {
                        appMessenger.showError('nas.createUnSuccessFull')
                      }
                    )
                  }
                }
              }
            ]
          })

        })
    }

    $scope.downloadScript = function (row) {
      if (row.entity.accessPointType != 'mikrotik') {
        appMessenger.showError('nas.dontNeedTemplates')
        return
      }
      var nasId = row.entity.id
      if (row.entity.accessPointType === 'mikrotik') {
        Business.nas.findById({id: businessId, fk: nasId}).$promise.then(
          function (nas) {
            $scope.nas = nas
            window.location.href =
              Window.API_URL +
              '/api/radius/downloadScripts/{2}?businessId={1}&nasId={0}'
                .replace('{2}', nas.title)
                .replace('{1}', businessId)
                .replace('{0}', nasId)
          },
          function (error) {
            $log.error(error)
          }
        )
      } else {
        appMessenger.showError('nas.eapRouterDoesNotHaveScript')
      }
    }

    $scope.downloadAccountingScript = function (row) {
      var nasId = row.entity.id
      Business.nas.findById({id: businessId, fk: nasId}).$promise.then(
        function (nas) {
          $scope.nas = nas
          window.location.href = '/api/radius/downloadAccountingScripts/{2}?businessId={1}&nasId={0}'
            .replace('{2}', nas.title)
            .replace('{1}', businessId)
            .replace('{0}', nasId)
        },
        function (error) {
          $log.error(error)
        }
      )
    }

    $scope.editNas = function (row) {
      var nasId = row.entity.id
      Business.nas.findById({id: businessId, fk: nasId}).$promise.then(
        function (nas) {
          Business.departments({id: businessId}).$promise.then(function (allDepartments) {
            $uibModal.open({
              backdrop: true,
              animation: true,
              keyboard: true,
              backdropClick: true,
              templateUrl: PREFIX + 'app/nas/tpl/nasForm.html',
              controller: [
                '$scope',
                '$uibModalInstance',
                function ($scope, $uibModalInstance) {
                  $scope.departments = allDepartments
                  $scope.options = {
                    title: 'nas.editNas',
                    cancelBtnLabel: 'general.cancel',
                    saveBtnLabel: 'general.save'
                  }
                  var nasId = row.entity.id
                  nas.sessionStatus = nas.sessionStatus || 'singleSession'
                  $scope.nas = nas
                  const currentDepartment = allDepartments.filter((department) => {
                    return department.id === nas.department
                  })[0]
                  $scope.nas.department = currentDepartment;
                  $scope.cancel = function () {
                    $uibModalInstance.close()
                  }
                  $scope.save = function () {
                    if (verifyNas($scope.nas)) {
                      $scope.nas.department = $scope.nas.department.id
                      $uibModalInstance.close()
                      delete $scope.nas.ip
                      $scope.nas.port = $scope.nas.port || null
                      Business.nas
                        .updateById(
                          {
                            id: businessId,
                            fk: nasId
                          },
                          $scope.nas
                        )
                        .$promise.then(
                        function (res) {
                          appMessenger.showSuccess('nas.updateSuccessFull')
                          getPage()
                        },
                        function (err) {
                          appMessenger.showError('nas.updateUnSuccessFull')
                        }
                      )
                    }
                  }
                }
              ]
            })
          })
        },
        function (error) {
          $log.error(error)
        }
      )
    }

    $scope.reloadIps = function () {
      Business.reloadIps({businessId: businessId}).$promise.then(
        function (result) {
          appMessenger.showSuccess('nas.reloadIpRequestSuccessFull')
        },
        function (error) {
          appMessenger.showError('nas.reloadIpRequestUnSuccessFull')
          if (
            error.data &&
            error.data.error &&
            error.data.error.message == 'nasList empty'
          ) {
            appMessenger.showError('nas.nasListEmpty')
          }
        }
      )
    }

    function verifyNas (nas) {
      return true

      if (!nas.title) {
        appMessenger.showError('nas.nasTitleRequired')
        return false
      }
      if (nas.sessionStatus == 'multiSession') {
        if (!nas.ip || !nas.port) {
          appMessenger.showError('nas.youNeedValidIpAndPort')
          return false
        }
      } else {
        if (nas.kickOnSingleSession) {
          if (!nas.ip || !nas.port) {
            appMessenger.showError('nas.youNeedValidIpAndPort')
            return false
          }
        }
      }
      return true
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

      Business.nas.count({id: businessId}).$promise.then(
        function (result) {
          $scope.gridOptions.totalItems = result.count
          $scope.paginationOptions.totalItems = result.count
        },
        function (error) {
          $log.error(error)
        }
      )
      Business.nas(options).$promise.then(
        function (nases) {
          $scope.gridOptions.data = nases
        },
        function (error) {
          $log.error(error)
        }
      )
    }
  }
])
