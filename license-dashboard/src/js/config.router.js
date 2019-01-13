'use strict';


/**
 * Config for the router
 */
angular.module ( 'app' )
	.run (
		[ '$rootScope', '$state', '$stateParams',
			function ( $rootScope, $state, $stateParams ) {
				$rootScope.$state = $state;
				$rootScope.$stateParams = $stateParams;
				$rootScope.isCloud = function () {
					return Window.serviceStatus === 'cloud';
				};
			}
		]
	);
app.config (
	[ '$stateProvider', '$urlRouterProvider', 'JQ_CONFIG', 'MODULE_CONFIG',
		function ( $stateProvider, $urlRouterProvider, JQ_CONFIG, MODULE_CONFIG ) {
			var PREFIX = Window.PREFIX = "/src/";
			var TEMPLATE_PREFIX = Window.TEMPLATE_PREFIX = "/src/";
			if ( Window.appStatus === "production" || Window.appStatus === "sandbox" ) {
				PREFIX = Window.PREFIX = "/";
				TEMPLATE_PREFIX = Window.TEMPLATE_PREFIX = "";
			}
			app.constant ( 'PREFIX', Window.PREFIX );
			app.constant ( 'TEMPLATE_PREFIX', Window.TEMPLATE_PREFIX );

			var layout = "tpl/app.html";
			$urlRouterProvider.otherwise ( '/app/licenses' );
			$stateProvider.state ( 'app', {
				abstract:    true,
				url:         '/app',
				templateUrl: layout,
				resolve:     load ( [] )
			} )
				.state ( 'app.licenses', {
					url:         '/licenses',
					templateUrl: TEMPLATE_PREFIX + 'app/license/tpl/licenseList.html',
					resolve:     load ( [ 'ui.grid', 'ui.grid.pagination', 'ui.grid.selection', 'ui.bootstrap.persian.datepicker', 'ui.grid.resizeColumns',
						PREFIX + 'app/license/licenseList.js' ] )
				} )
				.state ( 'access', {
					url:      '/access',
					template: '<div ui-view class="fade-in-right-big smooth"></div>'
				} )
				.state ( 'access.adminSignIn', {
					url:         '/public/admin/signin',
					templateUrl: TEMPLATE_PREFIX + 'app/admin/tpl/signIn.html',
					resolve:     load ( [ PREFIX + 'app/admin/auth.js' ] )
				} );


			function load ( srcs, callback ) {
				return {
					deps: [ '$ocLazyLoad', '$q',
						function ( $ocLazyLoad, $q ) {
							var deferred = $q.defer ();
							var promise = false;
							srcs = angular.isArray ( srcs ) ? srcs : srcs.split ( /\s+/ );
							if ( !promise ) {
								promise = deferred.promise;
							}
							angular.forEach ( srcs, function ( src ) {
								promise = promise.then ( function () {
									if ( JQ_CONFIG[ src ] ) {
										return $ocLazyLoad.load ( JQ_CONFIG[ src ] );
									}
									var name;
									angular.forEach ( MODULE_CONFIG, function ( module ) {
										if ( module.name == src ) {
											name = module.name;
										} else {
											name = src;
										}
									} );
									return $ocLazyLoad.load ( name );
								} );
							} );
							deferred.resolve ();
							return callback ? promise.then ( function () {
								return callback ();
							} ) : promise;
						} ]
				}
			}

		}
	]
);
