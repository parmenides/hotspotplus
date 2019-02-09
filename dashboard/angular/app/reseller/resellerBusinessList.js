/**
 * Created by hamidehnouri on 8/8/2016 AD.
 */

app.controller('resellerBusinessList', [
  '$scope',
  '$state',
  '$log',
  'translateFilter',
  'Business',
  'uiGridConstants',
  'genericService',
  'persianDateFilter',
  'translateNumberFilter',
  'credit',
  'appMessenger',
  '$uibModal',
  'PREFIX',
  'Reseller',
  'Session',
  'englishNumberFilter',
  function(
    $scope,
    $state,
    $log,
    translateFilter,
    Business,
    uiGridConstants,
    genericService,
    persianDateFilter,
    translateNumberFilter,
    credit,
    appMessenger,
    $uibModal,
    PREFIX,
    Reseller,
    Session,
    englishNumberFilter,
  ) {
    if (!Session.reseller) {
      return;
    }
    var reseller = Session.reseller;
    var resellerId = reseller.id;

    $scope.paginationOptions = {
      pageNumber: 1,
      itemPerPage: 10,
      sort: null,
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
      minRowsToShow: 12,
      columnDefs: [
        {
          displayName: 'general.title',
          field: 'title',
          enableHiding: false,
          width: 160,
          enableSorting: false,
          enableColumnMenu: false,
          cellTemplate:
            '<a class="btn btn-link" ng-click="grid.appScope.editBusiness(row)">{{row.entity.title}}</a>',
          headerCellFilter: 'translate',
        },
        {
          displayName: 'general.mobile',
          field: 'mobile',
          enableHiding: false,
          width: 120,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellTemplate:
            '<div class="ui-grid-cell-contents"><span ng-if="row.entity.mobile">{{row.entity.mobile | translateNumber }}</span><span ng-if="!row.entity.mobile">-</span></div>',
        },
        {
          displayName: 'business.service',
          field: 'currentPkg',
          enableHiding: false,
          width: 120,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellTemplate:
            '<div class="ui-grid-cell-contents">{{"business."+(row.entity.services.id || "freeService") | translate }}</div>',
        },
        {
          displayName: 'business.durationInMonths',
          field: 'durationInMonths',
          enableHiding: false,
          enableSorting: false,
          width: 169,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellTemplate:
            '<div class="ui-grid-cell-contents">{{row.entity.durationInMonths | translateNumber }}&nbsp;{{"general.month" | translate }}</div>',
        },
        {
          displayName: 'general.email',
          field: 'email',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
        },
        {
          displayName: 'business.creationDate',
          field: 'creationDate',
          width: 160,
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellTemplate:
            '<div class="ui-grid-cell-contents">{{row.entity.creationDate |  persianDate : "fullDate" | translateNumber }}{{"general.,"| translate}}&nbsp;{{"general.hour"| translate}}:&nbsp;{{row.entity.creationDate |  date : "HH:mm" | translateNumber }}</div>',
        },
        {
          displayName: 'general.login',
          field: 'login',
          width: 70,
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellTemplate:
            '<a class="btn btn-link" ng-click="grid.appScope.openLoginPage(row)" >{{"general.login"|translate}}</a>',
        },
        {
          displayName: 'general.remove',
          field: 'delete',
          width: 70,
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellClass: 'center',
          cellTemplate:
            '<a class="btn btn-link" ng-click="grid.appScope.deleteBusiness(row)" ><i class="fa fa-fw fa-trash"></i></a>',
        },
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
      },
    };

    $scope.openLoginPage = function() {
      window.open(
        'http://' +
          window.location.host +
          '/' +
          window.location.pathname +
          '#/access/signin',
      );
    };

    $scope.addBusiness = function() {
      $scope.business = {};
      Business.loadServices().$promise.then(function(services) {
        var activeTariff =
          reseller.commissionRate || services.RESELLERS_COMMISSION_RATE;
        $uibModal.open({
          backdrop: true,
          animation: true,
          keyboard: true,
          size: 'lg',
          backdropClick: true,
          scope: $scope,
          templateUrl: PREFIX + 'app/reseller/tpl/resellerBusinessForm.html',
          controller: [
            '$scope',
            '$uibModalInstance',
            'appMessenger',
            function($scope, $uibModalInstance, appMessenger) {
              $scope.activeTariff = activeTariff;
              $scope.data = {
                modules: {},
              };
              $scope.data.packages = {};
              for (var i in services.packages) {
                $scope.data.packages[services.packages[i]['id']] =
                  services.packages[i];
                $scope.data.packagesId = services.packages[i].id;
              }
              $scope.data.packagePrice = 0;
              $scope.data.removeCopyright = false;

              $scope.updateModulePrice = function() {
                $scope.data.modulePrice = 0;
                for (var k in $scope.data.modules) {
                  var selected = $scope.data.modules[k];
                  if (
                    selected === true &&
                    $scope.data.packages[$scope.data.packagesId].modules
                  ) {
                    //$log.debug ( $scope.data.packages[ $scope.data.packagesId ] )
                    $scope.data.modulePrice =
                      $scope.data.modulePrice +
                      $scope.data.packages[$scope.data.packagesId].modules[k]
                        .annuallyPrice;
                  }
                }
              };

              $scope.updateModulePrice();

              $scope.$watchGroup(
                [
                  'data.modules.log',
                  'data.modules.memberPanel',
                  'data.modules.payment',
                ],
                function() {
                  $scope.updateModulePrice();
                },
              );

              $scope.options = {
                title: 'reseller.addProfile',
                cancelBtnLabel: 'general.cancel',
                saveBtnLabel: 'general.save',
                newBusiness: true,
              };
              $scope.cancel = function() {
                $uibModalInstance.close();
              };
              $scope.save = function(error) {
                $scope.business.resellerId = resellerId;
                var validationError = false;
                if (!error && !validationError) {
                  Reseller.createBusiness({
                    business: $scope.business,
                  }).$promise.then(
                    function(res) {
                      appMessenger.showSuccess(
                        'profile.businessCreatedSuccessFully',
                      );
                      $uibModalInstance.close();
                      /*if ( res.url ) {
										window.location.href = res.url;
									}*/
                      $state.reload();
                    },
                    function(err) {
                      if (err.status == 422) {
                        appMessenger.showError('profile.checkMobileNumber');
                      } else {
                        appMessenger.showError('error.generalError');
                      }
                    },
                  );
                } else if (error) {
                  appMessenger.showError('general.allFieldsRequired');
                }
              };
            },
          ],
        });
      });
    };

    $scope.editBusiness = function(row) {
      var businessId = row.entity.id;
      Reseller.findBusiness({
        resellerId: resellerId,
        businessId: businessId,
      }).$promise.then(
        function(business) {
          $uibModal.open({
            backdrop: true,
            animation: true,
            size: 'lg',
            keyboard: true,
            backdropClick: true,
            scope: $scope,
            templateUrl: PREFIX + 'app/reseller/tpl/resellerBusinessForm.html',
            controller: [
              '$scope',
              '$uibModalInstance',
              function($scope, $uibModalInstance) {
                $scope.options = {
                  title: 'reseller.editProfile',
                  cancelBtnLabel: 'general.cancel',
                  saveBtnLabel: 'general.save',
                  newBusiness: false,
                };
                $scope.business = business;
                $scope.oldOnlineUsers = business.onlineUsers;
                business.mobile = translateNumberFilter(business.mobile);
                business.onlineUsers = translateNumberFilter(
                  business.onlineUsers,
                );
                business.durationInMonths = translateNumberFilter(
                  business.durationInMonths,
                );
                // Persian date picker methods
                $scope.dateOptions = {
                  formatYear: 'yy',
                  startingDay: 6,
                };
                $scope.dateFormats = [
                  'dd-MMMM-yyyy',
                  'yyyy/MM/dd',
                  'dd.MM.yyyy',
                  'shortDate',
                ];
                $scope.dateFormat = $scope.dateFormats[0];
                $scope.disabled = function(date, mode) {
                  return mode === 'day' && date.getDay() === 5;
                };
                $scope.business.subscriptionDate = new Date(
                  $scope.business.subscriptionDate,
                );
                $scope.selectDate = function($event) {
                  $event.preventDefault();
                  $event.stopPropagation();
                  $scope.calendarIsOpen = true;
                };
                $scope.cancel = function() {
                  $uibModalInstance.close();
                };
                $scope.save = function(error) {
                  $scope.business.subscriptionDate = new Date(
                    $scope.business.subscriptionDate,
                  ).getTime();
                  $scope.business.onlineUsers = englishNumberFilter(
                    $scope.business.onlineUsers,
                  );
                  $scope.business.durationInMonths = englishNumberFilter(
                    $scope.business.durationInMonths,
                  );
                  var validationError = false;
                  if (
                    !$scope.business.onlineUsers ||
                    isNaN($scope.business.onlineUsers)
                  ) {
                    appMessenger.showError('reseller.invalidOnlineUsers');
                    validationError = true;
                  } else if (
                    $scope.business.onlineUsers > 5 &&
                    $scope.business.onlineUsers >
                      $scope.remainingOnlineUsers + $scope.oldOnlineUsers
                  ) {
                    appMessenger.showError('reseller.maxOnlineUsersRequired');
                    validationError = true;
                  }
                  if (
                    !$scope.business.durationInMonths ||
                    isNaN($scope.business.durationInMonths)
                  ) {
                    appMessenger.showError('reseller.invalidDurationInMonths');
                    validationError = true;
                  } else if ($scope.business.durationInMonths < 1) {
                    appMessenger.showError(
                      'reseller.minDurationInMonthsRequired',
                    );
                    validationError = true;
                  } else if ($scope.business.durationInMonths > 12) {
                    appMessenger.showError(
                      'reseller.maxDurationInMonthsRequired',
                    );
                    validationError = true;
                  }
                  if (!error && !validationError) {
                    $scope.business.mobile = englishNumberFilter(
                      $scope.business.mobile,
                    );
                    Reseller.updateBusiness({
                      business: $scope.business,
                    }).$promise.then(
                      function(res) {
                        appMessenger.showSuccess('profile.updateSuccessFull');
                        $state.reload();
                        $uibModalInstance.close();
                      },
                      function(err) {
                        if (err.status == 422) {
                          appMessenger.showError('profile.duplicateEmail');
                        } else {
                          appMessenger.showError('error.generalError');
                        }
                      },
                    );
                  } else if (error) {
                    appMessenger.showError('general.allFieldsRequired');
                  }
                };
              },
            ],
          });
        },
        function(error) {
          $log.error(error);
          appMessenger.showError('error.generalError');
        },
      );
    };

    $scope.deleteBusiness = function(row) {
      genericService.showConfirmDialog({
        title: 'general.warning',
        message: 'general.areYouSure',
        noBtnLabel: 'general.no',
        yesBtnLabel: 'general.yes',
        yesCallback: function() {
          var businessId = row.entity.id;
          var index = $scope.gridOptions.data.indexOf(row.entity);
          Reseller.removeBusiness({
            resellerId: resellerId,
            businessId: businessId,
          }).$promise.then(
            function(res) {
              $scope.gridOptions.data.splice(index, 1);
              $state.reload();
              appMessenger.showSuccess('profile.removeSuccessFull');
            },
            function(error) {
              $log.error(error);
              appMessenger.showError('error.generalError');
            },
          );
        },
        NoCallback: function() {},
      });
    };

    $scope.$watch('paginationOptions.itemPerPage', function(
      oldValue,
      newValue,
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
      var options = {};
      options.order = $scope.paginationOptions.sort;
      options.skip =
        ($scope.paginationOptions.pageNumber - 1) *
        $scope.paginationOptions.itemPerPage;
      options.limit = $scope.paginationOptions.itemPerPage;
      options.where = { resellerId: resellerId };

      Reseller.loadBusiness({ options: options }).$promise.then(
        function(data) {
          $scope.gridOptions.totalItems = data.total;
          $scope.paginationOptions.totalItems = data.total;
          $scope.gridOptions.data = data.businesses;
        },
        function(error) {
          $log.error(error);
        },
      );
    };
  },
]);
