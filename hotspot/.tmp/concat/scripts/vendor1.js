/**
 * @license AngularJS v1.6.6
 * (c) 2010-2017 Google, Inc. http://angularjs.org
 * License: MIT
 */
(function(window, angular) {'use strict';

/* global shallowCopy: true */

/**
 * Creates a shallow copy of an object, an array or a primitive.
 *
 * Assumes that there are no proto properties for objects.
 */
function shallowCopy(src, dst) {
  if (isArray(src)) {
    dst = dst || [];

    for (var i = 0, ii = src.length; i < ii; i++) {
      dst[i] = src[i];
    }
  } else if (isObject(src)) {
    dst = dst || {};

    for (var key in src) {
      if (!(key.charAt(0) === '$' && key.charAt(1) === '$')) {
        dst[key] = src[key];
      }
    }
  }

  return dst || src;
}

/* global shallowCopy: false */

// `isArray` and `isObject` are necessary for `shallowCopy()` (included via `src/shallowCopy.js`).
// They are initialized inside the `$RouteProvider`, to ensure `window.angular` is available.
var isArray;
var isObject;
var isDefined;
var noop;

/**
 * @ngdoc module
 * @name ngRoute
 * @description
 *
 * # ngRoute
 *
 * The `ngRoute` module provides routing and deeplinking services and directives for angular apps.
 *
 * ## Example
 * See {@link ngRoute.$route#example $route} for an example of configuring and using `ngRoute`.
 *
 *
 * <div doc-module-components="ngRoute"></div>
 */
/* global -ngRouteModule */
var ngRouteModule = angular.
  module('ngRoute', []).
  info({ angularVersion: '1.6.6' }).
  provider('$route', $RouteProvider).
  // Ensure `$route` will be instantiated in time to capture the initial `$locationChangeSuccess`
  // event (unless explicitly disabled). This is necessary in case `ngView` is included in an
  // asynchronously loaded template.
  run(instantiateRoute);
var $routeMinErr = angular.$$minErr('ngRoute');
var isEagerInstantiationEnabled;


/**
 * @ngdoc provider
 * @name $routeProvider
 * @this
 *
 * @description
 *
 * Used for configuring routes.
 *
 * ## Example
 * See {@link ngRoute.$route#example $route} for an example of configuring and using `ngRoute`.
 *
 * ## Dependencies
 * Requires the {@link ngRoute `ngRoute`} module to be installed.
 */
function $RouteProvider() {
  isArray = angular.isArray;
  isObject = angular.isObject;
  isDefined = angular.isDefined;
  noop = angular.noop;

  function inherit(parent, extra) {
    return angular.extend(Object.create(parent), extra);
  }

  var routes = {};

  /**
   * @ngdoc method
   * @name $routeProvider#when
   *
   * @param {string} path Route path (matched against `$location.path`). If `$location.path`
   *    contains redundant trailing slash or is missing one, the route will still match and the
   *    `$location.path` will be updated to add or drop the trailing slash to exactly match the
   *    route definition.
   *
   *    * `path` can contain named groups starting with a colon: e.g. `:name`. All characters up
   *        to the next slash are matched and stored in `$routeParams` under the given `name`
   *        when the route matches.
   *    * `path` can contain named groups starting with a colon and ending with a star:
   *        e.g.`:name*`. All characters are eagerly stored in `$routeParams` under the given `name`
   *        when the route matches.
   *    * `path` can contain optional named groups with a question mark: e.g.`:name?`.
   *
   *    For example, routes like `/color/:color/largecode/:largecode*\/edit` will match
   *    `/color/brown/largecode/code/with/slashes/edit` and extract:
   *
   *    * `color: brown`
   *    * `largecode: code/with/slashes`.
   *
   *
   * @param {Object} route Mapping information to be assigned to `$route.current` on route
   *    match.
   *
   *    Object properties:
   *
   *    - `controller` – `{(string|Function)=}` – Controller fn that should be associated with
   *      newly created scope or the name of a {@link angular.Module#controller registered
   *      controller} if passed as a string.
   *    - `controllerAs` – `{string=}` – An identifier name for a reference to the controller.
   *      If present, the controller will be published to scope under the `controllerAs` name.
   *    - `template` – `{(string|Function)=}` – html template as a string or a function that
   *      returns an html template as a string which should be used by {@link
   *      ngRoute.directive:ngView ngView} or {@link ng.directive:ngInclude ngInclude} directives.
   *      This property takes precedence over `templateUrl`.
   *
   *      If `template` is a function, it will be called with the following parameters:
   *
   *      - `{Array.<Object>}` - route parameters extracted from the current
   *        `$location.path()` by applying the current route
   *
   *      One of `template` or `templateUrl` is required.
   *
   *    - `templateUrl` – `{(string|Function)=}` – path or function that returns a path to an html
   *      template that should be used by {@link ngRoute.directive:ngView ngView}.
   *
   *      If `templateUrl` is a function, it will be called with the following parameters:
   *
   *      - `{Array.<Object>}` - route parameters extracted from the current
   *        `$location.path()` by applying the current route
   *
   *      One of `templateUrl` or `template` is required.
   *
   *    - `resolve` - `{Object.<string, Function>=}` - An optional map of dependencies which should
   *      be injected into the controller. If any of these dependencies are promises, the router
   *      will wait for them all to be resolved or one to be rejected before the controller is
   *      instantiated.
   *      If all the promises are resolved successfully, the values of the resolved promises are
   *      injected and {@link ngRoute.$route#$routeChangeSuccess $routeChangeSuccess} event is
   *      fired. If any of the promises are rejected the
   *      {@link ngRoute.$route#$routeChangeError $routeChangeError} event is fired.
   *      For easier access to the resolved dependencies from the template, the `resolve` map will
   *      be available on the scope of the route, under `$resolve` (by default) or a custom name
   *      specified by the `resolveAs` property (see below). This can be particularly useful, when
   *      working with {@link angular.Module#component components} as route templates.<br />
   *      <div class="alert alert-warning">
   *        **Note:** If your scope already contains a property with this name, it will be hidden
   *        or overwritten. Make sure, you specify an appropriate name for this property, that
   *        does not collide with other properties on the scope.
   *      </div>
   *      The map object is:
   *
   *      - `key` – `{string}`: a name of a dependency to be injected into the controller.
   *      - `factory` - `{string|Function}`: If `string` then it is an alias for a service.
   *        Otherwise if function, then it is {@link auto.$injector#invoke injected}
   *        and the return value is treated as the dependency. If the result is a promise, it is
   *        resolved before its value is injected into the controller. Be aware that
   *        `ngRoute.$routeParams` will still refer to the previous route within these resolve
   *        functions.  Use `$route.current.params` to access the new route parameters, instead.
   *
   *    - `resolveAs` - `{string=}` - The name under which the `resolve` map will be available on
   *      the scope of the route. If omitted, defaults to `$resolve`.
   *
   *    - `redirectTo` – `{(string|Function)=}` – value to update
   *      {@link ng.$location $location} path with and trigger route redirection.
   *
   *      If `redirectTo` is a function, it will be called with the following parameters:
   *
   *      - `{Object.<string>}` - route parameters extracted from the current
   *        `$location.path()` by applying the current route templateUrl.
   *      - `{string}` - current `$location.path()`
   *      - `{Object}` - current `$location.search()`
   *
   *      The custom `redirectTo` function is expected to return a string which will be used
   *      to update `$location.url()`. If the function throws an error, no further processing will
   *      take place and the {@link ngRoute.$route#$routeChangeError $routeChangeError} event will
   *      be fired.
   *
   *      Routes that specify `redirectTo` will not have their controllers, template functions
   *      or resolves called, the `$location` will be changed to the redirect url and route
   *      processing will stop. The exception to this is if the `redirectTo` is a function that
   *      returns `undefined`. In this case the route transition occurs as though there was no
   *      redirection.
   *
   *    - `resolveRedirectTo` – `{Function=}` – a function that will (eventually) return the value
   *      to update {@link ng.$location $location} URL with and trigger route redirection. In
   *      contrast to `redirectTo`, dependencies can be injected into `resolveRedirectTo` and the
   *      return value can be either a string or a promise that will be resolved to a string.
   *
   *      Similar to `redirectTo`, if the return value is `undefined` (or a promise that gets
   *      resolved to `undefined`), no redirection takes place and the route transition occurs as
   *      though there was no redirection.
   *
   *      If the function throws an error or the returned promise gets rejected, no further
   *      processing will take place and the
   *      {@link ngRoute.$route#$routeChangeError $routeChangeError} event will be fired.
   *
   *      `redirectTo` takes precedence over `resolveRedirectTo`, so specifying both on the same
   *      route definition, will cause the latter to be ignored.
   *
   *    - `[reloadOnSearch=true]` - `{boolean=}` - reload route when only `$location.search()`
   *      or `$location.hash()` changes.
   *
   *      If the option is set to `false` and url in the browser changes, then
   *      `$routeUpdate` event is broadcasted on the root scope.
   *
   *    - `[caseInsensitiveMatch=false]` - `{boolean=}` - match routes without being case sensitive
   *
   *      If the option is set to `true`, then the particular route can be matched without being
   *      case sensitive
   *
   * @returns {Object} self
   *
   * @description
   * Adds a new route definition to the `$route` service.
   */
  this.when = function(path, route) {
    //copy original route object to preserve params inherited from proto chain
    var routeCopy = shallowCopy(route);
    if (angular.isUndefined(routeCopy.reloadOnSearch)) {
      routeCopy.reloadOnSearch = true;
    }
    if (angular.isUndefined(routeCopy.caseInsensitiveMatch)) {
      routeCopy.caseInsensitiveMatch = this.caseInsensitiveMatch;
    }
    routes[path] = angular.extend(
      routeCopy,
      path && pathRegExp(path, routeCopy)
    );

    // create redirection for trailing slashes
    if (path) {
      var redirectPath = (path[path.length - 1] === '/')
            ? path.substr(0, path.length - 1)
            : path + '/';

      routes[redirectPath] = angular.extend(
        {redirectTo: path},
        pathRegExp(redirectPath, routeCopy)
      );
    }

    return this;
  };

  /**
   * @ngdoc property
   * @name $routeProvider#caseInsensitiveMatch
   * @description
   *
   * A boolean property indicating if routes defined
   * using this provider should be matched using a case insensitive
   * algorithm. Defaults to `false`.
   */
  this.caseInsensitiveMatch = false;

   /**
    * @param path {string} path
    * @param opts {Object} options
    * @return {?Object}
    *
    * @description
    * Normalizes the given path, returning a regular expression
    * and the original path.
    *
    * Inspired by pathRexp in visionmedia/express/lib/utils.js.
    */
  function pathRegExp(path, opts) {
    var insensitive = opts.caseInsensitiveMatch,
        ret = {
          originalPath: path,
          regexp: path
        },
        keys = ret.keys = [];

    path = path
      .replace(/([().])/g, '\\$1')
      .replace(/(\/)?:(\w+)(\*\?|[?*])?/g, function(_, slash, key, option) {
        var optional = (option === '?' || option === '*?') ? '?' : null;
        var star = (option === '*' || option === '*?') ? '*' : null;
        keys.push({ name: key, optional: !!optional });
        slash = slash || '';
        return ''
          + (optional ? '' : slash)
          + '(?:'
          + (optional ? slash : '')
          + (star && '(.+?)' || '([^/]+)')
          + (optional || '')
          + ')'
          + (optional || '');
      })
      .replace(/([/$*])/g, '\\$1');

    ret.regexp = new RegExp('^' + path + '$', insensitive ? 'i' : '');
    return ret;
  }

  /**
   * @ngdoc method
   * @name $routeProvider#otherwise
   *
   * @description
   * Sets route definition that will be used on route change when no other route definition
   * is matched.
   *
   * @param {Object|string} params Mapping information to be assigned to `$route.current`.
   * If called with a string, the value maps to `redirectTo`.
   * @returns {Object} self
   */
  this.otherwise = function(params) {
    if (typeof params === 'string') {
      params = {redirectTo: params};
    }
    this.when(null, params);
    return this;
  };

  /**
   * @ngdoc method
   * @name $routeProvider#eagerInstantiationEnabled
   * @kind function
   *
   * @description
   * Call this method as a setter to enable/disable eager instantiation of the
   * {@link ngRoute.$route $route} service upon application bootstrap. You can also call it as a
   * getter (i.e. without any arguments) to get the current value of the
   * `eagerInstantiationEnabled` flag.
   *
   * Instantiating `$route` early is necessary for capturing the initial
   * {@link ng.$location#$locationChangeStart $locationChangeStart} event and navigating to the
   * appropriate route. Usually, `$route` is instantiated in time by the
   * {@link ngRoute.ngView ngView} directive. Yet, in cases where `ngView` is included in an
   * asynchronously loaded template (e.g. in another directive's template), the directive factory
   * might not be called soon enough for `$route` to be instantiated _before_ the initial
   * `$locationChangeSuccess` event is fired. Eager instantiation ensures that `$route` is always
   * instantiated in time, regardless of when `ngView` will be loaded.
   *
   * The default value is true.
   *
   * **Note**:<br />
   * You may want to disable the default behavior when unit-testing modules that depend on
   * `ngRoute`, in order to avoid an unexpected request for the default route's template.
   *
   * @param {boolean=} enabled - If provided, update the internal `eagerInstantiationEnabled` flag.
   *
   * @returns {*} The current value of the `eagerInstantiationEnabled` flag if used as a getter or
   *     itself (for chaining) if used as a setter.
   */
  isEagerInstantiationEnabled = true;
  this.eagerInstantiationEnabled = function eagerInstantiationEnabled(enabled) {
    if (isDefined(enabled)) {
      isEagerInstantiationEnabled = enabled;
      return this;
    }

    return isEagerInstantiationEnabled;
  };


  this.$get = ['$rootScope',
               '$location',
               '$routeParams',
               '$q',
               '$injector',
               '$templateRequest',
               '$sce',
               '$browser',
      function($rootScope, $location, $routeParams, $q, $injector, $templateRequest, $sce, $browser) {

    /**
     * @ngdoc service
     * @name $route
     * @requires $location
     * @requires $routeParams
     *
     * @property {Object} current Reference to the current route definition.
     * The route definition contains:
     *
     *   - `controller`: The controller constructor as defined in the route definition.
     *   - `locals`: A map of locals which is used by {@link ng.$controller $controller} service for
     *     controller instantiation. The `locals` contain
     *     the resolved values of the `resolve` map. Additionally the `locals` also contain:
     *
     *     - `$scope` - The current route scope.
     *     - `$template` - The current route template HTML.
     *
     *     The `locals` will be assigned to the route scope's `$resolve` property. You can override
     *     the property name, using `resolveAs` in the route definition. See
     *     {@link ngRoute.$routeProvider $routeProvider} for more info.
     *
     * @property {Object} routes Object with all route configuration Objects as its properties.
     *
     * @description
     * `$route` is used for deep-linking URLs to controllers and views (HTML partials).
     * It watches `$location.url()` and tries to map the path to an existing route definition.
     *
     * Requires the {@link ngRoute `ngRoute`} module to be installed.
     *
     * You can define routes through {@link ngRoute.$routeProvider $routeProvider}'s API.
     *
     * The `$route` service is typically used in conjunction with the
     * {@link ngRoute.directive:ngView `ngView`} directive and the
     * {@link ngRoute.$routeParams `$routeParams`} service.
     *
     * @example
     * This example shows how changing the URL hash causes the `$route` to match a route against the
     * URL, and the `ngView` pulls in the partial.
     *
     * <example name="$route-service" module="ngRouteExample"
     *          deps="angular-route.js" fixBase="true">
     *   <file name="index.html">
     *     <div ng-controller="MainController">
     *       Choose:
     *       <a href="Book/Moby">Moby</a> |
     *       <a href="Book/Moby/ch/1">Moby: Ch1</a> |
     *       <a href="Book/Gatsby">Gatsby</a> |
     *       <a href="Book/Gatsby/ch/4?key=value">Gatsby: Ch4</a> |
     *       <a href="Book/Scarlet">Scarlet Letter</a><br/>
     *
     *       <div ng-view></div>
     *
     *       <hr />
     *
     *       <pre>$location.path() = {{$location.path()}}</pre>
     *       <pre>$route.current.templateUrl = {{$route.current.templateUrl}}</pre>
     *       <pre>$route.current.params = {{$route.current.params}}</pre>
     *       <pre>$route.current.scope.name = {{$route.current.scope.name}}</pre>
     *       <pre>$routeParams = {{$routeParams}}</pre>
     *     </div>
     *   </file>
     *
     *   <file name="book.html">
     *     controller: {{name}}<br />
     *     Book Id: {{params.bookId}}<br />
     *   </file>
     *
     *   <file name="chapter.html">
     *     controller: {{name}}<br />
     *     Book Id: {{params.bookId}}<br />
     *     Chapter Id: {{params.chapterId}}
     *   </file>
     *
     *   <file name="script.js">
     *     angular.module('ngRouteExample', ['ngRoute'])
     *
     *      .controller('MainController', function($scope, $route, $routeParams, $location) {
     *          $scope.$route = $route;
     *          $scope.$location = $location;
     *          $scope.$routeParams = $routeParams;
     *      })
     *
     *      .controller('BookController', function($scope, $routeParams) {
     *          $scope.name = 'BookController';
     *          $scope.params = $routeParams;
     *      })
     *
     *      .controller('ChapterController', function($scope, $routeParams) {
     *          $scope.name = 'ChapterController';
     *          $scope.params = $routeParams;
     *      })
     *
     *     .config(function($routeProvider, $locationProvider) {
     *       $routeProvider
     *        .when('/Book/:bookId', {
     *         templateUrl: 'book.html',
     *         controller: 'BookController',
     *         resolve: {
     *           // I will cause a 1 second delay
     *           delay: function($q, $timeout) {
     *             var delay = $q.defer();
     *             $timeout(delay.resolve, 1000);
     *             return delay.promise;
     *           }
     *         }
     *       })
     *       .when('/Book/:bookId/ch/:chapterId', {
     *         templateUrl: 'chapter.html',
     *         controller: 'ChapterController'
     *       });
     *
     *       // configure html5 to get links working on jsfiddle
     *       $locationProvider.html5Mode(true);
     *     });
     *
     *   </file>
     *
     *   <file name="protractor.js" type="protractor">
     *     it('should load and compile correct template', function() {
     *       element(by.linkText('Moby: Ch1')).click();
     *       var content = element(by.css('[ng-view]')).getText();
     *       expect(content).toMatch(/controller: ChapterController/);
     *       expect(content).toMatch(/Book Id: Moby/);
     *       expect(content).toMatch(/Chapter Id: 1/);
     *
     *       element(by.partialLinkText('Scarlet')).click();
     *
     *       content = element(by.css('[ng-view]')).getText();
     *       expect(content).toMatch(/controller: BookController/);
     *       expect(content).toMatch(/Book Id: Scarlet/);
     *     });
     *   </file>
     * </example>
     */

    /**
     * @ngdoc event
     * @name $route#$routeChangeStart
     * @eventType broadcast on root scope
     * @description
     * Broadcasted before a route change. At this  point the route services starts
     * resolving all of the dependencies needed for the route change to occur.
     * Typically this involves fetching the view template as well as any dependencies
     * defined in `resolve` route property. Once  all of the dependencies are resolved
     * `$routeChangeSuccess` is fired.
     *
     * The route change (and the `$location` change that triggered it) can be prevented
     * by calling `preventDefault` method of the event. See {@link ng.$rootScope.Scope#$on}
     * for more details about event object.
     *
     * @param {Object} angularEvent Synthetic event object.
     * @param {Route} next Future route information.
     * @param {Route} current Current route information.
     */

    /**
     * @ngdoc event
     * @name $route#$routeChangeSuccess
     * @eventType broadcast on root scope
     * @description
     * Broadcasted after a route change has happened successfully.
     * The `resolve` dependencies are now available in the `current.locals` property.
     *
     * {@link ngRoute.directive:ngView ngView} listens for the directive
     * to instantiate the controller and render the view.
     *
     * @param {Object} angularEvent Synthetic event object.
     * @param {Route} current Current route information.
     * @param {Route|Undefined} previous Previous route information, or undefined if current is
     * first route entered.
     */

    /**
     * @ngdoc event
     * @name $route#$routeChangeError
     * @eventType broadcast on root scope
     * @description
     * Broadcasted if a redirection function fails or any redirection or resolve promises are
     * rejected.
     *
     * @param {Object} angularEvent Synthetic event object
     * @param {Route} current Current route information.
     * @param {Route} previous Previous route information.
     * @param {Route} rejection The thrown error or the rejection reason of the promise. Usually
     * the rejection reason is the error that caused the promise to get rejected.
     */

    /**
     * @ngdoc event
     * @name $route#$routeUpdate
     * @eventType broadcast on root scope
     * @description
     * The `reloadOnSearch` property has been set to false, and we are reusing the same
     * instance of the Controller.
     *
     * @param {Object} angularEvent Synthetic event object
     * @param {Route} current Current/previous route information.
     */

    var forceReload = false,
        preparedRoute,
        preparedRouteIsUpdateOnly,
        $route = {
          routes: routes,

          /**
           * @ngdoc method
           * @name $route#reload
           *
           * @description
           * Causes `$route` service to reload the current route even if
           * {@link ng.$location $location} hasn't changed.
           *
           * As a result of that, {@link ngRoute.directive:ngView ngView}
           * creates new scope and reinstantiates the controller.
           */
          reload: function() {
            forceReload = true;

            var fakeLocationEvent = {
              defaultPrevented: false,
              preventDefault: function fakePreventDefault() {
                this.defaultPrevented = true;
                forceReload = false;
              }
            };

            $rootScope.$evalAsync(function() {
              prepareRoute(fakeLocationEvent);
              if (!fakeLocationEvent.defaultPrevented) commitRoute();
            });
          },

          /**
           * @ngdoc method
           * @name $route#updateParams
           *
           * @description
           * Causes `$route` service to update the current URL, replacing
           * current route parameters with those specified in `newParams`.
           * Provided property names that match the route's path segment
           * definitions will be interpolated into the location's path, while
           * remaining properties will be treated as query params.
           *
           * @param {!Object<string, string>} newParams mapping of URL parameter names to values
           */
          updateParams: function(newParams) {
            if (this.current && this.current.$$route) {
              newParams = angular.extend({}, this.current.params, newParams);
              $location.path(interpolate(this.current.$$route.originalPath, newParams));
              // interpolate modifies newParams, only query params are left
              $location.search(newParams);
            } else {
              throw $routeMinErr('norout', 'Tried updating route when with no current route');
            }
          }
        };

    $rootScope.$on('$locationChangeStart', prepareRoute);
    $rootScope.$on('$locationChangeSuccess', commitRoute);

    return $route;

    /////////////////////////////////////////////////////

    /**
     * @param on {string} current url
     * @param route {Object} route regexp to match the url against
     * @return {?Object}
     *
     * @description
     * Check if the route matches the current url.
     *
     * Inspired by match in
     * visionmedia/express/lib/router/router.js.
     */
    function switchRouteMatcher(on, route) {
      var keys = route.keys,
          params = {};

      if (!route.regexp) return null;

      var m = route.regexp.exec(on);
      if (!m) return null;

      for (var i = 1, len = m.length; i < len; ++i) {
        var key = keys[i - 1];

        var val = m[i];

        if (key && val) {
          params[key.name] = val;
        }
      }
      return params;
    }

    function prepareRoute($locationEvent) {
      var lastRoute = $route.current;

      preparedRoute = parseRoute();
      preparedRouteIsUpdateOnly = preparedRoute && lastRoute && preparedRoute.$$route === lastRoute.$$route
          && angular.equals(preparedRoute.pathParams, lastRoute.pathParams)
          && !preparedRoute.reloadOnSearch && !forceReload;

      if (!preparedRouteIsUpdateOnly && (lastRoute || preparedRoute)) {
        if ($rootScope.$broadcast('$routeChangeStart', preparedRoute, lastRoute).defaultPrevented) {
          if ($locationEvent) {
            $locationEvent.preventDefault();
          }
        }
      }
    }

    function commitRoute() {
      var lastRoute = $route.current;
      var nextRoute = preparedRoute;

      if (preparedRouteIsUpdateOnly) {
        lastRoute.params = nextRoute.params;
        angular.copy(lastRoute.params, $routeParams);
        $rootScope.$broadcast('$routeUpdate', lastRoute);
      } else if (nextRoute || lastRoute) {
        forceReload = false;
        $route.current = nextRoute;

        var nextRoutePromise = $q.resolve(nextRoute);

        $browser.$$incOutstandingRequestCount();

        nextRoutePromise.
          then(getRedirectionData).
          then(handlePossibleRedirection).
          then(function(keepProcessingRoute) {
            return keepProcessingRoute && nextRoutePromise.
              then(resolveLocals).
              then(function(locals) {
                // after route change
                if (nextRoute === $route.current) {
                  if (nextRoute) {
                    nextRoute.locals = locals;
                    angular.copy(nextRoute.params, $routeParams);
                  }
                  $rootScope.$broadcast('$routeChangeSuccess', nextRoute, lastRoute);
                }
              });
          }).catch(function(error) {
            if (nextRoute === $route.current) {
              $rootScope.$broadcast('$routeChangeError', nextRoute, lastRoute, error);
            }
          }).finally(function() {
            // Because `commitRoute()` is called from a `$rootScope.$evalAsync` block (see
            // `$locationWatch`), this `$$completeOutstandingRequest()` call will not cause
            // `outstandingRequestCount` to hit zero.  This is important in case we are redirecting
            // to a new route which also requires some asynchronous work.

            $browser.$$completeOutstandingRequest(noop);
          });
      }
    }

    function getRedirectionData(route) {
      var data = {
        route: route,
        hasRedirection: false
      };

      if (route) {
        if (route.redirectTo) {
          if (angular.isString(route.redirectTo)) {
            data.path = interpolate(route.redirectTo, route.params);
            data.search = route.params;
            data.hasRedirection = true;
          } else {
            var oldPath = $location.path();
            var oldSearch = $location.search();
            var newUrl = route.redirectTo(route.pathParams, oldPath, oldSearch);

            if (angular.isDefined(newUrl)) {
              data.url = newUrl;
              data.hasRedirection = true;
            }
          }
        } else if (route.resolveRedirectTo) {
          return $q.
            resolve($injector.invoke(route.resolveRedirectTo)).
            then(function(newUrl) {
              if (angular.isDefined(newUrl)) {
                data.url = newUrl;
                data.hasRedirection = true;
              }

              return data;
            });
        }
      }

      return data;
    }

    function handlePossibleRedirection(data) {
      var keepProcessingRoute = true;

      if (data.route !== $route.current) {
        keepProcessingRoute = false;
      } else if (data.hasRedirection) {
        var oldUrl = $location.url();
        var newUrl = data.url;

        if (newUrl) {
          $location.
            url(newUrl).
            replace();
        } else {
          newUrl = $location.
            path(data.path).
            search(data.search).
            replace().
            url();
        }

        if (newUrl !== oldUrl) {
          // Exit out and don't process current next value,
          // wait for next location change from redirect
          keepProcessingRoute = false;
        }
      }

      return keepProcessingRoute;
    }

    function resolveLocals(route) {
      if (route) {
        var locals = angular.extend({}, route.resolve);
        angular.forEach(locals, function(value, key) {
          locals[key] = angular.isString(value) ?
              $injector.get(value) :
              $injector.invoke(value, null, null, key);
        });
        var template = getTemplateFor(route);
        if (angular.isDefined(template)) {
          locals['$template'] = template;
        }
        return $q.all(locals);
      }
    }

    function getTemplateFor(route) {
      var template, templateUrl;
      if (angular.isDefined(template = route.template)) {
        if (angular.isFunction(template)) {
          template = template(route.params);
        }
      } else if (angular.isDefined(templateUrl = route.templateUrl)) {
        if (angular.isFunction(templateUrl)) {
          templateUrl = templateUrl(route.params);
        }
        if (angular.isDefined(templateUrl)) {
          route.loadedTemplateUrl = $sce.valueOf(templateUrl);
          template = $templateRequest(templateUrl);
        }
      }
      return template;
    }

    /**
     * @returns {Object} the current active route, by matching it against the URL
     */
    function parseRoute() {
      // Match a route
      var params, match;
      angular.forEach(routes, function(route, path) {
        if (!match && (params = switchRouteMatcher($location.path(), route))) {
          match = inherit(route, {
            params: angular.extend({}, $location.search(), params),
            pathParams: params});
          match.$$route = route;
        }
      });
      // No route matched; fallback to "otherwise" route
      return match || routes[null] && inherit(routes[null], {params: {}, pathParams:{}});
    }

    /**
     * @returns {string} interpolation of the redirect path with the parameters
     */
    function interpolate(string, params) {
      var result = [];
      angular.forEach((string || '').split(':'), function(segment, i) {
        if (i === 0) {
          result.push(segment);
        } else {
          var segmentMatch = segment.match(/(\w+)(?:[?*])?(.*)/);
          var key = segmentMatch[1];
          result.push(params[key]);
          result.push(segmentMatch[2] || '');
          delete params[key];
        }
      });
      return result.join('');
    }
  }];
}

instantiateRoute.$inject = ['$injector'];
function instantiateRoute($injector) {
  if (isEagerInstantiationEnabled) {
    // Instantiate `$route`
    $injector.get('$route');
  }
}

ngRouteModule.provider('$routeParams', $RouteParamsProvider);


/**
 * @ngdoc service
 * @name $routeParams
 * @requires $route
 * @this
 *
 * @description
 * The `$routeParams` service allows you to retrieve the current set of route parameters.
 *
 * Requires the {@link ngRoute `ngRoute`} module to be installed.
 *
 * The route parameters are a combination of {@link ng.$location `$location`}'s
 * {@link ng.$location#search `search()`} and {@link ng.$location#path `path()`}.
 * The `path` parameters are extracted when the {@link ngRoute.$route `$route`} path is matched.
 *
 * In case of parameter name collision, `path` params take precedence over `search` params.
 *
 * The service guarantees that the identity of the `$routeParams` object will remain unchanged
 * (but its properties will likely change) even when a route change occurs.
 *
 * Note that the `$routeParams` are only updated *after* a route change completes successfully.
 * This means that you cannot rely on `$routeParams` being correct in route resolve functions.
 * Instead you can use `$route.current.params` to access the new route's parameters.
 *
 * @example
 * ```js
 *  // Given:
 *  // URL: http://server.com/index.html#/Chapter/1/Section/2?search=moby
 *  // Route: /Chapter/:chapterId/Section/:sectionId
 *  //
 *  // Then
 *  $routeParams ==> {chapterId:'1', sectionId:'2', search:'moby'}
 * ```
 */
function $RouteParamsProvider() {
  this.$get = function() { return {}; };
}

ngRouteModule.directive('ngView', ngViewFactory);
ngRouteModule.directive('ngView', ngViewFillContentFactory);


/**
 * @ngdoc directive
 * @name ngView
 * @restrict ECA
 *
 * @description
 * # Overview
 * `ngView` is a directive that complements the {@link ngRoute.$route $route} service by
 * including the rendered template of the current route into the main layout (`index.html`) file.
 * Every time the current route changes, the included view changes with it according to the
 * configuration of the `$route` service.
 *
 * Requires the {@link ngRoute `ngRoute`} module to be installed.
 *
 * @animations
 * | Animation                        | Occurs                              |
 * |----------------------------------|-------------------------------------|
 * | {@link ng.$animate#enter enter}  | when the new element is inserted to the DOM |
 * | {@link ng.$animate#leave leave}  | when the old element is removed from to the DOM  |
 *
 * The enter and leave animation occur concurrently.
 *
 * @scope
 * @priority 400
 * @param {string=} onload Expression to evaluate whenever the view updates.
 *
 * @param {string=} autoscroll Whether `ngView` should call {@link ng.$anchorScroll
 *                  $anchorScroll} to scroll the viewport after the view is updated.
 *
 *                  - If the attribute is not set, disable scrolling.
 *                  - If the attribute is set without value, enable scrolling.
 *                  - Otherwise enable scrolling only if the `autoscroll` attribute value evaluated
 *                    as an expression yields a truthy value.
 * @example
    <example name="ngView-directive" module="ngViewExample"
             deps="angular-route.js;angular-animate.js"
             animations="true" fixBase="true">
      <file name="index.html">
        <div ng-controller="MainCtrl as main">
          Choose:
          <a href="Book/Moby">Moby</a> |
          <a href="Book/Moby/ch/1">Moby: Ch1</a> |
          <a href="Book/Gatsby">Gatsby</a> |
          <a href="Book/Gatsby/ch/4?key=value">Gatsby: Ch4</a> |
          <a href="Book/Scarlet">Scarlet Letter</a><br/>

          <div class="view-animate-container">
            <div ng-view class="view-animate"></div>
          </div>
          <hr />

          <pre>$location.path() = {{main.$location.path()}}</pre>
          <pre>$route.current.templateUrl = {{main.$route.current.templateUrl}}</pre>
          <pre>$route.current.params = {{main.$route.current.params}}</pre>
          <pre>$routeParams = {{main.$routeParams}}</pre>
        </div>
      </file>

      <file name="book.html">
        <div>
          controller: {{book.name}}<br />
          Book Id: {{book.params.bookId}}<br />
        </div>
      </file>

      <file name="chapter.html">
        <div>
          controller: {{chapter.name}}<br />
          Book Id: {{chapter.params.bookId}}<br />
          Chapter Id: {{chapter.params.chapterId}}
        </div>
      </file>

      <file name="animations.css">
        .view-animate-container {
          position:relative;
          height:100px!important;
          background:white;
          border:1px solid black;
          height:40px;
          overflow:hidden;
        }

        .view-animate {
          padding:10px;
        }

        .view-animate.ng-enter, .view-animate.ng-leave {
          transition:all cubic-bezier(0.250, 0.460, 0.450, 0.940) 1.5s;

          display:block;
          width:100%;
          border-left:1px solid black;

          position:absolute;
          top:0;
          left:0;
          right:0;
          bottom:0;
          padding:10px;
        }

        .view-animate.ng-enter {
          left:100%;
        }
        .view-animate.ng-enter.ng-enter-active {
          left:0;
        }
        .view-animate.ng-leave.ng-leave-active {
          left:-100%;
        }
      </file>

      <file name="script.js">
        angular.module('ngViewExample', ['ngRoute', 'ngAnimate'])
          .config(['$routeProvider', '$locationProvider',
            function($routeProvider, $locationProvider) {
              $routeProvider
                .when('/Book/:bookId', {
                  templateUrl: 'book.html',
                  controller: 'BookCtrl',
                  controllerAs: 'book'
                })
                .when('/Book/:bookId/ch/:chapterId', {
                  templateUrl: 'chapter.html',
                  controller: 'ChapterCtrl',
                  controllerAs: 'chapter'
                });

              $locationProvider.html5Mode(true);
          }])
          .controller('MainCtrl', ['$route', '$routeParams', '$location',
            function MainCtrl($route, $routeParams, $location) {
              this.$route = $route;
              this.$location = $location;
              this.$routeParams = $routeParams;
          }])
          .controller('BookCtrl', ['$routeParams', function BookCtrl($routeParams) {
            this.name = 'BookCtrl';
            this.params = $routeParams;
          }])
          .controller('ChapterCtrl', ['$routeParams', function ChapterCtrl($routeParams) {
            this.name = 'ChapterCtrl';
            this.params = $routeParams;
          }]);

      </file>

      <file name="protractor.js" type="protractor">
        it('should load and compile correct template', function() {
          element(by.linkText('Moby: Ch1')).click();
          var content = element(by.css('[ng-view]')).getText();
          expect(content).toMatch(/controller: ChapterCtrl/);
          expect(content).toMatch(/Book Id: Moby/);
          expect(content).toMatch(/Chapter Id: 1/);

          element(by.partialLinkText('Scarlet')).click();

          content = element(by.css('[ng-view]')).getText();
          expect(content).toMatch(/controller: BookCtrl/);
          expect(content).toMatch(/Book Id: Scarlet/);
        });
      </file>
    </example>
 */


/**
 * @ngdoc event
 * @name ngView#$viewContentLoaded
 * @eventType emit on the current ngView scope
 * @description
 * Emitted every time the ngView content is reloaded.
 */
ngViewFactory.$inject = ['$route', '$anchorScroll', '$animate'];
function ngViewFactory($route, $anchorScroll, $animate) {
  return {
    restrict: 'ECA',
    terminal: true,
    priority: 400,
    transclude: 'element',
    link: function(scope, $element, attr, ctrl, $transclude) {
        var currentScope,
            currentElement,
            previousLeaveAnimation,
            autoScrollExp = attr.autoscroll,
            onloadExp = attr.onload || '';

        scope.$on('$routeChangeSuccess', update);
        update();

        function cleanupLastView() {
          if (previousLeaveAnimation) {
            $animate.cancel(previousLeaveAnimation);
            previousLeaveAnimation = null;
          }

          if (currentScope) {
            currentScope.$destroy();
            currentScope = null;
          }
          if (currentElement) {
            previousLeaveAnimation = $animate.leave(currentElement);
            previousLeaveAnimation.done(function(response) {
              if (response !== false) previousLeaveAnimation = null;
            });
            currentElement = null;
          }
        }

        function update() {
          var locals = $route.current && $route.current.locals,
              template = locals && locals.$template;

          if (angular.isDefined(template)) {
            var newScope = scope.$new();
            var current = $route.current;

            // Note: This will also link all children of ng-view that were contained in the original
            // html. If that content contains controllers, ... they could pollute/change the scope.
            // However, using ng-view on an element with additional content does not make sense...
            // Note: We can't remove them in the cloneAttchFn of $transclude as that
            // function is called before linking the content, which would apply child
            // directives to non existing elements.
            var clone = $transclude(newScope, function(clone) {
              $animate.enter(clone, null, currentElement || $element).done(function onNgViewEnter(response) {
                if (response !== false && angular.isDefined(autoScrollExp)
                  && (!autoScrollExp || scope.$eval(autoScrollExp))) {
                  $anchorScroll();
                }
              });
              cleanupLastView();
            });

            currentElement = clone;
            currentScope = current.scope = newScope;
            currentScope.$emit('$viewContentLoaded');
            currentScope.$eval(onloadExp);
          } else {
            cleanupLastView();
          }
        }
    }
  };
}

// This directive is called during the $transclude call of the first `ngView` directive.
// It will replace and compile the content of the element with the loaded template.
// We need this directive so that the element content is already filled when
// the link function of another directive on the same element as ngView
// is called.
ngViewFillContentFactory.$inject = ['$compile', '$controller', '$route'];
function ngViewFillContentFactory($compile, $controller, $route) {
  return {
    restrict: 'ECA',
    priority: -400,
    link: function(scope, $element) {
      var current = $route.current,
          locals = current.locals;

      $element.html(locals.$template);

      var link = $compile($element.contents());

      if (current.controller) {
        locals.$scope = scope;
        var controller = $controller(current.controller, locals);
        if (current.controllerAs) {
          scope[current.controllerAs] = controller;
        }
        $element.data('$ngControllerController', controller);
        $element.children().data('$ngControllerController', controller);
      }
      scope[current.resolveAs || '$resolve'] = locals;

      link(scope);
    }
  };
}


})(window, window.angular);

/**
 * State-based routing for AngularJS 1.x
 * NOTICE: This monolithic bundle also bundles the @uirouter/core code.
 *         This causes it to be incompatible with plugins that depend on @uirouter/core.
 *         We recommend switching to the ui-router-core.js and ui-router-angularjs.js bundles instead.
 *         For more information, see https://ui-router.github.io/blog/uirouter-for-angularjs-umd-bundles
 * @version v1.0.10
 * @link https://ui-router.github.io
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?e(exports,require("angular")):"function"==typeof define&&define.amd?define(["exports","angular"],e):e(t["@uirouter/angularjs"]={},t.angular)}(this,function(t,e){"use strict";function r(t){function e(r){return r.length>=n?t.apply(null,r):function(){return e(r.concat([].slice.apply(arguments)))}}var r=[].slice.apply(arguments,[1]),n=t.length;return e(r)}function n(){var t=arguments,e=t.length-1;return function(){for(var r=e,n=t[e].apply(this,arguments);r--;)n=t[r].call(this,n);return n}}function i(){for(var t=[],e=0;e<arguments.length;e++)t[e]=arguments[e];return n.apply(null,[].slice.call(arguments).reverse())}function o(t,e){return function(){for(var r=[],n=0;n<arguments.length;n++)r[n]=arguments[n];return t.apply(null,r)&&e.apply(null,r)}}function a(t,e){return function(){for(var r=[],n=0;n<arguments.length;n++)r[n]=arguments[n];return t.apply(null,r)||e.apply(null,r)}}function u(t,e){return function(r){return r[t].apply(r,e)}}function s(t){return function(e){for(var r=0;r<t.length;r++)if(t[r][0](e))return t[r][1](e)}}function c(t){if(te(t)&&t.length){var e=t.slice(0,-1),r=t.slice(-1);return!(e.filter(Ht(Zt)).length||r.filter(Ht(Kt)).length)}return Kt(t)}function f(t){return t}function l(){}function h(t,e,r,n,i){void 0===i&&(i=!1);var o=function(e){return t()[e].bind(r())},a=function(t){return function(){return e[t]=o(t),e[t].apply(null,arguments)}};return(n=n||Object.keys(t())).reduce(function(t,e){return t[e]=i?a(e):o(e),t},e)}function p(t,e){return-1!==t.indexOf(e)}function d(t,e){var r=t.indexOf(e);return r>=0&&t.splice(r,1),t}function v(t,e){return t.push(e),e}function m(t){for(var e=[],r=1;r<arguments.length;r++)e[r-1]=arguments[r];var n=e.concat({}).reverse(),i=he.apply(null,n);return he({},i,g(t||{},Object.keys(i)))}function y(t,e){var r=[];for(var n in t.path){if(t.path[n]!==e.path[n])break;r.push(t.path[n])}return r}function g(t,e){var r={};for(var n in t)-1!==e.indexOf(n)&&(r[n]=t[n]);return r}function _(t,e){return Object.keys(t).filter(Ht(ve(e))).reduce(function(e,r){return e[r]=t[r],e},{})}function w(t,e){return b(t,jt(e))}function $(t,e){var r=te(t),n=r?[]:{},i=r?function(t){return n.push(t)}:function(t,e){return n[e]=t};return le(t,function(t,r){e(t,r)&&i(t,r)}),n}function S(t,e){var r;return le(t,function(t,n){r||e(t,n)&&(r=t)}),r}function b(t,e){var r=te(t)?[]:{};return le(t,function(t,n){return r[n]=e(t,n)}),r}function R(t,e){return t.push(e),t}function E(t,e){return void 0===e&&(e="assert failure"),function(r){var n=t(r);if(!n)throw new Error(Kt(e)?e(r):e);return n}}function T(){for(var t=[],e=0;e<arguments.length;e++)t[e]=arguments[e];if(0===t.length)return[];var r,n=t.reduce(function(t,e){return Math.min(e.length,t)},9007199254740991),i=[];for(r=0;r<n;r++)switch(t.length){case 1:i.push([t[0][r]]);break;case 2:i.push([t[0][r],t[1][r]]);break;case 3:i.push([t[0][r],t[1][r],t[2][r]]);break;case 4:i.push([t[0][r],t[1][r],t[2][r],t[3][r]]);break;default:i.push(t.map(function(t){return t[r]}))}return i}function C(t,e){var r,n;if(te(e)&&(r=e[0],n=e[1]),!Zt(r))throw new Error("invalid parameters to applyPairs");return t[r]=n,t}function P(t){return t.length&&t[t.length-1]||void 0}function k(t,e){return e&&Object.keys(e).forEach(function(t){return delete e[t]}),e||(e={}),he(e,t)}function O(t){for(var e=1;e<arguments.length;e++){var r=arguments[e];if(r)for(var n=Object.keys(r),i=0;i<n.length;i++)t[n[i]]=r[n[i]]}return t}function x(t,e){if(t===e)return!0;if(null===t||null===e)return!1;if(t!==t&&e!==e)return!0;var r=typeof t;if(r!==typeof e||"object"!==r)return!1;var n=[t,e];if(qt(te)(n))return I(t,e);if(qt(ee)(n))return t.getTime()===e.getTime();if(qt(re)(n))return t.toString()===e.toString();if(qt(Kt)(n))return!0;if([Kt,te,ee,re].map(Dt).reduce(function(t,e){return t||!!e(n)},!1))return!1;var i,o={};for(i in t){if(!x(t[i],e[i]))return!1;o[i]=!0}for(i in e)if(!o[i])return!1;return!0}function I(t,e){return t.length===e.length&&T(t,e).reduce(function(t,e){return t&&x(e[0],e[1])},!0)}function j(t){if(!t)return"ui-view (defunct)";var e=t.creationContext?t.creationContext.name||"(root)":"(none)";return"[ui-view#"+t.id+" "+t.$type+":"+t.fqn+" ("+t.name+"@"+e+")]"}function V(e){return Yt(e)?t.Category[e]:t.Category[t.Category[e]]}function A(t,e){var r=Zt(e)?[e]:e;return!!(Kt(r)?r:function(t){for(var e=r,n=0;n<e.length;n++){var i=new Lt(e[n]);if(i&&i.matches(t.name)||!i&&e[n]===t.name)return!0}return!1})(t)}function H(t,e,r){function n(t,n,a){void 0===a&&(a={});var u=new Je(e,r,n,t,o,a);return i.push(u),u.deregister.bind(u)}var i=(t._registeredHooks=t._registeredHooks||{})[r.name]=[],o=me(i);return t[r.name]=n,n}function q(t){return void 0===t&&(t=!1),function(e,r){var n=t?-1:1,i=(e.node.state.path.length-r.node.state.path.length)*n;return 0!==i?i:r.hook.priority-e.hook.priority}}function D(t,e){function r(t){return te(t)?t:zt(t)?[t]:[]}function n(t){switch(t.length){case 0:return;case 1:return"auto"===e?t[0]:t;default:return t}}function i(t,e){return function(i){if(te(i)&&0===i.length)return i;var o=b(r(i),t);return!0===e?0===$(o,function(t){return!t}).length:n(o)}}function o(t){return function(e,n){var i=r(e),o=r(n);if(i.length!==o.length)return!1;for(var a=0;a<i.length;a++)if(!t(i[a],o[a]))return!1;return!0}}var a=this;["encode","decode","equals","$normalize"].forEach(function(e){var r=t[e].bind(t),n="equals"===e?o:i;a[e]=n(r)}),he(this,{dynamic:t.dynamic,name:t.name,pattern:t.pattern,inherit:t.inherit,is:i(t.is.bind(t),!0),$arrayMode:e})}function F(t){function e(){return t.value}return t=Ze(t)&&{value:t}||t,e.__cacheable=!0,he(t,{$$fn:c(t.value)?t.value:e})}function N(e,r,n,i,o){if(e.type&&r&&"string"!==r.name)throw new Error("Param '"+i+"' has two type configurations.");if(e.type&&r&&"string"===r.name&&o.type(e.type))return o.type(e.type);if(r)return r;if(!e.type){var a=n===t.DefType.CONFIG?"any":n===t.DefType.PATH?"path":n===t.DefType.SEARCH?"query":"string";return o.type(a)}return e.type instanceof Ke?e.type:o.type(e.type)}function U(t,e,r){var n=t.squash;if(!e||!1===n)return!1;if(!zt(n)||null==n)return r;if(!0===n||Zt(n))return n;throw new Error("Invalid squash policy: '"+n+"'. Valid policies: false, true, or arbitrary string")}function L(t,e,r,n){var i,o,a=[{from:"",to:r||e?void 0:""},{from:null,to:r||e?void 0:""}];return i=te(t.replace)?t.replace:[],Zt(n)&&i.push({from:n,to:void 0}),o=b(i,jt("from")),$(a,function(t){return-1===o.indexOf(t.from)}).concat(i)}function M(t,e){return e.length<=t?e:e.substr(0,t-3)+"..."}function B(t,e){for(;e.length<t;)e+=" ";return e}function G(t){return t.replace(/^([A-Z])/,function(t){return t.toLowerCase()}).replace(/([A-Z])/g,function(t){return"-"+t.toLowerCase()})}function W(t){var e=z(t),r=e.match(/^(function [^ ]+\([^)]*\))/),n=r?r[1]:e,i=t.name||"";return i&&n.match(/function \(/)?"function "+i+n.substr(9):n}function z(t){var e=te(t)?t.slice(-1)[0]:t;return e&&e.toString()||"undefined"}function J(t){function e(t){if(Xt(t)){if(-1!==r.indexOf(t))return"[circular ref]";r.push(t)}return dr(t)}var r=[];return JSON.stringify(t,function(t,r){return e(r)}).replace(/\\"/g,'"')}function Q(t){var e=new RegExp("("+t+")","g");return function(t){return t.split(e).filter(f)}}function K(t,e){return Zt(P(t))&&Zt(e)?t.slice(0,-1).concat(P(t)+e):R(t,e)}function Y(t){return t.name}function Z(t){return t.self.$$state=function(){return t},t.self}function X(t){return t.parent&&t.parent.data&&(t.data=t.self.data=de(t.parent.data,t.data)),t.data}function tt(t){return t.parent?t.parent.path.concat(t):[t]}function et(t){var e=t.parent?he({},t.parent.includes):{};return e[t.name]=!0,e}function rt(t){var e=function(t){var e=ae.$injector;return t.$inject||e&&e.annotate(t,e.strictDi)||"deferred"},r=function(t){return t.provide||t.token},n=s([[jt("resolveFn"),function(t){return new nr(r(t),t.resolveFn,t.deps,t.policy)}],[jt("useFactory"),function(t){return new nr(r(t),t.useFactory,t.deps||t.dependencies,t.policy)}],[jt("useClass"),function(t){return new nr(r(t),function(){return new t.useClass},[],t.policy)}],[jt("useValue"),function(t){return new nr(r(t),function(){return t.useValue},[],t.policy,t.useValue)}],[jt("useExisting"),function(t){return new nr(r(t),f,[t.useExisting],t.policy)}]]),o=s([[i(jt("val"),Zt),function(t){return new nr(t.token,f,[t.val],t.policy)}],[i(jt("val"),te),function(t){return new nr(t.token,P(t.val),t.val.slice(0,-1),t.policy)}],[i(jt("val"),Kt),function(t){return new nr(t.token,t.val,e(t.val),t.policy)}]]),a=s([[Ft(nr),function(t){return t}],[function(t){return!(!t.token||!t.resolveFn)},n],[function(t){return!(!t.provide&&!t.token||!(t.useValue||t.useFactory||t.useExisting||t.useClass))},n],[function(t){return!!(t&&t.val&&(Zt(t.val)||te(t.val)||Kt(t.val)))},o],[Ut(!0),function(t){throw new Error("Invalid resolve value: "+J(t))}]]),u=t.resolve;return(te(u)?u:function(t,e){return Object.keys(t||{}).map(function(r){return{token:r,val:t[r],deps:void 0,policy:e[r]}})}(u,t.resolvePolicy||{})).map(a)}function nt(t,e){var r=["",""],n=t.replace(/[\\\[\]\^$*+?.()|{}]/g,"\\$&");if(!e)return n;switch(e.squash){case!1:r=["(",")"+(e.isOptional?"?":"")];break;case!0:n=n.replace(/\/$/,""),r=["(?:/(",")|/)?"];break;default:r=["("+e.squash+"|",")?"]}return n+r[0]+e.type.pattern.source+r[1]}function it(t,e,r,n){return"/"===n?t:e?yr(n)+t:r?n.slice(1)+t:t}function ot(t){if(!(Kt(t)||Zt(t)||Ft(Ge)(t)||Ge.isDef(t)))throw new Error("'handler' must be a string, function, TargetState, or have a state: 'newtarget' property");return Kt(t)?t:Ut(t)}function at(t){t.addResolvable({token:tn,deps:[],resolveFn:function(){return t.router},data:t.router},""),t.addResolvable({token:hr,deps:[],resolveFn:function(){return t},data:t},""),t.addResolvable({token:"$transition$",deps:[],resolveFn:function(){return t},data:t},""),t.addResolvable({token:"$stateParams",deps:[],resolveFn:function(){return t.params()},data:t.params()},""),t.entering().forEach(function(e){t.addResolvable({token:"$state$",deps:[],resolveFn:function(){return e},data:e},e)})}function ut(t){return function(e,r){return(0,r.$$state()[t])(e,r)}}function st(t,e){var r=e.$$state().lazyLoad,n=r._promise;if(!n){n=r._promise=ae.$q.when(r(t,e)).then(function(e){return e&&Array.isArray(e.states)&&e.states.forEach(function(e){return t.router.stateRegistry.register(e)}),e}).then(function(t){return delete e.lazyLoad,delete e.$$state().lazyLoad,delete r._promise,t},function(t){return delete r._promise,ae.$q.reject(t)})}return n}function ct(t){var e=t._ignoredReason();if(e){Be.traceTransitionIgnored(t);var r=t.router.globals.transition;return"SameAsCurrent"===e&&r&&r.abort(),He.ignored().toPromise()}}function ft(t){if(!t.valid())throw new Error(t.error())}function lt(t){var e=function(t){return t||""},r=gr(t).map(e),n=r[0],i=r[1],o=_r(n).map(e);return{path:o[0],search:o[1],hash:i,url:t}}function ht(t,e,r,n){return function(i){var o=i.locationService=new r(i),a=i.locationConfig=new n(i,e);return{name:t,service:o,configuration:a,dispose:function(t){t.dispose(o),t.dispose(a)}}}}function pt(t){return ae.$injector=An,ae.$q=xn,{name:"vanilla.services",$q:xn,$injector:An,dispose:function(){return null}}}function dt(){var t=null;return function(e,r){return t=t||ae.$injector.get("$templateFactory"),[new ei(e,r,t)]}}function vt(t){if(!t.parent)return{};var e=["controller","controllerProvider","controllerAs","resolveAs"],r=["component","bindings","componentProvider"],n=["templateProvider","templateUrl","template","notify","async"].concat(e),i=r.concat(n);if(zt(t.views)&&Xn(i,t))throw new Error("State '"+t.name+"' has a 'views' object. It cannot also have \"view properties\" at the state level.  Move the following properties into a view (in the 'views' object):  "+i.filter(function(e){return zt(t[e])}).join(", "));var o={},a=t.views||{$default:g(t,i)};return le(a,function(e,i){if(i=i||"$default",Zt(e)&&(e={component:e}),e=he({},e),Xn(r,e)&&Xn(n,e))throw new Error("Cannot combine: "+r.join("|")+" with: "+n.join("|")+" in stateview: '"+i+"@"+t.name+"'");e.resolveAs=e.resolveAs||"$resolve",e.$type="ng1",e.$context=t,e.$name=i;var a=Br.normalizeUIViewTarget(e.$context,e.$name);e.$uiViewName=a.uiViewName,e.$uiViewContextAnchor=a.uiViewContextAnchor,o[i]=e}),o}function mt(t){var e=ae.$injector.get(t+"Directive");if(!e||!e.length)throw new Error("Unable to find component named '"+t+"'");return e.map(ni).reduce(Re,[])}function yt(t){function e(t,e,n,i,o,a){return r._runtimeServices(i,t,n,e),delete di.router,delete di.$get,di}(di=this.router=new tn).stateProvider=new oi(di.stateRegistry,di.stateService),di.stateRegistry.decorator("views",vt),di.stateRegistry.decorator("onExit",ai("onExit")),di.stateRegistry.decorator("onRetain",ai("onRetain")),di.stateRegistry.decorator("onEnter",ai("onEnter")),di.viewService._pluginapi._viewConfigFactory("ng1",dt());var r=di.locationService=di.locationConfig=new ui(t);return ui.monkeyPatchPathParameterType(di),di.router=di,di.$get=e,e.$inject=["$location","$browser","$sniffer","$rootScope","$http","$templateCache"],di}function gt(t,e,r){ae.$injector=t,ae.$q=e,r.stateRegistry.get().map(function(t){return t.$$state().resolvables}).reduce(Re,[]).filter(function(t){return"deferred"===t.deps}).forEach(function(e){return e.deps=t.annotate(e.resolveFn,t.strictDi)})}function _t(t){t.$watch(function(){Be.approximateDigests++})}function wt(t){var e,r=t.match(/^\s*({[^}]*})\s*$/);if(r&&(t="("+r[1]+")"),!(e=t.replace(/\n/g," ").match(/^\s*([^(]*?)\s*(\((.*)\))?\s*$/))||4!==e.length)throw new Error("Invalid state ref '"+t+"'");return{state:e[1]||null,paramExpr:e[3]||null}}function $t(t){var e=t.parent().inheritedData("$uiView"),r=At("$cfg.path")(e);return r?P(r).state.name:void 0}function St(t,e,r){var n=r.uiState||t.current.name,i=he(Et(e,t),r.uiStateOpts||{}),o=t.href(n,r.uiStateParams,i);return{uiState:n,uiStateParams:r.uiStateParams,uiStateOpts:i,href:o}}function bt(t){var e="[object SVGAnimatedString]"===Object.prototype.toString.call(t.prop("href")),r="FORM"===t[0].nodeName;return{attr:r?"action":e?"xlink:href":"href",isAnchor:"A"===t.prop("tagName").toUpperCase(),clickable:!r}}function Rt(t,e,r,n,i){return function(o){var a=o.which||o.button,u=i();if(!(a>1||o.ctrlKey||o.metaKey||o.shiftKey||t.attr("target"))){var s=r(function(){e.go(u.uiState,u.uiStateParams,u.uiStateOpts)});o.preventDefault();var c=n.isAnchor&&!u.href?1:0;o.preventDefault=function(){c--<=0&&r.cancel(s)}}}}function Et(t,e){return{relative:$t(t)||e.$current,inherit:!0,source:"sref"}}function Tt(t,e,r,n){var i;n&&(i=n.events),te(i)||(i=["click"]);for(var o=t.on?"on":"bind",a=0,u=i;a<u.length;a++){var s=u[a];t[o](s,r)}e.$on("$destroy",function(){for(var e=t.off?"off":"unbind",n=0,o=i;n<o.length;n++){var a=o[n];t[e](a,r)}})}function Ct(t){var e=function(e,r,n){return t.is(e,r,n)};return e.$stateful=!0,e}function Pt(t){var e=function(e,r,n){return t.includes(e,r,n)};return e.$stateful=!0,e}function kt(t,r,n,i,o,a){var u=At("viewDecl.controllerAs"),s=At("viewDecl.resolveAs");return{restrict:"ECA",priority:-400,compile:function(i){var a=i.html();return i.empty(),function(i,c){var f=c.data("$uiView");if(!f)return c.html(a),void t(c.contents())(i);var l=f.$cfg||{viewDecl:{},getTemplate:e.noop},h=l.path&&new cr(l.path);c.html(l.getTemplate(c,h)||a),Be.traceUIViewFill(f.$uiView,c.html());var p=t(c.contents()),d=l.controller,v=u(l),m=s(l),y=h&&yi(h);if(i[m]=y,d){var g=r(d,he({},y,{$scope:i,$element:c}));v&&(i[v]=g,i[v][m]=y),c.data("$ngControllerController",g),c.children().data("$ngControllerController",g),Ot(o,n,g,i,l)}if(Zt(l.viewDecl.component))var _=l.viewDecl.component,w=G(_),$=new RegExp("^(x-|data-)?"+w+"$","i"),S=i.$watch(function(){var t=[].slice.call(c[0].children).filter(function(t){return t&&t.tagName&&$.exec(t.tagName)});return t&&It.element(t).data("$"+_+"Controller")},function(t){t&&(Ot(o,n,t,i,l),S())});p(i)}}}}function Ot(t,e,r,n,i){!Kt(r.$onInit)||i.viewDecl.component&&$i||r.$onInit();var o=P(i.path).state.self,a={bind:r};if(Kt(r.uiOnParamsChanged)){var u=new cr(i.path).getResolvable("$transition$").data;n.$on("$destroy",e.onSuccess({},function(t){if(t!==u&&-1===t.exiting().indexOf(o)){var e=t.params("to"),n=t.params("from"),i=t.treeChanges().to.map(function(t){return t.paramSchema}).reduce(Re,[]),a=t.treeChanges().from.map(function(t){return t.paramSchema}).reduce(Re,[]),s=i.filter(function(t){var r=a.indexOf(t);return-1===r||!a[r].type.equals(e[t.id],n[t.id])});if(s.length){var c=s.map(function(t){return t.id}),f=$(e,function(t,e){return-1!==c.indexOf(e)});r.uiOnParamsChanged(f,t)}}},a))}if(Kt(r.uiCanExit)){var s=Si++,c=function(t){return!!t&&(t._uiCanExitIds&&!0===t._uiCanExitIds[s]||c(t.redirectedFrom()))},f={exiting:o.name};n.$on("$destroy",e.onBefore(f,function(e){var n,i=e._uiCanExitIds=e._uiCanExitIds||{};return c(e)||(n=t.when(r.uiCanExit(e))).then(function(t){return i[s]=!1!==t}),n},a))}}var xt=angular,It=e&&e.module?e:xt,jt=function(t){return function(e){return e&&e[t]}},Vt=r(function(t,e,r){return r&&r[t]===e}),At=function(t){return i.apply(null,t.split(".").map(jt))},Ht=function(t){return function(){for(var e=[],r=0;r<arguments.length;r++)e[r]=arguments[r];return!t.apply(null,e)}},qt=function(t){return function(e){return e.reduce(function(e,r){return e&&!!t(r)},!0)}},Dt=function(t){return function(e){return e.reduce(function(e,r){return e||!!t(r)},!1)}},Ft=function(t){return function(e){return null!=e&&e.constructor===t||e instanceof t}},Nt=function(t){return function(e){return t===e}},Ut=function(t){return function(){return t}},Lt=function(){function t(t){this.text=t,this.glob=t.split(".");var e=this.text.split(".").map(function(t){return"**"===t?"(?:|(?:\\.[^.]*)*)":"*"===t?"\\.[^.]*":"\\."+t}).join("");this.regexp=new RegExp("^"+e+"$")}return t.prototype.matches=function(t){return this.regexp.test("."+t)},t.is=function(t){return!!/[!,*]+/.exec(t)},t.fromString=function(e){return t.is(e)?new t(e):null},t}(),Mt=function(){function t(e){return t.create(e||{})}return t.create=function(e){e=t.isStateClass(e)?new e:e;var r=de(de(e,t.prototype));return e.$$state=function(){return r},r.self=e,r.__stateObjectCache={nameGlob:Lt.fromString(r.name)},r},t.prototype.is=function(t){return this===t||this.self===t||this.fqn()===t},t.prototype.fqn=function(){if(!(this.parent&&this.parent instanceof this.constructor))return this.name;var t=this.parent.fqn();return t?t+"."+this.name:this.name},t.prototype.root=function(){return this.parent&&this.parent.root()||this},t.prototype.parameters=function(t){return((t=m(t,{inherit:!0,matchingKeys:null})).inherit&&this.parent&&this.parent.parameters()||[]).concat($e(this.params)).filter(function(e){return!t.matchingKeys||t.matchingKeys.hasOwnProperty(e.id)})},t.prototype.parameter=function(t,e){return void 0===e&&(e={}),this.url&&this.url.parameter(t,e)||S($e(this.params),Vt("id",t))||e.inherit&&this.parent&&this.parent.parameter(t)},t.prototype.toString=function(){return this.fqn()},t.isStateClass=function(t){return Kt(t)&&!0===t.__uiRouterState},t.isState=function(t){return Xt(t.__stateObjectCache)},t}(),Bt=Object.prototype.toString,Gt=function(t){return function(e){return typeof e===t}},Wt=Gt("undefined"),zt=Ht(Wt),Jt=function(t){return null===t},Qt=a(Jt,Wt),Kt=Gt("function"),Yt=Gt("number"),Zt=Gt("string"),Xt=function(t){return null!==t&&"object"==typeof t},te=Array.isArray,ee=function(t){return"[object Date]"===Bt.call(t)},re=function(t){return"[object RegExp]"===Bt.call(t)},ne=Mt.isState,ie=o(Xt,i(jt("then"),Kt)),oe=function(t){return function(){throw new Error(t+"(): No coreservices implementation for UI-Router is loaded.")}},ae={$q:void 0,$injector:void 0},ue="object"==typeof self&&self.self===self&&self||"object"==typeof global&&global.global===global&&global||void 0,se=ue.angular||{},ce=se.fromJson||JSON.parse.bind(JSON),fe=se.toJson||JSON.stringify.bind(JSON),le=se.forEach||function(t,e,r){if(te(t))return t.forEach(e,r);Object.keys(t).forEach(function(r){return e(t[r],r)})},he=Object.assign||O,pe=se.equals||x,de=function(t,e){return he(Object.create(t),e)},ve=r(p),me=r(d),ye=r(v),ge=function(t){return t.slice().forEach(function(e){"function"==typeof e&&e(),me(t,e)})},_e=function(t,e){return he(t,e)},we=b,$e=function(t){return Object.keys(t).map(function(e){return t[e]})},Se=function(t,e){return t&&e},be=function(t,e){return t||e},Re=function(t,e){return t.concat(e)},Ee=function(t,e){return te(e)?t.concat(e.reduce(Ee,[])):R(t,e)},Te=function(t,e){return ve(t,e)?t:R(t,e)},Ce=function(t){return t.reduce(Re,[])},Pe=function(t){return t.reduce(Ee,[])},ke=E,Oe=E,xe=function(t){return Object.keys(t).map(function(e){return[e,t[e]]})},Ie=function(t){return t.catch(function(t){return 0})&&t},je=function(t){return Ie(ae.$q.reject(t))},Ve=function(){function t(t,e){void 0===t&&(t=[]),void 0===e&&(e=null),this._items=t,this._limit=e}return t.prototype.enqueue=function(t){var e=this._items;return e.push(t),this._limit&&e.length>this._limit&&e.shift(),t},t.prototype.dequeue=function(){if(this.size())return this._items.splice(0,1)[0]},t.prototype.clear=function(){var t=this._items;return this._items=[],t},t.prototype.size=function(){return this._items.length},t.prototype.remove=function(t){var e=this._items.indexOf(t);return e>-1&&this._items.splice(e,1)[0]},t.prototype.peekTail=function(){return this._items[this._items.length-1]},t.prototype.peekHead=function(){if(this.size())return this._items[0]},t}();!function(t){t[t.SUPERSEDED=2]="SUPERSEDED",t[t.ABORTED=3]="ABORTED",t[t.INVALID=4]="INVALID",t[t.IGNORED=5]="IGNORED",t[t.ERROR=6]="ERROR"}(t.RejectType||(t.RejectType={}));var Ae=0,He=function(){function e(t,e,r){this.$id=Ae++,this.type=t,this.message=e,this.detail=r}return e.prototype.toString=function(){var t=function(t){return t&&t.toString!==Object.prototype.toString?t.toString():J(t)}(this.detail),e=this;return"Transition Rejection($id: "+e.$id+" type: "+e.type+", message: "+e.message+", detail: "+t+")"},e.prototype.toPromise=function(){return he(je(this),{_transitionRejection:this})},e.isRejectionPromise=function(t){return t&&"function"==typeof t.then&&Ft(e)(t._transitionRejection)},e.superseded=function(r,n){var i=new e(t.RejectType.SUPERSEDED,"The transition has been superseded by a different transition",r);return n&&n.redirected&&(i.redirected=!0),i},e.redirected=function(t){return e.superseded(t,{redirected:!0})},e.invalid=function(r){return new e(t.RejectType.INVALID,"This transition is invalid",r)},e.ignored=function(r){return new e(t.RejectType.IGNORED,"The transition was ignored",r)},e.aborted=function(r){return new e(t.RejectType.ABORTED,"The transition has been aborted",r)},e.errored=function(r){return new e(t.RejectType.ERROR,"The transition errored",r)},e.normalize=function(t){return Ft(e)(t)?t:e.errored(t)},e}(),qe=function(t){var e=t.viewDecl,r=e.$context.name||"(root)";return"[View#"+t.$id+" from '"+r+"' state]: target ui-view: '"+e.$uiViewName+"@"+e.$uiViewContextAnchor+"'"},De=Function.prototype.bind.call(console.log,console),Fe=Kt(console.table)?console.table.bind(console):De.bind(console);!function(t){t[t.RESOLVE=0]="RESOLVE",t[t.TRANSITION=1]="TRANSITION",t[t.HOOK=2]="HOOK",t[t.UIVIEW=3]="UIVIEW",t[t.VIEWCONFIG=4]="VIEWCONFIG"}(t.Category||(t.Category={}));var Ne=At("$id"),Ue=At("router.$id"),Le=function(t){return"Transition #"+Ne(t)+"-"+Ue(t)},Me=function(){function e(){this._enabled={},this.approximateDigests=0}return e.prototype._set=function(e,r){var n=this;r.length||(r=Object.keys(t.Category).map(function(t){return parseInt(t,10)}).filter(function(t){return!isNaN(t)}).map(function(e){return t.Category[e]})),r.map(V).forEach(function(t){return n._enabled[t]=e})},e.prototype.enable=function(){for(var t=[],e=0;e<arguments.length;e++)t[e]=arguments[e];this._set(!0,t)},e.prototype.disable=function(){for(var t=[],e=0;e<arguments.length;e++)t[e]=arguments[e];this._set(!1,t)},e.prototype.enabled=function(t){return!!this._enabled[V(t)]},e.prototype.traceTransitionStart=function(e){this.enabled(t.Category.TRANSITION)&&console.log(Le(e)+": Started  -> "+J(e))},e.prototype.traceTransitionIgnored=function(e){this.enabled(t.Category.TRANSITION)&&console.log(Le(e)+": Ignored  <> "+J(e))},e.prototype.traceHookInvocation=function(e,r,n){if(this.enabled(t.Category.HOOK)){var i=At("traceData.hookType")(n)||"internal",o=At("traceData.context.state.name")(n)||At("traceData.context")(n)||"unknown",a=W(e.registeredHook.callback);console.log(Le(r)+":   Hook -> "+i+" context: "+o+", "+M(200,a))}},e.prototype.traceHookResult=function(e,r,n){this.enabled(t.Category.HOOK)&&console.log(Le(r)+":   <- Hook returned: "+M(200,J(e)))},e.prototype.traceResolvePath=function(e,r,n){this.enabled(t.Category.RESOLVE)&&console.log(Le(n)+":         Resolving "+e+" ("+r+")")},e.prototype.traceResolvableResolved=function(e,r){this.enabled(t.Category.RESOLVE)&&console.log(Le(r)+":               <- Resolved  "+e+" to: "+M(200,J(e.data)))},e.prototype.traceError=function(e,r){this.enabled(t.Category.TRANSITION)&&console.log(Le(r)+": <- Rejected "+J(r)+", reason: "+e)},e.prototype.traceSuccess=function(e,r){this.enabled(t.Category.TRANSITION)&&console.log(Le(r)+": <- Success  "+J(r)+", final state: "+e.name)},e.prototype.traceUIViewEvent=function(e,r,n){void 0===n&&(n=""),this.enabled(t.Category.UIVIEW)&&console.log("ui-view: "+B(30,e)+" "+j(r)+n)},e.prototype.traceUIViewConfigUpdated=function(e,r){this.enabled(t.Category.UIVIEW)&&this.traceUIViewEvent("Updating",e," with ViewConfig from context='"+r+"'")},e.prototype.traceUIViewFill=function(e,r){this.enabled(t.Category.UIVIEW)&&this.traceUIViewEvent("Fill",e," with: "+M(200,r))},e.prototype.traceViewSync=function(e){if(this.enabled(t.Category.VIEWCONFIG)){var r=e.map(function(t){var e=t[0],r=t[1];return{"ui-view fqn":e.$type+":"+e.fqn,"state: view name":r&&r.viewDecl.$context.name+": "+r.viewDecl.$name+" ("+r.viewDecl.$type+")"}}).sort(function(t,e){return t["ui-view fqn"].localeCompare(e["ui-view fqn"])});Fe(r)}},e.prototype.traceViewServiceEvent=function(e,r){this.enabled(t.Category.VIEWCONFIG)&&console.log("VIEWCONFIG: "+e+" "+qe(r))},e.prototype.traceViewServiceUIViewEvent=function(e,r){this.enabled(t.Category.VIEWCONFIG)&&console.log("VIEWCONFIG: "+e+" "+j(r))},e}(),Be=new Me;!function(t){t[t.CREATE=0]="CREATE",t[t.BEFORE=1]="BEFORE",t[t.RUN=2]="RUN",t[t.SUCCESS=3]="SUCCESS",t[t.ERROR=4]="ERROR"}(t.TransitionHookPhase||(t.TransitionHookPhase={})),function(t){t[t.TRANSITION=0]="TRANSITION",t[t.STATE=1]="STATE"}(t.TransitionHookScope||(t.TransitionHookScope={}));var Ge=function(){function t(t,e,r,n){this._stateRegistry=t,this._identifier=e,this._identifier=e,this._params=he({},r||{}),this._options=he({},n||{}),this._definition=t.matcher.find(e,this._options.relative)}return t.prototype.name=function(){return this._definition&&this._definition.name||this._identifier},t.prototype.identifier=function(){return this._identifier},t.prototype.params=function(){return this._params},t.prototype.$state=function(){return this._definition},t.prototype.state=function(){return this._definition&&this._definition.self},t.prototype.options=function(){return this._options},t.prototype.exists=function(){return!(!this._definition||!this._definition.self)},t.prototype.valid=function(){return!this.error()},t.prototype.error=function(){var t=this.options().relative;if(!this._definition&&t){var e=t.name?t.name:t;return"Could not resolve '"+this.name()+"' from state '"+e+"'"}return this._definition?this._definition.self?void 0:"State '"+this.name()+"' has an invalid definition":"No such state '"+this.name()+"'"},t.prototype.toString=function(){return"'"+this.name()+"'"+J(this.params())},t.prototype.withState=function(e){return new t(this._stateRegistry,e,this._params,this._options)},t.prototype.withParams=function(e,r){void 0===r&&(r=!1);var n=r?e:he({},this._params,e);return new t(this._stateRegistry,this._identifier,n,this._options)},t.prototype.withOptions=function(e,r){void 0===r&&(r=!1);var n=r?e:he({},this._options,e);return new t(this._stateRegistry,this._identifier,this._params,n)},t.isDef=function(t){return t&&t.state&&(Zt(t.state)||Zt(t.state.name))},t}(),We={current:l,transition:null,traceData:{},bind:null},ze=function(){function e(e,r,n,i){var o=this;this.transition=e,this.stateContext=r,this.registeredHook=n,this.options=i,this.isSuperseded=function(){return o.type.hookPhase===t.TransitionHookPhase.RUN&&!o.options.transition.isActive()},this.options=m(i,We),this.type=n.eventType}return e.prototype.logError=function(t){this.transition.router.stateService.defaultErrorHandler()(t)},e.prototype.invokeHook=function(){var t=this,e=this.registeredHook;if(!e._deregistered){var r=this.getNotCurrentRejection();if(r)return r;var n=this.options;Be.traceHookInvocation(this,this.transition,n);var i=function(r){return e.eventType.getErrorHandler(t)(r)},o=function(r){return e.eventType.getResultHandler(t)(r)};try{var a=e.callback.call(n.bind,t.transition,t.stateContext);return!this.type.synchronous&&ie(a)?a.catch(function(t){return He.normalize(t).toPromise()}).then(o,i):o(a)}catch(t){return i(He.normalize(t))}finally{e.invokeLimit&&++e.invokeCount>=e.invokeLimit&&e.deregister()}}},e.prototype.handleHookResult=function(t){var e=this,r=this.getNotCurrentRejection();return r||(ie(t)?t.then(function(t){return e.handleHookResult(t)}):(Be.traceHookResult(t,this.transition,this.options),!1===t?He.aborted("Hook aborted transition").toPromise():Ft(Ge)(t)?He.redirected(t).toPromise():void 0))},e.prototype.getNotCurrentRejection=function(){var t=this.transition.router;return t._disposed?He.aborted("UIRouter instance #"+t.$id+" has been stopped (disposed)").toPromise():this.transition._aborted?He.aborted().toPromise():this.isSuperseded()?He.superseded(this.options.current()).toPromise():void 0},e.prototype.toString=function(){var t=this,e=t.options,r=t.registeredHook;return(At("traceData.hookType")(e)||"internal")+" context: "+(At("traceData.context.state.name")(e)||At("traceData.context")(e)||"unknown")+", "+M(200,z(r.callback))},e.chain=function(t,e){return t.reduce(function(t,e){return t.then(function(){return e.invokeHook()})},e||ae.$q.when())},e.invokeHooks=function(t,r){for(var n=0;n<t.length;n++){var i=t[n].invokeHook();if(ie(i)){var o=t.slice(n+1);return e.chain(o,i).then(r)}}return r()},e.runAllHooks=function(t){t.forEach(function(t){return t.invokeHook()})},e.HANDLE_RESULT=function(t){return function(e){return t.handleHookResult(e)}},e.LOG_REJECTED_RESULT=function(t){return function(e){ie(e)&&e.catch(function(e){return t.logError(He.normalize(e))})}},e.LOG_ERROR=function(t){return function(e){return t.logError(e)}},e.REJECT_ERROR=function(t){return function(t){return je(t)}},e.THROW_ERROR=function(t){return function(t){throw t}},e}(),Je=function(){function e(t,e,r,n,i,o){void 0===o&&(o={}),this.tranSvc=t,this.eventType=e,this.callback=r,this.matchCriteria=n,this.removeHookFromRegistry=i,this.invokeCount=0,this._deregistered=!1,this.priority=o.priority||0,this.bind=o.bind||null,this.invokeLimit=o.invokeLimit}return e.prototype._matchingNodes=function(t,e){if(!0===e)return t;var r=t.filter(function(t){return A(t.state,e)});return r.length?r:null},e.prototype._getDefaultMatchCriteria=function(){return b(this.tranSvc._pluginapi._getPathTypes(),function(){return!0})},e.prototype._getMatchingNodes=function(e){var r=this,n=he(this._getDefaultMatchCriteria(),this.matchCriteria);return $e(this.tranSvc._pluginapi._getPathTypes()).reduce(function(i,o){var a=o.scope===t.TransitionHookScope.STATE,u=e[o.name]||[],s=a?u:[P(u)];return i[o.name]=r._matchingNodes(s,n[o.name]),i},{})},e.prototype.matches=function(t){var e=this._getMatchingNodes(t);return $e(e).every(f)?e:null},e.prototype.deregister=function(){this.removeHookFromRegistry(this),this._deregistered=!0},e}(),Qe=function(){function e(t){this.transition=t}return e.prototype.buildHooksForPhase=function(t){var e=this;return this.transition.router.transitionService._pluginapi._getEvents(t).map(function(t){return e.buildHooks(t)}).reduce(Re,[]).filter(f)},e.prototype.buildHooks=function(e){var r=this.transition,n=r.treeChanges(),i=this.getMatchingHooks(e,n);if(!i)return[];var o={transition:r,current:r.options().current};return i.map(function(i){return i.matches(n)[e.criteriaMatchPath.name].map(function(n){var a=he({bind:i.bind,traceData:{hookType:e.name,context:n}},o),u=e.criteriaMatchPath.scope===t.TransitionHookScope.STATE?n.state.self:null,s=new ze(r,u,i,a);return{hook:i,node:n,transitionHook:s}})}).reduce(Re,[]).sort(q(e.reverseSort)).map(function(t){return t.transitionHook})},e.prototype.getMatchingHooks=function(e,r){var n=e.hookPhase===t.TransitionHookPhase.CREATE,i=this.transition.router.transitionService;return(n?[i]:[this.transition,i]).map(function(t){return t.getHooks(e.name)}).filter(ke(te,"broken event named: "+e.name)).reduce(Re,[]).filter(function(t){return t.matches(r)})},e}(),Ke=function(){function t(t){this.pattern=/.*/,this.inherit=!0,he(this,t)}return t.prototype.is=function(t,e){return!0},t.prototype.encode=function(t,e){return t},t.prototype.decode=function(t,e){return t},t.prototype.equals=function(t,e){return t==e},t.prototype.$subPattern=function(){var t=this.pattern.toString();return t.substr(1,t.length-2)},t.prototype.toString=function(){return"{ParamType:"+this.name+"}"},t.prototype.$normalize=function(t){return this.is(t)?t:this.decode(t)},t.prototype.$asArray=function(t,e){if(!t)return this;if("auto"===t&&!e)throw new Error("'auto' array mode is for query parameters only");return new D(this,t)},t}(),Ye=Object.prototype.hasOwnProperty,Ze=function(t){return 0===["value","type","squash","array","dynamic"].filter(Ye.bind(t||{})).length};!function(t){t[t.PATH=0]="PATH",t[t.SEARCH=1]="SEARCH",t[t.CONFIG=2]="CONFIG"}(t.DefType||(t.DefType={}));var Xe=function(){function e(e,r,n,i,o){r=N(n=F(n),r,i,e,o.paramTypes);var a=function(){var r={array:i===t.DefType.SEARCH&&"auto"},o=e.match(/\[\]$/)?{array:!0}:{};return he(r,o,n).array}();r=a?r.$asArray(a,i===t.DefType.SEARCH):r;var u=void 0!==n.value||i===t.DefType.SEARCH,s=zt(n.dynamic)?!!n.dynamic:!!r.dynamic,c=zt(n.raw)?!!n.raw:!!r.raw,f=U(n,u,o.defaultSquashPolicy()),l=L(n,a,u,f),h=zt(n.inherit)?!!n.inherit:!!r.inherit;he(this,{id:e,type:r,location:i,isOptional:u,dynamic:s,raw:c,squash:f,replace:l,inherit:h,array:a,config:n})}return e.prototype.isDefaultValue=function(t){return this.isOptional&&this.type.equals(this.value(),t)},e.prototype.value=function(t){var e=this;return t=function(t){for(var r=0,n=e.replace;r<n.length;r++){var i=n[r];if(i.from===t)return i.to}return t}(t),Wt(t)?function(){if(e._defaultValueCache)return e._defaultValueCache.defaultValue;if(!ae.$injector)throw new Error("Injectable functions cannot be called at configuration time");var t=ae.$injector.invoke(e.config.$$fn);if(null!==t&&void 0!==t&&!e.type.is(t))throw new Error("Default value ("+t+") for parameter '"+e.id+"' is not an instance of ParamType ("+e.type.name+")");return e.config.$$fn.__cacheable&&(e._defaultValueCache={defaultValue:t}),t}():this.type.$normalize(t)},e.prototype.isSearch=function(){return this.location===t.DefType.SEARCH},e.prototype.validates=function(t){if((Wt(t)||null===t)&&this.isOptional)return!0;var e=this.type.$normalize(t);if(!this.type.is(e))return!1;var r=this.type.encode(e);return!(Zt(r)&&!this.type.pattern.exec(r))},e.prototype.toString=function(){return"{Param:"+this.id+" "+this.type+" squash: '"+this.squash+"' optional: "+this.isOptional+"}"},e.values=function(t,e){void 0===e&&(e={});for(var r={},n=0,i=t;n<i.length;n++){var o=i[n];r[o.id]=o.value(e[o.id])}return r},e.changed=function(t,e,r){return void 0===e&&(e={}),void 0===r&&(r={}),t.filter(function(t){return!t.type.equals(e[t.id],r[t.id])})},e.equals=function(t,r,n){return void 0===r&&(r={}),void 0===n&&(n={}),0===e.changed(t,r,n).length},e.validates=function(t,e){return void 0===e&&(e={}),t.map(function(t){return t.validates(e[t.id])}).reduce(Se,!0)},e}(),tr=function(){function t(e){if(e instanceof t){var r=e;this.state=r.state,this.paramSchema=r.paramSchema.slice(),this.paramValues=he({},r.paramValues),this.resolvables=r.resolvables.slice(),this.views=r.views&&r.views.slice()}else{var n=e;this.state=n,this.paramSchema=n.parameters({inherit:!1}),this.paramValues={},this.resolvables=n.resolvables.map(function(t){return t.clone()})}}return t.prototype.applyRawParams=function(t){var e=function(e){return[e.id,e.value(t[e.id])]};return this.paramValues=this.paramSchema.reduce(function(t,r){return C(t,e(r))},{}),this},t.prototype.parameter=function(t){return S(this.paramSchema,Vt("id",t))},t.prototype.equals=function(t,e){var r=this.diff(t,e);return r&&0===r.length},t.prototype.diff=function(t,e){if(this.state!==t.state)return!1;var r=e?e(this):this.paramSchema;return Xe.changed(r,this.paramValues,t.paramValues)},t.clone=function(e){return new t(e)},t}(),er=function(){function t(){}return t.makeTargetState=function(t,e){var r=P(e).state;return new Ge(t,r,e.map(jt("paramValues")).reduce(_e,{}),{})},t.buildPath=function(t){var e=t.params();return t.$state().path.map(function(t){return new tr(t).applyRawParams(e)})},t.buildToPath=function(e,r){var n=t.buildPath(r);return r.options().inherit?t.inheritParams(e,n,Object.keys(r.params())):n},t.applyViewConfigs=function(e,r,n){r.filter(function(t){return ve(n,t.state)}).forEach(function(n){var i=$e(n.state.views||{}),o=t.subPath(r,function(t){return t===n}),a=i.map(function(t){return e.createViewConfig(o,t)});n.views=a.reduce(Re,[])})},t.inheritParams=function(t,e,r){function n(t,e){var r=S(t,Vt("state",e));return he({},r&&r.paramValues)}void 0===r&&(r=[]);var i=t.map(function(t){return t.paramSchema}).reduce(Re,[]).filter(function(t){return!t.inherit}).map(jt("id"));return e.map(function(e){var o=he({},e&&e.paramValues),a=g(o,r);o=_(o,r);var u=_(n(t,e.state)||{},i),s=he(o,u,a);return new tr(e.state).applyRawParams(s)})},t.treeChanges=function(e,r,n){for(var i=0,o=Math.min(e.length,r.length);i<o&&e[i].state!==n&&function(e,r){return e.equals(r,t.nonDynamicParams)}(e[i],r[i]);)i++;var a,u,s,c,f;u=(a=e).slice(0,i),s=a.slice(i);var l=u.map(function(t,e){var n=tr.clone(t);return n.paramValues=r[e].paramValues,n});return c=r.slice(i),f=l.concat(c),{from:a,to:f,retained:u,exiting:s,entering:c}},t.matching=function(t,e,r){var n=!1;return T(t,e).reduce(function(t,e){var i=e[0],o=e[1];return(n=n||!i.equals(o,r))?t:t.concat(i)},[])},t.equals=function(e,r,n){return e.length===r.length&&t.matching(e,r,n).length===e.length},t.subPath=function(t,e){var r=S(t,e),n=t.indexOf(r);return-1===n?void 0:t.slice(0,n+1)},t.nonDynamicParams=function(t){return t.state.parameters({inherit:!1}).filter(function(t){return!t.dynamic})},t.paramValues=function(t){return t.reduce(function(t,e){return he(t,e.paramValues)},{})},t}(),rr={when:"LAZY",async:"WAIT"},nr=function(){function t(e,r,n,i,o){if(this.resolved=!1,this.promise=void 0,e instanceof t)he(this,e);else if(Kt(r)){if(Qt(e))throw new Error("new Resolvable(): token argument is required");if(!Kt(r))throw new Error("new Resolvable(): resolveFn argument must be a function");this.token=e,this.policy=i,this.resolveFn=r,this.deps=n||[],this.data=o,this.resolved=void 0!==o,this.promise=this.resolved?ae.$q.when(this.data):void 0}else if(Xt(e)&&e.token&&Kt(e.resolveFn)){var a=e;return new t(a.token,a.resolveFn,a.deps,a.policy,a.data)}}return t.prototype.getPolicy=function(t){var e=this.policy||{},r=t&&t.resolvePolicy||{};return{when:e.when||r.when||rr.when,async:e.async||r.async||rr.async}},t.prototype.resolve=function(t,e){var r=this,n=ae.$q,i=t.findNode(this),o=i&&i.state,a="RXWAIT"===this.getPolicy(o).async?function(t){var e=t.cache(1);return e.take(1).toPromise().then(function(){return e})}:f;return this.promise=n.when().then(function(){return n.all(t.getDependencies(r).map(function(r){return r.get(t,e)}))}).then(function(t){return r.resolveFn.apply(null,t)}).then(a).then(function(t){return r.data=t,r.resolved=!0,Be.traceResolvableResolved(r,e),r.data})},t.prototype.get=function(t,e){return this.promise||this.resolve(t,e)},t.prototype.toString=function(){return"Resolvable(token: "+J(this.token)+", requires: ["+this.deps.map(J)+"])"},t.prototype.clone=function(){return new t(this)},t.fromData=function(e,r){return new t(e,function(){return r},null,null,r)},t}(),ir={when:{LAZY:"LAZY",EAGER:"EAGER"},async:{WAIT:"WAIT",NOWAIT:"NOWAIT",RXWAIT:"RXWAIT"}},or=ir.when,ar=[or.EAGER,or.LAZY],ur=[or.EAGER],sr="Native Injector",cr=function(){function t(t){this._path=t}return t.prototype.getTokens=function(){return this._path.reduce(function(t,e){return t.concat(e.resolvables.map(function(t){return t.token}))},[]).reduce(Te,[])},t.prototype.getResolvable=function(t){return P(this._path.map(function(t){return t.resolvables}).reduce(Re,[]).filter(function(e){return e.token===t}))},t.prototype.getPolicy=function(t){var e=this.findNode(t);return t.getPolicy(e.state)},t.prototype.subContext=function(e){return new t(er.subPath(this._path,function(t){return t.state===e}))},t.prototype.addResolvables=function(t,e){var r=S(this._path,Vt("state",e)),n=t.map(function(t){return t.token});r.resolvables=r.resolvables.filter(function(t){return-1===n.indexOf(t.token)}).concat(t)},t.prototype.resolvePath=function(t,e){var r=this;void 0===t&&(t="LAZY");var n=(ve(ar,t)?t:"LAZY")===ir.when.EAGER?ur:ar;Be.traceResolvePath(this._path,t,e);var i=function(t,e){return function(n){return ve(t,r.getPolicy(n)[e])}},o=this._path.reduce(function(t,o){var a=o.resolvables.filter(i(n,"when")),u=a.filter(i(["NOWAIT"],"async")),s=a.filter(Ht(i(["NOWAIT"],"async"))),c=r.subContext(o.state),f=function(t){return t.get(c,e).then(function(e){return{token:t.token,value:e}})};return u.forEach(f),t.concat(s.map(f))},[]);return ae.$q.all(o)},t.prototype.injector=function(){return this._injector||(this._injector=new fr(this))},t.prototype.findNode=function(t){return S(this._path,function(e){return ve(e.resolvables,t)})},t.prototype.getDependencies=function(t){var e=this,r=this.findNode(t),n=(er.subPath(this._path,function(t){return t===r})||this._path).reduce(function(t,e){return t.concat(e.resolvables)},[]).filter(function(e){return e!==t});return t.deps.map(function(t){var r=n.filter(function(e){return e.token===t});if(r.length)return P(r);var i=e.injector().getNative(t);if(Wt(i))throw new Error("Could not find Dependency Injection token: "+J(t));return new nr(t,function(){return i},[],i)})},t}(),fr=function(){function t(t){this.context=t,this.native=this.get(sr)||ae.$injector}return t.prototype.get=function(t){var e=this.context.getResolvable(t);if(e){if("NOWAIT"===this.context.getPolicy(e).async)return e.get(this.context);if(!e.resolved)throw new Error("Resolvable async .get() not complete:"+J(e.token));return e.data}return this.getNative(t)},t.prototype.getAsync=function(t){var e=this.context.getResolvable(t);return e?e.get(this.context):ae.$q.when(this.native.get(t))},t.prototype.getNative=function(t){return this.native&&this.native.get(t)},t}(),lr=jt("self"),hr=function(){function e(e,r,n){var i=this;if(this._deferred=ae.$q.defer(),this.promise=this._deferred.promise,this._registeredHooks={},this._hookBuilder=new Qe(this),this.isActive=function(){return i.router.globals.transition===i},this.router=n,this._targetState=r,!r.valid())throw new Error(r.error());this._options=he({current:Ut(this)},r.options()),this.$id=n.transitionService._transitionCount++;var o=er.buildToPath(e,r);this._treeChanges=er.treeChanges(e,o,this._options.reloadState),this.createTransitionHookRegFns();var a=this._hookBuilder.buildHooksForPhase(t.TransitionHookPhase.CREATE);ze.invokeHooks(a,function(){return null}),this.applyViewConfigs(n)}return e.prototype.onBefore=function(t,e,r){},e.prototype.onStart=function(t,e,r){},e.prototype.onExit=function(t,e,r){},e.prototype.onRetain=function(t,e,r){},e.prototype.onEnter=function(t,e,r){},e.prototype.onFinish=function(t,e,r){},e.prototype.onSuccess=function(t,e,r){},e.prototype.onError=function(t,e,r){},e.prototype.createTransitionHookRegFns=function(){var e=this;this.router.transitionService._pluginapi._getEvents().filter(function(e){return e.hookPhase!==t.TransitionHookPhase.CREATE}).forEach(function(t){return H(e,e.router.transitionService,t)})},e.prototype.getHooks=function(t){return this._registeredHooks[t]},e.prototype.applyViewConfigs=function(t){var e=this._treeChanges.entering.map(function(t){return t.state});er.applyViewConfigs(t.transitionService.$view,this._treeChanges.to,e)},e.prototype.$from=function(){return P(this._treeChanges.from).state},e.prototype.$to=function(){return P(this._treeChanges.to).state},e.prototype.from=function(){return this.$from().self},e.prototype.to=function(){return this.$to().self},e.prototype.targetState=function(){return this._targetState},e.prototype.is=function(t){return t instanceof e?this.is({to:t.$to().name,from:t.$from().name}):!(t.to&&!A(this.$to(),t.to)||t.from&&!A(this.$from(),t.from))},e.prototype.params=function(t){return void 0===t&&(t="to"),Object.freeze(this._treeChanges[t].map(jt("paramValues")).reduce(_e,{}))},e.prototype.injector=function(t,e){void 0===e&&(e="to");var r=this._treeChanges[e];return t&&(r=er.subPath(r,function(e){return e.state===t||e.state.name===t})),new cr(r).injector()},e.prototype.getResolveTokens=function(t){return void 0===t&&(t="to"),new cr(this._treeChanges[t]).getTokens()},e.prototype.addResolvable=function(t,e){void 0===e&&(e=""),t=Ft(nr)(t)?t:new nr(t);var r="string"==typeof e?e:e.name,n=this._treeChanges.to,i=S(n,function(t){return t.state.name===r});new cr(n).addResolvables([t],i.state)},e.prototype.redirectedFrom=function(){return this._options.redirectedFrom||null},e.prototype.originalTransition=function(){var t=this.redirectedFrom();return t&&t.originalTransition()||this},e.prototype.options=function(){return this._options},e.prototype.entering=function(){return b(this._treeChanges.entering,jt("state")).map(lr)},e.prototype.exiting=function(){return b(this._treeChanges.exiting,jt("state")).map(lr).reverse()},e.prototype.retained=function(){return b(this._treeChanges.retained,jt("state")).map(lr)},e.prototype.views=function(t,e){void 0===t&&(t="entering");var r=this._treeChanges[t];return(r=e?r.filter(Vt("state",e)):r).map(jt("views")).filter(f).reduce(Re,[])},e.prototype.treeChanges=function(t){return t?this._treeChanges[t]:this._treeChanges},e.prototype.redirect=function(t){for(var e=1,r=this;null!=(r=r.redirectedFrom());)if(++e>20)throw new Error("Too many consecutive Transition redirects (20+)");var n={redirectedFrom:this,source:"redirect"};"url"===this.options().source&&!1!==t.options().location&&(n.location="replace");var i=he({},this.options(),t.options(),n);t=t.withOptions(i,!0);var o=this.router.transitionService.create(this._treeChanges.from,t),a=this._treeChanges.entering,u=o._treeChanges.entering;return er.matching(u,a,er.nonDynamicParams).filter(Ht(function(t){return function(e){return t&&e.state.includes[t.name]}}(t.options().reloadState))).forEach(function(t,e){t.resolvables=a[e].resolvables}),o},e.prototype._changedParams=function(){var t=this._treeChanges;if(!(this._options.reload||t.exiting.length||t.entering.length||t.to.length!==t.from.length||T(t.to,t.from).map(function(t){return t[0].state!==t[1].state}).reduce(be,!1))){var e=t.to.map(function(t){return t.paramSchema}),r=[t.to,t.from].map(function(t){return t.map(function(t){return t.paramValues})});return T(e,r[0],r[1]).map(function(t){var e=t[0],r=t[1],n=t[2];return Xe.changed(e,r,n)}).reduce(Re,[])}},e.prototype.dynamic=function(){var t=this._changedParams();return!!t&&t.map(function(t){return t.dynamic}).reduce(be,!1)},e.prototype.ignored=function(){return!!this._ignoredReason()},e.prototype._ignoredReason=function(){var t=this.router.globals.transition,e=this._options.reloadState,r=function(t,r){if(t.length!==r.length)return!1;var n=er.matching(t,r);return t.length===n.filter(function(t){return!e||!t.state.includes[e.name]}).length},n=this.treeChanges(),i=t&&t.treeChanges();return i&&r(i.to,n.to)&&r(i.exiting,n.exiting)?"SameAsPending":0===n.exiting.length&&0===n.entering.length&&r(n.from,n.to)?"SameAsCurrent":void 0},e.prototype.run=function(){var e=this,r=ze.runAllHooks,n=function(t){return e._hookBuilder.buildHooksForPhase(t)},i=n(t.TransitionHookPhase.BEFORE);return ze.invokeHooks(i,function(){var t=e.router.globals;return t.lastStartedTransitionId=e.$id,t.transition=e,t.transitionHistory.enqueue(e),Be.traceTransitionStart(e),ae.$q.when(void 0)}).then(function(){var e=n(t.TransitionHookPhase.RUN);return ze.invokeHooks(e,function(){return ae.$q.when(void 0)})}).then(function(){Be.traceSuccess(e.$to(),e),e.success=!0,e._deferred.resolve(e.to()),r(n(t.TransitionHookPhase.SUCCESS))},function(i){Be.traceError(i,e),e.success=!1,e._deferred.reject(i),e._error=i,r(n(t.TransitionHookPhase.ERROR))}),this.promise},e.prototype.valid=function(){return!this.error()||void 0!==this.success},e.prototype.abort=function(){Wt(this.success)&&(this._aborted=!0)},e.prototype.error=function(){var t=this.$to();if(t.self.abstract)return"Cannot transition to abstract state '"+t.name+"'";var e=t.parameters(),r=this.params(),n=e.filter(function(t){return!t.validates(r[t.id])});return n.length?"Param values not valid for state '"+t.name+"'. Invalid params: [ "+n.map(function(t){return t.id}).join(", ")+" ]":!1===this.success?this._error:void 0},e.prototype.toString=function(){var t=this.from(),e=this.to(),r=function(t){return null!==t["#"]&&void 0!==t["#"]?t:_(t,["#"])};return"Transition#"+this.$id+"( '"+(Xt(t)?t.name:t)+"'"+J(r(this._treeChanges.from.map(jt("paramValues")).reduce(_e,{})))+" -> "+(this.valid()?"":"(X) ")+"'"+(Xt(e)?e.name:e)+"'"+J(r(this.params()))+" )"},e.diToken=e,e}(),pr=null,dr=function(t){var e=He.isRejectionPromise;return(pr=pr||s([[Ht(zt),Ut("undefined")],[Jt,Ut("null")],[ie,Ut("[Promise]")],[e,function(t){return t._transitionRejection.toString()}],[Ft(He),u("toString")],[Ft(hr),u("toString")],[Ft(nr),u("toString")],[c,W],[Ut(!0),f]]))(t)},vr=function(t){return function(e){if(!e)return["",""];var r=e.indexOf(t);return-1===r?[e,""]:[e.substr(0,r),e.substr(r+1)]}},mr=new RegExp("^(?:[a-z]+:)?//[^/]+/"),yr=function(t){return t.replace(/\/[^/]*$/,"")},gr=vr("#"),_r=vr("?"),wr=vr("="),$r=function(t){return t?t.replace(/^#/,""):""},Sr=function(){function t(){this.enqueue=!0,this.typeQueue=[],this.defaultTypes=g(t.prototype,["hash","string","query","path","int","bool","date","json","any"]);this.types=de(b(this.defaultTypes,function(t,e){return new Ke(he({name:e},t))}),{})}return t.prototype.dispose=function(){this.types={}},t.prototype.type=function(t,e,r){if(!zt(e))return this.types[t];if(this.types.hasOwnProperty(t))throw new Error("A type named '"+t+"' has already been defined.");return this.types[t]=new Ke(he({name:t},e)),r&&(this.typeQueue.push({name:t,def:r}),this.enqueue||this._flushTypeQueue()),this},t.prototype._flushTypeQueue=function(){for(;this.typeQueue.length;){var t=this.typeQueue.shift();if(t.pattern)throw new Error("You cannot override a type's .pattern at runtime.");he(this.types[t.name],ae.$injector.invoke(t.def))}},t}();!function(){var t=function(t){var e=function(t){return null!=t?t.toString():t},r={encode:e,decode:e,is:Ft(String),pattern:/.*/,equals:function(t,e){return t==e}};return he({},r,t)};he(Sr.prototype,{string:t({}),path:t({pattern:/[^/]*/}),query:t({}),hash:t({inherit:!1}),int:t({decode:function(t){return parseInt(t,10)},is:function(t){return!Qt(t)&&this.decode(t.toString())===t},pattern:/-?\d+/}),bool:t({encode:function(t){return t&&1||0},decode:function(t){return 0!==parseInt(t,10)},is:Ft(Boolean),pattern:/0|1/}),date:t({encode:function(t){return this.is(t)?[t.getFullYear(),("0"+(t.getMonth()+1)).slice(-2),("0"+t.getDate()).slice(-2)].join("-"):void 0},decode:function(t){if(this.is(t))return t;var e=this.capture.exec(t);return e?new Date(e[1],e[2]-1,e[3]):void 0},is:function(t){return t instanceof Date&&!isNaN(t.valueOf())},equals:function(t,e){return["getFullYear","getMonth","getDate"].reduce(function(r,n){return r&&t[n]()===e[n]()},!0)},pattern:/[0-9]{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[1-2][0-9]|3[0-1])/,capture:/([0-9]{4})-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])/}),json:t({encode:fe,decode:ce,is:Ft(Object),equals:pe,pattern:/[^/]*/}),any:t({encode:f,decode:f,is:function(){return!0},equals:pe})})}();var br,Rr=function(){function t(t){void 0===t&&(t={}),he(this,t)}return t.prototype.$inherit=function(t,e,r){var n,i=y(e,r),o={},a=[];for(var u in i)if(i[u]&&i[u].params&&(n=Object.keys(i[u].params)).length)for(var s in n)a.indexOf(n[s])>=0||(a.push(n[s]),o[n[s]]=this[n[s]]);return he({},o,t)},t}(),Er=function(t){if(!Zt(t))return!1;var e="^"===t.charAt(0);return{val:e?t.substring(1):t,root:e}},Tr=function(t,e){return function(r){var n=r;n&&n.url&&n.name&&n.name.match(/\.\*\*$/)&&(n.url+="{remainder:any}");var i=Er(n.url),o=r.parent,a=i?t.compile(i.val,{params:r.params||{},paramMap:function(t,e){return!1===n.reloadOnSearch&&e&&(t=he(t||{},{dynamic:!0})),t}}):n.url;if(!a)return null;if(!t.isMatcher(a))throw new Error("Invalid url '"+a+"' in state '"+r+"'");return i&&i.root?a:(o&&o.navigable||e()).url.append(a)}},Cr=function(t){return function(e){return!t(e)&&e.url?e:e.parent?e.parent.navigable:null}},Pr=function(t){return function(e){var r=e.url&&e.url.parameters({inherit:!1})||[],n=$e(we(_(e.params||{},r.map(jt("id"))),function(e,r){return t.fromConfig(r,null,e)}));return r.concat(n).map(function(t){return[t.id,t]}).reduce(C,{})}},kr=function(){function t(t,e){this.matcher=t;var r=this,n=function(){return t.find("")},i=function(t){return""===t.name};this.builders={name:[Y],self:[Z],parent:[function(e){return i(e)?null:t.find(r.parentName(e))||n()}],data:[X],url:[Tr(e,n)],navigable:[Cr(i)],params:[Pr(e.paramFactory)],views:[],path:[tt],includes:[et],resolvables:[rt]}}return t.prototype.builder=function(t,e){var r=this.builders,n=r[t]||[];return Zt(t)&&!zt(e)?n.length>1?n:n[0]:Zt(t)&&Kt(e)?(r[t]=n,r[t].push(e),function(){return r[t].splice(r[t].indexOf(e,1))&&null}):void 0},t.prototype.build=function(t){var e=this,r=e.matcher,n=e.builders,i=this.parentName(t);if(i&&!r.find(i,void 0,!1))return null;for(var o in n)if(n.hasOwnProperty(o)){var a=n[o].reduce(function(t,e){return function(r){return e(r,t)}},l);t[o]=a(t)}return t},t.prototype.parentName=function(t){var e=t.name||"",r=e.split(".");if("**"===r.pop()&&r.pop(),r.length){if(t.parent)throw new Error("States that specify the 'parent:' property should not have a '.' in their name ("+e+")");return r.join(".")}return t.parent?Zt(t.parent)?t.parent:t.parent.name:""},t.prototype.name=function(t){var e=t.name;if(-1!==e.indexOf(".")||!t.parent)return e;var r=Zt(t.parent)?t.parent:t.parent.name;return r?r+"."+e:e},t}(),Or=function(){function t(t){this._states=t}return t.prototype.isRelative=function(t){return 0===(t=t||"").indexOf(".")||0===t.indexOf("^")},t.prototype.find=function(t,e,r){if(void 0===r&&(r=!0),t||""===t){var n=Zt(t),i=n?t:t.name;this.isRelative(i)&&(i=this.resolvePath(i,e));var o=this._states[i];if(o&&(n||!(n||o!==t&&o.self!==t)))return o;if(n&&r){var a=$e(this._states).filter(function(t){return t.__stateObjectCache.nameGlob&&t.__stateObjectCache.nameGlob.matches(i)});return a.length>1&&console.log("stateMatcher.find: Found multiple matches for "+i+" using glob: ",a.map(function(t){return t.name})),a[0]}}},t.prototype.resolvePath=function(t,e){if(!e)throw new Error("No reference point given for path '"+t+"'");for(var r=this.find(e),n=t.split("."),i=0,o=n.length,a=r;i<o;i++)if(""!==n[i]||0!==i){if("^"!==n[i])break;if(!a.parent)throw new Error("Path '"+t+"' not valid for state '"+r.name+"'");a=a.parent}else a=r;var u=n.slice(i).join(".");return a.name+(a.name&&u?".":"")+u},t}(),xr=function(){function t(t,e,r,n,i){this.$registry=t,this.$urlRouter=e,this.states=r,this.builder=n,this.listeners=i,this.queue=[],this.matcher=t.matcher}return t.prototype.dispose=function(){this.queue=[]},t.prototype.register=function(t){var e=this.queue,r=Mt.create(t),n=r.name;if(!Zt(n))throw new Error("State must have a valid name");if(this.states.hasOwnProperty(n)||ve(e.map(jt("name")),n))throw new Error("State '"+n+"' is already defined");return e.push(r),this.flush(),r},t.prototype.flush=function(){for(var t=this,e=this,r=e.queue,n=e.states,i=e.builder,o=[],a=[],u={},s=function(e){return t.states.hasOwnProperty(e)&&t.states[e]};r.length>0;){var c=r.shift(),f=c.name,l=i.build(c),h=a.indexOf(c);if(l){var p=s(f);if(p&&p.name===f)throw new Error("State '"+f+"' is already defined");var d=s(f+".**");d&&this.$registry.deregister(d),n[f]=c,this.attachRoute(c),h>=0&&a.splice(h,1),o.push(c)}else{var v=u[f];if(u[f]=r.length,h>=0&&v===r.length)return r.push(c),n;h<0&&a.push(c),r.push(c)}}return o.length&&this.listeners.forEach(function(t){return t("registered",o.map(function(t){return t.self}))}),n},t.prototype.attachRoute=function(t){!t.abstract&&t.url&&this.$urlRouter.rule(this.$urlRouter.urlRuleFactory.create(t))},t}(),Ir=function(){function t(t){this._router=t,this.states={},this.listeners=[],this.matcher=new Or(this.states),this.builder=new kr(this.matcher,t.urlMatcherFactory),this.stateQueue=new xr(this,t.urlRouter,this.states,this.builder,this.listeners),this._registerRoot()}return t.prototype._registerRoot=function(){var t={name:"",url:"^",views:null,params:{"#":{value:null,type:"hash",dynamic:!0}},abstract:!0};(this._root=this.stateQueue.register(t)).navigable=null},t.prototype.dispose=function(){var t=this;this.stateQueue.dispose(),this.listeners=[],this.get().forEach(function(e){return t.get(e)&&t.deregister(e)})},t.prototype.onStatesChanged=function(t){return this.listeners.push(t),function(){me(this.listeners)(t)}.bind(this)},t.prototype.root=function(){return this._root},t.prototype.register=function(t){return this.stateQueue.register(t)},t.prototype._deregisterTree=function(t){var e=this,r=this.get().map(function(t){return t.$$state()}),n=function(t){var e=r.filter(function(e){return-1!==t.indexOf(e.parent)});return 0===e.length?e:e.concat(n(e))},i=n([t]),o=[t].concat(i).reverse();return o.forEach(function(t){var r=e._router.urlRouter;r.rules().filter(Vt("state",t)).forEach(r.removeRule.bind(r)),delete e.states[t.name]}),o},t.prototype.deregister=function(t){var e=this.get(t);if(!e)throw new Error("Can't deregister state; not found: "+t);var r=this._deregisterTree(e.$$state());return this.listeners.forEach(function(t){return t("deregistered",r.map(function(t){return t.self}))}),r},t.prototype.get=function(t,e){var r=this;if(0===arguments.length)return Object.keys(this.states).map(function(t){return r.states[t].self});var n=this.matcher.find(t,e);return n&&n.self||null},t.prototype.decorator=function(t,e){return this.builder.builder(t,e)},t}(),jr=function(t,e,r){return t[e]=t[e]||r()},Vr=Q("/"),Ar=function(){function e(t,r,n,i){var o=this;this.config=i,this._cache={path:[this]},this._children=[],this._params=[],this._segments=[],this._compiled=[],this.pattern=t,this.config=m(this.config,{params:{},strict:!0,caseInsensitive:!1,paramMap:f});for(var a,u,s,c=/([:*])([\w\[\]]+)|\{([\w\[\]]+)(?:\:\s*((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*\})+))?\}/g,l=/([:]?)([\w\[\].-]+)|\{([\w\[\].-]+)(?:\:\s*((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*\})+))?\}/g,h=0,p=[],d=function(r){if(!e.nameValidator.test(r))throw new Error("Invalid parameter name '"+r+"' in pattern '"+t+"'");if(S(o._params,Vt("id",r)))throw new Error("Duplicate parameter name '"+r+"' in pattern '"+t+"'")},v=function(e,n){var i=e[2]||e[3],a=n?e[4]:e[4]||("*"===e[1]?"[\\s\\S]*":null);return{id:i,regexp:a,cfg:o.config.params[i],segment:t.substring(h,e.index),type:a?r.type(a)||function(t){return de(r.type(n?"query":"path"),{pattern:new RegExp(t,o.config.caseInsensitive?"i":void 0)})}(a):null}};(a=c.exec(t))&&!((u=v(a,!1)).segment.indexOf("?")>=0);)d(u.id),this._params.push(n.fromPath(u.id,u.type,this.config.paramMap(u.cfg,!1))),this._segments.push(u.segment),p.push([u.segment,P(this._params)]),h=c.lastIndex;var y=(s=t.substring(h)).indexOf("?");if(y>=0){var g=s.substring(y);if(s=s.substring(0,y),g.length>0)for(h=0;a=l.exec(g);)d((u=v(a,!0)).id),this._params.push(n.fromSearch(u.id,u.type,this.config.paramMap(u.cfg,!0))),h=c.lastIndex}this._segments.push(s),this._compiled=p.map(function(t){return nt.apply(null,t)}).concat(nt(s))}return e.prototype.append=function(t){return this._children.push(t),t._cache={path:this._cache.path.concat(t),parent:this,pattern:null},t},e.prototype.isRoot=function(){return this._cache.path[0]===this},e.prototype.toString=function(){return this.pattern},e.prototype.exec=function(t,e,r,n){var i=this;void 0===e&&(e={}),void 0===n&&(n={});var o=jr(this._cache,"pattern",function(){return new RegExp(["^",Ce(i._cache.path.map(jt("_compiled"))).join(""),!1===i.config.strict?"/?":"","$"].join(""),i.config.caseInsensitive?"i":void 0)}).exec(t);if(!o)return null;var a=this.parameters(),u=a.filter(function(t){return!t.isSearch()}),s=a.filter(function(t){return t.isSearch()}),c=this._cache.path.map(function(t){return t._segments.length-1}).reduce(function(t,e){return t+e}),f={};if(c!==o.length-1)throw new Error("Unbalanced capture group in route '"+this.pattern+"'");for(var l=0;l<c;l++){for(var h=u[l],p=o[l+1],d=0;d<h.replace.length;d++)h.replace[d].from===p&&(p=h.replace[d].to);p&&!0===h.array&&(p=function(t){var e=function(t){return t.split("").reverse().join("")};return b(b(e(t).split(/-(?!\\)/),e),function(t){return t.replace(/\\-/g,"-")}).reverse()}(p)),zt(p)&&(p=h.type.decode(p)),f[h.id]=h.value(p)}return s.forEach(function(t){for(var r=e[t.id],n=0;n<t.replace.length;n++)t.replace[n].from===r&&(r=t.replace[n].to);zt(r)&&(r=t.type.decode(r)),f[t.id]=t.value(r)}),r&&(f["#"]=r),f},e.prototype.parameters=function(t){return void 0===t&&(t={}),!1===t.inherit?this._params:Ce(this._cache.path.map(function(t){return t._params}))},e.prototype.parameter=function(t,e){var r=this;void 0===e&&(e={});var n=this._cache.parent;return function(){for(var e=0,n=r._params;e<n.length;e++){var i=n[e];if(i.id===t)return i}}()||!1!==e.inherit&&n&&n.parameter(t,e)||null},e.prototype.validates=function(t){var e=function(t,e){return!t||t.validates(e)};return t=t||{},this.parameters().filter(function(e){return t.hasOwnProperty(e.id)}).map(function(r){return e(r,t[r.id])}).reduce(Se,!0)},e.prototype.format=function(t){function r(e){var r=e.value(t[e.id]),n=e.validates(r),i=e.isDefaultValue(r);return{param:e,value:r,isValid:n,isDefaultValue:i,squash:!!i&&e.squash,encoded:e.type.encode(r)}}void 0===t&&(t={});var n=this._cache.path,i=n.map(e.pathSegmentsAndParams).reduce(Re,[]).map(function(t){return Zt(t)?t:r(t)}),o=n.map(e.queryParams).reduce(Re,[]).map(r);if(i.concat(o).filter(function(t){return!1===t.isValid}).length)return null;var a=i.reduce(function(t,r){if(Zt(r))return t+r;var n=r.squash,i=r.encoded,o=r.param;return!0===n?t.match(/\/$/)?t.slice(0,-1):t:Zt(n)?t+n:!1!==n?t:null==i?t:te(i)?t+b(i,e.encodeDashes).join("-"):o.raw?t+i:t+encodeURIComponent(i)},""),u=o.map(function(t){var e=t.param,r=t.squash,n=t.encoded,i=t.isDefaultValue;if(!(null==n||i&&!1!==r)&&(te(n)||(n=[n]),0!==n.length))return e.raw||(n=b(n,encodeURIComponent)),n.map(function(t){return e.id+"="+t})}).filter(f).reduce(Re,[]).join("&");return a+(u?"?"+u:"")+(t["#"]?"#"+t["#"]:"")},e.encodeDashes=function(t){return encodeURIComponent(t).replace(/-/g,function(t){return"%5C%"+t.charCodeAt(0).toString(16).toUpperCase()})},e.pathSegmentsAndParams=function(e){return T(e._segments,e._params.filter(function(e){return e.location===t.DefType.PATH}).concat(void 0)).reduce(Re,[]).filter(function(t){return""!==t&&zt(t)})},e.queryParams=function(e){return e._params.filter(function(e){return e.location===t.DefType.SEARCH})},e.compare=function(t,r){var n=function(t){return t._cache.segments=t._cache.segments||t._cache.path.map(e.pathSegmentsAndParams).reduce(Re,[]).reduce(K,[]).map(function(t){return Zt(t)?Vr(t):t}).reduce(Re,[])},i=function(t){return t._cache.weights=t._cache.weights||n(t).map(function(t){return"/"===t?1:Zt(t)?2:t instanceof Xe?3:void 0})},o=i(t),a=i(r);!function(t,e,r){for(var n=Math.max(t.length,e.length);t.length<n;)t.push(r);for(;e.length<n;)e.push(r)}(o,a,0);var u,s,c=T(o,a);for(s=0;s<c.length;s++)if(0!=(u=c[s][0]-c[s][1]))return u;return 0},e.nameValidator=/^\w+([-.]+\w+)*(?:\[\])?$/,e}(),Hr=function(){function e(){var e=this;this.paramTypes=new Sr,this._isCaseInsensitive=!1,this._isStrictMode=!0,this._defaultSquashPolicy=!1,this._getConfig=function(t){return he({strict:e._isStrictMode,caseInsensitive:e._isCaseInsensitive},t)},this.paramFactory={fromConfig:function(r,n,i){return new Xe(r,n,i,t.DefType.CONFIG,e)},fromPath:function(r,n,i){return new Xe(r,n,i,t.DefType.PATH,e)},fromSearch:function(r,n,i){return new Xe(r,n,i,t.DefType.SEARCH,e)}},he(this,{UrlMatcher:Ar,Param:Xe})}return e.prototype.caseInsensitive=function(t){return this._isCaseInsensitive=zt(t)?t:this._isCaseInsensitive},e.prototype.strictMode=function(t){return this._isStrictMode=zt(t)?t:this._isStrictMode},e.prototype.defaultSquashPolicy=function(t){if(zt(t)&&!0!==t&&!1!==t&&!Zt(t))throw new Error("Invalid squash policy: "+t+". Valid policies: false, true, arbitrary-string");return this._defaultSquashPolicy=zt(t)?t:this._defaultSquashPolicy},e.prototype.compile=function(t,e){return new Ar(t,this.paramTypes,this.paramFactory,this._getConfig(e))},e.prototype.isMatcher=function(t){if(!Xt(t))return!1;var e=!0;return le(Ar.prototype,function(r,n){Kt(r)&&(e=e&&zt(t[n])&&Kt(t[n]))}),e},e.prototype.type=function(t,e,r){var n=this.paramTypes.type(t,e,r);return zt(e)?this:n},e.prototype.$get=function(){return this.paramTypes.enqueue=!1,this.paramTypes._flushTypeQueue(),this},e.prototype.dispose=function(){this.paramTypes.dispose()},e}(),qr=function(){function t(t){this.router=t}return t.prototype.compile=function(t){return this.router.urlMatcherFactory.compile(t)},t.prototype.create=function(t,e){var r=this,n=s([[Zt,function(t){return n(r.compile(t))}],[Ft(Ar),function(t){return r.fromUrlMatcher(t,e)}],[ne,function(t){return r.fromState(t,r.router)}],[Ft(RegExp),function(t){return r.fromRegExp(t,e)}],[Kt,function(t){return new Dr(t,e)}]]),i=n(t);if(!i)throw new Error("invalid 'what' in when()");return i},t.prototype.fromUrlMatcher=function(t,e){var r=e;Zt(e)&&(e=this.router.urlMatcherFactory.compile(e)),Ft(Ar)(e)&&(r=function(t){return e.format(t)});var n={urlMatcher:t,matchPriority:function(e){var r=t.parameters().filter(function(t){return t.isOptional});return r.length?r.filter(function(t){return e[t.id]}).length/r.length:1e-6},type:"URLMATCHER"};return he(new Dr(function(e){var r=t.exec(e.path,e.search,e.hash);return t.validates(r)&&r},r),n)},t.prototype.fromState=function(t,e){var r={state:t,type:"STATE"};return he(this.fromUrlMatcher(t.url,function(r){var n=e.stateService,i=e.globals;n.href(t,r)!==n.href(i.current,i.params)&&n.transitionTo(t,r,{inherit:!0,source:"url"})}),r)},t.prototype.fromRegExp=function(t,e){if(t.global||t.sticky)throw new Error("Rule RegExp must not be global or sticky");var r=Zt(e)?function(t){return e.replace(/\$(\$|\d{1,2})/,function(e,r){return t["$"===r?0:Number(r)]})}:e,n={regexp:t,type:"REGEXP"};return he(new Dr(function(e){return t.exec(e.path)},r),n)},t.isUrlRule=function(t){return t&&["type","match","handler"].every(function(e){return zt(t[e])})},t}(),Dr=function(){return function(t,e){var r=this;this.match=t,this.type="RAW",this.matchPriority=function(t){return 0-r.$id},this.handler=e||f}}(),Fr=function(t,e){return(e.priority||0)-(t.priority||0)},Nr=function(t,e){var r={STATE:4,URLMATCHER:4,REGEXP:3,RAW:2,OTHER:1};return(r[t.type]||0)-(r[e.type]||0)},Ur=function(t,e){return t.urlMatcher&&e.urlMatcher?Ar.compare(t.urlMatcher,e.urlMatcher):0},Lr=function(t,e){var r={STATE:!0,URLMATCHER:!0};return r[t.type]&&r[e.type]?0:(t.$id||0)-(e.$id||0)};br=function(t,e){var r=Fr(t,e);return 0!==r?r:0!==(r=Nr(t,e))?r:0!==(r=Ur(t,e))?r:Lr(t,e)};var Mr=function(){function t(e){this._sortFn=br,this._rules=[],this.interceptDeferred=!1,this._id=0,this._sorted=!1,this._router=e,this.urlRuleFactory=new qr(e),h(Ut(t.prototype),this,Ut(this))}return t.prototype.dispose=function(){this.listen(!1),this._rules=[],delete this._otherwiseFn},t.prototype.sort=function(t){this._rules=this.stableSort(this._rules,this._sortFn=t||this._sortFn),this._sorted=!0},t.prototype.ensureSorted=function(){this._sorted||this.sort()},t.prototype.stableSort=function(t,e){var r=t.map(function(t,e){return{elem:t,idx:e}});return r.sort(function(t,r){var n=e(t.elem,r.elem);return 0===n?t.idx-r.idx:n}),r.map(function(t){return t.elem})},t.prototype.match=function(t){var e=this;this.ensureSorted(),t=he({path:"",search:{},hash:""},t);var r=this.rules();this._otherwiseFn&&r.push(this._otherwiseFn);for(var n,i=0;i<r.length&&(!n||0===this._sortFn(r[i],n.rule));i++){var o=function(r){var n=r.match(t,e._router);return n&&{match:n,rule:r,weight:r.matchPriority(n)}}(r[i]);n=!n||o&&o.weight>n.weight?o:n}return n},t.prototype.sync=function(t){if(!t||!t.defaultPrevented){var e=this._router,r=e.urlService,n=e.stateService,i={path:r.path(),search:r.search(),hash:r.hash()},o=this.match(i);s([[Zt,function(t){return r.url(t,!0)}],[Ge.isDef,function(t){return n.go(t.state,t.params,t.options)}],[Ft(Ge),function(t){return n.go(t.state(),t.params(),t.options())}]])(o&&o.rule.handler(o.match,i,e))}},t.prototype.listen=function(t){var e=this;if(!1!==t)return this._stopFn=this._stopFn||this._router.urlService.onChange(function(t){return e.sync(t)});this._stopFn&&this._stopFn(),delete this._stopFn},t.prototype.update=function(t){var e=this._router.locationService;t?this.location=e.path():e.path()!==this.location&&e.url(this.location,!0)},t.prototype.push=function(t,e,r){var n=r&&!!r.replace;this._router.urlService.url(t.format(e||{}),n)},t.prototype.href=function(t,e,r){var n=t.format(e);if(null==n)return null;r=r||{absolute:!1};var i=this._router.urlService.config,o=i.html5Mode();if(o||null===n||(n="#"+i.hashPrefix()+n),n=it(n,o,r.absolute,i.baseHref()),!r.absolute||!n)return n;var a=!o&&n?"/":"",u=i.port();return u=80===u||443===u?"":":"+u,[i.protocol(),"://",i.host(),u,a,n].join("")},t.prototype.rule=function(t){var e=this;if(!qr.isUrlRule(t))throw new Error("invalid rule");return t.$id=this._id++,t.priority=t.priority||0,this._rules.push(t),this._sorted=!1,function(){return e.removeRule(t)}},t.prototype.removeRule=function(t){me(this._rules,t)},t.prototype.rules=function(){return this.ensureSorted(),this._rules.slice()},t.prototype.otherwise=function(t){var e=ot(t);this._otherwiseFn=this.urlRuleFactory.create(Ut(!0),e),this._sorted=!1},t.prototype.initial=function(t){var e=ot(t);this.rule(this.urlRuleFactory.create(function(t,e){return 0===e.globals.transitionHistory.size()&&!!/^\/?$/.exec(t.path)},e))},t.prototype.when=function(t,e,r){var n=this.urlRuleFactory.create(t,e);return zt(r&&r.priority)&&(n.priority=r.priority),this.rule(n),n},t.prototype.deferIntercept=function(t){void 0===t&&(t=!0),this.interceptDeferred=t},t}(),Br=function(){function t(){var t=this;this._uiViews=[],this._viewConfigs=[],this._viewConfigFactories={},this._pluginapi={_rootViewContext:this._rootViewContext.bind(this),_viewConfigFactory:this._viewConfigFactory.bind(this),_registeredUIViews:function(){return t._uiViews},_activeViewConfigs:function(){return t._viewConfigs}}}return t.prototype._rootViewContext=function(t){return this._rootContext=t||this._rootContext},t.prototype._viewConfigFactory=function(t,e){this._viewConfigFactories[t]=e},t.prototype.createViewConfig=function(t,e){var r=this._viewConfigFactories[e.$type];if(!r)throw new Error("ViewService: No view config factory registered for type "+e.$type);var n=r(t,e);return te(n)?n:[n]},t.prototype.deactivateViewConfig=function(t){Be.traceViewServiceEvent("<- Removing",t),me(this._viewConfigs,t)},t.prototype.activateViewConfig=function(t){Be.traceViewServiceEvent("-> Registering",t),this._viewConfigs.push(t)},t.prototype.sync=function(){function e(t){for(var e=t.viewDecl.$context,r=0;++r&&e.parent;)e=e.parent;return r}var n=this,i=this._uiViews.map(function(t){return[t.fqn,t]}).reduce(C,{}),o=r(function(t,e,r,n){return e*(t(r)-t(n))}),a=this._uiViews.sort(o(function(t){var e=function(t){return t&&t.parent?e(t.parent)+1:1};return 1e4*t.fqn.split(".").length+e(t.creationContext)},1)).map(function(r){var a=n._viewConfigs.filter(t.matches(i,r));return a.length>1&&a.sort(o(e,-1)),[r,a[0]]});Be.traceViewSync(a),a.forEach(function(t){var e=t[0],r=t[1];-1!==n._uiViews.indexOf(e)&&e.configUpdated(r)})},t.prototype.registerUIView=function(t){Be.traceViewServiceUIViewEvent("-> Registering",t);var e=this._uiViews;return e.filter(function(e){return e.fqn===t.fqn&&e.$type===t.$type}).length&&Be.traceViewServiceUIViewEvent("!!!! duplicate uiView named:",t),e.push(t),this.sync(),function(){-1!==e.indexOf(t)?(Be.traceViewServiceUIViewEvent("<- Deregistering",t),me(e)(t)):Be.traceViewServiceUIViewEvent("Tried removing non-registered uiView",t)}},t.prototype.available=function(){return this._uiViews.map(jt("fqn"))},t.prototype.active=function(){return this._uiViews.filter(jt("$config")).map(jt("name"))},t.normalizeUIViewTarget=function(t,e){void 0===e&&(e="");var r=e.split("@"),n=r[0]||"$default",i=Zt(r[1])?r[1]:"^",o=/^(\^(?:\.\^)*)\.(.*$)/.exec(n);return o&&(i=o[1],n=o[2]),"!"===n.charAt(0)&&(n=n.substr(1),i=""),/^(\^(?:\.\^)*)$/.exec(i)?i=i.split(".").reduce(function(t,e){return t.parent},t).name:"."===i&&(i=t.name),{uiViewName:n,uiViewContextAnchor:i}},t.matches=function(t,e){return function(r){if(e.$type!==r.viewDecl.$type)return!1;var n=r.viewDecl,i=n.$uiViewName.split("."),o=e.fqn.split(".");if(!pe(i,o.slice(0-i.length)))return!1;var a=1-i.length||void 0,u=o.slice(0,a).join("."),s=t[u].creationContext;return n.$uiViewContextAnchor===(s&&s.name)}},t}(),Gr=function(){function t(){this.params=new Rr,this.lastStartedTransitionId=-1,this.transitionHistory=new Ve([],1),this.successfulTransitions=new Ve([],1)}return t.prototype.dispose=function(){this.transitionHistory.clear(),this.successfulTransitions.clear(),this.transition=null},t}(),Wr=function(t){return t.reduce(function(t,e){return t[e]=oe(e),t},{dispose:l})},zr=["url","path","search","hash","onChange"],Jr=["port","protocol","host","baseHref","html5Mode","hashPrefix"],Qr=["type","caseInsensitive","strictMode","defaultSquashPolicy"],Kr=["sort","when","initial","otherwise","rules","rule","removeRule"],Yr=["deferIntercept","listen","sync","match"],Zr=function(){function t(t,e){void 0===e&&(e=!0),this.router=t,this.rules={},this.config={};var r=function(){return t.locationService};h(r,this,r,zr,e);var n=function(){return t.locationConfig};h(n,this.config,n,Jr,e);var i=function(){return t.urlMatcherFactory};h(i,this.config,i,Qr);var o=function(){return t.urlRouter};h(o,this.rules,o,Kr),h(o,this,o,Yr)}return t.prototype.url=function(t,e,r){},t.prototype.path=function(){},t.prototype.search=function(){},t.prototype.hash=function(){},t.prototype.onChange=function(t){},t.prototype.parts=function(){return{path:this.path(),search:this.search(),hash:this.hash()}},t.prototype.dispose=function(){},t.prototype.sync=function(t){},t.prototype.listen=function(t){},t.prototype.deferIntercept=function(t){},t.prototype.match=function(t){},t.locationServiceStub=Wr(zr),t.locationConfigStub=Wr(Jr),t}(),Xr=0,tn=function(){function t(t,e){void 0===t&&(t=Zr.locationServiceStub),void 0===e&&(e=Zr.locationConfigStub),this.locationService=t,this.locationConfig=e,this.$id=Xr++,this._disposed=!1,this._disposables=[],this.trace=Be,this.viewService=new Br,this.transitionService=new kn(this),this.globals=new Gr,this.urlMatcherFactory=new Hr,this.urlRouter=new Mr(this),this.stateRegistry=new Ir(this),this.stateService=new On(this),this.urlService=new Zr(this),this._plugins={},this.viewService._pluginapi._rootViewContext(this.stateRegistry.root()),this.globals.$current=this.stateRegistry.root(),this.globals.current=this.globals.$current.self,this.disposable(this.globals),this.disposable(this.stateService),this.disposable(this.stateRegistry),this.disposable(this.transitionService),this.disposable(this.urlRouter),this.disposable(t),this.disposable(e)}return t.prototype.disposable=function(t){this._disposables.push(t)},t.prototype.dispose=function(t){var e=this;t&&Kt(t.dispose)?t.dispose(this):(this._disposed=!0,this._disposables.slice().forEach(function(t){try{"function"==typeof t.dispose&&t.dispose(e),me(e._disposables,t)}catch(t){}}))},t.prototype.plugin=function(t,e){void 0===e&&(e={});var r=new t(this,e);if(!r.name)throw new Error("Required property `name` missing on plugin: "+r);return this._disposables.push(r),this._plugins[r.name]=r},t.prototype.getPlugin=function(t){return t?this._plugins[t]:$e(this._plugins)},t}(),en=function(t){return t.onCreate({},at)},rn=function(t){function e(e){if(e)return e instanceof Ge?e:Zt(e)?n.target(e,t.params(),t.options()):e.state||e.params?n.target(e.state||t.to(),e.params||t.params(),t.options()):void 0}var r=t.to().redirectTo;if(r){var n=t.router.stateService;return Kt(r)?ae.$q.when(r(t)).then(e):e(r)}},nn=function(t){return t.onStart({to:function(t){return!!t.redirectTo}},rn)},on=ut("onExit"),an=function(t){return t.onExit({exiting:function(t){return!!t.onExit}},on)},un=ut("onRetain"),sn=function(t){return t.onRetain({retained:function(t){return!!t.onRetain}},un)},cn=ut("onEnter"),fn=function(t){return t.onEnter({entering:function(t){return!!t.onEnter}},cn)},ln=function(t){return new cr(t.treeChanges().to).resolvePath("EAGER",t).then(l)},hn=function(t){return t.onStart({},ln,{priority:1e3})},pn=function(t,e){return new cr(t.treeChanges().to).subContext(e.$$state()).resolvePath("LAZY",t).then(l)},dn=function(t){return t.onEnter({entering:Ut(!0)},pn,{priority:1e3})},vn=function(t){var e=ae.$q,r=t.views("entering");if(r.length)return e.all(r.map(function(t){return e.when(t.load())})).then(l)},mn=function(t){return t.onFinish({},vn)},yn=function(t){var e=t.views("entering"),r=t.views("exiting");if(e.length||r.length){var n=t.router.viewService;r.forEach(function(t){return n.deactivateViewConfig(t)}),e.forEach(function(t){return n.activateViewConfig(t)}),n.sync()}},gn=function(t){return t.onSuccess({},yn)},_n=function(t){var e=t.router.globals,r=function(){e.transition===t&&(e.transition=null)};t.onSuccess({},function(){e.successfulTransitions.enqueue(t),e.$current=t.$to(),e.current=e.$current.self,k(t.params(),e.params)},{priority:1e4}),t.promise.then(r,r)},wn=function(t){return t.onCreate({},_n)},$n=function(t){var e=t.options(),r=t.router.stateService,n=t.router.urlRouter;if("url"!==e.source&&e.location&&r.$current.navigable){var i={replace:"replace"===e.location};n.push(r.$current.navigable.url,r.params,i)}n.update(!0)},Sn=function(t){return t.onSuccess({},$n,{priority:9999})},bn=function(t){var e=t.router,r=t.entering().filter(function(t){return!!t.$$state().lazyLoad}).map(function(e){return st(t,e)});return ae.$q.all(r).then(function(){if("url"!==t.originalTransition().options().source){var r=t.targetState();return e.stateService.target(r.identifier(),r.params(),r.options())}var n=e.urlService,i=n.match(n.parts()),o=i&&i.rule;if(o&&"STATE"===o.type){var a=o.state,u=i.match;return e.stateService.target(a,u,t.options())}e.urlService.sync()})},Rn=function(t){return t.onBefore({entering:function(t){return!!t.lazyLoad}},bn)},En=function(){return function(t,e,r,n,i,o,a,u){void 0===i&&(i=!1),void 0===o&&(o=ze.HANDLE_RESULT),void 0===a&&(a=ze.REJECT_ERROR),void 0===u&&(u=!1),this.name=t,this.hookPhase=e,this.hookOrder=r,this.criteriaMatchPath=n,this.reverseSort=i,this.getResultHandler=o,this.getErrorHandler=a,this.synchronous=u}}(),Tn=function(t){return t.onBefore({},ct,{priority:-9999})},Cn=function(t){return t.onBefore({},ft,{priority:-1e4})},Pn={location:!0,relative:null,inherit:!1,notify:!0,reload:!1,custom:{},current:function(){return null},source:"unknown"},kn=function(){function e(t){this._transitionCount=0,this._eventTypes=[],this._registeredHooks={},this._criteriaPaths={},this._router=t,this.$view=t.viewService,this._deregisterHookFns={},this._pluginapi=h(Ut(this),{},Ut(this),["_definePathType","_defineEvent","_getPathTypes","_getEvents","getHooks"]),this._defineCorePaths(),this._defineCoreEvents(),this._registerCoreTransitionHooks()}return e.prototype.onCreate=function(t,e,r){},e.prototype.onBefore=function(t,e,r){},e.prototype.onStart=function(t,e,r){},e.prototype.onExit=function(t,e,r){},e.prototype.onRetain=function(t,e,r){},e.prototype.onEnter=function(t,e,r){},e.prototype.onFinish=function(t,e,r){},e.prototype.onSuccess=function(t,e,r){},e.prototype.onError=function(t,e,r){},e.prototype.dispose=function(t){$e(this._registeredHooks).forEach(function(t){return t.forEach(function(e){e._deregistered=!0,me(t,e)})})},e.prototype.create=function(t,e){return new hr(t,e,this._router)},e.prototype._defineCoreEvents=function(){var e=t.TransitionHookPhase,r=ze,n=this._criteriaPaths;this._defineEvent("onCreate",e.CREATE,0,n.to,!1,r.LOG_REJECTED_RESULT,r.THROW_ERROR,!0),this._defineEvent("onBefore",e.BEFORE,0,n.to),this._defineEvent("onStart",e.RUN,0,n.to),this._defineEvent("onExit",e.RUN,100,n.exiting,!0),this._defineEvent("onRetain",e.RUN,200,n.retained),this._defineEvent("onEnter",e.RUN,300,n.entering),this._defineEvent("onFinish",e.RUN,400,n.to),this._defineEvent("onSuccess",e.SUCCESS,0,n.to,!1,r.LOG_REJECTED_RESULT,r.LOG_ERROR,!0),this._defineEvent("onError",e.ERROR,0,n.to,!1,r.LOG_REJECTED_RESULT,r.LOG_ERROR,!0)},e.prototype._defineCorePaths=function(){var e=t.TransitionHookScope.STATE,r=t.TransitionHookScope.TRANSITION;this._definePathType("to",r),this._definePathType("from",r),this._definePathType("exiting",e),this._definePathType("retained",e),this._definePathType("entering",e)},e.prototype._defineEvent=function(t,e,r,n,i,o,a,u){void 0===i&&(i=!1),void 0===o&&(o=ze.HANDLE_RESULT),void 0===a&&(a=ze.REJECT_ERROR),void 0===u&&(u=!1);var s=new En(t,e,r,n,i,o,a,u);this._eventTypes.push(s),H(this,this,s)},e.prototype._getEvents=function(t){return(zt(t)?this._eventTypes.filter(function(e){return e.hookPhase===t}):this._eventTypes.slice()).sort(function(t,e){var r=t.hookPhase-e.hookPhase;return 0===r?t.hookOrder-e.hookOrder:r})},e.prototype._definePathType=function(t,e){this._criteriaPaths[t]={name:t,scope:e}},e.prototype._getPathTypes=function(){return this._criteriaPaths},e.prototype.getHooks=function(t){return this._registeredHooks[t]},e.prototype._registerCoreTransitionHooks=function(){var t=this._deregisterHookFns;t.addCoreResolves=en(this),t.ignored=Tn(this),t.invalid=Cn(this),t.redirectTo=nn(this),t.onExit=an(this),t.onRetain=sn(this),t.onEnter=fn(this),t.eagerResolve=hn(this),t.lazyResolve=dn(this),t.loadViews=mn(this),t.activateViews=gn(this),t.updateGlobals=wn(this),t.updateUrl=Sn(this),t.lazyLoad=Rn(this)},e}(),On=function(){function e(t){this.router=t,this.invalidCallbacks=[],this._defaultErrorHandler=function(t){t instanceof Error&&t.stack?(console.error(t),console.error(t.stack)):t instanceof He?(console.error(t.toString()),t.detail&&t.detail.stack&&console.error(t.detail.stack)):console.error(t)};var r=["current","$current","params","transition"],n=Object.keys(e.prototype).filter(Ht(ve(r)));h(Ut(e.prototype),this,Ut(this),n)}return Object.defineProperty(e.prototype,"transition",{get:function(){return this.router.globals.transition},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"params",{get:function(){return this.router.globals.params},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"current",{get:function(){return this.router.globals.current},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"$current",{get:function(){return this.router.globals.$current},enumerable:!0,configurable:!0}),e.prototype.dispose=function(){this.defaultErrorHandler(l),this.invalidCallbacks=[]},e.prototype._handleInvalidTargetState=function(t,e){function r(){var t=s.dequeue();return void 0===t?He.invalid(e.error()).toPromise():ae.$q.when(t(e,i,c)).then(f).then(function(t){return t||r()})}var n=this,i=er.makeTargetState(this.router.stateRegistry,t),o=this.router.globals,a=function(){return o.transitionHistory.peekTail()},u=a(),s=new Ve(this.invalidCallbacks.slice()),c=new cr(t).injector(),f=function(t){if(t instanceof Ge){var e=t;return(e=n.target(e.identifier(),e.params(),e.options())).valid()?a()!==u?He.superseded().toPromise():n.transitionTo(e.identifier(),e.params(),e.options()):He.invalid(e.error()).toPromise()}};return r()},e.prototype.onInvalid=function(t){return this.invalidCallbacks.push(t),function(){me(this.invalidCallbacks)(t)}.bind(this)},e.prototype.reload=function(t){return this.transitionTo(this.current,this.params,{reload:!zt(t)||t,inherit:!1,notify:!1})},e.prototype.go=function(t,e,r){var n=m(r,{relative:this.$current,inherit:!0},Pn);return this.transitionTo(t,e,n)},e.prototype.target=function(t,e,r){if(void 0===r&&(r={}),Xt(r.reload)&&!r.reload.name)throw new Error("Invalid reload state object");var n=this.router.stateRegistry;if(r.reloadState=!0===r.reload?n.root():n.matcher.find(r.reload,r.relative),r.reload&&!r.reloadState)throw new Error("No such reload state '"+(Zt(r.reload)?r.reload:r.reload.name)+"'");return new Ge(this.router.stateRegistry,t,e,r)},e.prototype.getCurrentPath=function(){var t=this,e=this.router.globals.successfulTransitions.peekTail();return e?e.treeChanges().to:[new tr(t.router.stateRegistry.root())]},e.prototype.transitionTo=function(e,r,n){var i=this;void 0===r&&(r={}),void 0===n&&(n={});var o=this.router,a=o.globals;n=m(n,Pn);n=he(n,{current:function(){return a.transition}});var u=this.target(e,r,n),s=this.getCurrentPath();if(!u.exists())return this._handleInvalidTargetState(s,u);if(!u.valid())return je(u.error());var c=function(e){return function(r){if(r instanceof He){var n=o.globals.lastStartedTransitionId===e.$id;if(r.type===t.RejectType.IGNORED)return n&&o.urlRouter.update(),ae.$q.when(a.current);var u=r.detail;if(r.type===t.RejectType.SUPERSEDED&&r.redirected&&u instanceof Ge){var s=e.redirect(u);return s.run().catch(c(s))}if(r.type===t.RejectType.ABORTED)return n&&o.urlRouter.update(),ae.$q.reject(r)}return i.defaultErrorHandler()(r),ae.$q.reject(r)}},f=this.router.transitionService.create(s,u),l=f.run().catch(c(f));return Ie(l),he(l,{transition:f})},e.prototype.is=function(t,e,r){r=m(r,{relative:this.$current});var n=this.router.stateRegistry.matcher.find(t,r.relative);if(zt(n)){if(this.$current!==n)return!1;if(!e)return!0;var i=n.parameters({inherit:!0,matchingKeys:e});return Xe.equals(i,Xe.values(i,e),this.params)}},e.prototype.includes=function(t,e,r){r=m(r,{relative:this.$current});var n=Zt(t)&&Lt.fromString(t);if(n){if(!n.matches(this.$current.name))return!1;t=this.$current.name}var i=this.router.stateRegistry.matcher.find(t,r.relative),o=this.$current.includes;if(zt(i)){if(!zt(o[i.name]))return!1;if(!e)return!0;var a=i.parameters({inherit:!0,matchingKeys:e});return Xe.equals(a,Xe.values(a,e),this.params)}},e.prototype.href=function(t,e,r){r=m(r,{lossy:!0,inherit:!0,absolute:!1,relative:this.$current}),e=e||{};var n=this.router.stateRegistry.matcher.find(t,r.relative);if(!zt(n))return null;r.inherit&&(e=this.params.$inherit(e,this.$current,n));var i=n&&r.lossy?n.navigable:n;return i&&void 0!==i.url&&null!==i.url?this.router.urlRouter.href(i.url,e,{absolute:r.absolute}):null},e.prototype.defaultErrorHandler=function(t){return this._defaultErrorHandler=t||this._defaultErrorHandler},e.prototype.get=function(t,e){var r=this.router.stateRegistry;return 0===arguments.length?r.get():r.get(t,e||this.$current)},e.prototype.lazyLoad=function(t,e){var r=this.get(t);if(!r||!r.lazyLoad)throw new Error("Can not lazy load "+t);var n=this.getCurrentPath(),i=er.makeTargetState(this.router.stateRegistry,n);return e=e||this.router.transitionService.create(n,i),st(e,r)},e}(),xn={when:function(t){return new Promise(function(e,r){return e(t)})},reject:function(t){return new Promise(function(e,r){r(t)})},defer:function(){var t={};return t.promise=new Promise(function(e,r){t.resolve=e,t.reject=r}),t},all:function(t){if(te(t))return Promise.all(t);if(Xt(t)){var e=Object.keys(t).map(function(e){return t[e].then(function(t){return{key:e,val:t}})});return xn.all(e).then(function(t){return t.reduce(function(t,e){return t[e.key]=e.val,t},{})})}}},In={},jn=/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm,Vn=/([^\s,]+)/g,An={get:function(t){return In[t]},has:function(t){return null!=An.get(t)},invoke:function(t,e,r){var n=he({},In,r||{}),i=An.annotate(t),o=ke(function(t){return n.hasOwnProperty(t)},function(t){return"DI can't find injectable: '"+t+"'"}),a=i.filter(o).map(function(t){return n[t]});return Kt(t)?t.apply(e,a):t.slice(-1)[0].apply(e,a)},annotate:function(t){if(!c(t))throw new Error("Not an injectable function: "+t);if(t&&t.$inject)return t.$inject;if(te(t))return t.slice(0,-1);var e=t.toString().replace(jn,"");return e.slice(e.indexOf("(")+1,e.indexOf(")")).match(Vn)||[]}},Hn=function(t,e){var r=e[0],n=e[1];return t.hasOwnProperty(r)?te(t[r])?t[r].push(n):t[r]=[t[r],n]:t[r]=n,t},qn=function(t){return t.split("&").filter(f).map(wr).reduce(Hn,{})},Dn=function(t){var e=t.path(),r=t.search(),n=t.hash(),i=Object.keys(r).map(function(t){var e=r[t];return(te(e)?e:[e]).map(function(e){return t+"="+e})}).reduce(Re,[]).join("&");return e+(i?"?"+i:"")+(n?"#"+n:"")},Fn=function(){function t(t,e){var r=this;this.fireAfterUpdate=e,this._listener=function(t){return r._listeners.forEach(function(e){return e(t)})},this._listeners=[],this.hash=function(){return lt(r._get()).hash},this.path=function(){return lt(r._get()).path},this.search=function(){return qn(lt(r._get()).search)},this._location=ue.location,this._history=ue.history}return t.prototype.url=function(t,e){return void 0===e&&(e=!0),zt(t)&&t!==this._get()&&(this._set(null,null,t,e),this.fireAfterUpdate&&this._listeners.forEach(function(e){return e({url:t})})),Dn(this)},t.prototype.onChange=function(t){var e=this;return this._listeners.push(t),function(){return me(e._listeners,t)}},t.prototype.dispose=function(t){ge(this._listeners)},t}(),Nn=function(){var t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var r in e)e.hasOwnProperty(r)&&(t[r]=e[r])};return function(e,r){function n(){this.constructor=e}t(e,r),e.prototype=null===r?Object.create(r):(n.prototype=r.prototype,new n)}}(),Un=function(t){function e(e){var r=t.call(this,e,!1)||this;return ue.addEventListener("hashchange",r._listener,!1),r}return Nn(e,t),e.prototype._get=function(){return $r(this._location.hash)},e.prototype._set=function(t,e,r,n){this._location.hash=r},e.prototype.dispose=function(e){t.prototype.dispose.call(this,e),ue.removeEventListener("hashchange",this._listener)},e}(Fn),Ln=function(){var t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var r in e)e.hasOwnProperty(r)&&(t[r]=e[r])};return function(e,r){function n(){this.constructor=e}t(e,r),e.prototype=null===r?Object.create(r):(n.prototype=r.prototype,new n)}}(),Mn=function(t){function e(e){return t.call(this,e,!0)||this}return Ln(e,t),e.prototype._get=function(){return this._url},e.prototype._set=function(t,e,r,n){this._url=r},e}(Fn),Bn=function(){var t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var r in e)e.hasOwnProperty(r)&&(t[r]=e[r])};return function(e,r){function n(){this.constructor=e}t(e,r),e.prototype=null===r?Object.create(r):(n.prototype=r.prototype,new n)}}(),Gn=function(t){function e(e){var r=t.call(this,e,!0)||this;return r._config=e.urlService.config,ue.addEventListener("popstate",r._listener,!1),r}return Bn(e,t),e.prototype._getBasePrefix=function(){return yr(this._config.baseHref())},e.prototype._get=function(){var t=this._location,e=t.pathname,r=t.hash,n=t.search;n=_r(n)[1],r=gr(r)[1];var i=this._getBasePrefix(),o=e===this._config.baseHref(),a=e.startsWith(i);return(e=o?"/":a?e.substring(i.length):e)+(n?"?"+n:"")+(r?"#"+r:"")},e.prototype._set=function(t,e,r,n){var i=this._getBasePrefix()+r;n?this._history.replaceState(t,e,i):this._history.pushState(t,e,i)},e.prototype.dispose=function(e){t.prototype.dispose.call(this,e),ue.removeEventListener("popstate",this._listener)},e}(Fn),Wn=function(){return function(){var t=this;this._baseHref="",this._port=80,this._protocol="http",this._host="localhost",this._hashPrefix="",this.port=function(){return t._port},this.protocol=function(){return t._protocol},this.host=function(){return t._host},this.baseHref=function(){return t._baseHref},this.html5Mode=function(){return!1},this.hashPrefix=function(e){return zt(e)?t._hashPrefix=e:t._hashPrefix},this.dispose=l}}(),zn=function(){function t(t,e){void 0===e&&(e=!1),this._isHtml5=e,this._baseHref=void 0,this._hashPrefix=""}return t.prototype.port=function(){return location.port?Number(location.port):"https"===this.protocol()?443:80},t.prototype.protocol=function(){return location.protocol.replace(/:/g,"")},t.prototype.host=function(){return location.hostname},t.prototype.html5Mode=function(){return this._isHtml5},t.prototype.hashPrefix=function(t){return zt(t)?this._hashPrefix=t:this._hashPrefix},t.prototype.baseHref=function(t){return zt(t)?this._baseHref=t:zt(this._baseHref)?this._baseHref:this.applyDocumentBaseHref()},t.prototype.applyDocumentBaseHref=function(){var t=document.getElementsByTagName("base")[0];return this._baseHref=t?t.href.substr(location.origin.length):""},t.prototype.dispose=function(){},t}(),Jn=ht("vanilla.hashBangLocation",!1,Un,zn),Qn=ht("vanilla.pushStateLocation",!0,Gn,zn),Kn=ht("vanilla.memoryLocation",!1,Mn,Wn),Yn=function(){function t(){}return t.prototype.dispose=function(t){},t}(),Zn=Object.freeze({root:ue,fromJson:ce,toJson:fe,forEach:le,extend:he,equals:pe,identity:f,noop:l,createProxyFunctions:h,inherit:de,inArray:ve,_inArray:p,removeFrom:me,_removeFrom:d,pushTo:ye,_pushTo:v,deregAll:ge,defaults:m,mergeR:_e,ancestors:y,pick:g,omit:_,pluck:w,filter:$,find:S,mapObj:we,map:b,values:$e,allTrueR:Se,anyTrueR:be,unnestR:Re,flattenR:Ee,pushR:R,uniqR:Te,unnest:Ce,flatten:Pe,assertPredicate:ke,assertMap:Oe,assertFn:E,pairs:xe,arrayTuples:T,applyPairs:C,tail:P,copy:k,_extend:O,silenceUncaughtInPromise:Ie,silentRejection:je,notImplemented:oe,services:ae,Glob:Lt,curry:r,compose:n,pipe:i,prop:jt,propEq:Vt,parse:At,not:Ht,and:o,or:a,all:qt,any:Dt,is:Ft,eq:Nt,val:Ut,invoke:u,pattern:s,isUndefined:Wt,isDefined:zt,isNull:Jt,isNullOrUndefined:Qt,isFunction:Kt,isNumber:Yt,isString:Zt,isObject:Xt,isArray:te,isDate:ee,isRegExp:re,isState:ne,isInjectable:c,isPromise:ie,Queue:Ve,maxLength:M,padString:B,kebobString:G,functionToString:W,fnToString:z,stringify:J,beforeAfterSubstr:vr,hostRegex:mr,stripFile:yr,splitHash:gr,splitQuery:_r,splitEqual:wr,trimHashVal:$r,splitOnDelim:Q,joinNeighborsR:K,get Category(){return t.Category},Trace:Me,trace:Be,get DefType(){return t.DefType},Param:Xe,ParamTypes:Sr,StateParams:Rr,ParamType:Ke,PathNode:tr,PathUtils:er,resolvePolicies:ir,defaultResolvePolicy:rr,Resolvable:nr,NATIVE_INJECTOR_TOKEN:sr,ResolveContext:cr,resolvablesBuilder:rt,StateBuilder:kr,StateObject:Mt,StateMatcher:Or,StateQueueManager:xr,StateRegistry:Ir,StateService:On,TargetState:Ge,get TransitionHookPhase(){return t.TransitionHookPhase},get TransitionHookScope(){return t.TransitionHookScope},HookBuilder:Qe,matchState:A,RegisteredHook:Je,makeEvent:H,get RejectType(){return t.RejectType},Rejection:He,Transition:hr,TransitionHook:ze,TransitionEventType:En,defaultTransOpts:Pn,TransitionService:kn,UrlMatcher:Ar,UrlMatcherFactory:Hr,UrlRouter:Mr,UrlRuleFactory:qr,BaseUrlRule:Dr,UrlService:Zr,ViewService:Br,UIRouterGlobals:Gr,UIRouter:tn,$q:xn,$injector:An,BaseLocationServices:Fn,HashLocationService:Un,MemoryLocationService:Mn,PushStateLocationService:Gn,MemoryLocationConfig:Wn,BrowserLocationConfig:zn,keyValsToObjectR:Hn,getParams:qn,parseUrl:lt,buildUrl:Dn,locationPluginFactory:ht,servicesPlugin:pt,hashLocationPlugin:Jn,pushStateLocationPlugin:Qn,memoryLocationPlugin:Kn,UIRouterPluginBase:Yn}),Xn=function(t,e){return t.reduce(function(t,r){return t||zt(e[r])},!1)},ti=0,ei=function(){function t(t,e,r){var n=this;this.path=t,this.viewDecl=e,this.factory=r,this.$id=ti++,this.loaded=!1,this.getTemplate=function(t,e){return n.component?n.factory.makeComponentTemplate(t,e,n.component,n.viewDecl.bindings):n.template}}return t.prototype.load=function(){var t=this,e=ae.$q,r=new cr(this.path),n=this.path.reduce(function(t,e){return he(t,e.paramValues)},{}),i={template:e.when(this.factory.fromConfig(this.viewDecl,n,r)),controller:e.when(this.getController(r))};return e.all(i).then(function(e){return Be.traceViewServiceEvent("Loaded",t),t.controller=e.controller,he(t,e.template),t})},t.prototype.getController=function(t){var e=this.viewDecl.controllerProvider;if(!c(e))return this.viewDecl.controller;var r=ae.$injector.annotate(e),n=te(e)?P(e):e;return new nr("",n,r).get(t)},t}(),ri=function(){function t(){var t=this;this._useHttp=It.version.minor<3,this.$get=["$http","$templateCache","$injector",function(e,r,n){return t.$templateRequest=n.has&&n.has("$templateRequest")&&n.get("$templateRequest"),t.$http=e,t.$templateCache=r,t}]}return t.prototype.useHttpService=function(t){this._useHttp=t},t.prototype.fromConfig=function(t,e,r){var n=function(t){return ae.$q.when(t).then(function(t){return{template:t}})},i=function(t){return ae.$q.when(t).then(function(t){return{component:t}})};return zt(t.template)?n(this.fromString(t.template,e)):zt(t.templateUrl)?n(this.fromUrl(t.templateUrl,e)):zt(t.templateProvider)?n(this.fromProvider(t.templateProvider,e,r)):zt(t.component)?i(t.component):zt(t.componentProvider)?i(this.fromComponentProvider(t.componentProvider,e,r)):n("<ui-view></ui-view>")},t.prototype.fromString=function(t,e){return Kt(t)?t(e):t},t.prototype.fromUrl=function(t,e){return Kt(t)&&(t=t(e)),null==t?null:this._useHttp?this.$http.get(t,{cache:this.$templateCache,headers:{Accept:"text/html"}}).then(function(t){return t.data}):this.$templateRequest(t)},t.prototype.fromProvider=function(t,e,r){var n=ae.$injector.annotate(t),i=te(t)?P(t):t;return new nr("",i,n).get(r)},t.prototype.fromComponentProvider=function(t,e,r){var n=ae.$injector.annotate(t),i=te(t)?P(t):t;return new nr("",i,n).get(r)},t.prototype.makeComponentTemplate=function(t,e,r,n){n=n||{};var i=It.version.minor>=3?"::":"",o=function(t){var e=G(t);return/^(x|data)-/.exec(e)?"x-"+e:e},a=mt(r).map(function(r){var a=r.name,u=r.type,s=o(a);if(t.attr(s)&&!n[a])return s+"='"+t.attr(s)+"'";var c=n[a]||a;if("@"===u)return s+"='{{"+i+"$resolve."+c+"}}'";if("&"===u){var f=e.getResolvable(c),l=f&&f.data,h=l&&ae.$injector.annotate(l)||[];return s+"='$resolve."+c+(te(l)?"["+(l.length-1)+"]":"")+"("+h.join(",")+")'"}return s+"='"+i+"$resolve."+c+"'"}).join(" "),u=o(r);return"<"+u+" "+a+"></"+u+">"},t}(),ni=function(t){return ii(Xt(t.bindToController)?t.bindToController:t.scope)},ii=function(t){return Object.keys(t||{}).map(function(e){return[e,/^([=<@&])[?]?(.*)/.exec(t[e])]}).filter(function(t){return zt(t)&&te(t[1])}).map(function(t){return{name:t[1][2]||t[0],type:t[1][1]}})},oi=function(){function t(e,r){this.stateRegistry=e,this.stateService=r,h(Ut(t.prototype),this,Ut(this))}return t.prototype.decorator=function(t,e){return this.stateRegistry.decorator(t,e)||this},t.prototype.state=function(t,e){return Xt(t)?e=t:e.name=t,this.stateRegistry.register(e),this},t.prototype.onInvalid=function(t){return this.stateService.onInvalid(t)},t}(),ai=function(t){return function(e,r){var n=e[t],i="onExit"===t?"from":"to";return n?function(t,e){var r=new cr(t.treeChanges(i)),o=he(yi(r),{$state$:e,$transition$:t});return ae.$injector.invoke(n,this,o)}:void 0}},ui=function(){function t(t){this._urlListeners=[],this.$locationProvider=t;var e=Ut(t);h(e,this,e,["hashPrefix"])}return t.prototype.dispose=function(){},t.prototype.onChange=function(t){var e=this;return this._urlListeners.push(t),function(){return me(e._urlListeners)(t)}},t.prototype.html5Mode=function(){var t=this.$locationProvider.html5Mode();return(t=Xt(t)?t.enabled:t)&&this.$sniffer.history},t.prototype.url=function(t,e,r){return void 0===e&&(e=!1),t&&this.$location.url(t),e&&this.$location.replace(),r&&this.$location.state(r),this.$location.url()},t.prototype._runtimeServices=function(t,e,r,n){var i=this;this.$location=e,this.$sniffer=r,t.$on("$locationChangeSuccess",function(t){return i._urlListeners.forEach(function(e){return e(t)})});var o=Ut(e),a=Ut(n);h(o,this,o,["replace","path","search","hash"]),h(o,this,o,["port","protocol","host"]),h(a,this,a,["baseHref"])},t.monkeyPatchPathParameterType=function(t){var e=t.urlMatcherFactory.type("path");e.encode=function(t){return null!=t?t.toString().replace(/(~|\/)/g,function(t){return{"~":"~~","/":"~2F"}[t]}):t},e.decode=function(t){return null!=t?t.toString().replace(/(~~|~2F)/g,function(t){return{"~~":"~","~2F":"/"}[t]}):t}},t}(),si=function(){function t(t){this._router=t,this._urlRouter=t.urlRouter}return t.prototype.$get=function(){var t=this._urlRouter;return t.update(!0),t.interceptDeferred||t.listen(),t},t.prototype.rule=function(t){var e=this;if(!Kt(t))throw new Error("'rule' must be a function");var r=new Dr(function(){return t(ae.$injector,e._router.locationService)},f);return this._urlRouter.rule(r),this},t.prototype.otherwise=function(t){var e=this,r=this._urlRouter;if(Zt(t))r.otherwise(t);else{if(!Kt(t))throw new Error("'rule' must be a string or function");r.otherwise(function(){return t(ae.$injector,e._router.locationService)})}return this},t.prototype.when=function(e,r){return(te(r)||Kt(r))&&(r=t.injectableHandler(this._router,r)),this._urlRouter.when(e,r),this},t.injectableHandler=function(t,e){return function(r){return ae.$injector.invoke(e,null,{$match:r,$stateParams:t.globals.params})}},t.prototype.deferIntercept=function(t){this._urlRouter.deferIntercept(t)},t}();It.module("ui.router.angular1",[]);var ci=It.module("ui.router.init",[]),fi=It.module("ui.router.util",["ng","ui.router.init"]),li=It.module("ui.router.router",["ui.router.util"]),hi=It.module("ui.router.state",["ui.router.router","ui.router.util","ui.router.angular1"]),pi=It.module("ui.router",["ui.router.init","ui.router.state","ui.router.angular1"]),di=(It.module("ui.router.compat",["ui.router"]),null);yt.$inject=["$locationProvider"];var vi=function(t){return["$uiRouterProvider",function(e){var r=e.router[t];return r.$get=function(){return r},r}]};gt.$inject=["$injector","$q","$uiRouter"];_t.$inject=["$rootScope"],ci.provider("$uiRouter",yt),li.provider("$urlRouter",["$uiRouterProvider",function(t){return t.urlRouterProvider=new si(t)}]),fi.provider("$urlService",vi("urlService")),fi.provider("$urlMatcherFactory",["$uiRouterProvider",function(){return di.urlMatcherFactory}]),fi.provider("$templateFactory",function(){return new ri}),hi.provider("$stateRegistry",vi("stateRegistry")),hi.provider("$uiRouterGlobals",vi("globals")),hi.provider("$transitions",vi("transitionService")),hi.provider("$state",["$uiRouterProvider",function(){return he(di.stateProvider,{$get:function(){return di.stateService}})}]),hi.factory("$stateParams",["$uiRouter",function(t){return t.globals.params}]),pi.factory("$view",function(){return di.viewService}),pi.service("$trace",function(){return Be}),pi.run(_t),fi.run(["$urlMatcherFactory",function(t){}]),hi.run(["$state",function(t){}]),li.run(["$urlRouter",function(t){}]),ci.run(gt);var mi,yi=function(t){return t.getTokens().filter(Zt).map(function(e){var r=t.getResolvable(e);return[e,"NOWAIT"===t.getPolicy(r).async?r.promise:r.data]}).reduce(C,{})};mi=["$uiRouter","$timeout",function(t,e){var r=t.stateService;return{restrict:"A",require:["?^uiSrefActive","?^uiSrefActiveEq"],link:function(n,i,o,a){function u(){var t=p();l&&l(),f&&(l=f.$$addStateInfo(t.uiState,t.uiStateParams)),null!=t.href&&o.$set(c.attr,t.href)}var s,c=bt(i),f=a[1]||a[0],l=null,h={},p=function(){return St(r,i,h)},d=wt(o.uiSref);h.uiState=d.state,h.uiStateOpts=o.uiSrefOpts?n.$eval(o.uiSrefOpts):{},d.paramExpr&&(n.$watch(d.paramExpr,function(t){h.uiStateParams=he({},t),u()},!0),h.uiStateParams=he({},n.$eval(d.paramExpr))),u(),n.$on("$destroy",t.stateRegistry.onStatesChanged(u)),n.$on("$destroy",t.transitionService.onSuccess({},u)),c.clickable&&(s=Rt(i,r,e,c,p),Tt(i,n,s,h.uiStateOpts))}}}];var gi;gi=["$uiRouter","$timeout",function(t,e){var r=t.stateService;return{restrict:"A",require:["?^uiSrefActive","?^uiSrefActiveEq"],link:function(n,i,o,a){function u(){var t=d();h&&h(),f&&(h=f.$$addStateInfo(t.uiState,t.uiStateParams)),null!=t.href&&o.$set(c.attr,t.href)}var s,c=bt(i),f=a[1]||a[0],h=null,p={},d=function(){return St(r,i,p)},v=["uiState","uiStateParams","uiStateOpts"],m=v.reduce(function(t,e){return t[e]=l,t},{});v.forEach(function(t){p[t]=o[t]?n.$eval(o[t]):null,o.$observe(t,function(e){m[t](),m[t]=n.$watch(e,function(e){p[t]=e,u()},!0)})}),u(),n.$on("$destroy",t.stateRegistry.onStatesChanged(u)),n.$on("$destroy",t.transitionService.onSuccess({},u)),c.clickable&&(s=Rt(i,r,e,c,d),Tt(i,n,s,p.uiStateOpts))}}}];var _i;_i=["$state","$stateParams","$interpolate","$uiRouter",function(t,e,r,n){return{restrict:"A",controller:["$scope","$element","$attrs",function(e,i,o){function a(t){t.promise.then(s,l)}function u(e,r,n){var o={state:t.get(e,$t(i))||{name:e},params:r,activeClass:n};return p.push(o),function(){me(p)(o)}}function s(){var r=function(t){return t.split(/\s/).filter(f)},n=function(t){return t.map(function(t){return t.activeClass}).map(r).reduce(Re,[])},o=n(p).concat(r(c)).reduce(Te,[]),a=n(p.filter(function(e){return t.includes(e.state.name,e.params)})),u=!!p.filter(function(e){return t.is(e.state.name,e.params)}).length?r(c):[],s=a.concat(u).reduce(Te,[]),l=o.filter(function(t){return!ve(s,t)});e.$evalAsync(function(){s.forEach(function(t){return i.addClass(t)}),l.forEach(function(t){return i.removeClass(t)})})}var c,h,p=[];c=r(o.uiSrefActiveEq||"",!1)(e);try{h=e.$eval(o.uiSrefActive)}catch(t){}h=h||r(o.uiSrefActive||"",!1)(e),Xt(h)&&le(h,function(t,r){if(Zt(t)){var n=wt(t);u(n.state,e.$eval(n.paramExpr),r)}}),this.$$addStateInfo=function(t,e){if(!(Xt(h)&&p.length>0)){var r=u(t,e,h);return s(),r}},e.$on("$stateChangeSuccess",s),e.$on("$destroy",n.transitionService.onStart({},a)),n.globals.transition&&a(n.globals.transition),s()}]}}],It.module("ui.router.state").directive("uiSref",mi).directive("uiSrefActive",_i).directive("uiSrefActiveEq",_i).directive("uiState",gi),Ct.$inject=["$state"],Pt.$inject=["$state"],It.module("ui.router.state").filter("isState",Ct).filter("includedByState",Pt);var wi;wi=["$view","$animate","$uiViewScroll","$interpolate","$q",function(t,e,r,n,i){function o(t,r){return{enter:function(t,r,n){It.version.minor>2?e.enter(t,null,r).then(n):e.enter(t,null,r,n)},leave:function(t,r){It.version.minor>2?e.leave(t).then(r):e.leave(t,r)}}}function a(t,e){return t===e}var u={$cfg:{viewDecl:{$context:t._pluginapi._rootViewContext()}},$uiView:{}},s={count:0,restrict:"ECA",terminal:!0,priority:400,transclude:"element",compile:function(e,c,f){return function(e,c,l){function h(){if(d&&(Be.traceUIViewEvent("Removing (previous) el",d.data("$uiView")),d.remove(),d=null),m&&(Be.traceUIViewEvent("Destroying scope",R),m.$destroy(),m=null),v){var t=v.data("$uiViewAnim");Be.traceUIViewEvent("Animate out",t),w.leave(v,function(){t.$$animLeave.resolve(),d=null}),d=v,v=null}}function p(t){var n=e.$new(),o=i.defer(),a=i.defer(),u={$cfg:t,$uiView:R},s={$animEnter:o.promise,$animLeave:a.promise,$$animLeave:a};n.$emit("$viewContentLoading",b);var l=f(n,function(t){t.data("$uiViewAnim",s),t.data("$uiView",u),w.enter(t,c,function(){o.resolve(),m&&m.$emit("$viewContentAnimationEnded"),(zt(_)&&!_||e.$eval(_))&&r(t)}),h()});v=l,(m=n).$emit("$viewContentLoaded",t||$),m.$eval(g)}var d,v,m,y,g=l.onload||"",_=l.autoscroll,w=o(),$=void 0,S=c.inheritedData("$uiView")||u,b=n(l.uiView||l.name||"")(e)||"$default",R={$type:"ng1",id:s.count++,name:b,fqn:S.$uiView.fqn?S.$uiView.fqn+"."+b:b,config:null,configUpdated:function(t){(!t||t instanceof ei)&&(a($,t)||(Be.traceUIViewConfigUpdated(R,t&&t.viewDecl&&t.viewDecl.$context),$=t,p(t)))},get creationContext(){var t=At("$cfg.viewDecl.$context")(S),e=At("$uiView.creationContext")(S);return t||e}};Be.traceUIViewEvent("Linking",R),c.data("$uiView",{$uiView:R}),p(),y=t.registerUIView(R),e.$on("$destroy",function(){Be.traceUIViewEvent("Destroying/Unregistering",R),y()})}}};return s}],kt.$inject=["$compile","$controller","$transitions","$view","$q","$timeout"];var $i="function"==typeof It.module("ui.router").component,Si=0;It.module("ui.router.state").directive("uiView",wi),It.module("ui.router.state").directive("uiView",kt),It.module("ui.router.state").provider("$uiViewScroll",function(){var t=!1;this.useAnchorScroll=function(){t=!0},this.$get=["$anchorScroll","$timeout",function(e,r){return t?e:function(t){return r(function(){t[0].scrollIntoView()},0,!1)}}]});t.default="ui.router",t.core=Zn,t.watchDigests=_t,t.getLocals=yi,t.getNg1ViewConfigFactory=dt,t.ng1ViewsBuilder=vt,t.Ng1ViewConfig=ei,t.StateProvider=oi,t.UrlRouterProvider=si,t.root=ue,t.fromJson=ce,t.toJson=fe,t.forEach=le,t.extend=he,t.equals=pe,t.identity=f,t.noop=l,t.createProxyFunctions=h,t.inherit=de,t.inArray=ve,t._inArray=p,t.removeFrom=me,t._removeFrom=d,t.pushTo=ye,t._pushTo=v,t.deregAll=ge,t.defaults=m,t.mergeR=_e,t.ancestors=y,t.pick=g,t.omit=_,t.pluck=w,t.filter=$,t.find=S,t.mapObj=we,t.map=b,t.values=$e,t.allTrueR=Se,t.anyTrueR=be,t.unnestR=Re,t.flattenR=Ee,t.pushR=R,t.uniqR=Te,t.unnest=Ce,t.flatten=Pe,t.assertPredicate=ke,t.assertMap=Oe,t.assertFn=E,t.pairs=xe,t.arrayTuples=T,t.applyPairs=C,t.tail=P,t.copy=k,t._extend=O,t.silenceUncaughtInPromise=Ie,t.silentRejection=je,t.notImplemented=oe,t.services=ae,t.Glob=Lt,t.curry=r,t.compose=n,t.pipe=i,t.prop=jt,t.propEq=Vt,t.parse=At,t.not=Ht,t.and=o,t.or=a,t.all=qt,t.any=Dt,t.is=Ft,t.eq=Nt,t.val=Ut,t.invoke=u,t.pattern=s,t.isUndefined=Wt,t.isDefined=zt,t.isNull=Jt,t.isNullOrUndefined=Qt,t.isFunction=Kt,t.isNumber=Yt,t.isString=Zt,t.isObject=Xt,t.isArray=te,t.isDate=ee,t.isRegExp=re,t.isState=ne,t.isInjectable=c,t.isPromise=ie,t.Queue=Ve,t.maxLength=M,t.padString=B,t.kebobString=G,t.functionToString=W,t.fnToString=z,t.stringify=J,t.beforeAfterSubstr=vr,t.hostRegex=mr,t.stripFile=yr,t.splitHash=gr,t.splitQuery=_r,t.splitEqual=wr,t.trimHashVal=$r,t.splitOnDelim=Q,t.joinNeighborsR=K,t.Trace=Me,t.trace=Be,t.Param=Xe,t.ParamTypes=Sr,t.StateParams=Rr,t.ParamType=Ke,t.PathNode=tr,t.PathUtils=er,t.resolvePolicies=ir,t.defaultResolvePolicy=rr,t.Resolvable=nr,t.NATIVE_INJECTOR_TOKEN=sr,t.ResolveContext=cr,t.resolvablesBuilder=rt,t.StateBuilder=kr,t.StateObject=Mt,t.StateMatcher=Or,t.StateQueueManager=xr,t.StateRegistry=Ir,t.StateService=On,t.TargetState=Ge,t.HookBuilder=Qe,t.matchState=A,t.RegisteredHook=Je,t.makeEvent=H,t.Rejection=He,t.Transition=hr,t.TransitionHook=ze,t.TransitionEventType=En,t.defaultTransOpts=Pn,t.TransitionService=kn,t.UrlMatcher=Ar,t.UrlMatcherFactory=Hr,t.UrlRouter=Mr,t.UrlRuleFactory=qr,t.BaseUrlRule=Dr,t.UrlService=Zr,t.ViewService=Br,t.UIRouterGlobals=Gr,t.UIRouter=tn,t.$q=xn,t.$injector=An,t.BaseLocationServices=Fn,t.HashLocationService=Un,t.MemoryLocationService=Mn,t.PushStateLocationService=Gn,t.MemoryLocationConfig=Wn,t.BrowserLocationConfig=zn,t.keyValsToObjectR=Hn,t.getParams=qn,t.parseUrl=lt,t.buildUrl=Dn,t.locationPluginFactory=ht,t.servicesPlugin=pt,t.hashLocationPlugin=Jn,t.pushStateLocationPlugin=Qn,t.memoryLocationPlugin=Kn,t.UIRouterPluginBase=Yn,Object.defineProperty(t,"__esModule",{value:!0})});
//# sourceMappingURL=angular-ui-router.min.js.map

/*! Raven.js 3.19.1 (fee3771) | github.com/getsentry/raven-js */
!function(a){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=a();else if("function"==typeof define&&define.amd)define([],a);else{var b;b="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,b=b.Raven||(b.Raven={}),b=b.Plugins||(b.Plugins={}),b.Angular=a()}}(function(){return function a(b,c,d){function e(g,h){if(!c[g]){if(!b[g]){var i="function"==typeof require&&require;if(!h&&i)return i(g,!0);if(f)return f(g,!0);var j=new Error("Cannot find module '"+g+"'");throw j.code="MODULE_NOT_FOUND",j}var k=c[g]={exports:{}};b[g][0].call(k.exports,function(a){var c=b[g][1][a];return e(c?c:a)},k,k.exports,a,b,c,d)}return c[g].exports}for(var f="function"==typeof require&&require,g=0;g<d.length;g++)e(d[g]);return e}({1:[function(a,b,c){function d(a,b){function c(){this.$get=["$window",function(b){return a}]}function f(a){a.decorator("$exceptionHandler",["Raven","$delegate",h])}function h(a,b){return function(c,d){a.captureException(c,{extra:{cause:d}}),b(c,d)}}b=b||window.angular,b&&(b.module(g,[]).provider("Raven",c).config(["$provide",f]),a.setDataCallback(e(function(a){return d.a(a)})))}var e=a(2).wrappedCallback,f=/^\[((?:[$a-zA-Z0-9]+:)?(?:[$a-zA-Z0-9]+))\] (.*?)\n?(\S+)$/,g="ngRaven";d.a=function(a){var b=a.exception;if(b){b=b.values[0];var c=f.exec(b.value);c&&(b.type=c[1],b.value=c[2],a.message=b.type+": "+b.value,a.extra.angularDocs=c[3].substr(0,250))}return a},d.moduleName=g,b.exports=d},{2:2}],2:[function(a,b,c){(function(a){function c(a){return"object"==typeof a&&null!==a}function d(a){switch({}.toString.call(a)){case"[object Error]":return!0;case"[object Exception]":return!0;case"[object DOMException]":return!0;default:return a instanceof Error}}function e(a){return j()&&"[object ErrorEvent]"==={}.toString.call(a)}function f(a){return void 0===a}function g(a){return"function"==typeof a}function h(a){return"[object String]"===Object.prototype.toString.call(a)}function i(a){for(var b in a)return!1;return!0}function j(){try{return new ErrorEvent(""),!0}catch(a){return!1}}function k(a){function b(b,c){var d=a(b)||b;return c?c(d)||d:d}return b}function l(a,b){var c,d;if(f(a.length))for(c in a)p(a,c)&&b.call(null,c,a[c]);else if(d=a.length)for(c=0;c<d;c++)b.call(null,c,a[c])}function m(a,b){return b?(l(b,function(b,c){a[b]=c}),a):a}function n(a){return!!Object.isFrozen&&Object.isFrozen(a)}function o(a,b){return!b||a.length<=b?a:a.substr(0,b)+"…"}function p(a,b){return Object.prototype.hasOwnProperty.call(a,b)}function q(a){for(var b,c=[],d=0,e=a.length;d<e;d++)b=a[d],h(b)?c.push(b.replace(/([.*+?^=!:${}()|\[\]\/\\])/g,"\\$1")):b&&b.source&&c.push(b.source);return new RegExp(c.join("|"),"i")}function r(a){var b=[];return l(a,function(a,c){b.push(encodeURIComponent(a)+"="+encodeURIComponent(c))}),b.join("&")}function s(a){var b=a.match(/^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/);if(!b)return{};var c=b[6]||"",d=b[8]||"";return{protocol:b[2],host:b[4],path:b[5],relative:b[5]+c+d}}function t(){var a=A.crypto||A.msCrypto;if(!f(a)&&a.getRandomValues){var b=new Uint16Array(8);a.getRandomValues(b),b[3]=4095&b[3]|16384,b[4]=16383&b[4]|32768;var c=function(a){for(var b=a.toString(16);b.length<4;)b="0"+b;return b};return c(b[0])+c(b[1])+c(b[2])+c(b[3])+c(b[4])+c(b[5])+c(b[6])+c(b[7])}return"xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g,function(a){var b=16*Math.random()|0,c="x"===a?b:3&b|8;return c.toString(16)})}function u(a){for(var b,c=5,d=80,e=[],f=0,g=0,h=" > ",i=h.length;a&&f++<c&&(b=v(a),!("html"===b||f>1&&g+e.length*i+b.length>=d));)e.push(b),g+=b.length,a=a.parentNode;return e.reverse().join(h)}function v(a){var b,c,d,e,f,g=[];if(!a||!a.tagName)return"";if(g.push(a.tagName.toLowerCase()),a.id&&g.push("#"+a.id),b=a.className,b&&h(b))for(c=b.split(/\s+/),f=0;f<c.length;f++)g.push("."+c[f]);var i=["type","name","title","alt"];for(f=0;f<i.length;f++)d=i[f],e=a.getAttribute(d),e&&g.push("["+d+'="'+e+'"]');return g.join("")}function w(a,b){return!!(!!a^!!b)}function x(a,b){return!w(a,b)&&(a=a.values[0],b=b.values[0],a.type===b.type&&a.value===b.value&&y(a.stacktrace,b.stacktrace))}function y(a,b){if(w(a,b))return!1;var c=a.frames,d=b.frames;if(c.length!==d.length)return!1;for(var e,f,g=0;g<c.length;g++)if(e=c[g],f=d[g],e.filename!==f.filename||e.lineno!==f.lineno||e.colno!==f.colno||e["function"]!==f["function"])return!1;return!0}function z(a,b,c,d){var e=a[b];a[b]=c(e),d&&d.push([a,b,e])}var A="undefined"!=typeof window?window:"undefined"!=typeof a?a:"undefined"!=typeof self?self:{};b.exports={isObject:c,isError:d,isErrorEvent:e,isUndefined:f,isFunction:g,isString:h,isEmptyObject:i,supportsErrorEvent:j,wrappedCallback:k,each:l,objectMerge:m,truncate:o,objectFrozen:n,hasKey:p,joinRegExp:q,urlencode:r,uuid4:t,htmlTreeAsString:u,htmlElementAsString:v,isSameException:x,isSameStacktrace:y,parseUrl:s,fill:z}}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}]},{},[1])(1)});
//# sourceMappingURL=angular.min.js.map
/*!
 * angular-translate - v2.15.2 - 2017-06-22
 * 
 * Copyright (c) 2017 The angular-translate team, Pascal Precht; Licensed MIT
 */
!function(a,b){"function"==typeof define&&define.amd?define([],function(){return b()}):"object"==typeof module&&module.exports?module.exports=b():b()}(0,function(){function a(a){"use strict";var b=a.storageKey(),c=a.storage(),d=function(){var d=a.preferredLanguage();angular.isString(d)?a.use(d):c.put(b,a.use())};d.displayName="fallbackFromIncorrectStorageValue",c?c.get(b)?a.use(c.get(b)).catch(d):d():angular.isString(a.preferredLanguage())&&a.use(a.preferredLanguage())}function b(){"use strict";var a,b,c,d=null,e=!1,f=!1;c={sanitize:function(a,b){return"text"===b&&(a=h(a)),a},escape:function(a,b){return"text"===b&&(a=g(a)),a},sanitizeParameters:function(a,b){return"params"===b&&(a=j(a,h)),a},escapeParameters:function(a,b){return"params"===b&&(a=j(a,g)),a},sce:function(a,b,c){return"text"===b?a=i(a):"params"===b&&"filter"!==c&&(a=j(a,g)),a},sceParameters:function(a,b){return"params"===b&&(a=j(a,i)),a}},c.escaped=c.escapeParameters,this.addStrategy=function(a,b){return c[a]=b,this},this.removeStrategy=function(a){return delete c[a],this},this.useStrategy=function(a){return e=!0,d=a,this},this.$get=["$injector","$log",function(g,h){var i={},j=function(a,b,d,e){return angular.forEach(e,function(e){if(angular.isFunction(e))a=e(a,b,d);else if(angular.isFunction(c[e]))a=c[e](a,b,d);else{if(!angular.isString(c[e]))throw new Error("pascalprecht.translate.$translateSanitization: Unknown sanitization strategy: '"+e+"'");if(!i[c[e]])try{i[c[e]]=g.get(c[e])}catch(a){throw i[c[e]]=function(){},new Error("pascalprecht.translate.$translateSanitization: Unknown sanitization strategy: '"+e+"'")}a=i[c[e]](a,b,d)}}),a},k=function(){e||f||(h.warn("pascalprecht.translate.$translateSanitization: No sanitization strategy has been configured. This can have serious security implications. See http://angular-translate.github.io/docs/#/guide/19_security for details."),f=!0)};return g.has("$sanitize")&&(a=g.get("$sanitize")),g.has("$sce")&&(b=g.get("$sce")),{useStrategy:function(a){return function(b){a.useStrategy(b)}}(this),sanitize:function(a,b,c,e){if(d||k(),c||null===c||(c=d),!c)return a;e||(e="service");var f=angular.isArray(c)?c:[c];return j(a,b,e,f)}}}];var g=function(a){var b=angular.element("<div></div>");return b.text(a),b.html()},h=function(b){if(!a)throw new Error("pascalprecht.translate.$translateSanitization: Error cannot find $sanitize service. Either include the ngSanitize module (https://docs.angularjs.org/api/ngSanitize) or use a sanitization strategy which does not depend on $sanitize, such as 'escape'.");return a(b)},i=function(a){if(!b)throw new Error("pascalprecht.translate.$translateSanitization: Error cannot find $sce service.");return b.trustAsHtml(a)},j=function(a,b,c){if(angular.isDate(a))return a;if(angular.isObject(a)){var d=angular.isArray(a)?[]:{};if(c){if(c.indexOf(a)>-1)throw new Error("pascalprecht.translate.$translateSanitization: Error cannot interpolate parameter due recursive object")}else c=[];return c.push(a),angular.forEach(a,function(a,e){angular.isFunction(a)||(d[e]=j(a,b,c))}),c.splice(-1,1),d}return angular.isNumber(a)?a:!0===a||!1===a?a:angular.isUndefined(a)||null===a?a:b(a)}}function c(a,b,c,d){"use strict";var e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u={},v=[],w=a,x=[],y="translate-cloak",z=!1,A=!1,B=".",C=!1,D=!1,E=0,F=!0,G="default",H={default:function(a){return(a||"").split("-").join("_")},java:function(a){var b=(a||"").split("-").join("_"),c=b.split("_");return c.length>1?c[0].toLowerCase()+"_"+c[1].toUpperCase():b},bcp47:function(a){var b=(a||"").split("_").join("-"),c=b.split("-");return c.length>1?c[0].toLowerCase()+"-"+c[1].toUpperCase():b},"iso639-1":function(a){return(a||"").split("_").join("-").split("-")[0].toLowerCase()}},I=function(){if(angular.isFunction(d.getLocale))return d.getLocale();var a,c,e=b.$get().navigator,f=["language","browserLanguage","systemLanguage","userLanguage"];if(angular.isArray(e.languages))for(a=0;a<e.languages.length;a++)if((c=e.languages[a])&&c.length)return c;for(a=0;a<f.length;a++)if((c=e[f[a]])&&c.length)return c;return null};I.displayName="angular-translate/service: getFirstBrowserLanguage";var J=function(){var a=I()||"";return H[G]&&(a=H[G](a)),a};J.displayName="angular-translate/service: getLocale";var K=function(a,b){for(var c=0,d=a.length;c<d;c++)if(a[c]===b)return c;return-1},L=function(){return this.toString().replace(/^\s+|\s+$/g,"")},M=function(a){if(a){for(var b=[],c=angular.lowercase(a),d=0,e=v.length;d<e;d++)b.push(angular.lowercase(v[d]));if(K(b,c)>-1)return a;if(f){var g;for(var h in f)if(f.hasOwnProperty(h)){var i=!1,j=Object.prototype.hasOwnProperty.call(f,h)&&angular.lowercase(h)===angular.lowercase(a);if("*"===h.slice(-1)&&(i=h.slice(0,-1)===a.slice(0,h.length-1)),(j||i)&&(g=f[h],K(b,angular.lowercase(g))>-1))return g}}var k=a.split("_");return k.length>1&&K(b,angular.lowercase(k[0]))>-1?k[0]:void 0}},N=function(a,b){if(!a&&!b)return u;if(a&&!b){if(angular.isString(a))return u[a]}else angular.isObject(u[a])||(u[a]={}),angular.extend(u[a],O(b));return this};this.translations=N,this.cloakClassName=function(a){return a?(y=a,this):y},this.nestedObjectDelimeter=function(a){return a?(B=a,this):B};var O=function(a,b,c,d){var e,f,g,h;b||(b=[]),c||(c={});for(e in a)Object.prototype.hasOwnProperty.call(a,e)&&(h=a[e],angular.isObject(h)?O(h,b.concat(e),c,e):(f=b.length?""+b.join(B)+B+e:e,b.length&&e===d&&(g=""+b.join(B),c[g]="@:"+f),c[f]=h));return c};O.displayName="flatObject",this.addInterpolation=function(a){return x.push(a),this},this.useMessageFormatInterpolation=function(){return this.useInterpolation("$translateMessageFormatInterpolation")},this.useInterpolation=function(a){return n=a,this},this.useSanitizeValueStrategy=function(a){return c.useStrategy(a),this},this.preferredLanguage=function(a){return a?(P(a),this):e};var P=function(a){return a&&(e=a),e};this.translationNotFoundIndicator=function(a){return this.translationNotFoundIndicatorLeft(a),this.translationNotFoundIndicatorRight(a),this},this.translationNotFoundIndicatorLeft=function(a){return a?(q=a,this):q},this.translationNotFoundIndicatorRight=function(a){return a?(r=a,this):r},this.fallbackLanguage=function(a){return Q(a),this};var Q=function(a){return a?(angular.isString(a)?(h=!0,g=[a]):angular.isArray(a)&&(h=!1,g=a),angular.isString(e)&&K(g,e)<0&&g.push(e),this):h?g[0]:g};this.use=function(a){if(a){if(!u[a]&&!o)throw new Error("$translateProvider couldn't find translationTable for langKey: '"+a+"'");return i=a,this}return i},this.resolveClientLocale=function(){return J()};var R=function(a){return a?(w=a,this):l?l+w:w};this.storageKey=R,this.useUrlLoader=function(a,b){return this.useLoader("$translateUrlLoader",angular.extend({url:a},b))},this.useStaticFilesLoader=function(a){return this.useLoader("$translateStaticFilesLoader",a)},this.useLoader=function(a,b){return o=a,p=b||{},this},this.useLocalStorage=function(){return this.useStorage("$translateLocalStorage")},this.useCookieStorage=function(){return this.useStorage("$translateCookieStorage")},this.useStorage=function(a){return k=a,this},this.storagePrefix=function(a){return a?(l=a,this):a},this.useMissingTranslationHandlerLog=function(){return this.useMissingTranslationHandler("$translateMissingTranslationHandlerLog")},this.useMissingTranslationHandler=function(a){return m=a,this},this.usePostCompiling=function(a){return z=!!a,this},this.forceAsyncReload=function(a){return A=!!a,this},this.uniformLanguageTag=function(a){return a?angular.isString(a)&&(a={standard:a}):a={},G=a.standard,this},this.determinePreferredLanguage=function(a){var b=a&&angular.isFunction(a)?a():J();return e=v.length?M(b)||b:b,this},this.registerAvailableLanguageKeys=function(a,b){return a?(v=a,b&&(f=b),this):v},this.useLoaderCache=function(a){return!1===a?s=void 0:!0===a?s=!0:void 0===a?s="$translationCache":a&&(s=a),this},this.directivePriority=function(a){return void 0===a?E:(E=a,this)},this.statefulFilter=function(a){return void 0===a?F:(F=a,this)},this.postProcess=function(a){return t=a||void 0,this},this.keepContent=function(a){return D=!!a,this},this.$get=["$log","$injector","$rootScope","$q",function(a,b,c,d){var f,l,G,H=b.get(n||"$translateDefaultInterpolation"),I=!1,S={},T={},U=function(a,b,c,h,j){!i&&e&&(i=e);var m=j&&j!==i?M(j)||j:i;if(j&&ja(j),angular.isArray(a)){return function(a){for(var e={},f=[],g=0,i=a.length;g<i;g++)f.push(function(a){var f=d.defer(),g=function(b){e[a]=b,f.resolve([a,b])};return U(a,b,c,h,j).then(g,g),f.promise}(a[g]));return d.all(f).then(function(){return e})}(a)}var n=d.defer();a&&(a=L.apply(a));var o=function(){var a=e?T[e]:T[m];if(l=0,k&&!a){var b=f.get(w);if(a=T[b],g&&g.length){var c=K(g,b);l=0===c?1:0,K(g,e)<0&&g.push(e)}}return a}();if(o){var p=function(){j||(m=i),fa(a,b,c,h,m).then(n.resolve,n.reject)};p.displayName="promiseResolved",o.finally(p).catch(angular.noop)}else fa(a,b,c,h,m).then(n.resolve,n.reject);return n.promise},V=function(a){return q&&(a=[q,a].join(" ")),r&&(a=[a,r].join(" ")),a},W=function(a){i=a,k&&f.put(U.storageKey(),i),c.$emit("$translateChangeSuccess",{language:a}),H.setLocale(i);var b=function(a,b){S[b].setLocale(i)};b.displayName="eachInterpolatorLocaleSetter",angular.forEach(S,b),c.$emit("$translateChangeEnd",{language:a})},X=function(a){if(!a)throw"No language key specified for loading.";var e=d.defer();c.$emit("$translateLoadingStart",{language:a}),I=!0;var f=s;"string"==typeof f&&(f=b.get(f));var g=angular.extend({},p,{key:a,$http:angular.extend({},{cache:f},p.$http)}),h=function(b){var d={};c.$emit("$translateLoadingSuccess",{language:a}),angular.isArray(b)?angular.forEach(b,function(a){angular.extend(d,O(a))}):angular.extend(d,O(b)),I=!1,e.resolve({key:a,table:d}),c.$emit("$translateLoadingEnd",{language:a})};h.displayName="onLoaderSuccess";var i=function(a){c.$emit("$translateLoadingError",{language:a}),e.reject(a),c.$emit("$translateLoadingEnd",{language:a})};return i.displayName="onLoaderError",b.get(o)(g).then(h,i),e.promise};if(k&&(f=b.get(k),!f.get||!f.put))throw new Error("Couldn't use storage '"+k+"', missing get() or put() method!");if(x.length){var Y=function(a){var c=b.get(a);c.setLocale(e||i),S[c.getInterpolationIdentifier()]=c};Y.displayName="interpolationFactoryAdder",angular.forEach(x,Y)}var Z=function(a){var b=d.defer();if(Object.prototype.hasOwnProperty.call(u,a))b.resolve(u[a]);else if(T[a]){var c=function(a){N(a.key,a.table),b.resolve(a.table)};c.displayName="translationTableResolver",T[a].then(c,b.reject)}else b.reject();return b.promise},$=function(a,b,c,e,f){var g=d.defer(),h=function(d){if(Object.prototype.hasOwnProperty.call(d,b)&&null!==d[b]){e.setLocale(a);var h=d[b];if("@:"===h.substr(0,2))$(a,h.substr(2),c,e,f).then(g.resolve,g.reject);else{var j=e.interpolate(d[b],c,"service",f,b);j=ia(b,d[b],j,c,a),g.resolve(j)}e.setLocale(i)}else g.reject()};return h.displayName="fallbackTranslationResolver",Z(a).then(h,g.reject),g.promise},_=function(a,b,c,d,e){var f,g=u[a];if(g&&Object.prototype.hasOwnProperty.call(g,b)&&null!==g[b]){if(d.setLocale(a),f=d.interpolate(g[b],c,"filter",e,b),f=ia(b,g[b],f,c,a,e),!angular.isString(f)&&angular.isFunction(f.$$unwrapTrustedValue)){var h=f.$$unwrapTrustedValue();if("@:"===h.substr(0,2))return _(a,h.substr(2),c,d,e)}else if("@:"===f.substr(0,2))return _(a,f.substr(2),c,d,e);d.setLocale(i)}return f},aa=function(a,c,d,e){return m?b.get(m)(a,i,c,d,e):a},ba=function(a,b,c,e,f,h){var i=d.defer();if(a<g.length){var j=g[a];$(j,b,c,e,h).then(function(a){i.resolve(a)},function(){return ba(a+1,b,c,e,f,h).then(i.resolve,i.reject)})}else if(f)i.resolve(f);else{var k=aa(b,c,f);m&&k?i.resolve(k):i.reject(V(b))}return i.promise},ca=function(a,b,c,d,e){var f;if(a<g.length){var h=g[a];f=_(h,b,c,d,e),f||""===f||(f=ca(a+1,b,c,d))}return f},da=function(a,b,c,d,e){return ba(G>0?G:l,a,b,c,d,e)},ea=function(a,b,c,d){return ca(G>0?G:l,a,b,c,d)},fa=function(a,b,c,e,f,h){var i=d.defer(),j=f?u[f]:u,k=c?S[c]:H;if(j&&Object.prototype.hasOwnProperty.call(j,a)&&null!==j[a]){var l=j[a];if("@:"===l.substr(0,2))U(l.substr(2),b,c,e,f).then(i.resolve,i.reject);else{var n=k.interpolate(l,b,"service",h,a);n=ia(a,l,n,b,f),i.resolve(n)}}else{var o;m&&!I&&(o=aa(a,b,e)),f&&g&&g.length?da(a,b,k,e,h).then(function(a){i.resolve(a)},function(a){i.reject(V(a))}):m&&!I&&o?e?i.resolve(e):i.resolve(o):e?i.resolve(e):i.reject(V(a))}return i.promise},ga=function(a,b,c,d,e){var f,h=d?u[d]:u,i=H;if(S&&Object.prototype.hasOwnProperty.call(S,c)&&(i=S[c]),h&&Object.prototype.hasOwnProperty.call(h,a)&&null!==h[a]){var j=h[a];"@:"===j.substr(0,2)?f=ga(j.substr(2),b,c,d,e):(f=i.interpolate(j,b,"filter",e,a),f=ia(a,j,f,b,d,e))}else{var k;m&&!I&&(k=aa(a,b,e)),d&&g&&g.length?(l=0,f=ea(a,b,i,e)):f=m&&!I&&k?k:V(a)}return f},ha=function(a){j===a&&(j=void 0),T[a]=void 0},ia=function(a,c,d,e,f,g){var h=t;return h&&("string"==typeof h&&(h=b.get(h)),h)?h(a,c,d,e,f,g):d},ja=function(a){u[a]||!o||T[a]||(T[a]=X(a).then(function(a){return N(a.key,a.table),a}))};U.preferredLanguage=function(a){return a&&P(a),e},U.cloakClassName=function(){return y},U.nestedObjectDelimeter=function(){return B},U.fallbackLanguage=function(a){if(void 0!==a&&null!==a){if(Q(a),o&&g&&g.length)for(var b=0,c=g.length;b<c;b++)T[g[b]]||(T[g[b]]=X(g[b]));U.use(U.use())}return h?g[0]:g},U.useFallbackLanguage=function(a){if(void 0!==a&&null!==a)if(a){var b=K(g,a);b>-1&&(G=b)}else G=0},U.proposedLanguage=function(){return j},U.storage=function(){return f},U.negotiateLocale=M,U.use=function(a){if(!a)return i;var b=d.defer();b.promise.then(null,angular.noop),c.$emit("$translateChangeStart",{language:a});var e=M(a);return v.length>0&&!e?d.reject(a):(e&&(a=e),j=a,!A&&u[a]||!o||T[a]?T[a]?T[a].then(function(a){return j===a.key&&W(a.key),b.resolve(a.key),a},function(a){return!i&&g&&g.length>0&&g[0]!==a?U.use(g[0]).then(b.resolve,b.reject):b.reject(a)}):(b.resolve(a),W(a)):(T[a]=X(a).then(function(c){return N(c.key,c.table),b.resolve(c.key),j===a&&W(c.key),c},function(a){return c.$emit("$translateChangeError",{language:a}),b.reject(a),c.$emit("$translateChangeEnd",{language:a}),d.reject(a)}),T[a].finally(function(){ha(a)}).catch(angular.noop)),b.promise)},U.resolveClientLocale=function(){return J()},U.storageKey=function(){return R()},U.isPostCompilingEnabled=function(){return z},U.isForceAsyncReloadEnabled=function(){return A},U.isKeepContent=function(){return D},U.refresh=function(a){function b(a){var b=X(a);return T[a]=b,b.then(function(b){u[a]={},N(a,b.table),f[a]=!0},angular.noop),b}if(!o)throw new Error("Couldn't refresh translation table, no loader registered!");c.$emit("$translateRefreshStart",{language:a});var e=d.defer(),f={};if(e.promise.then(function(){for(var a in u)u.hasOwnProperty(a)&&(a in f||delete u[a]);i&&W(i)},angular.noop).finally(function(){c.$emit("$translateRefreshEnd",{language:a})}),a)u[a]?b(a).then(e.resolve,e.reject):e.reject();else{var h=g&&g.slice()||[];i&&-1===h.indexOf(i)&&h.push(i),d.all(h.map(b)).then(e.resolve,e.reject)}return e.promise},U.instant=function(a,b,c,d,f){var h=d&&d!==i?M(d)||d:i;if(null===a||angular.isUndefined(a))return a;if(d&&ja(d),angular.isArray(a)){for(var j={},k=0,l=a.length;k<l;k++)j[a[k]]=U.instant(a[k],b,c,d,f);return j}if(angular.isString(a)&&a.length<1)return a;a&&(a=L.apply(a));var n,o=[];e&&o.push(e),h&&o.push(h),g&&g.length&&(o=o.concat(g));for(var p=0,s=o.length;p<s;p++){var t=o[p];if(u[t]&&void 0!==u[t][a]&&(n=ga(a,b,c,h,f)),void 0!==n)break}if(!n&&""!==n)if(q||r)n=V(a);else{n=H.interpolate(a,b,"filter",f);var v;m&&!I&&(v=aa(a,b,f)),m&&!I&&v&&(n=v)}return n},U.versionInfo=function(){return"2.15.2"},U.loaderCache=function(){return s},U.directivePriority=function(){return E},U.statefulFilter=function(){return F},U.isReady=function(){return C};var ka=d.defer();ka.promise.then(function(){C=!0}),U.onReady=function(a){var b=d.defer();return angular.isFunction(a)&&b.promise.then(a),C?b.resolve():ka.promise.then(b.resolve),b.promise},U.getAvailableLanguageKeys=function(){return v.length>0?v:null},U.getTranslationTable=function(a){return a=a||U.use(),a&&u[a]?angular.copy(u[a]):null};var la=c.$on("$translateReady",function(){ka.resolve(),la(),la=null}),ma=c.$on("$translateChangeEnd",function(){ka.resolve(),ma(),ma=null});if(o){if(angular.equals(u,{})&&U.use()&&U.use(U.use()),g&&g.length)for(var na=function(a){return N(a.key,a.table),c.$emit("$translateChangeEnd",{language:a.key}),a},oa=0,pa=g.length;oa<pa;oa++){var qa=g[oa];!A&&u[qa]||(T[qa]=X(qa).then(na))}}else c.$emit("$translateReady",{language:U.use()});return U}]}function d(a,b){"use strict";var c,d={};return d.setLocale=function(a){c=a},d.getInterpolationIdentifier=function(){return"default"},d.useSanitizeValueStrategy=function(a){return b.useStrategy(a),this},d.interpolate=function(c,d,e,f,g){d=d||{},d=b.sanitize(d,"params",f,e);var h;return angular.isNumber(c)?h=""+c:angular.isString(c)?(h=a(c)(d),h=b.sanitize(h,"text",f,e)):h="",h},d}function e(a,b,c,d,e){"use strict";var g=function(){return this.toString().replace(/^\s+|\s+$/g,"")};return{restrict:"AE",scope:!0,priority:a.directivePriority(),compile:function(h,i){var j=i.translateValues?i.translateValues:void 0,k=i.translateInterpolation?i.translateInterpolation:void 0,l=h[0].outerHTML.match(/translate-value-+/i),m="^(.*)("+b.startSymbol()+".*"+b.endSymbol()+")(.*)",n="^(.*)"+b.startSymbol()+"(.*)"+b.endSymbol()+"(.*)";return function(h,o,p){h.interpolateParams={},h.preText="",h.postText="",h.translateNamespace=f(h);var q={},r=function(a){if(angular.isFunction(r._unwatchOld)&&(r._unwatchOld(),r._unwatchOld=void 0),angular.equals(a,"")||!angular.isDefined(a)){var c=g.apply(o.text()),d=c.match(m);if(angular.isArray(d)){h.preText=d[1],h.postText=d[3],q.translate=b(d[2])(h.$parent);var e=c.match(n);angular.isArray(e)&&e[2]&&e[2].length&&(r._unwatchOld=h.$watch(e[2],function(a){q.translate=a,v()}))}else q.translate=c||void 0}else q.translate=a;v()};!function(a,b,c){if(b.translateValues&&angular.extend(a,d(b.translateValues)(h.$parent)),l)for(var e in c)if(Object.prototype.hasOwnProperty.call(b,e)&&"translateValue"===e.substr(0,14)&&"translateValues"!==e){var f=angular.lowercase(e.substr(14,1))+e.substr(15);a[f]=c[e]}}(h.interpolateParams,p,i);var s=!0;p.$observe("translate",function(a){void 0===a?r(""):""===a&&s||(q.translate=a,v()),s=!1});for(var t in p)p.hasOwnProperty(t)&&"translateAttr"===t.substr(0,13)&&t.length>13&&function(a){p.$observe(a,function(b){q[a]=b,v()})}(t);if(p.$observe("translateDefault",function(a){h.defaultText=a,v()}),j&&p.$observe("translateValues",function(a){a&&h.$parent.$watch(function(){angular.extend(h.interpolateParams,d(a)(h.$parent))})}),l){for(var u in p)Object.prototype.hasOwnProperty.call(p,u)&&"translateValue"===u.substr(0,14)&&"translateValues"!==u&&function(a){p.$observe(a,function(b){var c=angular.lowercase(a.substr(14,1))+a.substr(15);h.interpolateParams[c]=b})}(u)}var v=function(){for(var a in q)q.hasOwnProperty(a)&&void 0!==q[a]&&w(a,q[a],h,h.interpolateParams,h.defaultText,h.translateNamespace)},w=function(b,c,d,e,f,g){c?(g&&"."===c.charAt(0)&&(c=g+c),a(c,e,k,f,d.translateLanguage).then(function(a){x(a,d,!0,b)},function(a){x(a,d,!1,b)})):x(c,d,!1,b)},x=function(b,d,e,f){if(e||void 0!==d.defaultText&&(b=d.defaultText),"translate"===f){(e||!e&&!a.isKeepContent()&&void 0===p.translateKeepContent)&&o.empty().append(d.preText+b+d.postText);var g=a.isPostCompilingEnabled(),h=void 0!==i.translateCompile,j=h&&"false"!==i.translateCompile;(g&&!h||j)&&c(o.contents())(d)}else{var k=p.$attr[f];"data-"===k.substr(0,5)&&(k=k.substr(5)),k=k.substr(15),o.attr(k,b)}};(j||l||p.translateDefault)&&h.$watch("interpolateParams",v,!0),h.$on("translateLanguageChanged",v);var y=e.$on("$translateChangeSuccess",v);o.text().length?r(p.translate?p.translate:""):p.translate&&r(p.translate),v(),h.$on("$destroy",y)}}}}function f(a){"use strict";return a.translateNamespace?a.translateNamespace:a.$parent?f(a.$parent):void 0}function g(a,b){"use strict";return{restrict:"A",priority:a.directivePriority(),link:function(c,d,e){var f,g,i={},j=function(){angular.forEach(f,function(b,f){b&&(i[f]=!0,c.translateNamespace&&"."===b.charAt(0)&&(b=c.translateNamespace+b),a(b,g,e.translateInterpolation,void 0,c.translateLanguage).then(function(a){d.attr(f,a)},function(a){d.attr(f,a)}))}),angular.forEach(i,function(a,b){f[b]||(d.removeAttr(b),delete i[b])})};h(c,e.translateAttr,function(a){f=a},j),h(c,e.translateValues,function(a){g=a},j),e.translateValues&&c.$watch(e.translateValues,j,!0),c.$on("translateLanguageChanged",j);var k=b.$on("$translateChangeSuccess",j);j(),c.$on("$destroy",k)}}}function h(a,b,c,d){"use strict";b&&("::"===b.substr(0,2)?b=b.substr(2):a.$watch(b,function(a){c(a),d()},!0),c(a.$eval(b)))}function i(a,b){"use strict";return{compile:function(c){var d=function(b){b.addClass(a.cloakClassName())},e=function(b){b.removeClass(a.cloakClassName())};return d(c),function(c,f,g){var h=e.bind(this,f),i=d.bind(this,f);g.translateCloak&&g.translateCloak.length?(g.$observe("translateCloak",function(b){a(b).then(h,i)}),b.$on("$translateChangeSuccess",function(){a(g.translateCloak).then(h,i)})):a.onReady(h)}}}}function j(){"use strict";return{restrict:"A",scope:!0,compile:function(){return{pre:function(a,b,c){a.translateNamespace=f(a),a.translateNamespace&&"."===c.translateNamespace.charAt(0)?a.translateNamespace+=c.translateNamespace:a.translateNamespace=c.translateNamespace}}}}}function f(a){"use strict";return a.translateNamespace?a.translateNamespace:a.$parent?f(a.$parent):void 0}function k(){"use strict";return{restrict:"A",scope:!0,compile:function(){return function(a,b,c){c.$observe("translateLanguage",function(b){a.translateLanguage=b}),a.$watch("translateLanguage",function(){a.$broadcast("translateLanguageChanged")})}}}}function l(a,b){"use strict";var c=function(c,d,e,f){if(!angular.isObject(d)){var g=this||{__SCOPE_IS_NOT_AVAILABLE:"More info at https://github.com/angular/angular.js/commit/8863b9d04c722b278fa93c5d66ad1e578ad6eb1f"};d=a(d)(g)}return b.instant(c,d,e,f)};return b.statefulFilter()&&(c.$stateful=!0),c}function m(a){"use strict";return a("translations")}return a.$inject=["$translate"],c.$inject=["$STORAGE_KEY","$windowProvider","$translateSanitizationProvider","pascalprechtTranslateOverrider"],d.$inject=["$interpolate","$translateSanitization"],e.$inject=["$translate","$interpolate","$compile","$parse","$rootScope"],g.$inject=["$translate","$rootScope"],i.$inject=["$translate","$rootScope"],l.$inject=["$parse","$translate"],m.$inject=["$cacheFactory"],angular.module("pascalprecht.translate",["ng"]).run(a),a.displayName="runTranslate",angular.module("pascalprecht.translate").provider("$translateSanitization",b),angular.module("pascalprecht.translate").constant("pascalprechtTranslateOverrider",{}).provider("$translate",c),c.displayName="displayName",angular.module("pascalprecht.translate").factory("$translateDefaultInterpolation",d),d.displayName="$translateDefaultInterpolation",angular.module("pascalprecht.translate").constant("$STORAGE_KEY","NG_TRANSLATE_LANG_KEY"),angular.module("pascalprecht.translate").directive("translate",e),e.displayName="translateDirective",angular.module("pascalprecht.translate").directive("translateAttr",g),g.displayName="translateAttrDirective",angular.module("pascalprecht.translate").directive("translateCloak",i),i.displayName="translateCloakDirective",angular.module("pascalprecht.translate").directive("translateNamespace",j),j.displayName="translateNamespaceDirective",angular.module("pascalprecht.translate").directive("translateLanguage",k),k.displayName="translateLanguageDirective",angular.module("pascalprecht.translate").filter("translate",l),l.displayName="translateFilterFactory",angular.module("pascalprecht.translate").factory("$translationCache",m),m.displayName="$translationCache","pascalprecht.translate"});
/*
 * AngularJS Toaster
 * Version: 2.2.0
 *
 * Copyright 2013-2016 Jiri Kavulak.
 * All Rights Reserved.
 * Use, reproduction, distribution, and modification of this code is subject to the terms and
 * conditions of the MIT license, available at http://www.opensource.org/licenses/mit-license.php
 *
 * Author: Jiri Kavulak
 * Related to project of John Papa, Hans Fjällemark and Nguyễn Thiện Hùng (thienhung1989)
 */
!function(t,e){"use strict";angular.module("toaster",[]).constant("toasterConfig",{limit:0,"tap-to-dismiss":!0,"close-button":!1,"close-html":'<button class="toast-close-button" type="button">&times;</button>',"newest-on-top":!0,"time-out":5e3,"icon-classes":{error:"toast-error",info:"toast-info",wait:"toast-wait",success:"toast-success",warning:"toast-warning"},"body-output-type":"","body-template":"toasterBodyTmpl.html","icon-class":"toast-info","position-class":"toast-top-right","title-class":"toast-title","message-class":"toast-message","prevent-duplicates":!1,"mouseover-timer-stop":!0}).run(["$templateCache",function(t){t.put("angularjs-toaster/toast.html",'<div id="toast-container" ng-class="[config.position, config.animation]"><div ng-repeat="toaster in toasters" class="toast" ng-class="toaster.type" ng-click="click($event, toaster)" ng-mouseover="stopTimer(toaster)" ng-mouseout="restartTimer(toaster)"><div ng-if="toaster.showCloseButton" ng-click="click($event, toaster, true)" ng-bind-html="toaster.closeHtml"></div><div ng-class="config.title">{{toaster.title}}</div><div ng-class="config.message" ng-switch on="toaster.bodyOutputType"><div ng-switch-when="trustedHtml" ng-bind-html="toaster.html"></div><div ng-switch-when="template"><div ng-include="toaster.bodyTemplate"></div></div><div ng-switch-when="templateWithData"><div ng-include="toaster.bodyTemplate"></div></div><div ng-switch-when="directive"><div directive-template directive-name="{{toaster.html}}" directive-data="{{toaster.directiveData}}"></div></div><div ng-switch-default >{{toaster.body}}</div></div></div></div>')}]).service("toaster",["$rootScope","toasterConfig",function(t,e){var o=function(){var t={};return t.newGuid=function(){return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(t){var e=16*Math.random()|0;return("x"==t?e:3&e|8).toString(16)})},t}();this.pop=function(e,s,a,i,n,r,c,l,u,d){if(angular.isObject(e)){var m=e;this.toast={type:m.type,title:m.title,body:m.body,timeout:m.timeout,bodyOutputType:m.bodyOutputType,clickHandler:m.clickHandler,showCloseButton:m.showCloseButton,closeHtml:m.closeHtml,toastId:m.toastId,onShowCallback:m.onShowCallback,onHideCallback:m.onHideCallback,directiveData:m.directiveData,tapToDismiss:m.tapToDismiss},c=m.toasterId}else this.toast={type:e,title:s,body:a,timeout:i,bodyOutputType:n,clickHandler:r,showCloseButton:l,toastId:u,onHideCallback:d};return this.toast.toastId&&this.toast.toastId.length||(this.toast.toastId=o.newGuid()),t.$emit("toaster-newToast",c,this.toast.toastId),{toasterId:c,toastId:this.toast.toastId}},this.clear=function(e,o){angular.isObject(e)?t.$emit("toaster-clearToasts",e.toasterId,e.toastId):t.$emit("toaster-clearToasts",e,o)};for(var s in e["icon-classes"])this[s]=function(t){return function(e,o,s,a,i,n,r,c,l){return angular.isString(e)?this.pop(t,e,o,s,a,i,n,r,c,l):this.pop(angular.extend(e,{type:t}))}}(s)}]).factory("toasterEventRegistry",["$rootScope",function(t){var e,o=null,s=null,a=[],i=[];return e={setup:function(){o||(o=t.$on("toaster-newToast",function(t,e,o){for(var s=0,i=a.length;s<i;s++)a[s](t,e,o)})),s||(s=t.$on("toaster-clearToasts",function(t,e,o){for(var s=0,a=i.length;s<a;s++)i[s](t,e,o)}))},subscribeToNewToastEvent:function(t){a.push(t)},subscribeToClearToastsEvent:function(t){i.push(t)},unsubscribeToNewToastEvent:function(t){var e=a.indexOf(t);e>=0&&a.splice(e,1),0===a.length&&(o(),o=null)},unsubscribeToClearToastsEvent:function(t){var e=i.indexOf(t);e>=0&&i.splice(e,1),0===i.length&&(s(),s=null)}},{setup:e.setup,subscribeToNewToastEvent:e.subscribeToNewToastEvent,subscribeToClearToastsEvent:e.subscribeToClearToastsEvent,unsubscribeToNewToastEvent:e.unsubscribeToNewToastEvent,unsubscribeToClearToastsEvent:e.unsubscribeToClearToastsEvent}}]).directive("directiveTemplate",["$compile","$injector",function(t,e){return{restrict:"A",scope:{directiveName:"@directiveName",directiveData:"@directiveData"},replace:!0,link:function(o,s,a){o.$watch("directiveName",function(i){if(angular.isUndefined(i)||i.length<=0)throw new Error("A valid directive name must be provided via the toast body argument when using bodyOutputType: directive");var n;try{n=e.get(a.$normalize(i)+"Directive")}catch(t){throw new Error(i+" could not be found. The name should appear as it exists in the markup, not camelCased as it would appear in the directive declaration, e.g. directive-name not directiveName.")}var r=n[0];if(!0!==r.scope&&r.scope)throw new Error("Cannot use a directive with an isolated scope. The scope must be either true or falsy (e.g. false/null/undefined). Occurred for directive "+i+".");if(r.restrict.indexOf("A")<0)throw new Error('Directives must be usable as attributes. Add "A" to the restrict option (or remove the option entirely). Occurred for directive '+i+".");o.directiveData&&(o.directiveData=angular.fromJson(o.directiveData));var c=t("<div "+i+"></div>")(o);s.append(c)})}}}]).directive("toasterContainer",["$parse","$rootScope","$interval","$sce","toasterConfig","toaster","toasterEventRegistry",function(t,e,o,s,a,i,n){return{replace:!0,restrict:"EA",scope:!0,link:function(e,r,c){function l(t,s){t.timeoutPromise=o(function(){e.removeToast(t.toastId)},s,1)}function u(o,a){if(o.type=v["icon-classes"][o.type],o.type||(o.type=v["icon-class"]),!0===v["prevent-duplicates"]&&e.toasters.length){if(e.toasters[e.toasters.length-1].body===o.body)return;var i,n,r=!1;for(i=0,n=e.toasters.length;i<n;i++)if(e.toasters[i].toastId===a){r=!0;break}if(r)return}var c=v["close-button"];if("boolean"==typeof o.showCloseButton);else if("boolean"==typeof c)o.showCloseButton=c;else if("object"==typeof c){var l=c[o.type];void 0!==l&&null!==l&&(o.showCloseButton=l)}else o.showCloseButton=!1;switch(o.showCloseButton&&(o.closeHtml=s.trustAsHtml(o.closeHtml||e.config.closeHtml)),o.bodyOutputType=o.bodyOutputType||v["body-output-type"],o.bodyOutputType){case"trustedHtml":o.html=s.trustAsHtml(o.body);break;case"template":o.bodyTemplate=o.body||v["body-template"];break;case"templateWithData":var u=t(o.body||v["body-template"])(e);o.bodyTemplate=u.template,o.data=u.data;break;case"directive":o.html=o.body}e.configureTimer(o),!0===v["newest-on-top"]?(e.toasters.unshift(o),v.limit>0&&e.toasters.length>v.limit&&e.toasters.pop()):(e.toasters.push(o),v.limit>0&&e.toasters.length>v.limit&&e.toasters.shift()),angular.isFunction(o.onShowCallback)&&o.onShowCallback(o)}function d(t){var s=e.toasters[t];s.timeoutPromise&&o.cancel(s.timeoutPromise),e.toasters.splice(t,1),angular.isFunction(s.onHideCallback)&&s.onHideCallback(s)}function m(t){for(var o=e.toasters.length-1;o>=0;o--)p(t)?d(o):e.toasters[o].toastId==t&&d(o)}function p(t){return angular.isUndefined(t)||null===t}var v;v=angular.extend({},a,e.$eval(c.toasterOptions)),e.config={toasterId:v["toaster-id"],position:v["position-class"],title:v["title-class"],message:v["message-class"],tap:v["tap-to-dismiss"],closeButton:v["close-button"],closeHtml:v["close-html"],animation:v["animation-class"],mouseoverTimer:v["mouseover-timer-stop"]},e.$on("$destroy",function(){n.unsubscribeToNewToastEvent(e._onNewToast),n.unsubscribeToClearToastsEvent(e._onClearToasts)}),e.configureTimer=function(t){var e=angular.isNumber(t.timeout)?t.timeout:v["time-out"];"object"==typeof e&&(e=e[t.type]),e>0&&l(t,e)},e.removeToast=function(t){var o,s;for(o=0,s=e.toasters.length;o<s;o++)if(e.toasters[o].toastId===t){d(o);break}},e.toasters=[],e._onNewToast=function(t,o,s){(p(e.config.toasterId)&&p(o)||!p(e.config.toasterId)&&!p(o)&&e.config.toasterId==o)&&u(i.toast,s)},e._onClearToasts=function(t,o,s){("*"==o||p(e.config.toasterId)&&p(o)||!p(e.config.toasterId)&&!p(o)&&e.config.toasterId==o)&&m(s)},n.setup(),n.subscribeToNewToastEvent(e._onNewToast),n.subscribeToClearToastsEvent(e._onClearToasts)},controller:["$scope","$element","$attrs",function(t,e,s){t.stopTimer=function(e){!0===t.config.mouseoverTimer&&e.timeoutPromise&&(o.cancel(e.timeoutPromise),e.timeoutPromise=null)},t.restartTimer=function(e){!0===t.config.mouseoverTimer?e.timeoutPromise||t.configureTimer(e):null===e.timeoutPromise&&t.removeToast(e.toastId)},t.click=function(e,o,s){if(e.stopPropagation(),!0===("boolean"==typeof o.tapToDismiss?o.tapToDismiss:t.config.tap)||!0===o.showCloseButton&&!0===s){var a=!0;o.clickHandler&&(angular.isFunction(o.clickHandler)?a=o.clickHandler(o,s):angular.isFunction(t.$parent.$eval(o.clickHandler))?a=t.$parent.$eval(o.clickHandler)(o,s):console.log("TOAST-NOTE: Your click handler is not inside a parent scope of toaster-container.")),a&&t.removeToast(o.toastId)}}}],templateUrl:"angularjs-toaster/toast.html"}}])}(window,document);
/**
 * oclazyload - Load modules on demand (lazy load) with angularJS
 * @version v1.0.10
 * @link https://github.com/ocombe/ocLazyLoad
 * @license MIT
 * @author Olivier Combe <olivier.combe@gmail.com>
 */
!function(e,n){"use strict";var r=["ng","oc.lazyLoad"],o={},t=[],i=[],a=[],s=[],u=e.noop,c={},d=[],l=e.module("oc.lazyLoad",["ng"]);l.provider("$ocLazyLoad",["$controllerProvider","$provide","$compileProvider","$filterProvider","$injector","$animateProvider",function(l,f,p,m,v,y){function L(n,o,t){if(o){var i,s,l,f=[];for(i=o.length-1;i>=0;i--)if(s=o[i],e.isString(s)||(s=E(s)),s&&-1===d.indexOf(s)&&(!w[s]||-1!==a.indexOf(s))){var h=-1===r.indexOf(s);if(l=g(s),h&&(r.push(s),L(n,l.requires,t)),l._runBlocks.length>0)for(c[s]=[];l._runBlocks.length>0;)c[s].push(l._runBlocks.shift());e.isDefined(c[s])&&(h||t.rerun)&&(f=f.concat(c[s])),j(n,l._invokeQueue,s,t.reconfig),j(n,l._configBlocks,s,t.reconfig),u(h?"ocLazyLoad.moduleLoaded":"ocLazyLoad.moduleReloaded",s),o.pop(),d.push(s)}var p=n.getInstanceInjector();e.forEach(f,function(e){p.invoke(e)})}}function $(n,r){function t(n,r){var o,t=!0;return r.length&&(o=i(n),e.forEach(r,function(e){t=t&&i(e)!==o})),t}function i(n){return e.isArray(n)?M(n.toString()):e.isObject(n)?M(S(n)):e.isDefined(n)&&null!==n?M(n.toString()):n}var a=n[2][0],s=n[1],c=!1;e.isUndefined(o[r])&&(o[r]={}),e.isUndefined(o[r][s])&&(o[r][s]={});var d=function(e,n){o[r][s].hasOwnProperty(e)||(o[r][s][e]=[]),t(n,o[r][s][e])&&(c=!0,o[r][s][e].push(n),u("ocLazyLoad.componentLoaded",[r,s,e]))};if(e.isString(a))d(a,n[2][1]);else{if(!e.isObject(a))return!1;e.forEach(a,function(n,r){e.isString(n)?d(n,a[1]):d(r,n)})}return c}function j(n,r,o,i){if(r){var a,s,u,c;for(a=0,s=r.length;s>a;a++)if(u=r[a],e.isArray(u)){if(null!==n){if(!n.hasOwnProperty(u[0]))throw new Error("unsupported provider "+u[0]);c=n[u[0]]}var d=$(u,o);if("invoke"!==u[1])d&&e.isDefined(c)&&c[u[1]].apply(c,u[2]);else{var l=function(n){var r=t.indexOf(o+"-"+n);(-1===r||i)&&(-1===r&&t.push(o+"-"+n),e.isDefined(c)&&c[u[1]].apply(c,u[2]))};if(e.isFunction(u[2][0]))l(u[2][0]);else if(e.isArray(u[2][0]))for(var f=0,h=u[2][0].length;h>f;f++)e.isFunction(u[2][0][f])&&l(u[2][0][f])}}}}function E(n){var r=null;return e.isString(n)?r=n:e.isObject(n)&&n.hasOwnProperty("name")&&e.isString(n.name)&&(r=n.name),r}function _(n){if(!e.isString(n))return!1;try{return g(n)}catch(r){if(/No module/.test(r)||r.message.indexOf("$injector:nomod")>-1)return!1}}var w={},O={$controllerProvider:l,$compileProvider:p,$filterProvider:m,$provide:f,$injector:v,$animateProvider:y},x=!1,b=!1,z=[],D={};z.push=function(e){-1===this.indexOf(e)&&Array.prototype.push.apply(this,arguments)},this.config=function(n){e.isDefined(n.modules)&&(e.isArray(n.modules)?e.forEach(n.modules,function(e){w[e.name]=e}):w[n.modules.name]=n.modules),e.isDefined(n.debug)&&(x=n.debug),e.isDefined(n.events)&&(b=n.events)},this._init=function(o){if(0===i.length){var t=[o],a=["ng:app","ng-app","x-ng-app","data-ng-app"],u=/\sng[:\-]app(:\s*([\w\d_]+);?)?\s/,c=function(e){return e&&t.push(e)};e.forEach(a,function(n){a[n]=!0,c(document.getElementById(n)),n=n.replace(":","\\:"),"undefined"!=typeof o[0]&&o[0].querySelectorAll&&(e.forEach(o[0].querySelectorAll("."+n),c),e.forEach(o[0].querySelectorAll("."+n+"\\:"),c),e.forEach(o[0].querySelectorAll("["+n+"]"),c))}),e.forEach(t,function(n){if(0===i.length){var r=" "+o.className+" ",t=u.exec(r);t?i.push((t[2]||"").replace(/\s+/g,",")):e.forEach(n.attributes,function(e){0===i.length&&a[e.name]&&i.push(e.value)})}})}0!==i.length||(n.jasmine||n.mocha)&&e.isDefined(e.mock)||console.error("No module found during bootstrap, unable to init ocLazyLoad. You should always use the ng-app directive or angular.boostrap when you use ocLazyLoad.");var d=function l(n){if(-1===r.indexOf(n)){r.push(n);var o=e.module(n);j(null,o._invokeQueue,n),j(null,o._configBlocks,n),e.forEach(o.requires,l)}};e.forEach(i,function(e){d(e)}),i=[],s.pop()};var S=function(n){try{return JSON.stringify(n)}catch(r){var o=[];return JSON.stringify(n,function(n,r){if(e.isObject(r)&&null!==r){if(-1!==o.indexOf(r))return;o.push(r)}return r})}},M=function(e){var n,r,o,t=0;if(0==e.length)return t;for(n=0,o=e.length;o>n;n++)r=e.charCodeAt(n),t=(t<<5)-t+r,t|=0;return t};this.$get=["$log","$rootElement","$rootScope","$cacheFactory","$q",function(n,t,a,c,l){function f(e){var r=l.defer();return n.error(e.message),r.reject(e),r.promise}var p,m=c("ocLazyLoad");return x||(n={},n.error=e.noop,n.warn=e.noop,n.info=e.noop),O.getInstanceInjector=function(){return p?p:p=t.data("$injector")||e.injector()},u=function(e,r){b&&a.$broadcast(e,r),x&&n.info(e,r)},{_broadcast:u,_$log:n,_getFilesCache:function(){return m},toggleWatch:function(e){e?s.push(!0):s.pop()},getModuleConfig:function(n){if(!e.isString(n))throw new Error("You need to give the name of the module to get");return w[n]?e.copy(w[n]):null},setModuleConfig:function(n){if(!e.isObject(n))throw new Error("You need to give the module config object to set");return w[n.name]=n,n},getModules:function(){return r},isLoaded:function(n){var o=function(e){var n=r.indexOf(e)>-1;return n||(n=!!_(e)),n};if(e.isString(n)&&(n=[n]),e.isArray(n)){var t,i;for(t=0,i=n.length;i>t;t++)if(!o(n[t]))return!1;return!0}throw new Error("You need to define the module(s) name(s)")},_getModuleName:E,_getModule:function(e){try{return g(e)}catch(n){throw(/No module/.test(n)||n.message.indexOf("$injector:nomod")>-1)&&(n.message='The module "'+S(e)+'" that you are trying to load does not exist. '+n.message),n}},moduleExists:_,_loadDependencies:function(n,r){var o,t,i,a=[],s=this;if(n=s._getModuleName(n),null===n)return l.when();try{o=s._getModule(n)}catch(u){return f(u)}return t=s.getRequires(o),e.forEach(t,function(o){if(e.isString(o)){var t=s.getModuleConfig(o);if(null===t)return void z.push(o);o=t,t.name=void 0}if(s.moduleExists(o.name))return i=o.files.filter(function(e){return s.getModuleConfig(o.name).files.indexOf(e)<0}),0!==i.length&&s._$log.warn('Module "',n,'" attempted to redefine configuration for dependency. "',o.name,'"\n Additional Files Loaded:',i),e.isDefined(s.filesLoader)?void a.push(s.filesLoader(o,r).then(function(){return s._loadDependencies(o)})):f(new Error("Error: New dependencies need to be loaded from external files ("+o.files+"), but no loader has been defined."));if(e.isArray(o)){var u=[];e.forEach(o,function(e){var n=s.getModuleConfig(e);null===n?u.push(e):n.files&&(u=u.concat(n.files))}),u.length>0&&(o={files:u})}else e.isObject(o)&&o.hasOwnProperty("name")&&o.name&&(s.setModuleConfig(o),z.push(o.name));if(e.isDefined(o.files)&&0!==o.files.length){if(!e.isDefined(s.filesLoader))return f(new Error('Error: the module "'+o.name+'" is defined in external files ('+o.files+"), but no loader has been defined."));a.push(s.filesLoader(o,r).then(function(){return s._loadDependencies(o)}))}}),l.all(a)},inject:function(n){var r=arguments.length<=1||void 0===arguments[1]?{}:arguments[1],o=arguments.length<=2||void 0===arguments[2]?!1:arguments[2],t=this,a=l.defer();if(e.isDefined(n)&&null!==n){if(e.isArray(n)){var s=[];return e.forEach(n,function(e){s.push(t.inject(e,r,o))}),l.all(s)}t._addToLoadList(t._getModuleName(n),!0,o)}if(i.length>0){var u=i.slice(),c=function f(e){z.push(e),D[e]=a.promise,t._loadDependencies(e,r).then(function(){try{d=[],L(O,z,r)}catch(e){return t._$log.error(e.message),void a.reject(e)}i.length>0?f(i.shift()):a.resolve(u)},function(e){a.reject(e)})};c(i.shift())}else{if(r&&r.name&&D[r.name])return D[r.name];a.resolve()}return a.promise},getRequires:function(n){var o=[];return e.forEach(n.requires,function(e){-1===r.indexOf(e)&&o.push(e)}),o},_invokeQueue:j,_registerInvokeList:$,_register:L,_addToLoadList:h,_unregister:function(n){e.isDefined(n)&&e.isArray(n)&&e.forEach(n,function(e){o[e]=void 0})}}}],this._init(e.element(n.document))}]);var f=e.bootstrap;e.bootstrap=function(n,l,g){return r=["ng","oc.lazyLoad"],o={},t=[],i=[],a=[],s=[],u=e.noop,c={},d=[],e.forEach(l.slice(),function(e){h(e,!0,!0)}),f(n,l,g)};var h=function(n,r,o){(s.length>0||r)&&e.isString(n)&&-1===i.indexOf(n)&&(i.push(n),o&&a.push(n))},g=e.module;e.module=function(e,n,r){return h(e,!1,!0),g(e,n,r)},"undefined"!=typeof module&&"undefined"!=typeof exports&&module.exports===exports&&(module.exports="oc.lazyLoad")}(angular,window),function(e){"use strict";e.module("oc.lazyLoad").directive("ocLazyLoad",["$ocLazyLoad","$compile","$animate","$parse","$timeout",function(n,r,o,t,i){return{restrict:"A",terminal:!0,priority:1e3,compile:function(i,a){var s=i[0].innerHTML;return i.html(""),function(i,a,u){var c=t(u.ocLazyLoad);i.$watch(function(){return c(i)||u.ocLazyLoad},function(t){e.isDefined(t)&&n.load(t).then(function(){o.enter(s,a),r(a.contents())(i)})},!0)}}}}])}(angular),function(e){"use strict";e.module("oc.lazyLoad").config(["$provide",function(n){n.decorator("$ocLazyLoad",["$delegate","$q","$window","$interval",function(n,r,o,t){var i=!1,a=!1,s=o.document.getElementsByTagName("head")[0]||o.document.getElementsByTagName("body")[0];return n.buildElement=function(u,c,d){var l,f,h=r.defer(),g=n._getFilesCache(),p=function(e){var n=(new Date).getTime();return e.indexOf("?")>=0?"&"===e.substring(0,e.length-1)?e+"_dc="+n:e+"&_dc="+n:e+"?_dc="+n};switch(e.isUndefined(g.get(c))&&g.put(c,h.promise),u){case"css":l=o.document.createElement("link"),l.type="text/css",l.rel="stylesheet",l.href=d.cache===!1?p(c):c;break;case"js":l=o.document.createElement("script"),l.src=d.cache===!1?p(c):c;break;default:g.remove(c),h.reject(new Error('Requested type "'+u+'" is not known. Could not inject "'+c+'"'))}l.onload=l.onreadystatechange=function(e){l.readyState&&!/^c|loade/.test(l.readyState)||f||(l.onload=l.onreadystatechange=null,f=1,n._broadcast("ocLazyLoad.fileLoaded",c),h.resolve(l))},l.onerror=function(){g.remove(c),h.reject(new Error("Unable to load "+c))},l.async=d.serie?0:1;var m=s.lastChild;if(d.insertBefore){var v=e.element(e.isDefined(window.jQuery)?d.insertBefore:document.querySelector(d.insertBefore));v&&v.length>0&&(m=v[0])}if(m.parentNode.insertBefore(l,m),"css"==u){if(!i){var y=o.navigator.userAgent.toLowerCase();if(y.indexOf("phantomjs/1.9")>-1)a=!0;else if(/iP(hone|od|ad)/.test(o.navigator.platform)){var L=o.navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/),$=parseFloat([parseInt(L[1],10),parseInt(L[2],10),parseInt(L[3]||0,10)].join("."));a=6>$}else if(y.indexOf("android")>-1){var j=parseFloat(y.slice(y.indexOf("android")+8));a=4.4>j}else if(y.indexOf("safari")>-1){var E=y.match(/version\/([\.\d]+)/i);a=E&&E[1]&&parseFloat(E[1])<6}}if(a)var _=1e3,w=t(function(){try{l.sheet.cssRules,t.cancel(w),l.onload()}catch(e){--_<=0&&l.onerror()}},20)}return h.promise},n}])}])}(angular),function(e){"use strict";e.module("oc.lazyLoad").config(["$provide",function(n){n.decorator("$ocLazyLoad",["$delegate","$q",function(n,r){return n.filesLoader=function(o){var t=arguments.length<=1||void 0===arguments[1]?{}:arguments[1],i=[],a=[],s=[],u=[],c=null,d=n._getFilesCache();n.toggleWatch(!0),e.extend(t,o);var l=function(r){var o,l=null;if(e.isObject(r)&&(l=r.type,r=r.path),c=d.get(r),e.isUndefined(c)||t.cache===!1){if(null!==(o=/^(css|less|html|htm|js)?(?=!)/.exec(r))&&(l=o[1],r=r.substr(o[1].length+1,r.length)),!l)if(null!==(o=/[.](css|less|html|htm|js)?((\?|#).*)?$/.exec(r)))l=o[1];else{if(n.jsLoader.hasOwnProperty("ocLazyLoadLoader")||!n.jsLoader.hasOwnProperty("requirejs"))return void n._$log.error("File type could not be determined. "+r);l="js"}"css"!==l&&"less"!==l||-1!==i.indexOf(r)?"html"!==l&&"htm"!==l||-1!==a.indexOf(r)?"js"===l||-1===s.indexOf(r)?s.push(r):n._$log.error("File type is not valid. "+r):a.push(r):i.push(r)}else c&&u.push(c)};if(t.serie?l(t.files.shift()):e.forEach(t.files,function(e){l(e)}),i.length>0){var f=r.defer();n.cssLoader(i,function(r){e.isDefined(r)&&n.cssLoader.hasOwnProperty("ocLazyLoadLoader")?(n._$log.error(r),f.reject(r)):f.resolve()},t),u.push(f.promise)}if(a.length>0){var h=r.defer();n.templatesLoader(a,function(r){e.isDefined(r)&&n.templatesLoader.hasOwnProperty("ocLazyLoadLoader")?(n._$log.error(r),h.reject(r)):h.resolve()},t),u.push(h.promise)}if(s.length>0){var g=r.defer();n.jsLoader(s,function(r){e.isDefined(r)&&(n.jsLoader.hasOwnProperty("ocLazyLoadLoader")||n.jsLoader.hasOwnProperty("requirejs"))?(n._$log.error(r),g.reject(r)):g.resolve()},t),u.push(g.promise)}if(0===u.length){var p=r.defer(),m="Error: no file to load has been found, if you're trying to load an existing module you should use the 'inject' method instead of 'load'.";return n._$log.error(m),p.reject(m),p.promise}return t.serie&&t.files.length>0?r.all(u).then(function(){return n.filesLoader(o,t)}):r.all(u)["finally"](function(e){return n.toggleWatch(!1),e})},n.load=function(o){var t,i=arguments.length<=1||void 0===arguments[1]?{}:arguments[1],a=this,s=null,u=[],c=r.defer(),d=e.copy(o),l=e.copy(i);if(e.isArray(d))return e.forEach(d,function(e){u.push(a.load(e,l))}),r.all(u).then(function(e){c.resolve(e)},function(e){c.reject(e)}),c.promise;if(e.isString(d)?(s=a.getModuleConfig(d),s||(s={files:[d]})):e.isObject(d)&&(s=e.isDefined(d.path)&&e.isDefined(d.type)?{files:[d]}:a.setModuleConfig(d)),null===s){var f=a._getModuleName(d);return t='Module "'+(f||"unknown")+'" is not configured, cannot load.',n._$log.error(t),c.reject(new Error(t)),c.promise}e.isDefined(s.template)&&(e.isUndefined(s.files)&&(s.files=[]),e.isString(s.template)?s.files.push(s.template):e.isArray(s.template)&&s.files.concat(s.template));var h=e.extend({},l,s);return e.isUndefined(s.files)&&e.isDefined(s.name)&&n.moduleExists(s.name)?n.inject(s.name,h,!0):(n.filesLoader(s,h).then(function(){n.inject(null,h).then(function(e){c.resolve(e)},function(e){c.reject(e)})},function(e){c.reject(e)}),c.promise)},n}])}])}(angular),function(e){"use strict";e.module("oc.lazyLoad").config(["$provide",function(n){n.decorator("$ocLazyLoad",["$delegate","$q",function(n,r){return n.cssLoader=function(o,t,i){var a=[];e.forEach(o,function(e){a.push(n.buildElement("css",e,i))}),r.all(a).then(function(){t()},function(e){t(e)})},n.cssLoader.ocLazyLoadLoader=!0,n}])}])}(angular),function(e){"use strict";e.module("oc.lazyLoad").config(["$provide",function(n){n.decorator("$ocLazyLoad",["$delegate","$q",function(n,r){return n.jsLoader=function(o,t,i){var a=[];e.forEach(o,function(e){a.push(n.buildElement("js",e,i))}),r.all(a).then(function(){t()},function(e){t(e)})},n.jsLoader.ocLazyLoadLoader=!0,n}])}])}(angular),function(e){"use strict";e.module("oc.lazyLoad").config(["$provide",function(n){n.decorator("$ocLazyLoad",["$delegate","$templateCache","$q","$http",function(n,r,o,t){return n.templatesLoader=function(i,a,s){var u=[],c=n._getFilesCache();return e.forEach(i,function(n){var i=o.defer();u.push(i.promise),t.get(n,s).then(function(o){var t=o.data;e.isString(t)&&t.length>0&&e.forEach(e.element(t),function(e){"SCRIPT"===e.nodeName&&"text/ng-template"===e.type&&r.put(e.id,e.innerHTML)}),e.isUndefined(c.get(n))&&c.put(n,!0),i.resolve()})["catch"](function(e){i.reject(new Error('Unable to load template file "'+n+'": '+e.data))})}),o.all(u).then(function(){a()},function(e){a(e)})},n.templatesLoader.ocLazyLoadLoader=!0,n}])}])}(angular),Array.prototype.indexOf||(Array.prototype.indexOf=function(e,n){var r;if(null==this)throw new TypeError('"this" is null or not defined');var o=Object(this),t=o.length>>>0;if(0===t)return-1;var i=+n||0;if(Math.abs(i)===1/0&&(i=0),i>=t)return-1;for(r=Math.max(i>=0?i:t-Math.abs(i),0);t>r;){if(r in o&&o[r]===e)return r;r++}return-1});
/*
 * angular-ui-bootstrap
 * http://angular-ui.github.io/bootstrap/

 * Version: 2.5.0 - 2017-01-28
 * License: MIT
 */angular.module("ui.bootstrap",["ui.bootstrap.tpls","ui.bootstrap.modal","ui.bootstrap.multiMap","ui.bootstrap.stackedMap","ui.bootstrap.position"]),angular.module("ui.bootstrap.tpls",["uib/template/modal/window.html"]),angular.module("ui.bootstrap.modal",["ui.bootstrap.multiMap","ui.bootstrap.stackedMap","ui.bootstrap.position"]).provider("$uibResolve",function(){var t=this;this.resolver=null,this.setResolver=function(t){this.resolver=t},this.$get=["$injector","$q",function(e,o){var n=t.resolver?e.get(t.resolver):null;return{resolve:function(t,r,i,a){if(n)return n.resolve(t,r,i,a);var l=[];return angular.forEach(t,function(t){l.push(angular.isFunction(t)||angular.isArray(t)?o.resolve(e.invoke(t)):angular.isString(t)?o.resolve(e.get(t)):o.resolve(t))}),o.all(l).then(function(e){var o={},n=0;return angular.forEach(t,function(t,r){o[r]=e[n++]}),o})}}}]}).directive("uibModalBackdrop",["$animate","$injector","$uibModalStack",function(t,e,o){function n(e,n,r){r.modalInClass&&(t.addClass(n,r.modalInClass),e.$on(o.NOW_CLOSING_EVENT,function(o,i){var a=i();e.modalOptions.animation?t.removeClass(n,r.modalInClass).then(a):a()}))}return{restrict:"A",compile:function(t,e){return t.addClass(e.backdropClass),n}}}]).directive("uibModalWindow",["$uibModalStack","$q","$animateCss","$document",function(t,e,o,n){return{scope:{index:"@"},restrict:"A",transclude:!0,templateUrl:function(t,e){return e.templateUrl||"uib/template/modal/window.html"},link:function(r,i,a){i.addClass(a.windowTopClass||""),r.size=a.size,r.close=function(e){var o=t.getTop();o&&o.value.backdrop&&"static"!==o.value.backdrop&&e.target===e.currentTarget&&(e.preventDefault(),e.stopPropagation(),t.dismiss(o.key,"backdrop click"))},i.on("click",r.close),r.$isRendered=!0;var l=e.defer();r.$$postDigest(function(){l.resolve()}),l.promise.then(function(){var l=null;a.modalInClass&&(l=o(i,{addClass:a.modalInClass}).start(),r.$on(t.NOW_CLOSING_EVENT,function(t,e){var n=e();o(i,{removeClass:a.modalInClass}).start().then(n)})),e.when(l).then(function(){var e=t.getTop();if(e&&t.modalRendered(e.key),!n[0].activeElement||!i[0].contains(n[0].activeElement)){var o=i[0].querySelector("[autofocus]");o?o.focus():i[0].focus()}})})}}}]).directive("uibModalAnimationClass",function(){return{compile:function(t,e){e.modalAnimation&&t.addClass(e.uibModalAnimationClass)}}}).directive("uibModalTransclude",["$animate",function(t){return{link:function(e,o,n,r,i){i(e.$parent,function(e){o.empty(),t.enter(e,o)})}}}]).factory("$uibModalStack",["$animate","$animateCss","$document","$compile","$rootScope","$q","$$multiMap","$$stackedMap","$uibPosition",function(t,e,o,n,r,i,a,l,s){function d(t){var e="-";return t.replace(D,function(t,o){return(o?e:"")+t.toLowerCase()})}function u(t){return!!(t.offsetWidth||t.offsetHeight||t.getClientRects().length)}function c(){for(var t=-1,e=C.keys(),o=0;o<e.length;o++)C.get(e[o]).value.backdrop&&(t=o);return t>-1&&M>t&&(t=M),t}function p(t,e){var o=C.get(t).value,n=o.appendTo;C.remove(t),T=C.top(),T&&(M=parseInt(T.value.modalDomEl.attr("index"),10)),h(o.modalDomEl,o.modalScope,function(){var e=o.openedClass||k;S.remove(e,t);var r=S.hasKey(e);n.toggleClass(e,r),!r&&y&&y.heightOverflow&&y.scrollbarWidth&&(n.css(y.originalRight?{paddingRight:y.originalRight+"px"}:{paddingRight:""}),y=null),f(!0)},o.closedDeferred),m(),e&&e.focus?e.focus():n.focus&&n.focus()}function f(t){var e;C.length()>0&&(e=C.top().value,e.modalDomEl.toggleClass(e.windowTopClass||"",t))}function m(){if(w&&-1===c()){var t=$;h(w,$,function(){t=null}),w=void 0,$=void 0}}function h(e,o,n,r){function a(){a.done||(a.done=!0,t.leave(e).then(function(){n&&n(),e.remove(),r&&r.resolve()}),o.$destroy())}var l,s=null,d=function(){return l||(l=i.defer(),s=l.promise),function(){l.resolve()}};return o.$broadcast(E.NOW_CLOSING_EVENT,d),i.when(s).then(a)}function g(t){if(t.isDefaultPrevented())return t;var e=C.top();if(e)switch(t.which){case 27:e.value.keyboard&&(t.preventDefault(),r.$apply(function(){E.dismiss(e.key,"escape key press")}));break;case 9:var o=E.loadFocusElementList(e),n=!1;t.shiftKey?(E.isFocusInFirstItem(t,o)||E.isModalFocused(t,e))&&(n=E.focusLastFocusableElement(o)):E.isFocusInLastItem(t,o)&&(n=E.focusFirstFocusableElement(o)),n&&(t.preventDefault(),t.stopPropagation())}}function v(t,e,o){return!t.value.modalScope.$broadcast("modal.closing",e,o).defaultPrevented}function b(){Array.prototype.forEach.call(document.querySelectorAll("["+x+"]"),function(t){var e=parseInt(t.getAttribute(x),10),o=e-1;t.setAttribute(x,o),o||(t.removeAttribute(x),t.removeAttribute("aria-hidden"))})}var w,$,y,k="modal-open",C=l.createNew(),S=a.createNew(),E={NOW_CLOSING_EVENT:"modal.stack.now-closing"},M=0,T=null,x="data-bootstrap-modal-aria-hidden-count",N="a[href], area[href], input:not([disabled]):not([tabindex='-1']), button:not([disabled]):not([tabindex='-1']),select:not([disabled]):not([tabindex='-1']), textarea:not([disabled]):not([tabindex='-1']), iframe, object, embed, *[tabindex]:not([tabindex='-1']), *[contenteditable=true]",D=/[A-Z]/g;return r.$watch(c,function(t){$&&($.index=t)}),o.on("keydown",g),r.$on("$destroy",function(){o.off("keydown",g)}),E.open=function(e,i){function a(t){function e(t){var e=t.parent()?t.parent().children():[];return Array.prototype.filter.call(e,function(e){return e!==t[0]})}if(t&&"BODY"!==t[0].tagName)return e(t).forEach(function(t){var e="true"===t.getAttribute("aria-hidden"),o=parseInt(t.getAttribute(x),10);o||(o=e?1:0),t.setAttribute(x,o+1),t.setAttribute("aria-hidden","true")}),a(t.parent())}var l=o[0].activeElement,u=i.openedClass||k;f(!1),T=C.top(),C.add(e,{deferred:i.deferred,renderDeferred:i.renderDeferred,closedDeferred:i.closedDeferred,modalScope:i.scope,backdrop:i.backdrop,keyboard:i.keyboard,openedClass:i.openedClass,windowTopClass:i.windowTopClass,animation:i.animation,appendTo:i.appendTo}),S.put(u,e);var p=i.appendTo,m=c();m>=0&&!w&&($=r.$new(!0),$.modalOptions=i,$.index=m,w=angular.element('<div uib-modal-backdrop="modal-backdrop"></div>'),w.attr({"class":"modal-backdrop","ng-style":"{'z-index': 1040 + (index && 1 || 0) + index*10}","uib-modal-animation-class":"fade","modal-in-class":"in"}),i.backdropClass&&w.addClass(i.backdropClass),i.animation&&w.attr("modal-animation","true"),n(w)($),t.enter(w,p),s.isScrollable(p)&&(y=s.scrollbarPadding(p),y.heightOverflow&&y.scrollbarWidth&&p.css({paddingRight:y.right+"px"})));var h;i.component?(h=document.createElement(d(i.component.name)),h=angular.element(h),h.attr({resolve:"$resolve","modal-instance":"$uibModalInstance",close:"$close($value)",dismiss:"$dismiss($value)"})):h=i.content,M=T?parseInt(T.value.modalDomEl.attr("index"),10)+1:0;var g=angular.element('<div uib-modal-window="modal-window"></div>');g.attr({"class":"modal","template-url":i.windowTemplateUrl,"window-top-class":i.windowTopClass,role:"dialog","aria-labelledby":i.ariaLabelledBy,"aria-describedby":i.ariaDescribedBy,size:i.size,index:M,animate:"animate","ng-style":"{'z-index': 1050 + $$topModalIndex*10, display: 'block'}",tabindex:-1,"uib-modal-animation-class":"fade","modal-in-class":"in"}).append(h),i.windowClass&&g.addClass(i.windowClass),i.animation&&g.attr("modal-animation","true"),p.addClass(u),i.scope&&(i.scope.$$topModalIndex=M),t.enter(n(g)(i.scope),p),C.top().value.modalDomEl=g,C.top().value.modalOpener=l,a(g)},E.close=function(t,e){var o=C.get(t);return b(),o&&v(o,e,!0)?(o.value.modalScope.$$uibDestructionScheduled=!0,o.value.deferred.resolve(e),p(t,o.value.modalOpener),!0):!o},E.dismiss=function(t,e){var o=C.get(t);return b(),o&&v(o,e,!1)?(o.value.modalScope.$$uibDestructionScheduled=!0,o.value.deferred.reject(e),p(t,o.value.modalOpener),!0):!o},E.dismissAll=function(t){for(var e=this.getTop();e&&this.dismiss(e.key,t);)e=this.getTop()},E.getTop=function(){return C.top()},E.modalRendered=function(t){var e=C.get(t);e&&e.value.renderDeferred.resolve()},E.focusFirstFocusableElement=function(t){return t.length>0?(t[0].focus(),!0):!1},E.focusLastFocusableElement=function(t){return t.length>0?(t[t.length-1].focus(),!0):!1},E.isModalFocused=function(t,e){if(t&&e){var o=e.value.modalDomEl;if(o&&o.length)return(t.target||t.srcElement)===o[0]}return!1},E.isFocusInFirstItem=function(t,e){return e.length>0?(t.target||t.srcElement)===e[0]:!1},E.isFocusInLastItem=function(t,e){return e.length>0?(t.target||t.srcElement)===e[e.length-1]:!1},E.loadFocusElementList=function(t){if(t){var e=t.value.modalDomEl;if(e&&e.length){var o=e[0].querySelectorAll(N);return o?Array.prototype.filter.call(o,function(t){return u(t)}):o}}},E}]).provider("$uibModal",function(){var t={options:{animation:!0,backdrop:!0,keyboard:!0},$get:["$rootScope","$q","$document","$templateRequest","$controller","$uibResolve","$uibModalStack",function(e,o,n,r,i,a,l){function s(t){return t.template?o.when(t.template):r(angular.isFunction(t.templateUrl)?t.templateUrl():t.templateUrl)}var d={},u=null;return d.getPromiseChain=function(){return u},d.open=function(r){function d(){return g}var c=o.defer(),p=o.defer(),f=o.defer(),m=o.defer(),h={result:c.promise,opened:p.promise,closed:f.promise,rendered:m.promise,close:function(t){return l.close(h,t)},dismiss:function(t){return l.dismiss(h,t)}};if(r=angular.extend({},t.options,r),r.resolve=r.resolve||{},r.appendTo=r.appendTo||n.find("body").eq(0),!r.appendTo.length)throw new Error("appendTo element not found. Make sure that the element passed is in DOM.");if(!r.component&&!r.template&&!r.templateUrl)throw new Error("One of component or template or templateUrl options is required.");var g;g=r.component?o.when(a.resolve(r.resolve,{},null,null)):o.all([s(r),a.resolve(r.resolve,{},null,null)]);var v;return v=u=o.all([u]).then(d,d).then(function(t){function o(e,o,n,r){e.$scope=a,e.$scope.$resolve={},n?e.$scope.$uibModalInstance=h:e.$uibModalInstance=h;var i=o?t[1]:t;angular.forEach(i,function(t,o){r&&(e[o]=t),e.$scope.$resolve[o]=t})}var n=r.scope||e,a=n.$new();a.$close=h.close,a.$dismiss=h.dismiss,a.$on("$destroy",function(){a.$$uibDestructionScheduled||a.$dismiss("$uibUnscheduledDestruction")});var s,d,u={scope:a,deferred:c,renderDeferred:m,closedDeferred:f,animation:r.animation,backdrop:r.backdrop,keyboard:r.keyboard,backdropClass:r.backdropClass,windowTopClass:r.windowTopClass,windowClass:r.windowClass,windowTemplateUrl:r.windowTemplateUrl,ariaLabelledBy:r.ariaLabelledBy,ariaDescribedBy:r.ariaDescribedBy,size:r.size,openedClass:r.openedClass,appendTo:r.appendTo},g={},v={};r.component?(o(g,!1,!0,!1),g.name=r.component,u.component=g):r.controller&&(o(v,!0,!1,!0),d=i(r.controller,v,!0,r.controllerAs),r.controllerAs&&r.bindToController&&(s=d.instance,s.$close=a.$close,s.$dismiss=a.$dismiss,angular.extend(s,{$resolve:v.$scope.$resolve},n)),s=d(),angular.isFunction(s.$onInit)&&s.$onInit()),r.component||(u.content=t[0]),l.open(h,u),p.resolve(!0)},function(t){p.reject(t),c.reject(t)})["finally"](function(){u===v&&(u=null)}),h},d}]};return t}),angular.module("ui.bootstrap.multiMap",[]).factory("$$multiMap",function(){return{createNew:function(){var t={};return{entries:function(){return Object.keys(t).map(function(e){return{key:e,value:t[e]}})},get:function(e){return t[e]},hasKey:function(e){return!!t[e]},keys:function(){return Object.keys(t)},put:function(e,o){t[e]||(t[e]=[]),t[e].push(o)},remove:function(e,o){var n=t[e];if(n){var r=n.indexOf(o);-1!==r&&n.splice(r,1),n.length||delete t[e]}}}}}}),angular.module("ui.bootstrap.stackedMap",[]).factory("$$stackedMap",function(){return{createNew:function(){var t=[];return{add:function(e,o){t.push({key:e,value:o})},get:function(e){for(var o=0;o<t.length;o++)if(e===t[o].key)return t[o]},keys:function(){for(var e=[],o=0;o<t.length;o++)e.push(t[o].key);return e},top:function(){return t[t.length-1]},remove:function(e){for(var o=-1,n=0;n<t.length;n++)if(e===t[n].key){o=n;break}return t.splice(o,1)[0]},removeTop:function(){return t.pop()},length:function(){return t.length}}}}}),angular.module("ui.bootstrap.position",[]).factory("$uibPosition",["$document","$window",function(t,e){var o,n,r={normal:/(auto|scroll)/,hidden:/(auto|scroll|hidden)/},i={auto:/\s?auto?\s?/i,primary:/^(top|bottom|left|right)$/,secondary:/^(top|bottom|left|right|center)$/,vertical:/^(top|bottom)$/},a=/(HTML|BODY)/;return{getRawNode:function(t){return t.nodeName?t:t[0]||t},parseStyle:function(t){return t=parseFloat(t),isFinite(t)?t:0},offsetParent:function(o){function n(t){return"static"===(e.getComputedStyle(t).position||"static")}o=this.getRawNode(o);for(var r=o.offsetParent||t[0].documentElement;r&&r!==t[0].documentElement&&n(r);)r=r.offsetParent;return r||t[0].documentElement},scrollbarWidth:function(r){if(r){if(angular.isUndefined(n)){var i=t.find("body");i.addClass("uib-position-body-scrollbar-measure"),n=e.innerWidth-i[0].clientWidth,n=isFinite(n)?n:0,i.removeClass("uib-position-body-scrollbar-measure")}return n}if(angular.isUndefined(o)){var a=angular.element('<div class="uib-position-scrollbar-measure"></div>');t.find("body").append(a),o=a[0].offsetWidth-a[0].clientWidth,o=isFinite(o)?o:0,a.remove()}return o},scrollbarPadding:function(t){t=this.getRawNode(t);var o=e.getComputedStyle(t),n=this.parseStyle(o.paddingRight),r=this.parseStyle(o.paddingBottom),i=this.scrollParent(t,!1,!0),l=this.scrollbarWidth(a.test(i.tagName));return{scrollbarWidth:l,widthOverflow:i.scrollWidth>i.clientWidth,right:n+l,originalRight:n,heightOverflow:i.scrollHeight>i.clientHeight,bottom:r+l,originalBottom:r}},isScrollable:function(t,o){t=this.getRawNode(t);var n=o?r.hidden:r.normal,i=e.getComputedStyle(t);return n.test(i.overflow+i.overflowY+i.overflowX)},scrollParent:function(o,n,i){o=this.getRawNode(o);var a=n?r.hidden:r.normal,l=t[0].documentElement,s=e.getComputedStyle(o);if(i&&a.test(s.overflow+s.overflowY+s.overflowX))return o;var d="absolute"===s.position,u=o.parentElement||l;if(u===l||"fixed"===s.position)return l;for(;u.parentElement&&u!==l;){var c=e.getComputedStyle(u);if(d&&"static"!==c.position&&(d=!1),!d&&a.test(c.overflow+c.overflowY+c.overflowX))break;u=u.parentElement}return u},position:function(o,n){o=this.getRawNode(o);var r=this.offset(o);if(n){var i=e.getComputedStyle(o);r.top-=this.parseStyle(i.marginTop),r.left-=this.parseStyle(i.marginLeft)}var a=this.offsetParent(o),l={top:0,left:0};return a!==t[0].documentElement&&(l=this.offset(a),l.top+=a.clientTop-a.scrollTop,l.left+=a.clientLeft-a.scrollLeft),{width:Math.round(angular.isNumber(r.width)?r.width:o.offsetWidth),height:Math.round(angular.isNumber(r.height)?r.height:o.offsetHeight),top:Math.round(r.top-l.top),left:Math.round(r.left-l.left)}},offset:function(o){o=this.getRawNode(o);var n=o.getBoundingClientRect();return{width:Math.round(angular.isNumber(n.width)?n.width:o.offsetWidth),height:Math.round(angular.isNumber(n.height)?n.height:o.offsetHeight),top:Math.round(n.top+(e.pageYOffset||t[0].documentElement.scrollTop)),left:Math.round(n.left+(e.pageXOffset||t[0].documentElement.scrollLeft))}},viewportOffset:function(o,n,r){o=this.getRawNode(o),r=r!==!1?!0:!1;var i=o.getBoundingClientRect(),a={top:0,left:0,bottom:0,right:0},l=n?t[0].documentElement:this.scrollParent(o),s=l.getBoundingClientRect();if(a.top=s.top+l.clientTop,a.left=s.left+l.clientLeft,l===t[0].documentElement&&(a.top+=e.pageYOffset,a.left+=e.pageXOffset),a.bottom=a.top+l.clientHeight,a.right=a.left+l.clientWidth,r){var d=e.getComputedStyle(l);a.top+=this.parseStyle(d.paddingTop),a.bottom-=this.parseStyle(d.paddingBottom),a.left+=this.parseStyle(d.paddingLeft),a.right-=this.parseStyle(d.paddingRight)}return{top:Math.round(i.top-a.top),bottom:Math.round(a.bottom-i.bottom),left:Math.round(i.left-a.left),right:Math.round(a.right-i.right)}},parsePlacement:function(t){var e=i.auto.test(t);return e&&(t=t.replace(i.auto,"")),t=t.split("-"),t[0]=t[0]||"top",i.primary.test(t[0])||(t[0]="top"),t[1]=t[1]||"center",i.secondary.test(t[1])||(t[1]="center"),t[2]=e?!0:!1,t},positionElements:function(t,o,n,r){t=this.getRawNode(t),o=this.getRawNode(o);var a=angular.isDefined(o.offsetWidth)?o.offsetWidth:o.prop("offsetWidth"),l=angular.isDefined(o.offsetHeight)?o.offsetHeight:o.prop("offsetHeight");n=this.parsePlacement(n);var s=r?this.offset(t):this.position(t),d={top:0,left:0,placement:""};if(n[2]){var u=this.viewportOffset(t,r),c=e.getComputedStyle(o),p={width:a+Math.round(Math.abs(this.parseStyle(c.marginLeft)+this.parseStyle(c.marginRight))),height:l+Math.round(Math.abs(this.parseStyle(c.marginTop)+this.parseStyle(c.marginBottom)))};if(n[0]="top"===n[0]&&p.height>u.top&&p.height<=u.bottom?"bottom":"bottom"===n[0]&&p.height>u.bottom&&p.height<=u.top?"top":"left"===n[0]&&p.width>u.left&&p.width<=u.right?"right":"right"===n[0]&&p.width>u.right&&p.width<=u.left?"left":n[0],n[1]="top"===n[1]&&p.height-s.height>u.bottom&&p.height-s.height<=u.top?"bottom":"bottom"===n[1]&&p.height-s.height>u.top&&p.height-s.height<=u.bottom?"top":"left"===n[1]&&p.width-s.width>u.right&&p.width-s.width<=u.left?"right":"right"===n[1]&&p.width-s.width>u.left&&p.width-s.width<=u.right?"left":n[1],"center"===n[1])if(i.vertical.test(n[0])){var f=s.width/2-a/2;u.left+f<0&&p.width-s.width<=u.right?n[1]="left":u.right+f<0&&p.width-s.width<=u.left&&(n[1]="right")}else{var m=s.height/2-p.height/2;u.top+m<0&&p.height-s.height<=u.bottom?n[1]="top":u.bottom+m<0&&p.height-s.height<=u.top&&(n[1]="bottom")}}switch(n[0]){case"top":d.top=s.top-l;break;case"bottom":d.top=s.top+s.height;break;case"left":d.left=s.left-a;break;case"right":d.left=s.left+s.width}switch(n[1]){case"top":d.top=s.top;break;case"bottom":d.top=s.top+s.height-l;break;case"left":d.left=s.left;break;case"right":d.left=s.left+s.width-a;break;case"center":i.vertical.test(n[0])?d.left=s.left+s.width/2-a/2:d.top=s.top+s.height/2-l/2}return d.top=Math.round(d.top),d.left=Math.round(d.left),d.placement="center"===n[1]?n[0]:n[0]+"-"+n[1],d},adjustTop:function(t,e,o,n){return-1!==t.indexOf("top")&&o!==n?{top:e.top-n+"px"}:void 0},positionArrow:function(t,o){t=this.getRawNode(t);var n=t.querySelector(".tooltip-inner, .popover-inner");if(n){var r=angular.element(n).hasClass("tooltip-inner"),a=t.querySelector(r?".tooltip-arrow":".arrow");if(a){var l={top:"",bottom:"",left:"",right:""};if(o=this.parsePlacement(o),"center"===o[1])return void angular.element(a).css(l);var s="border-"+o[0]+"-width",d=e.getComputedStyle(a)[s],u="border-";u+=i.vertical.test(o[0])?o[0]+"-"+o[1]:o[1]+"-"+o[0],u+="-radius";var c=e.getComputedStyle(r?n:t)[u];switch(o[0]){case"top":l.bottom=r?"0":"-"+d;break;case"bottom":l.top=r?"0":"-"+d;break;case"left":l.right=r?"0":"-"+d;break;case"right":l.left=r?"0":"-"+d}l[o[1]]=c,angular.element(a).css(l)}}}}}]),angular.module("uib/template/modal/window.html",[]).run(["$templateCache",function(t){t.put("uib/template/modal/window.html","<div class=\"modal-dialog {{size ? 'modal-' + size : ''}}\"><div class=\"modal-content\" uib-modal-transclude></div></div>\n")}]),angular.module("ui.bootstrap.position").run(function(){!angular.$$csp().noInlineStyle&&!angular.$$uibPositionCss&&angular.element(document).find("head").prepend('<style type="text/css">.uib-position-measure{display:block !important;visibility:hidden !important;position:absolute !important;top:-9999px !important;left:-9999px !important;}.uib-position-scrollbar-measure{position:absolute !important;top:-9999px !important;width:50px !important;height:50px !important;overflow:scroll !important;}.uib-position-body-scrollbar-measure{overflow:scroll !important;}</style>'),angular.$$uibPositionCss=!0});
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Pepper=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require('./lib');
},{"./lib":3}],2:[function(require,module,exports){

/*
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.1 Copyright (C) Paul Johnston 1999 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */

/*
 * Calculate the MD5 of an array of little-endian words, and a bit length
 */
function core_md5(x, len) {
  /* append padding */
  x[len >> 5] |= 0x80 << ((len) % 32);
  x[(((len + 64) >>> 9) << 4) + 14] = len;

  var a = 1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d = 271733878;

  for (var i = 0; i < x.length; i += 16) {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;

    a = md5_ff(a, b, c, d, x[i + 0], 7, -680876936);
    d = md5_ff(d, a, b, c, x[i + 1], 12, -389564586);
    c = md5_ff(c, d, a, b, x[i + 2], 17, 606105819);
    b = md5_ff(b, c, d, a, x[i + 3], 22, -1044525330);
    a = md5_ff(a, b, c, d, x[i + 4], 7, -176418897);
    d = md5_ff(d, a, b, c, x[i + 5], 12, 1200080426);
    c = md5_ff(c, d, a, b, x[i + 6], 17, -1473231341);
    b = md5_ff(b, c, d, a, x[i + 7], 22, -45705983);
    a = md5_ff(a, b, c, d, x[i + 8], 7, 1770035416);
    d = md5_ff(d, a, b, c, x[i + 9], 12, -1958414417);
    c = md5_ff(c, d, a, b, x[i + 10], 17, -42063);
    b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
    a = md5_ff(a, b, c, d, x[i + 12], 7, 1804603682);
    d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
    c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
    b = md5_ff(b, c, d, a, x[i + 15], 22, 1236535329);

    a = md5_gg(a, b, c, d, x[i + 1], 5, -165796510);
    d = md5_gg(d, a, b, c, x[i + 6], 9, -1069501632);
    c = md5_gg(c, d, a, b, x[i + 11], 14, 643717713);
    b = md5_gg(b, c, d, a, x[i + 0], 20, -373897302);
    a = md5_gg(a, b, c, d, x[i + 5], 5, -701558691);
    d = md5_gg(d, a, b, c, x[i + 10], 9, 38016083);
    c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
    b = md5_gg(b, c, d, a, x[i + 4], 20, -405537848);
    a = md5_gg(a, b, c, d, x[i + 9], 5, 568446438);
    d = md5_gg(d, a, b, c, x[i + 14], 9, -1019803690);
    c = md5_gg(c, d, a, b, x[i + 3], 14, -187363961);
    b = md5_gg(b, c, d, a, x[i + 8], 20, 1163531501);
    a = md5_gg(a, b, c, d, x[i + 13], 5, -1444681467);
    d = md5_gg(d, a, b, c, x[i + 2], 9, -51403784);
    c = md5_gg(c, d, a, b, x[i + 7], 14, 1735328473);
    b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);

    a = md5_hh(a, b, c, d, x[i + 5], 4, -378558);
    d = md5_hh(d, a, b, c, x[i + 8], 11, -2022574463);
    c = md5_hh(c, d, a, b, x[i + 11], 16, 1839030562);
    b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
    a = md5_hh(a, b, c, d, x[i + 1], 4, -1530992060);
    d = md5_hh(d, a, b, c, x[i + 4], 11, 1272893353);
    c = md5_hh(c, d, a, b, x[i + 7], 16, -155497632);
    b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
    a = md5_hh(a, b, c, d, x[i + 13], 4, 681279174);
    d = md5_hh(d, a, b, c, x[i + 0], 11, -358537222);
    c = md5_hh(c, d, a, b, x[i + 3], 16, -722521979);
    b = md5_hh(b, c, d, a, x[i + 6], 23, 76029189);
    a = md5_hh(a, b, c, d, x[i + 9], 4, -640364487);
    d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
    c = md5_hh(c, d, a, b, x[i + 15], 16, 530742520);
    b = md5_hh(b, c, d, a, x[i + 2], 23, -995338651);

    a = md5_ii(a, b, c, d, x[i + 0], 6, -198630844);
    d = md5_ii(d, a, b, c, x[i + 7], 10, 1126891415);
    c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
    b = md5_ii(b, c, d, a, x[i + 5], 21, -57434055);
    a = md5_ii(a, b, c, d, x[i + 12], 6, 1700485571);
    d = md5_ii(d, a, b, c, x[i + 3], 10, -1894986606);
    c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
    b = md5_ii(b, c, d, a, x[i + 1], 21, -2054922799);
    a = md5_ii(a, b, c, d, x[i + 8], 6, 1873313359);
    d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
    c = md5_ii(c, d, a, b, x[i + 6], 15, -1560198380);
    b = md5_ii(b, c, d, a, x[i + 13], 21, 1309151649);
    a = md5_ii(a, b, c, d, x[i + 4], 6, -145523070);
    d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
    c = md5_ii(c, d, a, b, x[i + 2], 15, 718787259);
    b = md5_ii(b, c, d, a, x[i + 9], 21, -343485551);

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
  }
  return Array(a, b, c, d);

}

/*
 * These functions implement the four basic operations the algorithm uses.
 */
function md5_cmn(q, a, b, x, s, t) {
  return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b);
}

function md5_ff(a, b, c, d, x, s, t) {
  return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
}

function md5_gg(a, b, c, d, x, s, t) {
  return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
}

function md5_hh(a, b, c, d, x, s, t) {
  return md5_cmn(b ^ c ^ d, a, b, x, s, t);
}

function md5_ii(a, b, c, d, x, s, t) {
  return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y) {
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function bit_rol(num, cnt) {
  return (num << cnt) | (num >>> (32 - cnt));
}

module.exports = core_md5;

},{}],3:[function(require,module,exports){

/**
 * Module dependencies
 */

var debug = require('debug')('pepper');
var jsonp = require('jsonp');
var querystring = require('querystring');
var url = require('url');
var request = require('superagent');

var utils = require('./utils');
var isNode = typeof window !== 'object';


module.exports = Pepper;


function Pepper(options) {
  if (!(this instanceof Pepper)) return new Pepper(options || {});

  if (typeof options.querystring === 'string') {
    this.querystring = options.querystring;
  } else {
    this.querystring = !isNode ? window.location.search : null;
  }

  this.data = utils.parseQS(this.querystring);

  this.status = {};

  if (options.host && /^http/gi.test(options.host)) {
    throw new Error('option `host` must not contain protocol');
  }

  this.host = options.host || this.data.uamip;
  this.port = +(options.port || this.data.uamport);

  this.interval = options.interval ?
    parseInt(options.interval, 10) :
    null;

  if (typeof options.ssl === 'boolean') {
    this.ssl = !!options.ssl;
  } else {
    this.ssl = !isNode ? window.location.protocol === 'https:' : false;
  }

  this.ident = options.ident || '00';
  this.uamservice = options.uamservice ? url.parse(options.uamservice) : null;

  //

  this._refreshInterval = null;

  this._jsonpOptions = {
    timeout: +options.timeout || 5000,
    prefix: '__Pepper'
  };

  // calculate API base url (or throw)

  this._baseUrl = utils.getBaseUrl(this.host, this.port, this.ssl);

  if (!this._baseUrl) {
    throw new Error('Cannot determine CoovaChilli JSON API base url');
  }

  // check if uamservice uri is secure

  if (this.uamservice && this.uamservice.protocol !== 'https:') {
    var message = 'warning: uamservice uri is insecure - Password will be sent in cleartext';

    if (console) {
      console.log(message);
    } else {
      alert(message);
    }
  }

  debug('computed CoovaChilli JSON interface baseUrl: %s', this._baseUrl);
}


/**
 * CoovaChilli clientState codes
 *
 * @type {Object}
 */

Pepper.stateCodes = {
  UNKNOWN: -1,
  NOT_AUTH: 0,
  AUTH: 1,
  AUTH_PENDING: 2,
  AUTH_SPLASH: 3
};


/**
 * Pepper supported authentication protocols
 *
 * @type {Array}
 */

Pepper.authProtocols = ['pap', 'chap'];


/**
 * Performs a 'logon' action on CoovaChilli
 *
 * @param  {String} username
 * @param  {String} password
 * @param  {Object} password
 */

Pepper.prototype.logon = function(username, password, options, callback) {

  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  if (typeof callback !== 'function') {
    throw new Error('callback function is required on logon');
  }

  if (typeof options !== 'object') {
    throw new Error('options should must be an object');
  }

  if (typeof username !== 'string' || username.length === 0) {
    return callback(new TypeError('username must be a string'));
  }

  if (typeof password !== 'string' || password.length === 0) {
    return callback(new TypeError('password must be a string'));
  }

  if (this.status.clientState === Pepper.stateCodes.AUTH) {
    return callback(new Error('Current clientState is already ' + Pepper.stateCodes.AUTH));
  }

  // check / set authentication protocol

  if (options.protocol) {

    var valid = ~Pepper.authProtocols.indexOf(options.protocol.toLowerCase());

    if (!valid) {
      return callback(new Error('Invalid or unsupported authentication protocol'));
    }

  }

  var protocol = options.protocol ? options.protocol.toLowerCase() : 'chap';

  debug('starting logon for %s - %s - protocol: %s', username, password, protocol);

  // 1. check current status on CoovaChilli

  var self = this;

  this._api(this._baseUrl + 'status', function(err, data) {

    if (err) return callback(err);

    if (!data.challenge) {
      return callback(new Error('Cannot find a challenge'));
    }

    if (data.clientState === Pepper.stateCodes.AUTH) {
      return callback(new Error('Current clientState is already %s', Pepper.stateCodes.AUTH));
    }

    self.status = data;

    if (self.uamservice && protocol === 'chap') {

      // 2-A. Handle uamservice

      debug('calling uamservice uri: %s', self.uamservice.href);

      self._callUamservice(username, password, data.challenge, function(err, response) {
        if (err) return callback(err);

        if (!response || !response.chap) {
          return callback(new Error('uamservice response is invalid (missing "chap" field)'));
        }

        debug('obtained uamservice response', response);

        // 3-A. Call logon API

        self._callLogon({
          username: username,
          response: response.chap
        }, callback);

      });

    } else {

      // 2-B. Calculate CHAP with obtained challenge (if needed)
      //    NOTE: clear password will be converted to hex inside utils.chap()

      if (protocol === 'chap') {
        self.chap = utils.chap(self.ident, password, self.status.challenge);
        debug('computed CHAP-Password: %s', self.chap);
      }

      // Prepare logon payload, handling authentication protocol

      var payload = {
        username: username
      };

      if (protocol === 'chap') {
        payload.response = self.chap;
      } else {
        payload.password = password;
      }

      debug('logon payload', payload);

      // 3-B. call logon API

      self._callLogon(payload, callback);

    }

  });

};


/**
 * Performs a 'logoff' action on CoovaChilli
 *
 * @callback {Pepper~onSuccess}
 */

Pepper.prototype.logoff = function(callback) {
  clearInterval(this._refreshInterval);

  var self = this;

  this._api(this._baseUrl + 'logoff', function(err, data) {
    if (data) self.status = data;
    if (callback) callback(err, data);
  });
};


/**
 * Performs a 'refresh' action on CoovaChilli
 *
 * @callback {Pepper~onSuccess}
 */

Pepper.prototype.refresh = function(callback) {
  var self = this;

  this._api(this._baseUrl + 'status', function(err, data) {
    if (data) self.status = data;
    if (callback) callback(err, data);
  });
};


/**
 * Start auto-refresh routine
 * (will update accounting status every {interval}s)
 */

Pepper.prototype.startAutoRefresh = function(interval) {
  if (!interval && !this.interval) return;

  var i = interval || this.interval, self = this;
  clearInterval(this._refreshInterval);

  this._refreshInterval = setInterval(function() {
    self.refresh();
  }, i);

  debug('Auto-refreshing status every %s ms', i);
};


/**
 * Stop auto-refresh routine
 */

Pepper.prototype.stopAutoRefresh = function() {
  clearInterval(this._refreshInterval);
  debug('Stop Auto-refreshing status');
};


/**
 * call logon API
 *
 * @param  {Object}   payload
 * @callback {Pepper~onSuccess}
 */

Pepper.prototype._callLogon = function(payload, callback) {
  var self = this;

  this._api(this._baseUrl + 'logon', payload, function(err, data) {
    if (err) return callback(err);
    if (data) {
      self.status = data;

      if (data.clientState === Pepper.stateCodes.AUTH) {
        self.startAutoRefresh();
      }
    }

    callback(err, data);
  });
};


/**
 * Call uamservice API
 *
 * @param  {String}   username
 * @param  {String}   password
 * @param  {String}   challenge
 * @callback {Pepper~onSuccess}
 */

Pepper.prototype._callUamservice = function(username, password, challenge, callback) {
  var payload = {
    username: username,
    password: password,
    challenge: challenge,
    userurl: this.data.userurl
  };

  var qs = this.uamservice.query ?
    this.uamservice.query + querystring.stringify(payload) :
    this.uamservice.query;

  var uri = this.uamservice.href + '?' + qs;

  this._api(uri, this._jsonpOptions, callback);
};


/**
 * Call a JSON API
 *
 * @param  {String} uri
 * @param  {String|Object|null} qs
 * @callback {Pepper~onSuccess}
 */

Pepper.prototype._api = function(uri, qs, callback) {
  if (typeof qs === 'function') {
    callback = qs;
    qs = null;
  } else {
    uri += '?';
  }

  uri += typeof qs === 'string' ? qs : querystring.stringify(qs);

  if (isNode) {
    request
      .get(uri)
      .timeout(this._jsonpOptions.timeout)
      .end(function(err, res) {
        if (err) return callback(err);

        // We have to force JSON.parse on text response here.
        // Why? superagent expect an 'application/json' Content-Type,
        // but CoovaChilli responds with 'text/javascript'

        var data = res.header['content-type'] === 'text/javascript' ?
          JSON.parse(res.text) :
          res.body;

        debug('superagent got', data);
        callback(null, data);
      });
  } else {
    jsonp(uri, this._jsonpOptions, callback);
  }
};

},{"./utils":4,"debug":6,"jsonp":8,"querystring":14,"superagent":5,"url":15}],4:[function(require,module,exports){

/**
 * Module dependencies
 */

var querystring = require('querystring');
var core_md5 = require('./core_md5');

/**
 * Get CoovaChilli JSON interface base url
 *
 * @param  {String} host
 * @param  {Number} port
 * @param  {Boolean} ssl
 *
 * @returns {String|null}
 */


var getBaseUrl = exports.getBaseUrl = function(host, port, ssl) {
  var base = null;

  if (host) {
    var protocol = ssl ? 'https:' : 'http:';
    if (protocol === 'https:') port = null;

    base = protocol + '//' + host + (port ? ':' + port : '') + '/json/';
  }

  return base;
};

/**
 * Parse CoovaChilli querystring
 * after captive portal redirection to UAMSERVER
 *
 * @param  {String} qs
 * @return {Object|null}
 */

var parseQS = exports.parseQS = function(qs) {
  if (!qs) return {};

  var data = querystring.parse(qs.slice(1));
  if (!data.loginurl) return {};

  return querystring.parse(data.loginurl);
};


/**
 * Calculate chap MD5
 * NOTE: ident and challenge are 'hex' strings
 *
 * @param  {String} ident
 * @param  {String} password
 * @param  {String} challenge
 *
 * @return {String}
 */

var chap = exports.chap = function(ident, password, challenge) {
  var hexPassword = str2hex(password);

  var hex = ident + hexPassword + challenge;
  var bin = hex2binl(hex);
  var md5 = core_md5(bin, hex.length * 4);

  return binl2hex(md5);
};

/**
 * hex2binl / binl2hex / str2hex (extracted from ChilliMD5 object)
 */

var hexcase = 0; /* hex output format. 0 - lowercase; 1 - uppercase */
var b64pad = ''; /* base-64 pad character. "=" for strict RFC compliance */
var chrsz = 8; /* bits per input character. 8 - ASCII; 16 - Unicode */

var str2hex = exports.str2hex = function(str) {
  var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
  var hex = '';
  var val;
  for (var i = 0; i < str.length; i++) {
    /* TODO: adapt this if chrz=16   */
    val = str.charCodeAt(i);
    hex = hex + hex_tab.charAt(val / 16);
    hex = hex + hex_tab.charAt(val % 16);
  }
  return hex;
};

var hex2binl = exports.hex2binl = function(hex) {
  /*  Clean-up hex encoded input string */
  hex = hex.toLowerCase();
  hex = hex.replace(/ /g, '');

  var bin = [];

  /* Transfrom to array of integers (binary representation) */
  for (i = 0; i < hex.length * 4; i = i + 8) {
    octet = parseInt(hex.substr(i / 4, 2), 16);
    bin[i >> 5] |= (octet & 255) << (i % 32);
  }
  return bin;
};

var binl2hex = exports.binl2hex = function(binarray) {
  var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
  var str = '';
  for (var i = 0; i < binarray.length * 4; i++) {
    str += hex_tab.charAt((binarray[i >> 2] >> ((i % 4) * 8 + 4)) & 0xF) +
      hex_tab.charAt((binarray[i >> 2] >> ((i % 4) * 8)) & 0xF);
  }
  return str;
};

},{"./core_md5":2,"querystring":14}],5:[function(require,module,exports){

},{}],6:[function(require,module,exports){
(function (process){
/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = 'undefined' != typeof chrome
               && 'undefined' != typeof chrome.storage
                  ? chrome.storage.local
                  : localstorage();

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // NB: In an Electron preload script, document will be defined but not fully
  // initialized. Since we know we're in Chrome, we'll just detect this case
  // explicitly
  if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
    return true;
  }

  // is webkit? http://stackoverflow.com/a/16459606/376773
  // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
  return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
    // double check webkit in userAgent just in case we are in a worker
    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  try {
    return JSON.stringify(v);
  } catch (err) {
    return '[UnexpectedJSONParseError]: ' + err.message;
  }
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(args) {
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return;

  var c = 'color: ' + this.color;
  args.splice(1, 0, c, 'color: inherit')

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-zA-Z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = exports.storage.debug;
  } catch(e) {}

  // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
  if (!r && typeof process !== 'undefined' && 'env' in process) {
    r = process.env.DEBUG;
  }

  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
  try {
    return window.localStorage;
  } catch (e) {}
}

}).call(this,require('_process'))
},{"./debug":7,"_process":10}],7:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = createDebug.debug = createDebug['default'] = createDebug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
 */

exports.formatters = {};

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 * @param {String} namespace
 * @return {Number}
 * @api private
 */

function selectColor(namespace) {
  var hash = 0, i;

  for (i in namespace) {
    hash  = ((hash << 5) - hash) + namespace.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  return exports.colors[Math.abs(hash) % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function createDebug(namespace) {

  function debug() {
    // disabled?
    if (!debug.enabled) return;

    var self = debug;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // turn the `arguments` into a proper Array
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %O
      args.unshift('%O');
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    // apply env-specific formatting (colors, etc.)
    exports.formatArgs.call(self, args);

    var logFn = debug.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }

  debug.namespace = namespace;
  debug.enabled = exports.enabled(namespace);
  debug.useColors = exports.useColors();
  debug.color = selectColor(namespace);

  // env-specific initialization logic for debug instances
  if ('function' === typeof exports.init) {
    exports.init(debug);
  }

  return debug;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  exports.names = [];
  exports.skips = [];

  var split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":9}],8:[function(require,module,exports){
/**
 * Module dependencies
 */

var debug = require('debug')('jsonp');

/**
 * Module exports.
 */

module.exports = jsonp;

/**
 * Callback index.
 */

var count = 0;

/**
 * Noop function.
 */

function noop(){}

/**
 * JSONP handler
 *
 * Options:
 *  - param {String} qs parameter (`callback`)
 *  - timeout {Number} how long after a timeout error is emitted (`60000`)
 *
 * @param {String} url
 * @param {Object|Function} optional options / callback
 * @param {Function} optional callback
 */

function jsonp(url, opts, fn){
  if ('function' == typeof opts) {
    fn = opts;
    opts = {};
  }
  if (!opts) opts = {};

  var prefix = opts.prefix || '__jp';
  var param = opts.param || 'callback';
  var timeout = null != opts.timeout ? opts.timeout : 60000;
  var enc = encodeURIComponent;
  var target = document.getElementsByTagName('script')[0] || document.head;
  var script;
  var timer;

  // generate a unique id for this request
  var id = prefix + (count++);

  if (timeout) {
    timer = setTimeout(function(){
      cleanup();
      if (fn) fn(new Error('Timeout'));
    }, timeout);
  }

  function cleanup(){
    if (script.parentNode) script.parentNode.removeChild(script);
    window[id] = noop;
    if (timer) clearTimeout(timer);
  }

  function cancel(){
    if (window[id]) {
      cleanup();
    }
  }

  window[id] = function(data){
    debug('jsonp got', data);
    cleanup();
    if (fn) fn(null, data);
  };

  // add qs component
  url += (~url.indexOf('?') ? '&' : '?') + param + '=' + enc(id);
  url = url.replace('?&', '?');

  debug('jsonp req "%s"', url);

  // create script
  script = document.createElement('script');
  script.src = url;
  target.parentNode.insertBefore(script, target);

  return cancel;
}

},{"debug":6}],9:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isNaN(val) === false) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val)
  );
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  if (ms >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (ms >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (ms >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (ms >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  return plural(ms, d, 'day') ||
    plural(ms, h, 'hour') ||
    plural(ms, m, 'minute') ||
    plural(ms, s, 'second') ||
    ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) {
    return;
  }
  if (ms < n * 1.5) {
    return Math.floor(ms / n) + ' ' + name;
  }
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],10:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],11:[function(require,module,exports){
(function (global){
/*! http://mths.be/punycode v1.2.4 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports;
	var freeModule = typeof module == 'object' && module &&
		module.exports == freeExports && module;
	var freeGlobal = typeof global == 'object' && global;
	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^ -~]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /\x2E|\u3002|\uFF0E|\uFF61/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		while (length--) {
			array[length] = fn(array[length]);
		}
		return array;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings.
	 * @private
	 * @param {String} domain The domain name.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		return map(string.split(regexSeparators), fn).join('.');
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <http://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * http://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols to a Punycode string of ASCII-only
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name to Unicode. Only the
	 * Punycoded parts of the domain name will be converted, i.e. it doesn't
	 * matter if you call it on a string that has already been converted to
	 * Unicode.
	 * @memberOf punycode
	 * @param {String} domain The Punycode domain name to convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(domain) {
		return mapDomain(domain, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name to Punycode. Only the
	 * non-ASCII parts of the domain name will be converted, i.e. it doesn't
	 * matter if you call it with a domain that's already in ASCII.
	 * @memberOf punycode
	 * @param {String} domain The domain name to convert, as a Unicode string.
	 * @returns {String} The Punycode representation of the given domain name.
	 */
	function toASCII(domain) {
		return mapDomain(domain, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.2.4',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <http://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],12:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],13:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],14:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":12,"./encode":13}],15:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var punycode = require('punycode');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a puny coded representation of "domain".
      // It only converts the part of the domain name that
      // has non ASCII characters. I.e. it dosent matter if
      // you call it with a domain that already is in ASCII.
      var domainArray = this.hostname.split('.');
      var newOut = [];
      for (var i = 0; i < domainArray.length; ++i) {
        var s = domainArray[i];
        newOut.push(s.match(/[^A-Za-z0-9_-]/) ?
            'xn--' + punycode.encode(s) : s);
      }
      this.hostname = newOut.join('.');
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  Object.keys(this).forEach(function(k) {
    result[k] = this[k];
  }, this);

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    Object.keys(relative).forEach(function(k) {
      if (k !== 'protocol')
        result[k] = relative[k];
    });

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      Object.keys(relative).forEach(function(k) {
        result[k] = relative[k];
      });
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especialy happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!isNull(result.pathname) || !isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host) && (last === '.' || last === '..') ||
      last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last == '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especialy happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!isNull(result.pathname) || !isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

function isString(arg) {
  return typeof arg === "string";
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isNull(arg) {
  return arg === null;
}
function isNullOrUndefined(arg) {
  return  arg == null;
}

},{"punycode":11,"querystring":14}]},{},[1])(1)
});