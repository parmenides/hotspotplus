// lazyload config

angular.module ( 'masterHotspotApp')
  .constant ( 'JQ_CONFIG', {} )
  .constant ( 'MODULE_CONFIG', [
    {
      name:  'hotspotplus.tpls.alpha',
      files: [
        'controllers/alpha.templates.js',
        'controllers/base.js'
      ]
    },
	  {
		  name:  'hotspotplus.tpls.loyalty',
		  files: [
			  'controllers/loyalty.templates.js',
			  'controllers/loyalty.js'
		  ]
	  }
    ] )
  // oclazyload config
  .config ( [ '$ocLazyLoadProvider', 'MODULE_CONFIG', function ( $ocLazyLoadProvider, MODULE_CONFIG ) {
    // We configure ocLazyLoad to use the lib script.js as the async loader
    $ocLazyLoadProvider.config ( {
      debug:   false,
      events:  true,
      modules: MODULE_CONFIG
    } );
  } ] )
;
