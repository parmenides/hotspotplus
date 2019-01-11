angular
  .module('masterHotspotApp')
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
  .service('loadingModal', [
    '$log',
    '$uibModal',
    function($log, $uibModal) {
      var _this = this;
      this.show = function() {
        $uibModal.open({
          backdrop: 'static',
          animation: true,
          keyboard: false,
          backdropClick: true,
          size: 'sm',
          templateUrl: 'loading.html',
          controller: [
            '$scope',
            '$uibModalInstance',
            function($scope, $uibModalInstance) {
              _this.modalInstance = $uibModalInstance;
            },
          ],
        });
      };
      this.hide = function() {
        _this.modalInstance && _this.modalInstance.close();
      };
    },
  ])
  .service('numberService', [
    '$log',
    function($log) {
      this.clockToString = function(clock) {
        if (clock < 10) {
          return '0' + clock;
        } else return clock;
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
        if (username.indexOf('@') !== -1) {
          return username;
        }
        return username.concat('@', businessId);
      };
    },
  ])
  .service('nationalCode', [
    '$log',
    'englishNumberFilter',
    function($log, englishNumberFilter) {
      this.isValid = function(code) {
        var length = code.length;
        if (7 < length && length < 11) {
          var nationalCode = Number(englishNumberFilter(code));
          var nationalCodeArray = [];
          var validationCode = 0;
          var validationRes = 0;
          for (var i = 0; i < 10; i++) {
            nationalCodeArray[i] = nationalCode % 10;
            nationalCode = parseInt(nationalCode / 10);
            if (i == 0) {
              validationCode = nationalCodeArray[0];
            } else {
              validationRes = nationalCodeArray[i] * (i + 1) + validationRes;
            }
          }
          validationRes = parseInt(validationRes % 11);
          if (
            (validationRes < 2 && validationRes == validationCode) ||
            11 - validationRes == validationCode
          ) {
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      };
    },
  ])
  .service('birthday', [
    '$log',
    'englishNumberFilter',
    function($log, englishNumberFilter) {
      this.getPersianEpochDay = function(dateInArray) {
        if (dateInArray[0] && dateInArray[1] && dateInArray[2]) {
          var birthYear = Number(englishNumberFilter(dateInArray[2]));
          var birthMonth = dateInArray[1];
          var birthDay = Number(englishNumberFilter(dateInArray[0]));
          var birthday = persianDate([birthYear, birthMonth, birthDay]);
          return new Date(birthday.gDate).getTime();
        } else {
          return null;
        }
      };
      this.getEnglishEpochDay = function(dateInArray) {
        if (dateInArray[0] && dateInArray[1] && dateInArray[2]) {
          var birthYear = Number(englishNumberFilter(dateInArray[2]));
          var birthMonth = dateInArray[1];
          var birthDay = Number(englishNumberFilter(dateInArray[0]));
          var birthday = new Date(birthYear, birthMonth, birthDay);
          return birthday.getTime();
        } else {
          return null;
        }
      };
    },
  ])
  .directive('ngFormCommit', [
    function() {
      return {
        require: 'form',
        link: function($scope, $el, $attr, $form) {
          $form.commit = function() {
            $el[0].submit();
          };
        },
      };
    },
  ]);
