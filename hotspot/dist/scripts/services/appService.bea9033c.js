/**
 * Created by payamyousefi on 4/26/17.
 */
angular
  .module('masterHotspotApp')
  .service('appService', [
    '$http',
    'config',
    '$log',
    '$q',
    'usernameService',
    function($http, config, $log, $q, usernameService) {
      this.recoverHotspotUser = function(usernameOrMobile, clbk) {
        usernameOrMobile.businessId = config.businessId;
        $http
          .post(
            window.API_URL + '/Members/recoverHotspotUser',
            usernameOrMobile,
          )
          .then(function(result) {
            return clbk(null, result.data);
          })
          .catch(function(error) {
            sendError('recoverHotspotUser', error, {
              usernameOrMobile: usernameOrMobile,
            });
            return clbk(error);
          });
      };

      this.loadRouterInfo = function(nasInfo, clbk) {
        $http
          .post(window.API_URL + '/Nas/loadRouterInfo', nasInfo)
          .then(function(result) {
            return clbk(null, result.data);
          })
          .catch(function(error) {
            sendError('loadRouterInfo', error, { nasInfo: nasInfo });
            return clbk(error);
          });
      };

      this.loadConfig = function(bizInfo, clbk) {
        $http
          .post(window.API_URL + '/Businesses/loadConfig', bizInfo)
          .then(function(result) {
            return clbk(null, result.data);
          })
          .catch(function(error) {
            var message = 'bizIdIsInvalid';
            if (error.status == 404) {
              message = 'bizNotFound';
              sendError('loadConfig', 'business profile not found', {
                bizInfo: bizInfo,
              });
            }
            sendError('loadConfig', error, { bizInfo: bizInfo });
            return clbk(message);
          });
      };

      this.getMemberBalance = function(memberInfo, clbk) {
        $http
          .post(window.API_URL + '/Members/getMemberBalance', memberInfo)
          .then(function(result) {
            return clbk(null, result.data);
          })
          .catch(function(error) {
            sendError('getMemberBalance', error, { memberInfo: memberInfo });
            return clbk(error);
          });
      };

      this.signIn = function(userInfo, clbk) {
        userInfo.username = usernameService.concat(
          userInfo.username,
          userInfo.businessId,
        );
        $http
          .post(window.API_URL + '/Members/signIn', userInfo)
          .then(function(result) {
            return clbk(null, result.data);
          })
          .catch(function(error) {
            sendError('signIn', error, { userInfo: userInfo });
            return clbk(error);
          });
      };

      /*this.loadProfile = function ( userInfo, clbk ) {
			$http.post ( window.API_URL + '/Members/loadProfile', userInfo )
				.then ( function ( result ) {
					return clbk ( null, result.data );
				} ).catch ( function ( error ) {
				sendError ( "loadProfile", error, { userInfo: userInfo } );
				return clbk ( error );
			} );
		};*/

      this.signUpCustomer = function(userInfo, clbk) {
        $http
          .post(window.API_URL + '/Members/signUpCustomer', userInfo)
          .then(function(result) {
            return clbk(null, result.data);
          })
          .catch(function(error) {
            sendError('signUpCustomer', error, { userInfo: userInfo });
            return clbk(error);
          });
      };

      this.createHotSpotMember = function(user, clbk) {
        $http
          .post(window.API_URL + '/Members/createHotSpotMember', user)
          .then(function(result) {
            return clbk(null, result.data);
          })
          .catch(function(error) {
            sendError('createHotSpotMember', error, { user: user });
            return clbk(error);
          });
      };

      this.findInternetPlan = function(businessId, clbk) {
        $http
          .post(
            window.API_URL + '/InternetPlans/getPublicInternetPlans',
            businessId,
          )
          .then(function(result) {
            return clbk(null, result.data);
          })
          .catch(function(error) {
            sendError('findInternetPlan', error, { businessId: businessId });
            return clbk(error);
          });
      };

      this.verifyHotSpot = function(user, clbk) {
        $http
          .post(window.API_URL + '/Members/verifyHotSpot', user)
          .then(function(result) {
            return clbk(null, result.data);
          })
          .catch(function(error) {
            sendError('verifyHotSpot', error, { user: user });
            return clbk(error);
          });
      };

      this.assignFreePlanToMember = function(freePlan) {
        var defer = $q.defer();
        $http
          .post(
            window.API_URL + '/InternetPlans/assignFreePlanToMember',
            freePlan,
          )
          .then(function(result) {
            return defer.resolve(result.data);
          })
          .catch(function(error) {
            sendError('assignFreePlanToMember', error, { freePlan: freePlan });
            return defer.reject(error);
          });
        return defer.promise;
      };

      this.payment = function(paymentData) {
        var defer = $q.defer();
        paymentData.businessId = config.businessId;
        paymentData.memberId = config.memberId;
        paymentData.nasId = config.nasId;
        paymentData.host = config.host;
        paymentData.password = config.password;
        paymentData.username = config.username;
        $http
          .post(window.API_URL + '/Members/paySubscription', paymentData)
          .then(function(result) {
            if (result.data && !result.data.url) {
              return defer.reject(result.data);
            }
            return defer.resolve(result.data);
          })
          .catch(function(error) {
            $log.error(error);
            sendError('payment', error, { paymentData: paymentData });
            return defer.reject(error);
          });
        return defer.promise;
      };

      this.checkDefaultInternetPlan = function(defaultPlan, cb) {
        $http
          .post(window.API_URL + '/Members/checkDefaultPlan', defaultPlan)
          .then(function(result) {
            return cb(null, result.data);
          })
          .catch(function(error) {
            sendError('checkDefaultInternetPlan', error, {
              defaultPlan: defaultPlan,
            });
            return cb(error);
          });
      };

      this.createForeignHotSpotMember = function(user, clbk) {
        $http
          .post(window.API_URL + '/Members/createForeignHotSpotMember', user)
          .then(function(result) {
            return clbk(null, result.data);
          })
          .catch(function(error) {
            sendError(
              error,
              { method: 'createForeignHotSpotMember' },
              { user: user },
            );
            return clbk(error);
          });
      };
    },
  ])
  .service('errorMessage', [
    '$log',
    'appMessenger',
    function($log, appMessenger) {
      this.show = function(errorResponse) {
        $log.error(errorResponse);
        var errorMessage = 'generalError';
        if (errorResponse && errorResponse.status === -1) {
          errorMessage = 'timeout';
        }
        if (
          errorResponse &&
          errorResponse.data &&
          errorResponse.data.error &&
          errorResponse.data.error.message
        ) {
          errorMessage = errorResponse.data.error.message;
        }
        appMessenger.showError(errorMessage);
      };
    },
  ]);
