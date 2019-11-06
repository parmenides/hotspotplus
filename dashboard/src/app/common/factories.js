/**
 * Created by payamyousefi on 5/5/15.
 */

app
  .factory('authorization', [
    'Session',
    function(Session) {
      var authorize = function(
        loginRequired,
        requiredPermissions,
        permissionCheckType
      ) {
        var result = 'authorized',
          user =
            Session.business ||
            Session.user ||
            Session.reseller ||
            Session.operator ||
            Session.member,
          loweredPermissions = [],
          hasPermission = true,
          permission,
          i;
        var roles = Session.roles;

        permissionCheckType = permissionCheckType || 'atLeastOne';
        if (loginRequired === true && !user) {
          result = 'loginRequired';
        } else if (
          loginRequired === true &&
          user &&
          (requiredPermissions === undefined ||
            requiredPermissions.length === 0)
        ) {
          // Login is required but no specific permissions are specified.
          result = 'authorized';
        } else if (requiredPermissions) {
          if (!roles || roles.length == 0) {
            result = 'notAuthorised';
          } else {
            loweredPermissions = [];
            angular.forEach(roles, function(permission) {
              loweredPermissions.push(permission.toLowerCase());
            });

            for (i = 0; i < requiredPermissions.length; i += 1) {
              permission = requiredPermissions[i].toLowerCase();

              if (permissionCheckType === 'all') {
                hasPermission =
                  hasPermission && loweredPermissions.indexOf(permission) > -1;
                // if all the permissions are required and hasPermission is false there is no point carrying on
                if (hasPermission === false) {
                  break;
                }
              } else if (permissionCheckType === 'one') {
                hasPermission = loweredPermissions.indexOf(permission) > -1;
                // if we only need one of the permissions and we have it there is no point carrying on
                if (hasPermission) {
                  break;
                }
              }
            }
            result = hasPermission ? 'authorized' : 'notAuthorised';
          }
        }
        return result;
      };

      return {
        authorize: authorize
      };
    }
  ])
  .factory('Session', [
    'Business',
    'Member',
    'Operator',
    'Reseller',
    function(Business, Member,Operator, Reseller) {
      var props = [
        'business',
        'operator',
        'roles',
        'user',
        'userType',
        'reseller',
        'member'
      ];

      function Session() {
        var self = this;
        props.forEach(function(name) {
          self[name] = load(name);
        });
        this.rememberMe = undefined;
        this.currentUserData = null;
        if (self.business && self.business.id) {
          businessId = self.business.id;
        } else {
          businessId = '73465736564751';
        }
        if (
          window.location.href &&
          window.location.href.indexOf('public') == -1
        ) {
          switch (self.userType) {
            case 'Business':
              Business.findById({ id: businessId });
              break;
            case 'Member':
              Member.findById({ id: self.member.id });
              break;
            case 'Reseller':
              Reseller.findById({ id: self.reseller.id });
              break;
            case 'Operator':
              Operator.findById({ id: self.operator.id });
              break;
            default:
              Business.findById({ id: businessId });
              break;
          }
        }
      }

      Session.prototype.isAdminUser = function() {
        return this.userType == 'Admin';
      };
      Session.prototype.isBusinessUser = function() {
        return this.userType == 'Business';
      };
      Session.prototype.isResellerUser = function() {
        return this.userType == 'Reseller';
      };
      Session.prototype.isOperatorUser = function() {
        return this.userType == 'Operator';
      };
      Session.prototype.isMemberUser = function() {
        return this.userType == 'Member';
      };

      Session.prototype.save = function() {
        var self = this;
        var storage = this.rememberMe ? localStorage : sessionStorage;
        props.forEach(function(name) {
          save(storage, name, self[name]);
        });
      };

      Session.prototype.setSession = function(data) {
        for (var i in props) {
          var key = props[i];
          var value = data[key];
          this[key] = value;
        }
        var theUser = {};
        if (this.business) {
          theUser = this.business;
        } else if (this.operator) {
          theUser = this.operator;
        } else if (this.reseller) {
          theUser = this.reseller;
        } else if (this.member) {
          theUser = this.member;
        } else {
          theUser = this.user;
        }

        this.save();
      };

      Session.prototype.clearSession = function() {
        for (var i in props) {
          var key = props[i];
          this[key] = null;
        }
        this.save();
      };

      Session.prototype.clearStorage = function() {
        props.forEach(function(name) {
          save(sessionStorage, name, null);
          save(localStorage, name, null);
        });
      };

      function save(storage, name, value) {
        var key = name;
        if (value == null) value = '';
        if (angular.isObject(value)) {
          value = JSON.stringify(value);
        }
        storage[key] = value;
      }

      function load(name) {
        var key = name;
        var value = localStorage[key] || sessionStorage[key] || null;
        if (IsJsonString(value)) {
          value = JSON.parse(value);
        }
        return value;
      }

      function IsJsonString(str) {
        try {
          JSON.parse(str);
        } catch (e) {
          return false;
        }
        return true;
      }

      return new Session();
    }
  ]);
