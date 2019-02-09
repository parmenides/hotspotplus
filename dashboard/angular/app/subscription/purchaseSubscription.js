/**
 * Created by hamidehnouri on 12/14/2016 AD.
 */
app.controller('purchaseSubscriptionController', [
  '$scope',
  '$log',
  'Session',
  'Business',
  'appMessenger',
  '$uibModal',
  'PREFIX',
  'Coupon',
  'Invoice',
  function(
    $scope,
    $log,
    Session,
    Business,
    appMessenger,
    $uibModal,
    PREFIX,
    Coupon,
    Invoice,
  ) {
    if (Session.business == null) {
      return;
    }
    var businessId = Session.business.id;
    $scope.currentService = {};

    Business.findById({ id: businessId }).$promise.then(
      function(business) {
        $scope.business = business;
        Business.loadServices().$promise.then(
          function(result) {
            $scope.packages = result.packages;
          },
          function(error) {
            $log.error(error);
            appMessenger.showError('business.failedToLoadService');
          },
        );
      },
      function(err) {
        appMessenger.showError('business.settingsLoadUnSuccessful');
      },
    );

    $scope.showDetails = function(theDesc) {
      $uibModal.open({
        backdrop: true,
        animation: true,
        keyboard: true,
        backdropClick: true,
        templateUrl: PREFIX + 'app/subscription/tpl/theDesc.html',
        controller: [
          '$scope',
          '$uibModalInstance',
          function($scope, $uibModalInstance) {
            $scope.theDesc = theDesc;

            $scope.closeTheDesc = function() {
              $uibModalInstance.close();
            };
          },
        ],
      });
    };

    $scope.buyPackage = function(selectedPackage) {
      $uibModal.open({
        backdrop: true,
        animation: true,
        keyboard: true,
        backdropClick: true,
        templateUrl: PREFIX + 'app/subscription/tpl/confirmService.html',
        controller: [
          '$scope',
          '$uibModalInstance',
          '$log',
          'Session',
          function($scope, $uibModalInstance, $log, Session, $state) {
            $scope.close = function() {
              $uibModalInstance.close();
            };
            $scope.premiumPackage = selectedPackage;
            $scope.premiumPackage.cost =
              $scope.premiumPackage.price -
              $scope.premiumPackage.price * $scope.premiumPackage.discount;
            $scope.searchGiftCode = function(giftCode) {
              $scope.premiumPackage.annuallyPriceWithCode =
                $scope.premiumPackage.price -
                $scope.premiumPackage.price * $scope.premiumPackage.discount;
              if (giftCode) {
                $scope.isSearchingCode = true;
                $scope.giftCodeValid = false;
                Coupon.verifyGiftCode({ giftCode: giftCode }).$promise.then(
                  function(loadedCode) {
                    $scope.isSearchingCode = false;
                    if (loadedCode) {
                      $scope.giftCodeFound = loadedCode;
                      $scope.giftCodeValid = true;
                      var count = loadedCode.count;
                      var used = loadedCode.used;
                      if (used < count) {
                        $scope.giftCodeUsed = false;
                        var unit = $scope.giftCodeFound.value.unit;
                        var amount = $scope.giftCodeFound.value.amount;
                        var packagePrice =
                          $scope.premiumPackage.price -
                          $scope.premiumPackage.price *
                            $scope.premiumPackage.discount;
                        if (unit === 'percent') {
                          var discountAmount =
                            ($scope.premiumPackage.price * amount) / 100;
                          $scope.premiumPackage.priceWithCode =
                            packagePrice - discountAmount;
                        }
                        if (unit === 'toman') {
                          $scope.premiumPackage.priceWithCode =
                            packagePrice - amount;
                        }
                      } else {
                        $scope.giftCodeUsed = true;
                      }
                    } else {
                      $scope.giftCodeValid = false;
                    }
                  },
                  function(error) {
                    $log.error(error);
                  },
                );
              }
            };
            $scope.openPaymentGateway = function() {
              var businessId = Session.business.id;
              Business.buyPackage({
                businessId: businessId,
                packageId: selectedPackage.id,
                discount: $scope.giftCodeFound,
              }).$promise.then(
                function(result) {
                  $log.debug(result);
                  if (result.url) {
                    window.location.href = result.url;
                  } else if (result.ok) {
                    appMessenger.showSuccess(
                      'business.serviceActivatedSuccessfully',
                    );
                    $uibModalInstance.close();
                    $state.reload();
                  }
                },
                function(error) {
                  $log.error(error);
                },
              );
            };
          },
        ],
      });
    };

    $scope.showResellerInvoiceConfirm = function() {
      Business.findById({ id: businessId }).$promise.then(
        function(business) {
          Business.loadServices().$promise.then(
            function(services) {
              var packageId = business.selectedPkgId;
              var allPkgs = services.packages;
              var selectedPackage;
              for (var i in allPkgs) {
                if (allPkgs[i].id === packageId) {
                  selectedPackage = allPkgs[i];
                }
              }
              $scope.business = business;

              $uibModal.open({
                backdrop: true,
                animation: true,
                keyboard: true,
                backdropClick: true,
                templateUrl:
                  PREFIX + 'app/subscription/tpl/confirmService.html',
                controller: [
                  '$scope',
                  '$uibModalInstance',
                  '$log',
                  'Session',
                  function($scope, $uibModalInstance, $log, Session, $state) {
                    $scope.close = function() {
                      $uibModalInstance.close();
                    };
                    $scope.premiumPackage = selectedPackage;
                    $scope.searchGiftCode = function(giftCode) {
                      $scope.premiumPackage.annuallyPriceWithCode =
                        $scope.premiumPackage.annuallyPrice;
                      if (giftCode) {
                        $scope.isSearchingCode = true;
                        $scope.giftCodeValid = false;
                        var options = { filter: {} };
                        options.filter.where = {
                          code: giftCode,
                          ownerId: 'Admin',
                        };
                        Coupon.find(options).$promise.then(
                          function(result) {
                            $scope.isSearchingCode = false;
                            if (result[0]) {
                              $scope.giftCodeFound = result[0];
                              $scope.giftCodeValid = true;
                              var count = result[0].count;
                              var used = result[0].used;
                              if (used < count) {
                                $scope.giftCodeUsed = false;
                                var unit = $scope.giftCodeFound.value.unit;
                                var amount = $scope.giftCodeFound.value.amount;
                                if (unit == 'percent') {
                                  var discountAmount =
                                    ($scope.premiumPackage.annuallyPrice *
                                      amount) /
                                    100;
                                  $scope.premiumPackage.annuallyPriceWithCode =
                                    $scope.premiumPackage.annuallyPrice -
                                    discountAmount;
                                }
                                if (unit == 'toman') {
                                  $scope.premiumPackage.annuallyPriceWithCode =
                                    $scope.premiumPackage.annuallyPrice -
                                    amount;
                                }
                              } else {
                                $scope.giftCodeUsed = true;
                              }
                            } else {
                              $scope.giftCodeValid = false;
                            }
                          },
                          function(error) {
                            $log.error(error);
                          },
                        );
                      }
                    };
                    $scope.openPaymentGateway = function() {
                      var businessId = Session.business.id;
                      Business.buyService({
                        businessId: businessId,
                        packageId: selectedPackage.id,
                        discount: $scope.giftCodeFound,
                      }).$promise.then(
                        function(result) {
                          $log.debug(result);
                          if (result.url) {
                            window.location.href = result.url;
                          } else if (result.ok) {
                            appMessenger.showSuccess(
                              'business.serviceActivatedSuccessfully',
                            );
                            $uibModalInstance.close();
                            $state.reload();
                          }
                        },
                        function(error) {
                          $log.error(error);
                        },
                      );
                    };
                  },
                ],
              });
            },
            function(error) {
              $log.error(error);
              appMessenger.showError('business.failedToLoadService');
            },
          );
        },
        function(error) {
          $log.error(error);
          appMessenger.showError('business.settingsLoadUnSuccessful');
        },
      );
    };

    Business.findById({ id: businessId }).$promise.then(
      function(res) {
        if (res.services) {
          $scope.currentService = res.services;
          var currentTime = new Date();
          $scope.currentService.expired =
            currentTime.getTime() > $scope.currentService.expiresAt;
          $scope.currentService.isExpiring =
            currentTime.getTime() > $scope.currentService.expiresAt - 432000000;
          $scope.currentService.remainingDays =
            ($scope.currentService.expiresAt - currentTime.getTime()) /
            86400000;
        } else {
          $scope.currentService.id = 'free';
          $scope.currentService.expired = false;
        }
        if (res.resellerId) {
          $scope.hasReseller = true;
          Business.getResellerMobile({ businessId: businessId }).$promise.then(
            function(result) {
              $scope.resellerMobile = result.mobile;
            },
            function(error) {
              $log.error(error);
              appMessenger.showError('business.settingsLoadUnSuccessful');
            },
          );
        } else {
          $scope.hasReseller = false;
        }
        if (res.serviceType) {
          $scope.currentService.serviceType = res.serviceType;
        } else if (res.onlineUsers == 5) {
          $scope.currentService.serviceType = 'free';
        } else {
          $scope.currentService.serviceType = '-';
        }
        $scope.currentService.onlineUsers = res.onlineUsers;
        $scope.currentService.durationInMonths = res.durationInMonths;
      },
      function(error) {
        $log.error(error);
        appMessenger.showError('business.settingsLoadUnSuccessful');
      },
    );
  },
]);
