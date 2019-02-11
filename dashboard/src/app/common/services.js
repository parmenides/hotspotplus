/**
 * Created by payamyousefi on 2/15/15.
 */
app
  .service('genericService', [
    '$uibModal',
    '$log',
    '$q',
    '$location',
    'PREFIX',
    function($uibModal, $log, $q, $location, PREFIX) {
      this.showPasswordForm = function(options) {
        $uibModal.open({
          backdrop: true,
          animation: true,
          keyboard: true,
          backdropClick: true,
          templateUrl: PREFIX + 'app/common/tpl/passwordForm.html',
          controller: [
            '$scope',
            '$uibModalInstance',
            function($scope, $uibModalInstance) {
              $scope.options = options || {};
              $scope.cancel = function() {
                $uibModalInstance.close();
                options.cancelCallback && options.cancelCallback();
              };
              $scope.save = function() {
                $uibModalInstance.close();
                options.saveCallback &&
                  options.saveCallback($scope.currentPassword, $scope.password);
              };
            },
          ],
        });
      };

      this.showConfirmDialog = function(options) {
        $uibModal.open({
          backdrop: true,
          animation: true,
          keyboard: true,
          backdropClick: true,
          templateUrl: PREFIX + 'app/common/tpl/confirmDialog.html',
          controller: [
            '$scope',
            '$uibModalInstance',
            function($scope, $uibModalInstance) {
              $scope.options = options || {};
              $scope.no = function() {
                $uibModalInstance.close();
                options.noCallback && options.noCallback();
              };
              $scope.yes = function() {
                $uibModalInstance.close();
                options.yesCallback && options.yesCallback();
              };
            },
          ],
        });
      };
    },
  ])
  .service('crudUtils', [
    '$log',
    'translateFilter',
    function($log, translateFilter) {
      this.translateObj = function(obj, translateKey) {
        traverse(obj).forEach(function(item) {
          if (angular.isString(item) && this.key == translateKey) {
            this.update(translateFilter(item));
          }
        });
      };
    },
  ])
  .service('appMessenger', [
    'toaster',
    'translateFilter',
    function(toaster, translateFilter) {
      this.showSuccess = function(message, title) {
        if (title) {
          title = 'common.success';
        }
        toaster.pop(
          'success',
          translateFilter(title),
          translateFilter(message),
        );
      };

      this.showError = function(message, title) {
        if (title) {
          title = 'common.error';
        }
        toaster.pop('error', translateFilter(title), translateFilter(message));
      };

      this.showWarning = function(message, title) {
        if (title) {
          title = 'common.warning';
        }
        toaster.pop(
          'warning',
          translateFilter(title),
          translateFilter(message),
        );
      };

      this.showInfo = function(message, title) {
        if (title) {
          title = 'common.info';
        }
        toaster.pop('info', translateFilter(title), translateFilter(message));
      };

      this.showWait = function(message, title) {
        if (title) {
          title = 'common.wait';
        }
        toaster.pop('wait', translateFilter(title), translateFilter(message));
      };
    },
  ])
  .service('roleService', [
    '$log',
    '$q',
    'Role',
    'RoleMapping',
    function($log, $q, Role, RoleMapping) {
      var self = this;

      this.getRoles = function(principalId) {
        return $q(function(resolve, reject) {
          RoleMapping.find({
            filter: {
              where: { principalType: 'USER', principalId: principalId },
            },
          }).$promise.then(
            function(roleMapping) {
              var roleIds = [];
              roleMapping.forEach(function(rMap) {
                roleIds.push(rMap.roleId);
              });
              if (roleIds.length > 0) {
                self.getRoleNames(roleIds).then(
                  function(names) {
                    resolve(names);
                  },
                  function(error) {
                    reject(error);
                  },
                );
              } else {
                resolve([]);
              }
            },
            function(error) {
              reject(error);
            },
          );
        });
      };

      this.getRoleNames = function(roleIds) {
        return $q(function(resolve, reject) {
          var ids = [];
          roleIds.forEach(function(id) {
            ids.push({ id: id });
          });
          var q = { filter: { where: { or: ids } } };
          if (ids.length > 0) {
            Role.find(q).$promise.then(
              function(roles) {
                var names = [];
                roles.forEach(function(role) {
                  names.push(role.name.toLowerCase());
                });
                resolve(names);
              },
              function(error) {
                reject(error);
              },
            );
          } else {
            resolve(ids);
          }
        });
      };
    },
  ])
  .service('dashboardTiming', [
    '$log',
    'PersianDateService',
    function(log, persianDate) {
      var DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
      var self = this;
      this.startOfWeek = function(date) {
        var dayOfWeek = persianDate.getDay(date) + 1;
        if (dayOfWeek == 7) {
          dayOfWeek = 0;
        }
        date = new Date(date.getTime() - dayOfWeek * DAY_MILLISECONDS).setHours(
          0,
          0,
          0,
          0,
        );
        return date;
      };
      this.startOfMonth = function(date) {
        var dayOfMonth = persianDate.getDate(date) - 1;
        return new Date(
          date.getTime() - dayOfMonth * DAY_MILLISECONDS,
        ).setHours(0, 0, 0, 0);
      };
      this.endOfMonth = function(date) {
        var dayOfMonth = persianDate.getDate(date) - 1;
        var year = persianDate.getFullYear(date);
        var month = persianDate.getMonth(date) + 1;
        var monthDays = persianDate.persianMonthDays(year, month);
        return new Date(
          date.getTime() + (monthDays - dayOfMonth) * DAY_MILLISECONDS,
        ).setHours(0, 0, 0, 0);
      };
      this.advanceTime = function(startDate, endDate) {
        var monthDays = [];
        var result = {
          monthDays: monthDays,
          startDate: startDate,
          endDate: endDate,
        };
        var daySelected = (endDate - startDate) / DAY_MILLISECONDS;
        startDate = new Date(startDate);
        endDate = new Date(endDate);

        if (daySelected > 30) {
          var counter = 0;
          var startDateYear = persianDate.getFullYear(startDate);
          var endDateYear = persianDate.getFullYear(endDate);
          var startDateMonth = persianDate.getMonth(startDate);
          var endDateMonth = persianDate.getMonth(endDate);
          // set start date to begin of persian month & round end date to end of persian month
          while (
            startDateYear <= endDateYear &&
            startDateMonth <= endDateMonth
          ) {
            monthDays[counter] = persianDate.persianMonthDays(
              startDateYear,
              startDateMonth,
            );
            if (startDateMonth == 12) {
              startDateMonth++;
              startDateYear++;
            } else {
              startDateMonth++;
            }
            counter++;
          }
          startDate = self.startOfMonth(startDate);
          endDate = self.endOfMonth(endDate);
          result = {
            monthDays: monthDays,
            startDate: startDate,
            endDate: endDate,
          };
        }
        return result;
      };
      this.getMonthTiming = function(month) {
        var today = new Date();
        var result = {};
        month = month - 1;
        var dayOfMonth = persianDate.getDate(today) - 1;
        var year = persianDate.getFullYear(today);
        var persianMonth = persianDate.getMonth(today);
        var monthDays = persianDate.persianMonthDays(year, month);
        var days = dayOfMonth;

        while (persianMonth > month) {
          persianMonth = persianMonth - 1;
          days += persianDate.persianMonthDays(year, persianMonth);
        }

        result.stratDate = new Date(
          today.getTime() - days * DAY_MILLISECONDS,
        ).setHours(0, 0, 0, 0);
        result.endDate = new Date(
          today.getTime() - (days - monthDays + 1) * DAY_MILLISECONDS,
        ).setHours(23, 59, 59, 0);
        return result;
      };
    },
  ])
  .service('credit', [
    '$log',
    '$uibModal',
    'PREFIX',
    'englishNumberFilter',
    'Business',
    '$window',
    'appMessenger',
    function(
      $log,
      $uibModal,
      PREFIX,
      englishNumberFilter,
      Business,
      $window,
      appMessenger,
    ) {
      this.showIncreaseCreditForm = function(options) {
        $uibModal.open({
          backdrop: true,
          animation: true,
          keyboard: true,
          backdropClick: true,
          templateUrl: PREFIX + 'app/common/tpl/increaseCreditForm.html',
          controller: [
            '$scope',
            '$uibModalInstance',
            'Business',
            '$state',
            '$stateParams',
            function($scope, $uibModalInstance, Business) {
              $scope.options = options || {};
              $scope.bankWait = false;
              var businessId = options.businessId;
              $scope.cancel = function() {
                $uibModalInstance.close();
                options.cancelCallback && options.cancelCallback();
              };
              $scope.payment = function() {
                var amount = Number(englishNumberFilter($scope.amount));
                var paymentOptions = {
                  businessId: businessId,
                  rialPrice: amount,
                  description: options.description,
                };
                if ($scope.options.chargedBy == 'business') {
                  $scope.bankWait = true;
                  Business.buyCredit(paymentOptions).$promise.then(
                    function(res) {
                      if (res.url) {
                        $window.location.href = res.url;
                        var message = 'business.chargedSuccessful';
                        options.saveCallback &&
                          options.saveCallback(false, message);
                      } else {
                        var errorMessage = 'error.generalError';
                        options.saveCallback &&
                          options.saveCallback(true, errorMessage);
                      }
                    },
                    function(err) {
                      var errorMessage = 'error.generalError';
                      options.saveCallback &&
                        options.saveCallback(true, errorMessage);
                    },
                  );
                } else if ($scope.options.chargedBy == 'admin') {
                  Business.adminChargeCredit(paymentOptions).$promise.then(
                    function(res) {
                      $uibModalInstance.close();
                      var message = 'business.chargedSuccessful';
                      options.saveCallback &&
                        options.saveCallback(false, message);
                    },
                    function(err) {
                      var errorMessage = 'error.generalError';
                      options.saveCallback &&
                        options.saveCallback(true, errorMessage);
                    },
                  );
                }
              };
            },
          ],
        });
      };
    },
  ])
  .service('uploadModal', [
    '$log',
    '$uibModal',
    'PREFIX',
    'FileStorage',
    'FileUploader',
    'appMessenger',
    'genericService',
    'Business',
    function(
      $log,
      $uibModal,
      PREFIX,
      Files,
      FileUploader,
      appMessenger,
      genericService,
      Business,
    ) {
      this.showUploadModal = function(options) {
        $uibModal.open({
          backdrop: true,
          animation: true,
          keyboard: true,
          backdropClick: true,
          size: 'lg',
          templateUrl: PREFIX + 'app/widgets/upload/tpl/uploadModal.html',
          controller: [
            '$scope',
            '$uibModalInstance',
            function($scope, $uibModalInstance) {
              $scope.image = {};
              var businessId = options.businessId;
              if (options.fileId && options.fileId != 'undefined') {
                $scope.image.id = options.fileId;
              }
              if (options.fileName && options.fileName != 'undefined') {
                $scope.image.name = options.fileName;
              }
              var option = { businessId: businessId, fileType: 'image' };
              getFiles(option);
              //create tabs for modal
              $scope.tabs = [
                {
                  title: 'upload.fileList',
                  icon: 'fa-th-list',
                  url: 'app/widgets/upload/tpl/fileListTabContent.html'
                },
                {
                  title: 'upload.file',
                  icon: 'fa-upload',
                  url: 'app/widgets/upload/tpl/uploadTabContent.html'
                }
              ];
              //upload file to data source
              $scope.DownloadUrlPrefix = Window.API_URL;
              var uploader = ($scope.uploader = new FileUploader({
                url: $scope.DownloadUrlPrefix + '/api/file/upload',
                removeAfterUpload: true,
                formData: [{ businessId: businessId }],
              }));
              //delete message after select new file
              uploader.onAfterAddingFile = function(fileItem) {
                $scope.show = false;
              };
              //show success message for uploaded file
              uploader.onSuccessItem = function(
                fileItem,
                response,
                status,
                headers
              ) {
                $scope.show = true;
                $scope.status = 'list-group-item-success';
                $scope.result = 'upload.success';
                $scope.fileName = fileItem.file.name;
                getFiles(option);
              };
              //show error message for failed uploaded file
              uploader.onErrorItem = function(
                fileItem,
                response,
                status,
                headers
              ) {
                $scope.show = true;
                $scope.status = 'list-group-item-danger';
                $scope.result = 'upload.fail';
                $scope.fileName = fileItem.file.name;
              };

              //get files from data source
              function getFiles(business) {
                Files.getFilesByBusinessId(business).$promise.then(function(
                  files
                ) {
                  $scope.fileList = files.result;
                }),
                  function(error) {
                    $log.error(
                      'can not get files info from data source: ' + error
                    );
                    appMessenger.showError('error.generalError');
                  };
              }

              //select image
              $scope.check = function(image) {
                $scope.image.id = image.id;
                $scope.image.name = image.name;
              };
              //save file and close modal
              $scope.saveImage = function() {
                option.id = $scope.image.id;
                option.name = $scope.image.name;
                options.saveCallback && options.saveCallback(option);
                $uibModalInstance.close();
              };
              $scope.removeImage = function(fileId) {
                genericService.showConfirmDialog({
                  title: 'general.warning',
                  message: 'general.areYouSureRemoveFile',
                  noBtnLabel: 'general.no',
                  yesBtnLabel: 'general.yes',
                  yesCallback: function() {
                    Business.files
                      .destroyById({ id: businessId }, { fk: fileId })
                      .$promise.then(
                        function(res) {
                          // if there is a logo or background that is deleted we also remove it from the related themeConfig
                          if (options.themeId && options.businessThemeConfig) {
                            angular.forEach(
                              options.businessThemeConfig,
                              function(themeConfig, themeId) {
                                if (
                                  themeConfig['logo'] &&
                                  themeConfig['logo'].id &&
                                  themeConfig['logo'].id == fileId
                                ) {
                                  themeConfig['logo'] = {};
                                  if (options.themeId == themeId) {
                                    $scope.image.id = null;
                                    $scope.image.name = null;
                                  }
                                }
                                if (
                                  themeConfig['background'] &&
                                  themeConfig['background'].id &&
                                  themeConfig['background'].id == fileId
                                ) {
                                  themeConfig['background'] = {};
                                  if (options.themeId == themeId) {
                                    $scope.image.id = null;
                                    $scope.image.name = null;
                                  }
                                }
                              },
                            );
                            Business.prototype$updateAttributes(
                              { id: businessId },
                              { themeConfig: options.businessThemeConfig },
                            ).$promise.then(
                              function(res) {
                                appMessenger.showSuccess(
                                  'upload.removeSuccessFull',
                                );
                                options.saveCallback &&
                                  options.saveCallback(option);
                                $uibModalInstance.close();
                              },
                              function(err) {
                                appMessenger.showError(
                                  'upload.removeUnSuccessFull',
                                );
                              },
                            );
                          }
                        },
                        function(err) {
                          appMessenger.showError('upload.removeUnSuccessFull');
                        },
                      );
                  },
                  NoCallback: function() {},
                });
              };
              //close modal
              $scope.cancel = function() {
                $uibModalInstance.close();
                options.cancelCallback && options.cancelCallback();
              };
            },
          ],
        });
      };
    },
  ])
  .service('usernameService', [
    '$log',
    function($log) {
      this.trim = function(username) {
        return username.split('@')[0];
      };
      this.concat = function(username, businessId) {
        return username.concat('@', businessId);
      };
    },
  ])
  .service('errorMessenger', [
    '$log',
    function($log) {
      this.send = function(messageName, sessionData) {
        var tags = {};
        var errorName = messageName + ' Login';
        switch (messageName) {
          case 'Member':
            tags.username = sessionData.username;
            tags.businessId = sessionData.businessId;
            tags.memberId = sessionData.id;
            tags.mobile = sessionData.mobile;
            tags.fullName = sessionData.fullName;
            break;
          case 'Business':
            tags.username = sessionData.username;
            tags.businessId = sessionData.id;
            tags.mobile = sessionData.mobile;
            tags.fullName = sessionData.fullName;
            tags.email = sessionData.email;
            tags.title = sessionData.title;
            break;
          case 'Reseller':
            tags.username = sessionData.username;
            tags.resellerId = sessionData.id;
            tags.mobile = sessionData.mobile;
            tags.fullName = sessionData.fullName;
            tags.email = sessionData.email;
            tags.title = sessionData.title;
            break;
          case 'Admin':
            tags.username = sessionData.username;
            tags.email = sessionData.email;
            tags.adminId = sessionData.id;
            tags = sessionData;
        }
        Raven.captureException(errorName, { tags: tags });
      };
    },
  ]);
