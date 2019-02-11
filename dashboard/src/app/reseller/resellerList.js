/**
 * Created by hamidehnouri on 8/8/2016 AD.
 */

app.controller('resellerList', [
  '$scope',
  '$log',
  'translateFilter',
  'Reseller',
  'Invoice',
  'uiGridConstants',
  'genericService',
  'persianDateFilter',
  'translateNumberFilter',
  'credit',
  'appMessenger',
  '$uibModal',
  'PREFIX',
  'englishNumberFilter',
  function(
    $scope,
    $log,
    translateFilter,
    Reseller,
    Invoice,
    uiGridConstants,
    genericService,
    persianDateFilter,
    translateNumberFilter,
    credit,
    appMessenger,
    $uibModal,
    PREFIX,
    englishNumberFilter
  ) {
    $scope.paginationOptions = {
      pageNumber: 1,
      itemPerPage: 10,
      sort: null
    };

    $scope.gridOptions = {
      enableSorting: true,
      enablePaginationControls: false,
      enableRowSelection: false,
      enableSelectAll: false,
      selectionRowHeaderWidth: 35,
      rowHeight: 35,
      showGridFooter: true,
      enableColumnResizing: true,
      enableFiltering: true,
      minRowsToShow: 12,
      columnDefs: [
        {
          displayName: 'reseller.title',
          field: 'title',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellTemplate:
            '<a class="btn btn-link" ng-click="grid.appScope.addOrEditReseller(row)">{{row.entity.title}}</a>'
        },
        {
          displayName: 'general.mobile',
          field: 'mobile',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellTemplate:
            '<div class="ui-grid-cell-contents"><span ng-if="row.entity.mobile">{{row.entity.mobile | translateNumber }}</span><span ng-if="!row.entity.mobile">-</span></div>'
        },
        {
          displayName: 'reseller.owner',
          field: 'fullName',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate'
        },
        {
          displayName: 'general.city',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          field: 'city',
          headerCellFilter: 'translate'
        },
        {
          displayName: 'reseller.creationDate',
          width: 250,
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          enableFiltering: false,
          field: 'subscriptionDate',
          headerCellFilter: 'translate',
          cellTemplate:
            '<div class="ui-grid-cell-contents">{{row.entity.creationDate |  persianDate : "fullDate" | translateNumber }}{{"general.,"| translate}}&nbsp;{{"general.hour"| translate}}:&nbsp;{{row.entity.creationDate |  date : "HH:mm" | translateNumber }}</div>'
        },
        {
          displayName: 'general.invoices',
          field: 'invoices',
          width: 90,
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          enableFiltering: false,
          headerCellFilter: 'translate',
          cellClass: 'center',
          cellTemplate:
            '<a class="btn btn-link" ng-click="grid.appScope.showInvoices(row)" ><i class="fa fa-fw fa-binoculars"></i></a>'
        },
        {
          displayName: 'reseller.active',
          field: 'active',
          width: 70,
          enableColumnMenu: false,
          enableHiding: false,
          enableSorting: false,
          enableFiltering: false,
          headerCellFilter: 'translate',
          cellClass: 'center',
          headerCellClass: 'headerCenter',
          cellTemplate:
            '<a class="btn btn-link" ng-click="grid.appScope.activateReseller(row)"><i class="fa fa-circle-o" ng-if="!row.entity.active"></i>' +
            '<i class="fa fa-dot-circle-o text-info" ng-if="row.entity.active"></i></a>'
        },
        {
          displayName: 'general.remove',
          field: 'delete',
          width: 70,
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          enableFiltering: false,
          headerCellFilter: 'translate',
          cellClass: 'center',
          cellTemplate:
            '<a class="btn btn-link" ng-click="grid.appScope.deleteReseller(row)" ><i class="fa fa-fw fa-trash"></i></a>'
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

    $scope.addOrEditReseller = function(row) {
      if (row) {
        var resellerId = row.entity.id;
        Reseller.findById({ id: resellerId }).$promise.then(
          function(res) {
            $scope.openResellerForm(res, {
              title: 'reseller.editReseller',
              newReseller: false
            });
          },
          function(error) {
            $log.error(error);
            appMessenger.showError('error.generalError');
          }
        );
      } else {
        $scope.openResellerForm(
          {
            active: true,
            subscriptionDate: new Date(),
            durationInMonths: 1,
            allowedOnlineUsers: 10,
            planType: 'static'
          },
          {
            title: 'reseller.addReseller',
            newReseller: true
          }
        );
      }
    };

    $scope.openResellerForm = function(reseller, options) {
      $uibModal.open({
        backdrop: true,
        animation: true,
        keyboard: true,
        backdropClick: true,
        scope: $scope,
        templateUrl: PREFIX + 'app/reseller/tpl/resellerForm.html',
        controller: [
          '$scope',
          '$uibModalInstance',
          function($scope, $uibModalInstance) {
            $scope.reseller = reseller;
            $scope.reseller.allowedOnlineUsers = translateNumberFilter(
              $scope.reseller.allowedOnlineUsers
            );
            if ($scope.reseller.durationInMonths) {
              $scope.reseller.durationInMonths = translateNumberFilter(
                $scope.reseller.durationInMonths
              );
            }
            if ($scope.reseller.mobile) {
              $scope.reseller.mobile = translateNumberFilter(
                $scope.reseller.mobile
              );
            }
            $scope.options = options;
            $scope.options.cancelBtnLabel = 'general.cancel';
            $scope.options.saveBtnLabel = 'general.save';
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
            $scope.selectDate = function($event) {
              $event.preventDefault();
              $event.stopPropagation();
              $scope.calendarIsOpen = true;
            };
            $scope.cancel = function() {
              $uibModalInstance.close();
            };
            $scope.save = function(error) {
              $scope.reseller.subscriptionDate = new Date(
                $scope.reseller.subscriptionDate
              ).getTime();
              $scope.reseller.allowedOnlineUsers = englishNumberFilter(
                $scope.reseller.allowedOnlineUsers
              );
              $scope.reseller.durationInMonths = englishNumberFilter(
                $scope.reseller.durationInMonths
              );
              $scope.reseller.mobile = englishNumberFilter(
                $scope.reseller.mobile
              );
              var validationError = false;
              if (
                !$scope.reseller.allowedOnlineUsers ||
                isNaN($scope.reseller.allowedOnlineUsers)
              ) {
                appMessenger.showError('general.invalidOnlineUsers');
                validationError = true;
              }
              if (
                !$scope.reseller.durationInMonths ||
                isNaN($scope.reseller.durationInMonths) ||
                $scope.reseller.durationInMonths < 0
              ) {
                appMessenger.showError('general.invalidDurationInMonths');
                validationError = true;
              }
              if (!error && !validationError) {
                if (!$scope.reseller.id) {
                  Reseller.create($scope.reseller).$promise.then(
                    function(res) {
                      appMessenger.showSuccess('reseller.createSuccessFull');
                      getPage();
                      $uibModalInstance.close();
                    },
                    function(err) {
                      if (err.status == 422) {
                        appMessenger.showError('reseller.checkMobileNumber');
                      } else {
                        appMessenger.showError('error.generalError');
                      }
                    }
                  );
                } else {
                  Reseller.prototype$updateAttributes(
                    { id: $scope.reseller.id },
                    $scope.reseller
                  ).$promise.then(
                    function(res) {
                      appMessenger.showSuccess('reseller.updateSuccessFull');
                      getPage();
                      $uibModalInstance.close();
                    },
                    function(err) {
                      if (err.status == 422) {
                        appMessenger.showError('reseller.duplicateEmail');
                      } else {
                        appMessenger.showError('error.generalError');
                      }
                    }
                  );
                }
              } else if (error) {
                appMessenger.showError('general.allFieldsRequired');
              }
            };
          }
        ]
      });
    };

    $scope.activateReseller = function(row) {
      var resellerId = row.entity.id;
      Reseller.findById({ id: resellerId }).$promise.then(function(reseller) {
        $uibModal.open({
          backdrop: true,
          animation: true,
          keyboard: true,
          backdropClick: true,
          templateUrl: PREFIX + 'app/common/tpl/areYouSure.html',
          controller: [
            '$scope',
            '$uibModalInstance',
            function($scope, $uibModalInstance) {
              $scope.options = {
                title: 'general.warning',
                message: 'general.areYouSure',
                noBtnLabel: 'general.no',
                yesBtnLabel: 'general.yes'
              };
              $scope.no = function() {
                $uibModalInstance.close();
              };
              $scope.yes = function() {
                var active = reseller.active;
                active = !active;
                Reseller.prototype$updateAttributes(
                  {
                    id: resellerId
                  },
                  { active: active },
                  function(res) {
                    appMessenger.showSuccess(
                      'reseller.changeStatusSuccessFull'
                    );
                    getPage();
                  },
                  function(err) {
                    appMessenger.showError(
                      'reseller.changeStatusUnSuccessFull'
                    );
                  }
                );
                $uibModalInstance.close();
              };
            }
          ]
        });
      });
    };

    $scope.deleteReseller = function(row) {
      genericService.showConfirmDialog({
        title: 'general.warning',
        message: 'general.areYouSure',
        noBtnLabel: 'general.no',
        yesBtnLabel: 'general.yes',
        yesCallback: function() {
          var resellerId = row.entity.id;
          var index = $scope.gridOptions.data.indexOf(row.entity);
          Reseller.destroyById({ id: resellerId }).$promise.then(
            function(res) {
              $scope.gridOptions.data.splice(index, 1);
            },
            function(err) {
              appMessenger.showError(err);
            }
          );
        },
        NoCallback: function() {}
      });
    };

    $scope.showInvoices = function(row) {
      var resellerId = row.entity.id;
      var options = { filter: {} };
      options.id = resellerId;

      Reseller.invoices(options).$promise.then(
        function(invoices) {
          $uibModal.open({
            backdrop: true,
            animation: true,
            keyboard: true,
            backdropClick: true,
            size: 'lg',
            scope: $scope,
            templateUrl: PREFIX + 'app/common/tpl/invoices.html',
            controller: [
              '$scope',
              '$uibModalInstance',
              function($scope, $uibModalInstance) {
                $scope.options = {
                  title: 'general.invoices',
                  okBtnLabel: 'general.ok',
                  invoices: invoices
                };
                $scope.ok = function() {
                  $uibModalInstance.close();
                };
              }
            ]
          });
        },
        function(error) {
          $log.error(error);
        }
      );
    };

    $scope.$watch('paginationOptions.itemPerPage', function(
      oldValue,
      newValue
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
      var options = { filter: {} };
      options.filter.sort = $scope.paginationOptions.sort;
      options.filter.skip =
        ($scope.paginationOptions.pageNumber - 1) *
        $scope.paginationOptions.itemPerPage;
      options.filter.limit = $scope.paginationOptions.itemPerPage;

      Reseller.count().$promise.then(
        function(result) {
          $scope.gridOptions.totalItems = result.count;
          $scope.paginationOptions.totalItems = result.count;
        },
        function(error) {
          $log.error(error);
        }
      );
      Reseller.find(options).$promise.then(
        function(resellers) {
          $scope.gridOptions.data = resellers;
        },
        function(error) {
          $log.error(error);
        }
      );
    };
  }
]);
