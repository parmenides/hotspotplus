
// config
var app =
	angular.module ( 'app' )
		.config (
			[ '$controllerProvider', '$compileProvider', '$filterProvider', '$provide','$ocLazyLoadProvider',
				function ( $controllerProvider, $compileProvider, $filterProvider, $provide,$ocLazyLoadProvider ) {

					// lazy controller, directive and service
					app.controller = $controllerProvider.register;
					app.directive = $compileProvider.directive;
					app.filter = $filterProvider.register;
					app.factory = $provide.factory;
					app.service = $provide.service;
					app.constant = $provide.constant;
					app.value = $provide.value;
					$ocLazyLoadProvider.config({
						debug: true
					});
				}
			] )
		.config ( [ '$translateProvider', '$httpProvider', function ( $translateProvider, $httpProvider ) {
			// Register a loader for the static files
			// So, the module will search missing translation tables under the specified urls.
			// Those urls are [prefix][langKey][suffix].
			$translateProvider.useStaticFilesLoader ( {
				prefix: 'l10n/',
				suffix: '.js'
			} );

			//Handle 401 responses
			$httpProvider.interceptors.push ( function ( $q, $location ) {
				return {
					responseError: function ( rejection ) {
						if ( rejection.status == 401 ) {
							var initialPage = location.pathname;
							var hash = location.hash;
							if ( hash.indexOf ( 'public' ) !== -1 || hash.indexOf ( 'access' ) !== -1 ) {
								location.replace ( initialPage + hash );
							} else {
								location.replace ( initialPage + '#/access.adminSignIn' );
							}
						}
						return $q.reject ( rejection );
					}
				};
			} );
			// Tell the module what language to use by default
			$translateProvider.preferredLanguage ( 'fa_IR' );
			// Tell the module to store the language in the local storage
			//$translateProvider.useLocalStorage ();

		} ] ).run ();
