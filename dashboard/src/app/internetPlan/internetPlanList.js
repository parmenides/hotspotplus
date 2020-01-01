/**
 * Created by hamidehnouri on 12/6/2016 AD.
 */

app.controller('internetPlanList', [
  '$scope',
  '$state',
  '$log',
  'translateFilter',
  'Business',
  'InternetPlan',
  'uiGridConstants',
  '$http',
  'genericService',
  '$uibModal',
  'PREFIX',
  'Session',
  'appMessenger',
  'translateNumberFilter',
  'englishNumberFilter',
  function (
    $scope,
    $state,
    $log,
    translateFilter,
    Business,
    InternetPlan,
    uiGridConstants,
    $http,
    genericService,
    $uibModal,
    PREFIX,
    Session,
    appMessenger,
    translateNumberFilter,
    englishNumberFilter
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
          displayName: 'internetPlan.name',
          field: 'name',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellTemplate:
            '<a class="btn btn-link" ng-click="grid.appScope.editPlan(row)">{{row.entity.name}}</a>'
        },
        {
          displayName: 'internetPlan.accessType',
          field: 'accessType',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellFilter: 'translate'
        },
        {
          displayName: 'internetPlan.price',
          field: 'price',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellFilter: 'translate',
          cellTemplate:
            '<div class="ui-grid-cell-contents"><span ng-if="row.entity.price != 0">{{row.entity.price | translateNumber }} {{"general.toman" | translate }}</span><span ng-if="row.entity.price == 0">{{"general.free" | translate}}</span></div>'
        },
        {
          displayName: 'internetPlan.defaultPlan',
          field: 'selected',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellClass: 'center',
          headerCellClass: 'center',
          cellTemplate:
            '<a class="btn btn-link" ng-disabled="row.entity.price != 0" ng-click="grid.appScope.editDefaultPlanSettings()" uib-popover={{grid.appScope.selectDefaultPlanSettingsText}} popover-trigger="mouseenter"' +
            'popover-placement="right"><i class="fa fa-circle-o" ng-if="!row.entity.selected"></i>' +
            '<i class="fa fa-dot-circle-o text-info" ng-if="row.entity.selected"></i></a>'
        },
        /*{
          displayName: 'general.edit',
          field: 'edit',
          width: 90,
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellClass: 'center',
          headerCellClass: 'center',
          cellTemplate:
            '<a class="btn btn-link" ng-click="grid.appScope.editPlan(row)"><i class="fa fa-fw fa-pencil"></i></a>'
        },*/
        {
          displayName: 'general.remove',
          field: 'delete',
          width: 100,
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellClass: 'center',
          headerCellClass: 'center',
          cellTemplate:
            '<a class="btn btn-link" ng-click="grid.appScope.removePlan(row)"><i class="fa fa-fw fa-trash"></i></a>'
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

    $scope.selectDefaultPlanSettingsText = translateFilter(
      'help.selectDefaultPlanSettings'
    )
    $scope.removePlan = function (row) {
      genericService.showConfirmDialog({
        title: 'general.warning',
        message: 'general.areYouSure',
        noBtnLabel: 'general.no',
        yesBtnLabel: 'general.yes',
        yesCallback: function () {
          var internetPlanId = row.entity.id
          var index = $scope.gridOptions.data.indexOf(row.entity)
          Business.internetPlans
            .destroyById({id: businessId}, {fk: internetPlanId})
            .$promise.then(
            function (res) {
              $scope.gridOptions.data.splice(index, 1)
            },
            function (err) {
              appMessenger.showError('internetPlan.removeUnSuccessFull')
            }
          )
        },
        NoCallback: function () {}
      })
    }

    $scope.addPlan = function (planType) {
      $uibModal.open({
        backdrop: true,
        size: 'lg',
        animation: true,
        keyboard: true,
        backdropClick: true,
        templateUrl: PREFIX + 'app/internetPlan/tpl/internetPlanForm.html',
        controller: [
          '$scope',
          '$uibModalInstance',
          function ($scope, $uibModalInstance) {
            var defaultPlan = {
              speed: {value: 128, type: 'Kbps'},
              bulk: {value: 0, type: 'MB'},
              timeDuration: 0,
              price: 0,
              fromToCheck: false,
              fromHour: 0,
              toHour: 0,
              fromMinute: 0,
              toMinute: 0,
              extraBulkPrice: 0,
              autoResubscribe: false,
              accessType: 'private'
            }
            $scope.options = {
              title: 'internetPlan.' + 'addPlan',
              cancelBtnLabel: 'general.cancel',
              saveBtnLabel: 'general.save'
            }
            $scope.speedTypes = ['Kbps', 'Mbps', 'Gbps']
            $scope.bulkTypes = ['KB', 'MB', 'GB']
            $scope.internetPlan = defaultPlan
            $scope.internetPlan.type = planType
            $scope.internetPlan.duration = 3
            $scope.internetPlan = translateInternetPlan($scope.internetPlan)
            $scope.cancel = function () {
              $uibModalInstance.close()
            }
            $scope.save = function () {
              $scope.internetPlan = englishInternetPlan($scope.internetPlan)
              Business.internetPlans
                .create({id: businessId}, $scope.internetPlan)
                .$promise.then(
                function (res) {
                  appMessenger.showSuccess('internetPlan.createSuccessFull')
                  getPage()
                  $uibModalInstance.close()
                },
                function (err) {
                  appMessenger.showError('internetPlan.createUnSuccessFull')
                  if (err.status == 422) {
                    appMessenger.showError('general.invalidInput')
                  }
                }
              )
            }
          }
        ]
      })
    }

    $scope.editPlan = function (row) {
      $uibModal.open({
        backdrop: true,
        animation: true,
        size: 'lg',
        keyboard: true,
        backdropClick: true,
        templateUrl: PREFIX + 'app/internetPlan/tpl/internetPlanForm.html',
        controller: [
          '$scope',
          '$uibModalInstance',
          function ($scope, $uibModalInstance) {
            $scope.speedTypes = ['Kbps', 'Mbps', 'Gbps']
            $scope.bulkTypes = ['KB', 'MB', 'GB']
            $scope.options = {
              title: 'internetPlan.editPlan',
              cancelBtnLabel: 'general.cancel',
              saveBtnLabel: 'general.save'
            }
            var internetPlanId = row.entity.id
            Business.internetPlans
              .findById({
                id: businessId,
                fk: internetPlanId
              })
              .$promise.then(
              function (internetPlan) {
                $scope.internetPlan = translateInternetPlan(internetPlan)
                if (internetPlan.type != 'dynamic') {
                  appMessenger.showInfo('internetPlan.unableToEdit')
                }
              },
              function (error) {
                $log.error(error)
              }
            )
            $scope.cancel = function () {
              $uibModalInstance.close()
            }
            $scope.save = function () {
              $scope.internetPlan = englishInternetPlan($scope.internetPlan)
              Business.internetPlans
                .updateById(
                  {
                    id: businessId,
                    fk: internetPlanId
                  },
                  $scope.internetPlan
                )
                .$promise.then(
                function (res) {
                  appMessenger.showSuccess('internetPlan.updateSuccessFull')
                  getPage()
                  $uibModalInstance.close()
                },
                function (err) {
                  appMessenger.showError('internetPlan.updateUnSuccessFull')
                  if (err.status == 422) {
                    appMessenger.showError('general.invalidInput')
                  }
                }
              )
            }
          }
        ]
      })
    }

    $scope.editDefaultPlanSettings = function () {
      $uibModal.open({
        backdrop: true,
        animation: true,
        keyboard: true,
        backdropClick: true,
        scope: $scope,
        templateUrl:
          PREFIX + 'app/internetPlan/tpl/internetPlanSettingsForm.html',
        controller: [
          '$scope',
          '$uibModalInstance',
          function ($scope, $uibModalInstance) {
            $scope.options = {
              title: 'internetPlan.defaultPlanSettings',
              cancelBtnLabel: 'general.cancel',
              saveBtnLabel: 'general.save'
            }
            Business.internetPlans({id: businessId}).$promise.then(
              function (internetPlans) {
                $scope.options.internetPlans = internetPlans
                angular.forEach(internetPlans, function (internetPlan) {
                  if (
                    $scope.defaultInternetPlan &&
                    $scope.defaultInternetPlan.id &&
                    $scope.defaultInternetPlan.id == internetPlan.id
                  ) {
                    $scope.defaultInternetPlan.plan = internetPlan
                  }
                })
                if (
                  $scope.defaultInternetPlan &&
                  $scope.defaultInternetPlan.count == 'undefined'
                ) {
                  $scope.defaultInternetPlan.count = translateNumberFilter(0)
                }
                if (
                  $scope.defaultInternetPlan &&
                  $scope.defaultInternetPlan.period == 'undefined'
                ) {
                  $scope.defaultInternetPlan.period = translateNumberFilter(0)
                }
                if (
                  $scope.defaultInternetPlan &&
                  $scope.defaultInternetPlan.count
                ) {
                  $scope.defaultInternetPlan.count = translateNumberFilter(
                    $scope.defaultInternetPlan.count
                  )
                }
                if (
                  $scope.defaultInternetPlan &&
                  $scope.defaultInternetPlan.period
                ) {
                  $scope.defaultInternetPlan.period = translateNumberFilter(
                    $scope.defaultInternetPlan.period
                  )
                }
              },
              function (error) {
                $log.error(error)
              }
            )
            $scope.cancel = function () {
              $uibModalInstance.close()
            }
            $scope.save = function () {
              var defaultInternetPlan = {}
              if (
                $scope.defaultInternetPlan &&
                $scope.defaultInternetPlan.plan
              ) {
                defaultInternetPlan = {
                  id: $scope.defaultInternetPlan.plan.id,
                  count:
                    englishNumberFilter($scope.defaultInternetPlan.count) || 0,
                  period:
                    englishNumberFilter($scope.defaultInternetPlan.period) || 0,
                  autoAssign: $scope.defaultInternetPlan.autoAssign
                }
              }
              Business.prototype$patchAttributes(
                {id: businessId},
                {defaultInternetPlan: defaultInternetPlan}
              ).$promise.then(
                function (res) {
                  appMessenger.showSuccess('business.settingsUpdateSuccessful')
                },
                function (err) {
                  appMessenger.showError('business.settingsUpdateUnSuccessful')
                }
              )
              $uibModalInstance.close()
              getPage()
            }
          }
        ]
      })
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

      Business.internetPlans.count({id: businessId}).$promise.then(
        function (result) {
          $scope.gridOptions.totalItems = result.count
          $scope.paginationOptions.totalItems = result.count
        },
        function (error) {
          $log.error(error)
        }
      )
      Business.internetPlans(options).$promise.then(
        function (internetPlans) {
          $scope.gridOptions.data = internetPlans
          Business.findById({id: businessId}).$promise.then(
            function (business) {
              if (
                business.defaultInternetPlan &&
                business.defaultInternetPlan.id
              ) {
                $scope.defaultInternetPlan = business.defaultInternetPlan
                angular.forEach($scope.gridOptions.data, function (
                  internetPlan
                ) {
                  internetPlan.selected = false
                  if (internetPlan.id == $scope.defaultInternetPlan.id) {
                    internetPlan.selected = true
                  }
                })
              } else {
                $scope.defaultInternetPlan = {}
              }
            },
            function (err) {
              appMessenger.showError('business.settingsLoadUnSuccessful')
            }
          )
        },
        function (error) {
          $log.error(error)
        }
      )
    }

    var translateInternetPlan = function (plan) {
      if (!plan.extraBulkPrice) {
        plan.extraBulkPrice = 0
      }
      angular.extend(plan, {
        speed: {
          value: translateNumberFilter(plan.speed.value),
          type: plan.speed.type
        },
        bulk: {
          value: translateNumberFilter(plan.bulk.value),
          type: plan.bulk.type
        },
        timeDuration: translateNumberFilter(plan.timeDuration),
        price: translateNumberFilter(plan.price),
        fromHour: translateNumberFilter(plan.fromHour),
        toHour: translateNumberFilter(plan.toHour),
        fromMinute: translateNumberFilter(plan.fromMinute),
        toMinute: translateNumberFilter(plan.toMinute),
        duration: translateNumberFilter(plan.duration),
        extraBulkPrice: translateNumberFilter(plan.extraBulkPrice)
      })
      return plan
    }
    var englishInternetPlan = function (plan) {
      angular.extend(plan, {
        speed: {
          value: englishNumberFilter(plan.speed.value),
          type: plan.speed.type
        },
        bulk: {
          value: englishNumberFilter(plan.bulk.value),
          type: plan.bulk.type
        },
        timeDuration: englishNumberFilter(plan.timeDuration),
        price: englishNumberFilter(plan.price),
        fromHour: englishNumberFilter(plan.fromHour),
        toHour: englishNumberFilter(plan.toHour),
        fromMinute: englishNumberFilter(plan.fromMinute),
        toMinute: englishNumberFilter(plan.toMinute),
        duration: englishNumberFilter(plan.duration),
        extraBulkPrice: englishNumberFilter(plan.extraBulkPrice)
      })
      return plan
    }

    function verifyIp (ip) {
      if (typeof ip !== 'string') {
        throw new TypeError('Expected a string')
      }
      var matcher = /^(?:(?:2[0-4]\d|25[0-5]|1\d{2}|[1-9]?\d)\.){3}(?:2[0-4]\d|25[0-5]|1\d{2}|[1-9]?\d)$/
      return matcher.test(ip)
    }
  }
])
