/**
 * Created by hamidehnouri on 8/8/2016 AD.
 */

app.controller('resellerPackages', [
  '$scope',
  '$log',
  '$state',
  'Reseller',
  'appMessenger',
  'genericService',
  'Session',
  '$uibModal',
  'PREFIX',
  function(
    $scope,
    $log,
    $state,
    Reseller,
    appMessenger,
    genericService,
    Session,
    $uibModal,
    PREFIX
  ) {
    if (Session.reseller == null) {
      return;
    }
    var resellerId = Session.reseller.id;
    $scope.packages = [
      {
        type: 'monthly',
        durationInMonths: 1,
        onlineUsers: [{ number: 50, cost: 20000 }]
      },
      {
        type: 'annually',
        durationInMonths: 12,
        onlineUsers: [
          {
            number: 50,
            cost: 360000,
            discount: 250000,
            discountPercentage: 31
          },
          {
            number: 100,
            cost: 720000,
            discount: 499000,
            discountPercentage: 31
          },
          {
            number: 200,
            cost: 1440000,
            discount: 990000,
            discountPercentage: 31
          },
          {
            number: 300,
            cost: 2160000,
            discount: 1495000,
            discountPercentage: 31
          },
          {
            number: 400,
            cost: 2880000,
            discount: 1990000,
            discountPercentage: 31
          },
          {
            number: 600,
            cost: 4320000,
            discount: 2950000,
            discountPercentage: 32
          },
          {
            number: 800,
            cost: 5760000,
            discount: 3100000,
            discountPercentage: 46
          },
          {
            number: 1000,
            cost: 7200000,
            discount: 3600000,
            discountPercentage: 50
          }
        ]
      }
    ];

    $scope.selectPackage = function(
      durationInMonths,
      numOfUsers,
      cost,
      discount
    ) {
      $uibModal.open({
        backdrop: true,
        scope: $scope,
        animation: true,
        keyboard: true,
        backdropClick: true,
        templateUrl: PREFIX + 'app/reseller/tpl/resellerPackageConfirm.html',
        controller: [
          '$scope',
          '$uibModalInstance',
          'appMessenger',
          '$state',
          function($scope, $uibModalInstance, appMessenger, $state) {
            $scope.package = {
              durationInMonths: durationInMonths,
              numOfUsers: numOfUsers,
              cost: cost,
              discount: discount
            };
            $scope.bankWait = false;
            $scope.cancel = function() {
              $uibModalInstance.close();
            };
            $scope.openPaymentGateway = function() {
              $scope.bankWait = true;
              Reseller.buyPackage({
                resellerId: resellerId,
                allowedOnlineUsers: numOfUsers,
                durationInMonths: durationInMonths
              }).$promise.then(
                function(result) {
                  if (result.url) {
                    window.location.href = result.url;
                  } else if (result.ok) {
                    appMessenger.showSuccess('reseller.packageBuySuccessful');
                    $state.reload();
                  }
                },
                function(error) {
                  $scope.bankWait = false;
                  appMessenger.showError('reseller.packageBuyUnSuccessful');
                  $log.error(error);
                }
              );
            };
          }
        ]
      });
    };
  }
]);
