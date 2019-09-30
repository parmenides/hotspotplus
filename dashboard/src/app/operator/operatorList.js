/**
 * Created by hamidehnouri on 8/8/2016 AD.
 */

app.controller('operatorList', [
  '$scope',
  '$state',
  '$log',
  'translateFilter',
  'Business',
  'InternetPlan',
  'Operator',
  'uiGridConstants',
  '$http',
  'genericService',
  'Session',
  '$uibModal',
  'PREFIX',
  'appMessenger',
  'translateNumberFilter',
  'englishNumberFilter',
  'trimUsernameFilter',
  function (
    $scope,
    $state,
    $log,
    translateFilter,
    Business,
    InternetPlan,
    Operator,
    uiGridConstants,
    $http,
    genericService,
    Session,
    $uibModal,
    PREFIX,
    appMessenger,
    translateNumberFilter,
    englishNumberFilter,
    trimUsernameFilter
  ) {
    var businessId = Session.business.id

    $scope.operatorUsername = ''
    $scope.isSearching = false
    $scope.paginationOptions = {
      pageNumber: 1,
      itemPerPage: 10,
      sort: null
    }
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
          displayName: 'operator.username',
          field: 'username',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          cellTemplate:
            '<a class="btn btn-link" ng-click="grid.appScope.editOperator(row)">{{row.entity.username|trimUsername}}</a>',
          headerCellFilter: 'translate'
        },
        {
          displayName: 'operator.firstName',
          field: 'firstName',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate'
        }, {
          displayName: 'operator.lastName',
          field: 'lastName',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate'
        },
        {
          displayName: 'operator.modifyPassword',
          field: 'passwordText',
          width: 90,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellClass: 'center',
          headerCellClass: 'headerCenter',
          cellTemplate:
            '<a class="btn btn-link" ng-click="grid.appScope.editPassword(row)"><i class="fa fa-key"></i></a>'
        },
        {
          displayName: 'general.remove',
          field: 'delete',
          width: 95,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellClass: 'center',
          headerCellClass: 'headerCenter',
          cellTemplate:
            '<a class="btn btn-link" ng-click="grid.appScope.removeOperator(row)"><i class="fa  fa-trash"></i></a>'
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
    $scope.activateOperatorHelpText = translateFilter('help.activateOperator')

    $scope.addOperator = function () {
      $scope.operator = {
        creationDate: new Date().getTime(),
        businessId: businessId,
        departments: []
      }
      Business.departments({id: businessId}).$promise.then(
        function (allDepartments) {
          $uibModal.open({
            backdrop: true,
            animation: true,
            keyboard: true,
            backdropClick: true,
            size: 'md',
            scope: $scope,
            templateUrl: PREFIX + 'app/operator/tpl/operatorForm.html',
            controller: [
              '$scope',
              '$uibModalInstance',
              function ($scope, $uibModalInstance) {

                $scope.options = {
                  title: 'operator.addOperator',
                  cancelBtnLabel: 'general.cancel',
                  saveBtnLabel: 'general.save',
                  newOperator: true
                }

                $scope.departments = allDepartments
                $scope.selectedDepartments = []
                $scope.cancel = function () {
                  $uibModalInstance.close()
                  getPage()
                }

                $scope.save = function () {

                  $scope.operator.departments = $scope.selectedDepartments.map((department) => {
                    return department.id
                  })

                  if (!$scope.operator.username || !$scope.operator.firstName || !$scope.operator.lastName) {
                    appMessenger.showError('operator.invalidOperator')
                    return
                  }
                  Business.operators
                    .create({id: businessId}, $scope.operator)
                    .$promise.then(
                    function (res) {
                      appMessenger.showSuccess(
                        'operator.createSuccessFull'
                      )
                      getPage()
                      $uibModalInstance.close()
                    },
                    function (err) {
                      appMessenger.showError('operator.createUnSuccessFull')
                      if (err.status == 422) {
                        appMessenger.showError('operator.invalidOperator')
                      }
                    }
                  )
                }

              }
            ]
          })
        },
        function (error) {
          $log.error(error)
          appMessenger.showError('error.generalError')
        }
      )
    }

    $scope.editOperator = function (row) {
      Business.operators.findById({id: businessId, fk: row.entity.id}).$promise.then(function (operator) {
        Business.departments({id: businessId}).$promise.then(
          function (allDepartments) {
            $uibModal.open({
              backdrop: true,
              animation: true,
              keyboard: true,
              backdropClick: true,
              size: 'md',
              scope: $scope,
              templateUrl: PREFIX + 'app/operator/tpl/operatorForm.html',
              controller: [
                '$scope',
                '$uibModalInstance',
                function ($scope, $uibModalInstance) {
                  $scope.options = {
                    title: 'operator.editOperator',
                    cancelBtnLabel: 'general.cancel',
                    saveBtnLabel: 'general.save',
                    saveAndSendBtnLabel: 'general.saveAndSend',
                    newOperator: false
                  }
                  $log.debug(operator)
                  var operatorId = operator.id
                  operator.username = trimUsernameFilter(operator.username)
                  operator.departments = operator.departments || []
                  const departmentsEntity = allDepartments.filter((dep) => {
                    return operator.departments.indexOf(dep.id) !== -1
                  })
                  operator.departments = departmentsEntity
                  $scope.operator = operator
                  $scope.selectedDepartments = operator.departments || []
                  $scope.departments = allDepartments

                  $scope.cancel = function () {
                    $uibModalInstance.close()
                    getPage()
                  }
                  $scope.save = function () {
                    $scope.operator.departments = $scope.selectedDepartments.map((department) => {
                      return department.id
                    })
                    $log.debug($scope.operator)
                    delete $scope.operator.id
                    Business.operators
                      .updateById(
                        {
                          id: businessId,
                          fk: operatorId
                        },
                        $scope.operator
                      )
                      .$promise.then(
                      function (res) {
                        appMessenger.showSuccess(
                          'operator.updateSuccessFull'
                        )
                        getPage()
                        $uibModalInstance.close()
                      },
                      function (err) {
                        $log.error(err)
                        appMessenger.showError('operator.updateUnSuccessFull')
                      }
                    )
                  }
                }
              ]
            })
          },
          function (error) {
            $log.error(error)
            appMessenger.showError('error.generalError')
          }
        )
      })
    }

    $scope.removeOperator = function (row) {
      genericService.showConfirmDialog({
        title: 'general.warning',
        message: 'general.areYouSure',
        noBtnLabel: 'general.no',
        yesBtnLabel: 'general.yes',
        yesCallback: function () {
          var operatorId = row.entity.id
          var index = $scope.gridOptions.data.indexOf(row.entity)
          Business.operators
            .destroyById({id: businessId}, {fk: operatorId})
            .$promise.then(
            function (business) {
              $scope.gridOptions.data.splice(index, 1)
              appMessenger.showSuccess('operator.removeSuccessFull')
            },
            function (err) {
              appMessenger.showError('operator.removeUnSuccessFull')
            }
          )
        },
        NoCallback: function () {}
      })
    }

    $scope.removeOperators = function () {
      var operatorIds = []
      var selectedRows = $scope.gridApi.selection.getSelectedRows()
      angular.forEach(selectedRows, function (selectedRow) {
        if (selectedRow.id) {
          operatorIds.push(selectedRow.id)
        }
      })
      if (operatorIds.length != 0) {
        genericService.showConfirmDialog({
          title: 'general.warning',
          message: 'general.areYouSure',
          noBtnLabel: 'general.no',
          yesBtnLabel: 'general.yes',
          yesCallback: function () {
            Business.destroyOperatorsById({
              businessId: businessId,
              operatorIds: operatorIds
            }).$promise.then(
              function (result) {
                $scope.gridApi.selection.clearSelectedRows()
                getPage()
                appMessenger.showSuccess('operator.removeSuccessFull')
              },
              function (err) {
                appMessenger.showError('operator.removeUnSuccessFull')
              }
            )
          },
          NoCallback: function () {}
        })
      } else {
        appMessenger.showInfo('operator.noOperatorToRemove')
      }
    }

    $scope.editPassword = function (row) {

      Business.operators.findById({id: businessId, fk: row.entity.id}).$promise.then(function (operator) {
        $uibModal.open({
          backdrop: true,
          animation: true,
          keyboard: true,
          backdropClick: true,
          scope: $scope,
          templateUrl: PREFIX + 'app/operator/tpl/passwordForm.html',
          controller: [
            '$scope',
            '$uibModalInstance',
            function ($scope, $uibModalInstance) {
              const operatorId = operator.id
              $scope.options = {
                title: 'operator.editPassword',
                cancelBtnLabel: 'general.cancel',
                saveBtnLabel: 'general.save',
                saveAndSendBtnLabel: 'general.saveAndSendPass',
                sendBtnLabel: 'general.sendPass'
              }
              $scope.newPassword = null
              $scope.cancel = function () {
                $uibModalInstance.close()
              }
              $scope.save = function () {
                $uibModalInstance.close()
                operator.password = $scope.newPassword
                delete operator.id
                Business.operators
                  .updateById(
                    {
                      id: businessId,
                      fk: operatorId
                    },
                    operator
                  )
                  .$promise.then(
                  function (res) {
                    appMessenger.showSuccess(
                      'operator.passwordChangeSuccessFull'
                    )
                    getPage()
                  },
                  function (err) {
                    appMessenger.showError(
                      'operator.passwordChangeUnSuccessFull'
                    )
                  }
                )
              }
            }
          ]
        })
      })

    }

    $scope.$watch('paginationOptions.itemPerPage', function (
      newValue,
      oldValue
    ) {
      getPage()
    })

    $scope.pageChanges = function () {
      getPage()
    }

    var getPage = function (inputFilter) {
      $scope.gridApi.selection.clearSelectedRows()
      switch ($scope.paginationOptions.sort) {
        case uiGridConstants.ASC:
          break
        case uiGridConstants.DESC:
          break
        default:
          break
      }
      var options = {filter: {}}
      if (inputFilter) {
        options.filter.where = inputFilter
      }
      options.id = businessId
      options.filter.sort = $scope.paginationOptions.sort
      options.filter.skip =
        ($scope.paginationOptions.pageNumber - 1) *
        $scope.paginationOptions.itemPerPage
      options.filter.limit = $scope.paginationOptions.itemPerPage
      options.filter.fields = {}
      Business.operators
        .count({id: businessId, where: inputFilter})
        .$promise.then(
        function (result) {
          $scope.gridOptions.totalItems = result.count
          $scope.paginationOptions.totalItems = result.count
        },
        function (error) {
          $log.error(error)
        }
      )
      Business.operators(options).$promise.then(
        function (operators) {
          $scope.isSearching = false
          $scope.gridOptions.data = operators
        },
        function (error) {
          $log.error(error)
        }
      )
    }
  }
])
