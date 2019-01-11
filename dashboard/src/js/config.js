// config
var app =
	angular.module ( 'app' )
		.config (
			[ '$controllerProvider', '$compileProvider', '$filterProvider', '$provide', '$ocLazyLoadProvider',
				function ( $controllerProvider, $compileProvider, $filterProvider, $provide, $ocLazyLoadProvider ) {

					// lazy controller, directive and service
					app.controller = $controllerProvider.register;
					app.directive = $compileProvider.directive;
					app.filter = $filterProvider.register;
					app.factory = $provide.factory;
					app.service = $provide.service;
					app.constant = $provide.constant;
					app.value = $provide.value;
					$ocLazyLoadProvider.config ( {
						debug: true
					} );
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
								location.replace ( initialPage + '#/access/signin' );
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

			Chart.pluginService.register ( {
				beforeDraw: function ( chart ) {
					if ( chart.config.options.elements.center ) {
						//Get ctx from string
						var ctx = chart.chart.ctx;

						//Get options from the center object in options
						var centerConfig = chart.config.options.elements.center;
						var fontStyle = centerConfig.fontStyle || 'Arial';
						var txt = centerConfig.text;
						var color = centerConfig.color || '#000';
						var sidePadding = centerConfig.sidePadding || 20;
						var sidePaddingCalculated = (sidePadding / 100) * (chart.innerRadius * 2)
						//Start with a base font of 30px
						ctx.font = "30px " + fontStyle;

						//Get the width of the string and also the width of the element minus 10 to give it 5px side padding
						var stringWidth = ctx.measureText ( txt ).width;
						var elementWidth = (chart.innerRadius * 2) - sidePaddingCalculated;

						// Find out how much the font can grow in width.
						var widthRatio = elementWidth / stringWidth;
						var newFontSize = Math.floor ( 30 * widthRatio );
						var elementHeight = (chart.innerRadius * 2);

						// Pick a new font size so it will not be larger than the height of label.
						var fontSizeToUse = Math.min ( newFontSize, elementHeight );

						//Set font settings to draw it correctly.
						ctx.textAlign = 'center';
						ctx.textBaseline = 'middle';
						var centerX = ((chart.chartArea.left + chart.chartArea.right) / 2);
						var centerY = ((chart.chartArea.top + chart.chartArea.bottom) / 2);
						ctx.font = fontSizeToUse + "px " + fontStyle;
						ctx.fillStyle = color;

						//Draw text in center
						ctx.fillText ( txt, centerX, centerY );
					}
				}
			} );
		} ] ).run ();
