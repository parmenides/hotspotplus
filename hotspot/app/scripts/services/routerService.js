/**
 * Created by payamyousefi on 4/26/17.
 */

angular.module ( 'masterHotspotApp' ).service ( 'routerService', [ '$http', 'config', '$log', '$q', '$httpParamSerializer', function ( $http, config, $log, $q, $httpParamSerializer ) {

	var MIKROTIK = 'mikrotik';
	var COOVACHILLI = 'coovachilli';
	var ENGENIUS = 'engenius';
	var XCLAIM = 'xclaim';
	this.login = function ( username, password, signinForm, clbk ) {
		if ( isMikrotik () ) {
			return mikrotikLogin ( username, password, clbk );
		} else if ( isCoovaChilli () ) {
			return coovaLogin ( username, password, clbk );
		} else if ( isEnGenius () ) {
			return engeniusLogin ( signinForm, clbk );
		}
	};

	/*this.getLoginUrl = function () {
	 if ( isMikrotik() ) {
	 return 'http://' + config.host + '/login';
	 } else {
	 return config.actionUrl;
	 }
	 };*/

	this.logout = function ( clbk ) {
		if ( isMikrotik () ) {
			return mikrotikLogout ( clbk );
		} else if ( isCoovaChilli () ) {
			return coovaChilliLogout ( clbk );
		} else if ( isEnGenius () ) {
			return coovaChilliLogout ( clbk );
		}
	};

	this.isLogin = function ( clbk ) {
		if ( isMikrotik () ) {
			return isMikrotikLogin ( clbk );
		} else if ( isCoovaChilli () ) {
			return isCoovaChilliLogin ( clbk );
		} else if ( isEnGenius () ) {
			return isCoovaChilliLogin ( clbk );
		}
	};

	function isMikrotikLogin ( clbk ) {
		var url = 'http://' + config.host + '/status';
		var signOutOptions = {};
		signOutOptions.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
		$http.post ( url, $httpParamSerializer ( { "ok": true } ), signOutOptions ).then ( function ( result ) {
			var data = result.data;
			if ( data.online === "true" ) {
				var response = {
					online:      true,
					ip:          data.ip,
					sessionTime: data.sessionTime,
					uptime:      data.uptime,
					upload:      data.upload,
					download:    data.download
				};
				if ( data.redir && data.redir.logoutURL ) {
					response.logoutUrl = data.redir.logoutURL;
				}
				return clbk ( null, response )
			} else {
				return clbk ( null, { online: false } );
			}
		} ).catch ( function ( error ) {
			return clbk ( error );
		} );
	}

	function isCoovaChilliLogin ( clbk ) {
		var pepper = Pepper ( {
			host: config.uamip,
			port: config.uamport
		} );
		pepper.refresh ( function ( error, data ) {
			$log.debug ( '########### isCoovaChilliLogin ##########' );
			$log.debug ( data );
			$log.debug ( error );
			if ( data.challenge ) {
				config.challenge = data.challenge;
			}
			if ( error ) {
				return clbk ( error );
			}
			if ( data.accounting ) {
				var accounting = data.accounting;
				var redir = data.redir || {};
				return clbk ( null, {
					online:      true,
					ip:          redir.ipAddress,
					sessionTime: -1,
					logoutUrl:   redir.logoutURL,
					clientMac:   redir.macAddress,
					uptime:      accounting.sessionTime,
					upload:      accounting.outputOctets,
					download:    accounting.inputOctets
				} );
			} else {
				return clbk ( null, { online: false } );

			}
			//clbk && clbk ();
		} );
	};

	function mikrotikLogin ( username, password, clbk ) {
		$log.info ( 'login to mikrotik' );
		var url = 'http://' + config.host + '/login'
		var signInOptions = {};
		signInOptions.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
		$http.post ( url, $httpParamSerializer ( {
			'username': username,
			'password': password
		} ), signInOptions ).then ( function ( result ) {
			var data = result.data;
			if ( data && data.ok == "false" ) {
				sendError ( "Router login", { "error message": data.message }, {
					username: username,
					password: password
				} );
				return clbk ( { message: data.message } );
			} else {
				$http.get ( "https://www.google.com/" );
				$http.get ( "https://www.apple.com/" );
				return clbk ( null );
			}
		} ).catch ( function ( error ) {
			return clbk ( error );
		} );
	}

	function mikrotikLogout ( clbk ) {
		var url = 'http://' + config.host + '/logout';
		var signOutOptions = {};
		signOutOptions.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
		$http.post ( url, $httpParamSerializer ( { "ok": true } ), signOutOptions ).then ( function ( result ) {
			var data = result.data;
			if ( data && data.ok == "false" ) {
				sendError ( "Router logout", { "error message": data.message } );
				return clbk ( { message: result.message } );
			} else {
				return clbk ( null, true );
			}
		} ).catch ( function ( error ) {
			return clbk ( error );
		} );
	}

	function coovaChilliLogout ( clbk ) {
		var pepper = Pepper ( {
			host: config.uamip,
			port: config.uamport
		} );
		pepper.logoff ( function ( error, data ) {
			if ( error ) {
				return clbk ( error );
			}
			return clbk ();
		} );
	}

	function coovaLogin ( username, password, clbk ) {
		$log.info ( 'login to coova', config.challenge );
		var pepper = Pepper ( {
			host: config.uamip,
			port: config.uamport
		} );
		pepper.logon ( username, password, { protocol: 'CHAP' }, function ( error, data ) {
			if ( error ) {
				return clbk ( error );
			}
			$log.debug ( data );
			$http.get ( "https://www.google.com/" );
			$http.get ( "https://www.apple.com/" );
			return clbk ();
		} );
	}

	function engeniusLogin ( signInForm ) {
		signInForm.commit ();
	}

	function isMikrotik () {
		return config.accessPointType.toLowerCase () == MIKROTIK;
	}

	function isCoovaChilli () {
		return config.accessPointType.toLowerCase () == COOVACHILLI;
	}

	function isEnGenius () {
		return config.accessPointType.toLowerCase () == ENGENIUS;
	}

	function isXClaim () {
		return config.accessPointType.toLowerCase () == XCLAIM;
	}
} ] );
