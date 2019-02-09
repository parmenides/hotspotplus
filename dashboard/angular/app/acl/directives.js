/**
 * Created by payamyousefi on 11/8/17.
 */
app.directive('checkAction', [
  '$log',
  'AclService',
  'translateFilter',
  function($log, AclService, translateFilter) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        var buyPremiumTitle = translateFilter('general.buyPremiumTitle');
        var makeVisible = function() {
            element.removeAttr('disabled');
            element.removeClass('text-muted');
          },
          makeHidden = function(message) {
            //$log.debug ( element[ 0 ].tagName );
            //$log.debug ( element[ 0 ].type );
            element.addClass('text-muted');
            element.addClass('fakedisabled');
            var el = element[0];
            if (
              el.tagName ===
              'INPUT' /*&& (el.type === 'text' || el.type === 'password')*/
            ) {
              element.attr('readonly', 'readonly');
            }
            element.off('click');
            element.bind('click', function(e) {
              e.stopPropagation && e.stopPropagation();
              return e.preventDefault();
            });
            $(element).popover({
              trigger: 'click',
              html: true,
              toggle: 'popover',
              title:
                "<div style='color: #23b7e5;min-width: 250px'><i class='fa fa-fw fa-lock'></i>" +
                buyPremiumTitle +
                '</div>',
              content: '<div>' + message + '</div>',
              placement: 'bottom',
            });
          },
          determineVisibility = function(resetFirst) {
            if (resetFirst) {
              makeVisible();
            }
            var action = attrs.accessAction;
            AclService.checkIfPermitted(action, function(options) {
              if (options.isPermitted == true) {
                makeVisible();
              } else {
                makeHidden(options.message);
              }
            });
          };

        if (attrs.accessAction) {
          determineVisibility(true);
        }
      },
    };
  },
]);
