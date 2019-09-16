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
  function(
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
  ) {
    var businessId = Session.business.id;

    $scope.operatorUsername = '';
    $scope.isSearching = false;
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
          displayName: 'operator.username',
          field: 'username',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          cellTemplate:
            '<a class="btn btn-link" ng-click="grid.appScope.editOperator(row)">{{row.entity.username}}</a>',
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
            '<a class="btn btn-link" ng-click="grid.appScope.editPassword(row.entity)"><i class="fa fa-key"></i></a>'
        },
        {
          displayName: 'general.edit',
          field: 'edit',
          width: 100,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellClass: 'center',
          headerCellClass: 'headerCenter',
          cellTemplate:
            '<a class="btn btn-link" ng-click="grid.appScope.editOperator(row)"><i class="fa  fa-pencil"></i></a>'
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
    $scope.activateOperatorHelpText = translateFilter('help.activateOperator');
    $scope.addOperator = function() {
      $scope.operator = {
        active: true,
        subscriptionDate: new Date().getTime(),
        creationDate: new Date().getTime(),
        businessId: businessId,
        selectedInternetPlan: null
      };
      Business.internetPlans({ id: businessId }).$promise.then(
        function(internetPlans) {
          if (internetPlans.length != 0) {
            $scope.internetPlans = internetPlans;
            $scope.operator.selectedInternetPlan = $scope.internetPlans[0];
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
                function($scope, $uibModalInstance) {
                  $scope.options = {
                    title: 'operator.addOperator',
                    cancelBtnLabel: 'general.cancel',
                    saveBtnLabel: 'general.save',
                    saveAndSendBtnLabel: 'general.saveAndSendPass',
                    newOperator: true
                  };
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
                  };
                  // --> for calendar bug
                  $scope.$watch('operator.birthday', function(
                    newValue,
                    oldValue
                  ) {
                    $scope.startDateCalendarIsOpen = false;
                  });
                  // <-- for calendar bug
                  $scope.cancel = function() {
                    $uibModalInstance.close();
                  };
                  $scope.save = function(sendMessage) {
                    if ($scope.operator.birthday) {
                      var birthday = new Date($scope.operator.birthday);
                      $scope.operator.birthday = birthday.getTime();
                    }
                    if ($scope.operator.mobile) {
                      $scope.operator.mobile = englishNumberFilter(
                        $scope.operator.mobile
                      );
                    }
                    var planId = $scope.operator.selectedInternetPlan.id;
                    delete $scope.operator.selectedInternetPlan;
                    Business.operators
                      .create({ id: businessId }, $scope.operator)
                      .$promise.then(
                        function(res) {
                          var operatorId = res.id;
                          InternetPlan.assignPlanToOperator({
                            operatorId: operatorId,
                            planId: planId
                          }).$promise.then(
                            function(res) {
                              if (sendMessage) {
                                $scope.sendPassword(operatorId);
                              }
                              appMessenger.showSuccess(
                                'operator.createSuccessFull'
                              );
                              getPage();
                              $uibModalInstance.close();
                            },
                            function(error) {
                              appMessenger.showError(
                                'operator.assignInternetPlanUnSuccessFull'
                              );
                            }
                          );
                        },
                        function(err) {
                          appMessenger.showError('operator.createUnSuccessFull');
                          if (err.status == 422) {
                            appMessenger.showError('operator.usernameNotValid');
                          }
                        }
                      );
                  };
                }
              ]
            });
          } else {
            appMessenger.showWarning('operator.pleaseCreateAnInternetPlan');
          }
        },
        function(error) {
          $log.error(error);
          appMessenger.showError('error.generalError');
        }
      );
    };
    $scope.editOperator = function(row) {
      var operatorId = row.entity.id;
      Operator.loadOperator({
        businessId: businessId,
        operatorId: operatorId
      }).$promise.then(
        function(operator) {
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
              function($scope, $uibModalInstance) {
                $scope.options = {
                  title: 'operator.editOperator',
                  cancelBtnLabel: 'general.cancel',
                  saveBtnLabel: 'general.save',
                  saveAndSendBtnLabel: 'general.saveAndSend',
                  newOperator: false
                };
                var operatorId = row.entity.id;
                $scope.operator = operator;
                $scope.operator.username = $scope.operator.username.split('@')[0];
                if (operator.mobile) {
                  operator.mobile = translateNumberFilter(operator.mobile);
                }
                $scope.operator.selectedInternetPlan = null;
                Business.internetPlans({ id: businessId }).$promise.then(
                  function(internetPlans) {
                    $scope.internetPlans = internetPlans;
                    angular.forEach(internetPlans, function(internetPlan) {
                      if (internetPlan.id == operator.internetPlanId) {
                        $scope.operator.selectedInternetPlan = internetPlan;
                      }
                    });
                  },
                  function(error) {
                    $log.error(error);
                  }
                );
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
                };
                // --> for calendar bug
                $scope.$watch('operator.birthday', function(newValue, oldValue) {
                  $scope.startDateCalendarIsOpen = false;
                });
                // <-- for calendar bug
                $scope.cancel = function() {
                  $uibModalInstance.close();
                };
                $scope.save = function() {
                  if ($scope.operator.birthday) {
                    $scope.operator.birthday = $scope.operator.birthday.getTime();
                  }
                  if ($scope.operator.mobile) {
                    $scope.operator.mobile = englishNumberFilter(
                      $scope.operator.mobile
                    );
                  }
                  if (!$scope.operator.selectedInternetPlan) {
                    appMessenger.showError('operator.pleaseSelectAnInternetPlan');
                  } else {
                    var planId = $scope.operator.selectedInternetPlan.id;
                    delete $scope.operator.selectedInternetPlan;
                    Business.operators
                      .updateById(
                        {
                          id: businessId,
                          fk: operatorId
                        },
                        $scope.operator
                      )
                      .$promise.then(
                        function(res) {
                          if (planId != res.internetPlanId) {
                            InternetPlan.assignPlanToOperator({
                              operatorId: operatorId,
                              planId: planId
                            }).$promise.then(
                              function(res) {
                                appMessenger.showSuccess(
                                  'operator.updateSuccessFull'
                                );
                                getPage();
                                $uibModalInstance.close();
                              },
                              function(err) {
                                appMessenger.showError(
                                  'operator.assignInternetPlanUnSuccessFull'
                                );
                              }
                            );
                          } else {
                            appMessenger.showSuccess(
                              'operator.updateSuccessFull'
                            );
                            getPage();
                            $uibModalInstance.close();
                          }
                        },
                        function(err) {
                          appMessenger.showError('operator.updateUnSuccessFull');
                          if (err.status == 422) {
                            appMessenger.showError('operator.duplicateUsername');
                          }
                        }
                      );
                  }
                };
                $scope.password = function() {
                  $uibModalInstance.close();
                  $scope.editPassword(row.entity);
                };
              }
            ]
          });
        },
        function(error) {
          $log.error(error);
          appMessenger.showError('error.generalError');
        }
      );
    };
    $scope.removeOperator = function(row) {
      genericService.showConfirmDialog({
        title: 'general.warning',
        message: 'general.areYouSure',
        noBtnLabel: 'general.no',
        yesBtnLabel: 'general.yes',
        yesCallback: function() {
          var operatorId = row.entity.id;
          var index = $scope.gridOptions.data.indexOf(row.entity);
          Business.operators
            .destroyById({ id: businessId }, { fk: operatorId })
            .$promise.then(
              function(business) {
                $scope.gridOptions.data.splice(index, 1);
                appMessenger.showSuccess('operator.removeSuccessFull');
              },
              function(err) {
                appMessenger.showError('operator.removeUnSuccessFull');
              }
            );
        },
        NoCallback: function() {}
      });
    };
    $scope.removeOperators = function() {
      var operatorIds = [];
      var selectedRows = $scope.gridApi.selection.getSelectedRows();
      angular.forEach(selectedRows, function(selectedRow) {
        if (selectedRow.id) {
          operatorIds.push(selectedRow.id);
        }
      });
      if (operatorIds.length != 0) {
        genericService.showConfirmDialog({
          title: 'general.warning',
          message: 'general.areYouSure',
          noBtnLabel: 'general.no',
          yesBtnLabel: 'general.yes',
          yesCallback: function() {
            Business.destroyOperatorsById({
              businessId: businessId,
              operatorIds: operatorIds
            }).$promise.then(
              function(result) {
                $scope.gridApi.selection.clearSelectedRows();
                getPage();
                appMessenger.showSuccess('operator.removeSuccessFull');
              },
              function(err) {
                appMessenger.showError('operator.removeUnSuccessFull');
              }
            );
          },
          NoCallback: function() {}
        });
      } else {
        appMessenger.showInfo('operator.noOperatorToRemove');
      }
    };
    $scope.editPassword = function(operator) {
      var operatorId = operator.id;
      Operator.loadOperatorPassword({
        businessId: businessId,
        operatorId: operatorId
      }).$promise.then(
        function(res) {
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
              function($scope, $uibModalInstance) {
                $scope.options = {
                  title: 'operator.editPassword',
                  cancelBtnLabel: 'general.cancel',
                  saveBtnLabel: 'general.save',
                  saveAndSendBtnLabel: 'general.saveAndSendPass',
                  sendBtnLabel: 'general.sendPass'
                };
                $scope.newPassword = null;
                $scope.currentPassword = res.passwordText;
                $scope.cancel = function() {
                  $uibModalInstance.close();
                };
                $scope.save = function(sendMessage) {
                  $uibModalInstance.close();
                  if ($scope.newPassword) {
                    Business.operators
                      .updateById(
                        {
                          id: businessId,
                          fk: operatorId
                        },
                        { passwordText: $scope.newPassword }
                      )
                      .$promise.then(
                        function(res) {
                          appMessenger.showSuccess(
                            'operator.passwordChangeSuccessFull'
                          );
                          if (sendMessage) {
                            $scope.sendPassword(operatorId);
                          }
                          getPage();
                        },
                        function(err) {
                          appMessenger.showError(
                            'operator.passwordChangeUnSuccessFull'
                          );
                        }
                      );
                  } else if (sendMessage) {
                    $scope.sendPassword(operatorId);
                  }
                };
              }
            ]
          });
        },
        function(error) {
          $log.error(error);
          appMessenger.showError('error.generalError');
        }
      );
    };
    $scope.searchOperator = function() {
      if ($scope.operatorUsername) {
        $scope.isSearching = true;
        var usernamePattern =
          '/' + $scope.operatorUsername + '.*@' + businessId + '$/i';
        var filter = { username: { regexp: usernamePattern } };
        getPage(filter);
      } else {
        getPage();
      }
    };
    $scope.clearSearch = function() {
      if ($scope.operatorUsername) {
        $scope.operatorUsername = '';
        getPage();
      }
    };

    $scope.$watch('operatorUsername', function(newValue, oldValue) {
      if (newValue != oldValue && newValue.length == 0) {
        getPage();
      }
    });

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
      options.filter.fields = {  };
      Business.operators
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
      Business.operators(options).$promise.then(
        function(operators) {
          Business.internetPlans({ id: businessId }).$promise.then(
            function(internetPlans) {
              Operator.loadOperatorUsage({ operators: operators }).$promise.then(
                function(usage) {
                  for (var i = 0; i < operators.length; i++) {
                    operators[i].upload = 0;
                    operators[i].download = 0;
                    var operatorId = operators[i].id;
                    if (usage[operatorId]) {
                      operators[i].upload = usage[operatorId].upload;
                      operators[i].download = usage[operatorId].download;
                    }
                    operators[i].username = operators[i].username.split('@')[0];
                    operators[i].internetPlanName = '-';
                    angular.forEach(internetPlans, function(internetPlan) {
                      if (operators[i].internetPlanId == internetPlan.id) {
                        operators[i].internetPlanName = internetPlan.name;
                      }
                    });
                  }
                  $scope.isSearching = false;
                  $scope.gridOptions.data = operators;
                },
                function(err) {
                  $log.error(err);
                }
              );
            },
            function(error) {
              $log.error(error);
            }
          );
        },
        function(error) {
          $log.error(error);
        }
      );
    };
  }
]);
