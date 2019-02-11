'use strict';

/* Controllers */
angular.module('app').controller('AppCtrl', [
  '$scope',
  '$translate',
  '$localStorage',
  '$window',
  '$rootScope',
  'Session',
  '$state',
  function(
    $scope,
    $translate,
    $localStorage,
    $window,
    $rootScope,
    Session,
    $state
  ) {
    // add 'ie' classes to html
    var isIE = !!navigator.userAgent.match(/MSIE/i);
    if (isIE) {
      angular.element($window.document.body).addClass('ie');
    }
    if (isSmartDevice($window)) {
      angular.element($window.document.body).addClass('smart');
    }
    /*
			 $rootScope.$on( '$stateChangeStart',
			 function ( event, toState, toParams, fromState, fromParams ) {
			 if ( toState !== 'access.signIn' ) {
			 if ( !Session.business ) {
			 event.preventDefault();
			 $state.go( "access.signIn" );
			 }
			 }
			 } );*/
    // config
    $scope.app = {
      name: Window.appTitle || 'Hsp',
      domain: Window.appDomain || 'Hsp',
      version: Window.systemConfig.version || '-',
      // for chart colors
      color: {
        primary: '#7266ba',
        info: '#23b7e5',
        success: '#27c24c',
        warning: '#fad733',
        danger: '#f05050',
        light: '#e8eff0',
        dark: '#3a3f51',
        black: '#1c2b36'
      },
      settings: {
        themeID: 1,
        navbarHeaderColor: 'bg-black',
        navbarCollapseColor: 'bg-white-only',
        asideColor: 'bg-black',
        headerFixed: true,
        asideFixed: false,
        asideFolded: false,
        asideDock: false,
        container: false
      }
    };

    // save settings to local storage
    if (angular.isDefined($localStorage.settings)) {
      $scope.app.settings = $localStorage.settings;
    } else {
      $localStorage.settings = $scope.app.settings;
    }
    $scope.$watch(
      'app.settings',
      function() {
        if ($scope.app.settings.asideDock && $scope.app.settings.asideFixed) {
          // aside dock and fixed must set the header fixed.
          $scope.app.settings.headerFixed = true;
        }
        // for box layout, add background image
        //$scope.app.settings.container ? angular.element('html').addClass('bg') : angular.element('html').removeClass('bg');
        angular.element('html').addClass('bg');
        $scope.app.settings.container = false;
        // save to local storage
        $localStorage.settings = $scope.app.settings;
      },
      true
    );

    // angular translate
    $scope.lang = { isopen: false };
    $scope.langs = {
      en: 'English',
      de_DE: 'German',
      it_IT: 'Italian',
      fa_IR: 'Persian'
    };
    $scope.selectLang =
      $scope.langs[$translate.proposedLanguage()] || 'Persian';
    $rootScope.direction = 'rtl';
    $rootScope.localLang = 'fa';
    $scope.setLang = function(langKey, $event) {
      // set the current lang
      $scope.selectLang = $scope.langs[langKey];
      // You can change the language during runtime
      $translate.use(langKey);
      $rootScope.localLang = langKey.split('_')[0];
      $scope.lang.isopen = !$scope.lang.isopen;
      if (langKey == 'fa_IR') {
        window.location.href = 'index.rtl.html';
        $rootScope.direction = 'rtl';
      } else {
        window.location.href = 'index.html';
        $rootScope.direction = 'ltr';
      }
    };

    function isSmartDevice($window) {
      // Adapted from http://www.detectmobilebrowsers.com
      var ua =
        $window['navigator']['userAgent'] ||
        $window['navigator']['vendor'] ||
        $window['opera'];
      // Checks for iOs, Android, Blackberry, Opera Mini, and Windows mobile devices
      return /iPhone|iPod|iPad|Silk|Android|BlackBerry|Opera Mini|IEMobile/.test(
        ua
      );
    }

    if (!Session.business) {
      $state.go('access.signIn');
      return;
    }
  }
]);
