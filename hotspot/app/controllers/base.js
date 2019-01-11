angular.module('masterHotspotApp').controller('baseCtrl', [
  '$scope',
  '$log',
  '$state',
  '$location',
  'config',
  function($scope, $log, $state, $location, config) {
    if (!config || !config.selectedThemeConfig) {
      $state.go('home');
      return;
    }
    $scope.logo = config.logo;
    $scope.themeConfig = config.selectedThemeConfig;
    $scope.goToSite = function() {
      window.location.href = 'https://hotspotplus.ir';
    };
    $scope.goBack = function(currentState) {
      switch (currentState) {
        case 'signup':
        case 'status':
        case 'internetplans':
        case 'forgetpassword':
          $state.go('theme.signin');
          break;
        case 'verify':
          $state.go('theme.signup');
          break;
        default:
          $state.go('home');
          break;
      }
    };
  },
]);
angular.module('masterHotspotApp').controller('baseSignInCtrl', [
  '$scope',
  '$timeout',
  '$log',
  '$state',
  '$location',
  'config',
  'appMessenger',
  'appService',
  'errorMessage',
  'englishNumberFilter',
  'routerService',
  'translateFilter',
  'loadingModal',
  'numberService',
  'usernameService',
  '$sce',
  function(
    $scope,
    $timeout,
    $log,
    $state,
    $location,
    config,
    appMessenger,
    appService,
    errorMessage,
    englishNumberFilter,
    routerService,
    translateFilter,
    loadingModal,
    numberService,
    usernameService,
    $sce,
  ) {
    if (!config || !config.selectedThemeConfig) {
      $state.go('home');
      return;
    }

    if (config.localLang === 'en') {
      $scope.signInTitle = $scope.themeConfig.signInTitleEn || 'signInTitle';
    } else {
      $scope.signInTitle = $scope.themeConfig.signInTitle || 'signInTitle';
    }
    if (config.localLang === 'en') {
      $scope.signUpDisabled = config.selectedThemeConfig.signUpDisabledEn;
    } else {
      $scope.signUpDisabled = config.selectedThemeConfig.signUpDisabled;
    }

    $scope.user = {};
    $scope.showPinCode = config.selectedThemeConfig.showPinCode;
    $scope.formAction = $sce.trustAsResourceUrl(config.signInUrl);
    $scope.signupDestination =
      'http://' +
      window.location.host +
      '/#!/home.html?&staticnasid=' +
      config.nasId +
      '&uamip=' +
      config.uamip +
      '&uamport=' +
      config.uamport;

    $scope.signIn = function($form) {
      var username = englishNumberFilter($scope.user.username);
      var password = $scope.user.password;
      if (!username || !password) {
        return appMessenger.showError('passwordAndUsernameAreRequired');
      }
      if ($scope.showPinCode && !$scope.user.hotSpotPinCode) {
        return appMessenger.showError('pinCodeRequired');
      }
      if ($scope.showPinCode && $scope.user.hotSpotPinCode) {
        var pinCode = $scope.user.hotSpotPinCode;
      }

      loadingModal.show();
      appService.signIn(
        {
          mac: window.businessConfig.mac,
          nasId: config.nasId,
          routerType: config.accessPointType,
          businessId: config.businessId,
          username: username,
          password: password,
          pinCode: pinCode,
        },
        function(error, result) {
          loadingModal.hide();
          if (error) {
            errorMessage.show(error);
            return;
          }
          if (!result.active) {
            appMessenger.showError('activateUsername');
          } else {
            config.username = username;
            config.password = password;
            config.memberId = result.memberId;
            Raven.setUserContext({
              id: username,
              email: config.businessId + '@hotspotplus.ir',
            });
            if (result.ok == true) {
              loadingModal.show();
              routerService.login(username, password, $form, function(
                error,
                result,
              ) {
                loadingModal.hide();
                if (error) {
                  $log.error(error);
                  if (error.message) {
                    appMessenger.showError(error.message);
                  } else {
                    appMessenger.showError('checkHotspotNetworkConnection');
                  }
                  return;
                }
                config.username = null;
                config.password = null;
                $state.go('home');
              });
            } else if (result.ok == false) {
              var code = result.errorCode;
              switch (code) {
                case 600:
                  appMessenger.showError('600');
                  break;
                case 601:
                  appMessenger.showError('601');
                  $state.go('theme.internetplans');
                  break;
                case 602:
                  appMessenger.showError('602');
                  $state.go('theme.internetplans');
                  break;
                case 603:
                  appMessenger.showError('603');
                  $state.go('theme.internetplans');
                  break;
                case 605:
                  appMessenger.showError('605');
                  $state.go('theme.internetplans');
                  break;
                case 604:
                  appMessenger.showError('604');
                  break;
                case 606:
                  appMessenger.showError('606');
                  break;
                case 608:
                  appMessenger.showError('608');
                  break;
                default:
                  var message = result.message['reply:Reply-Message'];
                  appMessenger.showError(message);
                  break;
              }
            }
          }
        },
      );
    };

    if (config.username && config.password) {
      $scope.user.username = usernameService.trim(config.username);
      $scope.user.password = config.password;
      $scope.signIn();
    }
    if (config.verificationCode) {
      $state.go('theme.verify');
    }
  },
]);
angular.module('masterHotspotApp').controller('baseSignUpCtrl', [
  '$scope',
  '$log',
  '$state',
  '$location',
  'config',
  'appMessenger',
  'appService',
  'errorMessage',
  'englishNumberFilter',
  'routerService',
  'translateFilter',
  'loadingModal',
  'numberService',
  'usernameService',
  'nationalCode',
  'birthday',
  function(
    $scope,
    $log,
    $state,
    $location,
    config,
    appMessenger,
    appService,
    errorMessage,
    englishNumberFilter,
    routerService,
    translateFilter,
    loadingModal,
    numberService,
    usernameService,
    nationalCode,
    birthday,
  ) {
    if (!config || !config.selectedThemeConfig) {
      $state.go('home');
      return;
    }

    if (config.localLang === 'en') {
      config.formConfig = config.selectedThemeConfig['formConfigEn'];
      $scope.signUpTitle = $scope.themeConfig.signUpTitleEn || 'signUpTitle';
      $scope.verificationMethod =
        config.selectedThemeConfig.verificationMethodEn || 'mobile';
    } else {
      config.formConfig = config.selectedThemeConfig['formConfig'];
      $scope.signUpTitle = $scope.themeConfig.signUpTitle || 'signUpTitle';
      $scope.verificationMethod =
        config.selectedThemeConfig.verificationMethodFa || 'mobile';
    }

    if (config.themeConfig[config.selectedThemeId].formConfig) {
      $scope.formConfig = angular.copy(config.formConfig);
    } else {
      $scope.formConfig = [];
    }

    $scope.user = {
      id: config.businessId,
      nasId: config.nasId,
      host: config.host,
      language: config.localLang,
    };

    if ($scope.verificationMethod === 'user') {
      $scope.user.verificationMethod = 'mobile';
    } else {
      $scope.user.verificationMethod = $scope.verificationMethod;
    }

    angular.forEach($scope.formConfig, function(conf) {
      if (conf.label == 'mobile') {
        $scope.mobileConfig = angular.copy(conf);
        if ($scope.user.verificationMethod === 'mobile') {
          conf.active = true;
          conf.required = true;
        }
      }
    });

    $scope.$watchGroup(
      ['user.birthDay', 'user.birthMonth', 'user.birthYear'],
      function(newValues, oldValues, scope) {
        if (newValues != oldValues) {
          if (config.localLang == 'en') {
            $scope.user.birthday = birthday.getEnglishEpochDay(newValues);
          } else {
            $scope.user.birthday = birthday.getPersianEpochDay(newValues);
          }
        }
      },
    );

    $scope.$watchCollection('user', function(newVal, oldVal) {
      if (newVal.verificationMethod != oldVal.verificationMethod) {
        angular.forEach($scope.formConfig, function(conf) {
          if (
            conf.label == 'mobile' &&
            newVal.verificationMethod === 'mobile'
          ) {
            conf.active = true;
            conf.required = true;
          } else if (
            conf.label == 'mobile' &&
            newVal.verificationMethod != 'mobile'
          ) {
            conf.active = $scope.mobileConfig.active;
            conf.required = $scope.mobileConfig.required;
          }
        });
      }
    });

    $scope.signUp = function(error) {
      var validationError = false;
      if (
        $scope.user.password &&
        $scope.user.confirmPassword &&
        $scope.user.password !== $scope.user.confirmPassword
      ) {
        appMessenger.showError('passwordsNotMatch');
        validationError = true;
      }

      if (
        $scope.user.nationalCode &&
        !nationalCode.isValid($scope.user.nationalCode)
      ) {
        appMessenger.showError('nationalCodeUndefined');
        validationError = true;
      }

      if ($scope.user.birthday) {
        $scope.user.birthday = Number($scope.user.birthday);
        if ($scope.user.birthday <= 0 || $scope.user.birthday > 31) {
          validationError = true;
          appMessenger.showError('birthdayUndefined');
        }
      }

      if (
        $scope.user.verificationMethod &&
        $scope.user.verificationMethod === 'user'
      ) {
        $scope.user.verificationMethod = 'mobile';
      }
      if ($scope.user.mobile) {
        $scope.user.mobile = englishNumberFilter($scope.user.mobile);
      }
      if (!error && !validationError) {
        angular.forEach($scope.formConfig, function(formConfig) {
          if (formConfig.active && formConfig.required) {
            if ($scope.user[formConfig.label]) {
              $scope.user[formConfig.label] = englishNumberFilter(
                $scope.user[formConfig.label],
              );
            }
          }
        });
        if ($scope.user.birthday) {
          $scope.user.birthday = Number($scope.user.birthday);
          $scope.user.birthDay = new Date($scope.user.birthday).getDate();
          $scope.user.birthMonth =
            new Date($scope.user.birthday).getMonth() + 1;
          $scope.user.birthYear = new Date($scope.user.birthday).getFullYear();
        }
        if ($scope.user.age) {
          $scope.user.age = Number(englishNumberFilter($scope.user.age));
        }

        loadingModal.show();
        appService.createHotSpotMember($scope.user, function(error, result) {
          loadingModal.hide();
          if (error) {
            errorMessage.show(error);
            return;
          }
          if (result.status === -1) {
            appMessenger.showInfo('alreadyMember');
            $state.go('theme.signin');
          } else if (result.status === 3) {
            appMessenger.showInfo(
              'memberExistPleaseContactOperatorForManualVerification',
            );
            $state.go('theme.signin');
          } else if (result.status === 5) {
            appMessenger.showInfo('pleaseContactOperatorForManualVerification');
            $state.go('theme.signin');
          } else if (result.status === 1) {
            $state.go('theme.signin');
          } else if (result.status === 0) {
            config.memberId = result.memberId;
            appMessenger.showSuccess('verifyHeaderText');
            $state.go('theme.verify');
          } else if (result.status == 2) {
            appMessenger.showError('signUpVerificationError');
          } else if (result.status == 6) {
            appMessenger.showInfo('noVerificationNeeded');
            config.verificationCode = result.verificationCode;
            config.memberId = result.memberId;
            $state.go('theme.verify');
          }
        });
      } else if (error) {
        appMessenger.showError('requiredFieldTitle');
      }
    };
  },
]);
angular.module('masterHotspotApp').controller('baseVerifyCtrl', [
  '$scope',
  '$log',
  '$state',
  '$location',
  'config',
  'appMessenger',
  'appService',
  'errorMessage',
  'englishNumberFilter',
  'routerService',
  'translateFilter',
  'loadingModal',
  function(
    $scope,
    $log,
    $state,
    $location,
    config,
    appMessenger,
    appService,
    errorMessage,
    englishNumberFilter,
    routerService,
    translateFilter,
    loadingModal,
  ) {
    if (!config.selectedThemeConfig) {
      $state.go('home');
      return;
    }
    $scope.resendTimeoutReached = false;
    $scope.counter = 0;
    $scope.data = {
      verificationCode: config.verificationCode || null,
    };
    $scope.verify = function() {
      loadingModal.show();
      appService.verifyHotSpot(
        {
          id: config.businessId,
          memberId: config.memberId,
          nasId: config.nasId,
          host: config.host,
          verificationCode: englishNumberFilter($scope.data.verificationCode),
        },
        function(error, result) {
          loadingModal.hide();
          if (error) {
            errorMessage.show(error);
            return;
          }
          var username = result.username;
          var password = result.password;
          config.username = username;
          config.password = password;
          config.verificationCode = null;
          appMessenger.showSuccess('signUpSuccess');
          $state.go('theme.signin');
        },
      );
    };

    if ($scope.data.verificationCode) {
      return $scope.verify();
    }
  },
]);
angular.module('masterHotspotApp').controller('baseStatusCtrl', [
  '$scope',
  '$log',
  '$state',
  '$location',
  'config',
  'appMessenger',
  'appService',
  'errorMessage',
  'englishNumberFilter',
  'routerService',
  'translateFilter',
  'loadingModal',
  '$stateParams',
  '$timeout',
  function(
    $scope,
    $log,
    $state,
    $location,
    config,
    appMessenger,
    appService,
    errorMessage,
    englishNumberFilter,
    routerService,
    translateFilter,
    loadingModal,
    $stateParams,
    $timeout,
  ) {
    if (!$stateParams) {
      $state.go('theme.signin');
    }
    if (!config.selectedThemeConfig) {
      $state.go('home');
      return;
    }

    $scope.showInstagram = false;
    $scope.showTelegram = false;
    if (config.selectedThemeConfig.showTelegram) {
      $scope.showTelegram = true;
      $scope.telegram = config.selectedThemeConfig.telegram;
    }
    if (config.selectedThemeConfig.showInstagram) {
      $scope.showInstagram = true;
      $scope.instagram = config.selectedThemeConfig.instagram;
    }

    $scope.status = {};
    $scope.status.show = false;
    if ($stateParams.online === 'true' || $stateParams.online === true) {
      if ($stateParams.ip && $stateParams.ip != null) {
        $scope.status.ip = $stateParams.ip;
      } else {
        $scope.status.ip = '-';
      }
      $scope.status.download = $stateParams.download;
      $scope.status.upload = $stateParams.upload;
      $scope.status.uptime = $stateParams.uptime;
      $scope.status.show = true;
    } else {
      window.location.href = 'http://' + config.host;
      return;
    }
    if (config.selectedThemeConfig.afterLoginAddress) {
      $timeout(function() {
        window.location.href = config.selectedThemeConfig.afterLoginAddress;
      }, 5000);
    }
    /* else {
         $timeout ( function () {
         window.location.href = "https://google.com";
         }, 10000 );
         }*/

    $scope.signOut = function() {
      loadingModal.show();
      routerService.logout(function(error, logOut) {
        loadingModal.hide();
        if (error) {
          errorMessage.show(error);
          return;
        }
        config.password = null;
        $state.go('theme.signin');
      });
    };
  },
]);
angular.module('masterHotspotApp').controller('baseInternetPlanListCtrl', [
  '$scope',
  '$log',
  '$state',
  '$location',
  'config',
  'appMessenger',
  'appService',
  'errorMessage',
  'englishNumberFilter',
  'routerService',
  'translateFilter',
  'loadingModal',
  function(
    $scope,
    $log,
    $state,
    $location,
    config,
    appMessenger,
    appService,
    errorMessage,
    englishNumberFilter,
    routerService,
    translateFilter,
    loadingModal,
  ) {
    if (!config.selectedThemeConfig) {
      $state.go('home');
      return;
    }
    var businessId = config.businessId;
    appService.findInternetPlan({ businessId: businessId }, function(
      error,
      plans,
    ) {
      if (error) {
        errorMessage.show(error);
        return;
      }
      if (!plans || plans.length == 0) {
        config.password = null;
        config.username = null;
        appMessenger.showError('noPublicPlan');
        return $state.go('theme.signin');
      } else {
        $scope.plans = plans;
      }
    });

    $scope.payment = function(selectedPlan) {
      loadingModal.show();
      var businessId = config.businessId;
      var memberId = config.memberId;
      var plan = selectedPlan;
      var planId = selectedPlan.id;
      if (!memberId || !businessId || !planId) {
        loadingModal.hide();
        appMessenger.showError('loginToByInternetPlan');
        return $state.go('theme.signin');
      } else {
        var price = plan.price;
        if (price == 0) {
          var freePlan = {
            memberId: memberId,
            planId: plan.id,
          };
          appService
            .assignFreePlanToMember(freePlan)
            .then(function(result) {
              loadingModal.hide();
              appMessenger.showSuccess('freePlanActivated');
              //Send back home to re login automatically
              return $state.go('theme.signin');
            })
            .catch(function(error) {
              loadingModal.hide();
              errorMessage.show(error);
              return $state.go('theme.internetplans');
            });
        } else {
          var username = config.username;
          var password = config.password;
          if (!password || !username) {
            loadingModal.hide();
            return $state.go('theme.signin');
          }
          var paymentData = {
            username: username,
            password: password,
            businessId: businessId,
            memberId: memberId,
            packageId: planId,
          };
          appService
            .payment(paymentData)
            .then(function(result) {
              loadingModal.hide();
              window.location.href = result.url;
            })
            .catch(function(error) {
              loadingModal.hide();
              errorMessage.show(error);
              return $state.go('theme.internetplans');
            });
        }
      }
    };
  },
]);
angular.module('masterHotspotApp').controller('baseForgetPasswordCtrl', [
  '$scope',
  '$log',
  '$state',
  '$location',
  'config',
  'appMessenger',
  'appService',
  'errorMessage',
  'englishNumberFilter',
  'routerService',
  'translateFilter',
  'loadingModal',
  function(
    $scope,
    $log,
    $state,
    $location,
    config,
    appMessenger,
    appService,
    errorMessage,
    englishNumberFilter,
    routerService,
    translateFilter,
    loadingModal,
  ) {
    if (!config.selectedThemeConfig) {
      $state.go('home');
      return;
    }
    $scope.user = $scope.user || {};
    $scope.user.usernameOrMobile = '';

    $scope.sendMyPassword = function() {
      loadingModal.show();
      var usernameOrMobile = englishNumberFilter($scope.user.usernameOrMobile);
      appService.recoverHotspotUser(
        {
          usernameOrMobile: usernameOrMobile,
          nasId: config.nasId,
          host: config.host,
        },
        function(error, result) {
          loadingModal.hide();
          if (error) {
            return errorMessage.show(error);
          }
          appMessenger.showSuccess('usernameAndPasswordSent');
          config.username = null;
          config.password = null;
          return $state.go('theme.signin');
        },
      );
    };
  },
]);
angular.module('masterHotspotApp').controller('baseLangCtrl', [
  '$scope',
  '$log',
  '$state',
  'config',
  '$translate',
  '$rootScope',
  function($scope, $log, $state, config, $translate, $rootScope) {
    if (!config || !config.selectedThemeConfig) {
      $state.go('home');
      return;
    }
    $scope.setLang = function(lang) {
      if (lang == 'en') {
        config.localLang = config.LANGUAGE_EN;
        config.direction = config.DIRECTION_LTR;
        $rootScope.logoFooter = config.logoFooterEn;
        config.formConfig = config.selectedThemeConfig['formConfigEn'];
      } else {
        config.localLang = config.LANGUAGE_FA;
        config.direction = config.DIRECTION_RTL;
        $rootScope.logoFooter = config.logoFooter;
        config.formConfig = config.selectedThemeConfig['formConfig'];
      }
      $translate.use(config.localLang);
      $state.go('theme.signin');
    };
  },
]);
