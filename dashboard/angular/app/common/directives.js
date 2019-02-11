/**
 * Created by payamyousefi on 5/5/15.
 */

app.directive('access', [
  'authorization',
  function(authorization) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        var makeVisible = function() {
            element.removeClass('hidden');
          },
          makeHidden = function() {
            element.addClass('hidden');
          },
          determineVisibility = function(resetFirst) {
            var result;
            if (resetFirst) {
              makeVisible();
            }

            result = authorization.authorize(
              true,
              roles,
              attrs.accessPermissionType
            );
            if (result === 'authorized') {
              makeVisible();
            } else {
              makeHidden();
            }
          };
        var rawRoles = attrs.access.split(',');
        var roles = [];
        rawRoles.forEach(function(role) {
          roles.push(role.trim());
        });

        if (roles.length > 0) {
          determineVisibility(true);
        }
      }
    };
  }
]);
