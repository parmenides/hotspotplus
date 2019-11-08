/**
 * Created by hamidehnouri on 5/24/2017 AD.
 */

app.controller('hotspotThemes', [
  'PREFIX',
  '$scope',
  '$log',
  '$state',
  'Business',
  'Theme',
  'appMessenger',
  'genericService',
  'Session',
  '$uibModal',
  'uploadModal',
  function(
    PREFIX,
    $scope,
    $log,
    $state,
    Business,
    Theme,
    appMessenger,
    genericService,
    Session,
    $uibModal,
    uploadModal
  ) {
    if (Session.business == null) {
      return;
    }
    var businessId = Session.business.id;

    function getConfigIndexById(formConfig, configId) {
      var index = -1;
      angular.forEach(formConfig, function(config, configIndex) {
        if (config.label === configId) {
          index = configIndex;
        }
      });
      return index;
    }

    var getPage = function() {
      Theme.loadHotspotThemes().$promise.then(
        function(themes) {
          $scope.themes = themes;
          Business.findById({ id: businessId }).$promise.then(
            function(business) {
              $scope.businessThemeConfig = business.themeConfig || {};
              $scope.selectedThemeId = business.selectedThemeId || null;
              $scope.hotSpotPinCode = business.hotSpotPinCode;
              angular.forEach($scope.themes, function(theme) {
                theme.selected = theme.id == $scope.selectedThemeId;
              });
            },
            function(error) {
              $log.error(error);
              appMessenger.showError('business.settingsLoadUnSuccessful');
            }
          );
        },
        function(error) {
          $log.error(error);
          appMessenger.showError('theme.loadUnSuccessful');
        }
      );
    };
    getPage();

    $scope.selectTheme = function(theme) {
      if (!theme.selected) {
        $uibModal.open({
          backdrop: true,
          animation: true,
          keyboard: true,
          backdropClick: true,
          scope: $scope,
          templateUrl: PREFIX + 'app/common/tpl/areYouSure.html',
          controller: [
            '$scope',
            '$uibModalInstance',
            function($scope, $uibModalInstance) {
              $scope.options = {
                title: 'theme.selectHotspotTheme',
                message: 'theme.areYouSureSelected',
                noBtnLabel: 'general.no',
                yesBtnLabel: 'general.yes'
              };
              $scope.no = function() {
                $uibModalInstance.close();
              };
              $scope.yes = function() {
                $scope.selectedThemeId = theme.id;
                if (!$scope.businessThemeConfig[theme.id]) {
                  $scope.businessThemeConfig[theme.id] = {
                    formConfig: $scope.themes[theme.id].formConfig,
                    formConfigEn: $scope.themes[theme.id].formConfigEn,
                    logo: {},
                    background: {},
                    showLogo: true,
                    style: theme.styles[0].id,
                    showPinCode: false,
                    isMultiLanguage: false,
                    verificationMethodFa: 'mobile',
                    verificationMethodEn: 'mobile'
                  };
                }
                Business.prototype$patchAttributes(
                  {
                    id: businessId
                  },
                  {
                    selectedThemeId: $scope.selectedThemeId,
                    themeConfig: $scope.businessThemeConfig
                  }
                ).$promise.then(
                  function(res) {
                    $uibModalInstance.close();
                    getPage();
                  },
                  function(err) {
                    appMessenger.showError('theme.selectUnSuccessFull');
                  }
                );
                $uibModalInstance.close();
              };
            }
          ]
        });
      }
    };

    $scope.editThemeSettings = function(theme) {
      $uibModal.open({
        backdrop: true,
        animation: true,
        keyboard: true,
        backdropClick: true,
        size: 'lg',
        scope: $scope,
        templateUrl: PREFIX + 'app/theme/tpl/' + theme.template + 'Form.html',
        controller: [
          '$scope',
          '$uibModalInstance',
          function($scope, $uibModalInstance) {
            var themeId = theme.id;
            $scope.styles = $scope.themes[themeId].styles;
            if (!$scope.businessThemeConfig[themeId]) {
              $scope.businessThemeConfig[themeId] = {
                formConfig: $scope.themes[themeId].formConfig,
                formConfigEn: $scope.themes[themeId].formConfigEn,
                logo: {},
                background: {},
                showLogo: true,
                style: $scope.styles[0].id,
                showPinCode: false,
                isMultiLanguage: false,
                verificationMethodFa: 'mobile',
                verificationMethodEn: 'mobile'
              };
            }
            //$scope.themeConfig = angular.copy ( $scope.businessThemeConfig[ themeId ] );
            var formConfig = angular.copy($scope.themes[themeId].formConfig);
            var formConfigEn = angular.copy(
              $scope.themes[themeId].formConfigEn
            );
            $scope.themeConfig = angular.copy(
              $scope.businessThemeConfig[themeId]
            );
            $scope.themeConfig.formConfig = [];
            $scope.themeConfig.formConfigEn = [];
            angular.forEach(formConfig, function(config, configIndex) {
              angular.forEach(
                $scope.businessThemeConfig[themeId].formConfig,
                function(conf, index) {
                  $scope.themeConfig.formConfig[configIndex] = config;
                  if (conf.label === config.label) {
                    $scope.themeConfig.formConfig[configIndex].required =
                      conf.required;
                    $scope.themeConfig.formConfig[configIndex].active =
                      conf.active;
                  }
                }
              );
            });
            angular.forEach(formConfigEn, function(config, configIndex) {
              angular.forEach(
                $scope.businessThemeConfig[themeId].formConfigEn,
                function(conf, index) {
                  $scope.themeConfig.formConfigEn[configIndex] = config;
                  if (conf.label === config.label) {
                    $scope.themeConfig.formConfigEn[configIndex].required =
                      conf.required;
                    $scope.themeConfig.formConfigEn[configIndex].active =
                      conf.active;
                  }
                }
              );
            });

            if (
              getConfigIndexById($scope.themeConfig.formConfig, 'password') !=
              -1
            ) {
              $scope.confirmPasswordEnabled =
                $scope.themeConfig.formConfig[
                  getConfigIndexById($scope.themeConfig.formConfig, 'password')
                ].active;
            }
            if (
              getConfigIndexById($scope.themeConfig.formConfigEn, 'password') !=
              -1
            ) {
              $scope.confirmPasswordEnabledEn =
                $scope.themeConfig.formConfigEn[
                  getConfigIndexById(
                    $scope.themeConfig.formConfigEn,
                    'password'
                  )
                ].active;
            }
            $scope.setPasswordState = function(state, language) {
              switch (language) {
                case 'fa':
                  if (state === false) {
                    $scope.themeConfig.formConfig[
                      getConfigIndexById(
                        $scope.themeConfig.formConfig,
                        'confirmPassword'
                      )
                    ].active = state;
                  }
                  $scope.confirmPasswordEnabled = state;
                  break;
                case 'en':
                  if (state === false) {
                    $scope.themeConfig.formConfigEn[
                      getConfigIndexById(
                        $scope.themeConfig.formConfigEn,
                        'confirmPassword'
                      )
                    ].active = state;
                  }
                  $scope.confirmPasswordEnabledEn = state;
                  break;
                default:
                  break;
              }
            };

            $scope.options = {
              title: 'theme.settings',
              themeTitle: theme.title,
              themeId: themeId,
              cancelBtnLabel: 'general.cancel',
              saveBtnLabel: 'general.save'
            };
            $scope.$watch('themeConfig.verificationMethodFa', function(
              newVal,
              oldVal
            ) {
              if (newVal == 'mobile') {
                var mobileIndex = getConfigIndexById(
                  $scope.themeConfig.formConfig,
                  'mobile'
                );
                $scope.themeConfig.formConfig[mobileIndex].active = true;
                $scope.themeConfig.formConfig[mobileIndex].required = true;
                $scope.mobileDisabled = true;
              } else {
                $scope.mobileDisabled = false;
              }
            });
            $scope.$watch('themeConfig.verificationMethodEn', function(
              newVal,
              oldVal
            ) {
              if (newVal == 'mobile') {
                var mobileIndexEn = getConfigIndexById(
                  $scope.themeConfig.formConfigEn,
                  'mobile'
                );
                $scope.themeConfig.formConfigEn[mobileIndexEn].active = true;
                $scope.themeConfig.formConfigEn[mobileIndexEn].required = true;
                $scope.mobileEnDisabled = true;
              } else {
                $scope.mobileEnDisabled = false;
              }
            });

            // upload or change a logo for hot spot theme
            $scope.upload = function(file, param) {
              $scope.file = file;
              $scope.file = $scope.file || {};
              uploadModal.showUploadModal({
                businessId: businessId,
                fileId: $scope.file.id,
                fileName: $scope.file.name,
                themeId: themeId,
                businessThemeConfig: $scope.businessThemeConfig,
                saveCallback: function(result) {
                  if (param === 'logo') {
                    $scope.themeConfig['logo'] =
                      $scope.themeConfig['logo'] || {};
                    $scope.themeConfig['logo'].id = result.id;
                    $scope.themeConfig['logo'].name = result.name;
                  } else if (param === 'background') {
                    $scope.themeConfig['background'] =
                      $scope.themeConfig['background'] || {};
                    $scope.themeConfig['background'].id = result.id;
                    $scope.themeConfig['background'].name = result.name;
                  }
                },
                cancelCallback: function() {}
              });
            };
            $scope.cancel = function() {
              $uibModalInstance.close();
              getPage();
            };
            $scope.save = function() {
              $scope.businessThemeConfig[themeId] = $scope.themeConfig;
              Business.prototype$patchAttributes(
                { id: businessId },
                { themeConfig: $scope.businessThemeConfig }
              ).$promise.then(
                function(res) {
                  appMessenger.showSuccess('theme.settingsUpdateSuccessFull');
                  $uibModalInstance.close();
                  getPage();
                },
                function(err) {
                  appMessenger.showError('theme.settingsUpdateUnSuccessFull');
                }
              );
            };
            $scope.deleteFile = function(param) {
              var fileId = false;
              if (param === 'logo' && $scope.themeConfig['logo'].id) {
                fileId = true;
              } else if (
                param === 'background' &&
                $scope.themeConfig['background'].id
              ) {
                fileId = true;
              }
              if (fileId) {
                $uibModal.open({
                  backdrop: true,
                  animation: true,
                  keyboard: true,
                  backdropClick: true,
                  scope: $scope,
                  templateUrl: PREFIX + 'app/common/tpl/areYouSure.html',
                  controller: [
                    '$scope',
                    '$uibModalInstance',
                    function($scope, $uibModalInstance) {
                      $scope.options = {
                        title: 'theme.delete' + param,
                        message: 'theme.areYouSureDeleted',
                        noBtnLabel: 'general.no',
                        yesBtnLabel: 'general.yes'
                      };
                      $scope.no = function() {
                        $uibModalInstance.close();
                      };
                      $scope.yes = function() {
                        if (param === 'logo' && $scope.themeConfig['logo'].id) {
                          $scope.themeConfig.logo = {};
                        } else if (
                          param === 'background' &&
                          $scope.themeConfig['background'].id
                        ) {
                          $scope.themeConfig.background = {};
                        }
                        $scope.businessThemeConfig[themeId] =
                          $scope.themeConfig;
                        Business.prototype$patchAttributes(
                          { id: businessId },
                          { themeConfig: $scope.businessThemeConfig }
                        ).$promise.then(
                          function(res) {
                            appMessenger.showSuccess(
                              'theme.settingsUpdateSuccessFull'
                            );
                            $uibModalInstance.close();
                            getPage();
                          },
                          function(err) {
                            appMessenger.showError(
                              'theme.settingsUpdateUnSuccessFull'
                            );
                          }
                        );
                      };
                    }
                  ]
                });
              }
            };
          }
        ]
      });
    };
  }
]);
