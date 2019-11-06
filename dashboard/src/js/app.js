'use strict';

angular.module('app', [
  'ngAnimate',
  'ngAria',
  'ngCookies',
  'persianDate',
  'ngMessages',
  'ngResource',
  'ngSanitize',
  'ngTouch',
  'ngStorage',
  'ui.router',
  'ui.bootstrap',
  'ui.utils',
  'ui.load',
  'ui.jq',
  'toaster',
  'lbServices',
  'oc.lazyLoad',
  'pascalprecht.translate',
  'angularFileUpload',
  'ngRoute',
  'ngFileSaver'
]);
String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}
/*persian date picker doc : https://github.com/AminRahimi/angular-bootstrap-persian-datepicker/tree/gh-pages*/
