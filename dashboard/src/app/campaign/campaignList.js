// Campaign controller
app.controller('campaignList', [
  '$scope',
  '$log',
  'Business',
  'Campaign',
  'genericService',
  'uiGridConstants',
  '$uibModal',
  'PREFIX',
  'Session',
  'appMessenger',
  function(
    $scope,
    $log,
    Business,
    Campaign,
    genericService,
    uiGridConstants,
    $uibModal,
    PREFIX,
    Session,
    appMessenger,
  ) {
    var businessId = Session.business.id;

    // Pagination options
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
      columnDefs: [],
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

    // Remove a campaign
    $scope.removeCampaign = function(campaign) {
      genericService.showConfirmDialog({
        title: 'general.warning',
        message: 'general.areYouSure',
        noBtnLabel: 'general.no',
        yesBtnLabel: 'general.yes',
        yesCallback: function() {
          var campaignId = campaign.id;
          Business.campaigns
            .destroyById({ id: businessId }, { fk: campaignId })
            .$promise.then(
              function(res) {
                getPage();
                appMessenger.showSuccess('campaign.removeSuccessFull');
              },
              function(err) {
                appMessenger.showError('campaign.removeUnSuccessFull');
              },
            );
        },
        NoCallback: function() {},
      });
    };

    // Add a new campaign
    $scope.addOrEditCampaign = function(item) {
      if (item && item.id) {
        var campaignId = item.id;
        Business.campaigns
          .findById({
            id: businessId,
            fk: campaignId,
          })
          .$promise.then(
            function(res) {
              $scope.openCampaignModal(res);
            },
            function(error) {
              appMessenger.showError('campaign.notFound');
            },
          );
      } else {
        var today = new Date();
        var nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        Business.findById({ id: businessId }).$promise.then(
          function(business) {
            var couponPrefix = business.title;
            $scope.openCampaignModal({
              type: 'birthday',
              time: 'rightNow',
              limitedTime: true,
              active: true,
              status: 'scheduled',
              start: today,
              end: nextWeek,
              sendCoupon: false,
              couponPrefix: couponPrefix,
              discount: {
                amount: 0,
                unit: 'percent',
              },
              allDays: true,
              allHours: true,
              messageBody: null,
              days: {
                saturday: false,
                sunday: false,
                monday: false,
                tuesday: false,
                wednesday: false,
                thursday: false,
                friday: false,
              },
              hours: {
                morning: false,
                afternoon: false,
                evening: false,
              },
            });
          },
          function(err) {
            appMessenger.showError('business.settingsLoadUnSuccessful');
          },
        );
      }
    };
    $scope.openCampaignModal = function(campaign) {
      $scope.campaign = campaign;
      $uibModal.open({
        backdrop: true,
        animation: true,
        keyboard: true,
        backdropClick: true,
        size: 'lg',
        scope: $scope,
        templateUrl: PREFIX + 'app/campaign/tpl/campaignForm.html',
        controller: [
          '$scope',
          '$uibModalInstance',
          'campaignService',
          function($scope, $uibModalInstance, campaignService) {
            $scope.campaignTypes = campaignService.getCampaigns();
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
            $scope.startDateCalendar = function($event) {
              $event.preventDefault();
              $event.stopPropagation();
              $scope.startDateCalendarIsOpen = true;
              $scope.endDateCalendarIsOpen = false;
            };
            $scope.endDateCalendar = function($event) {
              $event.preventDefault();
              $event.stopPropagation();
              $scope.endDateCalendarIsOpen = true;
              $scope.startDateCalendarIsOpen = false;
            };
            $scope.$watch('campaign.type', function(newValue, oldValue) {
              if (newValue != oldValue && newValue == 'sendBulkMessage') {
                $scope.campaign.end = new Date($scope.campaign.start);
              }
              if (newValue != oldValue && newValue != 'sendBulkMessage') {
                $scope.campaign.end = new Date(
                  $scope.campaign.start.getTime() + 7 * 24 * 60 * 60 * 1000,
                );
              }
            });
            // --> for calendar bug
            $scope.$watch('campaign.start', function(newValue, oldValue) {
              $scope.startDateCalendarIsOpen = false;
            });
            $scope.$watch('campaign.end', function(newValue, oldValue) {
              $scope.endDateCalendarIsOpen = false;
            });
            $scope.resetCalendar = function() {
              $scope.endDateCalendarIsOpen = false;
              $scope.startDateCalendarIsOpen = false;
            };
            // <-- for calendar bug
            $scope.$watch('campaign.sendCoupon', function(newValue) {
              if (newValue == true) {
                $scope.campaign.discount.amount = 10;
                $scope.campaign.allDays = true;
                $scope.campaign.allHours = true;
              } else {
                $scope.campaign.discount.amount = 0;
                $scope.campaign.allDays = false;
                $scope.campaign.allHours = false;
              }
            });

            $scope.$watch('campaign.allDays', function(newValue) {
              for (var day in $scope.campaign.days) {
                $scope.campaign.days[day] = newValue;
              }
            });

            $scope.$watch('campaign.allHours', function(newValue) {
              for (var hour in $scope.campaign.hours) {
                $scope.campaign.hours[hour] = newValue;
              }
            });

            $scope.save = function() {
              $scope.campaign.start = new Date($scope.campaign.start).getTime();
              $scope.campaign.end = new Date($scope.campaign.end).getTime();
              var validationError = false;
              if (!$scope.campaign.title) {
                validationError = true;
                appMessenger.showError('campaign.requiredName');
              }
              if (!$scope.campaign.sendCoupon && !$scope.campaign.messageBody) {
                validationError = true;
                appMessenger.showError('campaign.requiredMessage');
              }
              if (!validationError) {
                if (!$scope.campaign.id) {
                  Business.campaigns
                    .create({ id: businessId }, $scope.campaign)
                    .$promise.then(
                      function(campaign) {
                        getPage();
                        appMessenger.showSuccess('campaign.createSuccessFull');
                        switch ($scope.campaign.type) {
                          case 'sendBulkMessage':
                            Campaign.sendBulkMessages({
                              campaignId: campaign.id,
                            }).$promise.then(
                              function(res) {
                                $uibModalInstance.close();
                                appMessenger.showSuccess(
                                  'campaign.sendBulkMessageSuccessFull',
                                );
                              },
                              function(err) {
                                appMessenger.showError(
                                  'campaign.sendBulkMessageUnSuccessFull',
                                );
                              },
                            );
                            break;
                          default:
                            $uibModalInstance.close();
                            break;
                        }
                      },
                      function(err) {
                        appMessenger.showError('campaign.createUnSuccessFull');
                      },
                    );
                } else {
                  Business.campaigns
                    .updateById(
                      {
                        id: businessId,
                        fk: $scope.campaign.id,
                      },
                      $scope.campaign,
                    )
                    .$promise.then(
                      function(res) {
                        getPage();
                        appMessenger.showSuccess('campaign.updateSuccessFull');
                        $uibModalInstance.close();
                      },
                      function(err) {
                        appMessenger.showError('campaign.updateUnSuccessFull');
                      },
                    );
                }
              }
            };
          },
        ],
      });
    };

    $scope.changeCampaignStatus = function(item) {
      var campaignId = item.id;
      Business.campaigns
        .findById({ id: businessId, fk: campaignId })
        .$promise.then(function(campaign) {
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
                  yesBtnLabel: 'general.yes',
                };
                $scope.no = function() {
                  $uibModalInstance.close();
                };
                $scope.yes = function() {
                  var active = campaign.active;
                  active = !active;
                  Business.campaigns.updateById(
                    {
                      id: businessId,
                      fk: campaignId,
                    },
                    { active: active },
                    function(res) {
                      if (active) {
                        appMessenger.showSuccess('campaign.activeSuccessFull');
                      } else {
                        appMessenger.showSuccess(
                          'campaign.disabledSuccessFull',
                        );
                      }
                      getPage();
                    },
                    function(err) {
                      if (active) {
                        appMessenger.showError('campaign.activeUnSuccessFull');
                      } else {
                        appMessenger.showError(
                          'campaign.disabledUnSuccessFull',
                        );
                      }
                    },
                  );
                  $uibModalInstance.close();
                };
              },
            ],
          });
        });
    };

    $scope.showCampaignDetails = function(campaign) {
      var campaignId = campaign.id;
      Business.campaigns
        .findById({ id: businessId, fk: campaignId })
        .$promise.then(function(campaign) {
          $uibModal.open({
            backdrop: true,
            animation: true,
            keyboard: true,
            backdropClick: true,
            scope: $scope,
            templateUrl: PREFIX + 'app/campaign/tpl/campaignDetails.html',
            controller: [
              '$scope',
              '$uibModalInstance',
              function($scope, $uibModalInstance) {
                $scope.campaign = campaign;
                $scope.ok = function() {
                  $uibModalInstance.close();
                };
              },
            ],
          });
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
      var options = { filter: {} };
      options.id = businessId;
      options.filter.sort = $scope.paginationOptions.sort;
      options.filter.skip =
        ($scope.paginationOptions.pageNumber - 1) *
        $scope.paginationOptions.itemPerPage;
      options.filter.limit = $scope.paginationOptions.itemPerPage;

      Business.campaigns.count({ id: businessId }).$promise.then(
        function(result) {
          $scope.gridOptions.totalItems = result.count;
          $scope.paginationOptions.totalItems = result.count;
        },
        function(error) {
          $log.error(error);
        },
      );
      Business.campaigns(options).$promise.then(
        function(campaigns) {
          $scope.gridOptions.data = campaigns;
          $scope.campaigns = campaigns;
          $scope.runningCampaigns = 0;
          $scope.scheduledCampaigns = 0;
          $scope.pausedCampaigns = 0;
          $scope.doneCampaigns = 0;
          var today = new Date().getTime();
          angular.forEach(campaigns, function(campaign) {
            if (
              campaign.active &&
              campaign.start <= today &&
              today <= campaign.end
            ) {
              $scope.runningCampaigns++;
              campaign.status = 'running';
            }
            if (!campaign.active) {
              $scope.pausedCampaigns++;
              campaign.status = 'paused';
            }
            if (campaign.active && campaign.start >= today) {
              $scope.scheduledCampaigns++;
              campaign.status = 'scheduled';
            }
            if (campaign.active && campaign.end < today) {
              $scope.doneCampaigns++;
              campaign.status = 'done';
            }
          });
        },
        function(error) {
          $log.error(error);
        },
      );
    };
  },
]);
