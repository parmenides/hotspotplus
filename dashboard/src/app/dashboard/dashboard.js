// Dashboard controller
app.controller('dashboard', [
  '$scope',
  '$log',
  'Session',
  'dashboardTiming',
  'appMessenger',
  '$timeout',
  'translateFilter',
  'persianDateFilter',
  function(
    $scope,
    $log,
    Session,
    dashboardTiming,
    appMessenger,
    $timeout,
    translateFilter,
    persianDateFilter
  ) {
    var RELOAD_DASHBOARD_EVENT = 'dashboard.reload';
    var businessId = Session.business.id;
    var timeZone = Session.business.timeZone.offset;
    var interval = 1 * 60 * 1000;
    var INTERVAL_HOUR_MINUTE = -60;

    $scope.datePicker = true;

    // Load dashboard on page load
    loadDashboard();

    // Load dashboard on advance option select or after interval
    $scope.updateDashboard = function(option) {
      $scope.fromDate = option.fromDate;
      $scope.endDate = option.endDate;
      if (option.advanceTime) {
        $scope.advanceTime = option.advanceTime;
      }
      getFromToDate($scope.fromDate, $scope.endDate);
      $scope.$broadcast(RELOAD_DASHBOARD_EVENT, {
        params: {
          fromDate: $scope.fromDate,
          endDate: $scope.endDate,
          businessId: businessId,
          offset: timeZone,
          advanceTime: $scope.advanceTime
        }
      });
    };

    // Prepare start date & end date for scope
    function getFromToDate(fromDate, endDate) {
      if (!fromDate)
        fromDate = new Date(new Date().getTime()).setHours(0, 0, 0, 0);
      if (!endDate)
        endDate = new Date().setDate(new Date(fromDate).getDate() + 7);

      $scope.fromDate = fromDate;
      $scope.endDate = endDate;
      var offset = new Date($scope.fromDate);
      offset = offset.getTimezoneOffset();
      timeZone = offset / INTERVAL_HOUR_MINUTE;
    }

    // Load dashboard on page load or after interval
    function loadDashboard() {
      getFromToDate();
      $scope.initParams = {
        fromDate: $scope.fromDate,
        endDate: $scope.endDate,
        businessId: businessId,
        offset: timeZone,
        advanceTime: $scope.advanceTime,
        reloadEvent: RELOAD_DASHBOARD_EVENT
      };
    }

    // Function to replicate setInterval using $timeout service.
    var timer;

    function intervalFunction() {
      timer = $timeout(function() {
        var option = {
          fromDate: $scope.fromDate,
          endDate: $scope.endDate,
          advanceTime: $scope.advanceTime
        };
        $scope.updateDashboard(option);
        intervalFunction();
      }, interval);

      // bind resolve-reject handlers to make sure cancel approach is actually working
      timer.then(
        function() {
          //$log.info( "Timer activated" );
        },
        function() {
          //$log.info( "Timer stopped" );
        }
      );
    }

    // Kick off the interval
    intervalFunction();

    // Cancel any pending timer when DOM element is removed from the page
    $scope.$on('$destroy', function() {
      if (timer) {
        $timeout.cancel(timer);
      }
    });
  }
]);
