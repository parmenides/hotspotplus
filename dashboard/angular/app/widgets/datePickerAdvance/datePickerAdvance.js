/**
 * Created by rezanazari on 3/16/18.
 */

app.directive('datePickerAdvance', [
  'PREFIX',
  '$log',
  'persianDateFilter',
  'translateNumberFilter',
  'translateFilter',
  'dashboardTiming',
  'appMessenger',
  'Business',
  function (
    PREFIX,
    $log,
    persianDateFilter,
    translateNumberFilter,
    translateFilter,
    dashboardTiming,
    appMessenger,
    Business
  ) {
    return {
      scope: {
        updateDashboard: '&'
      },
      controller: function ($scope) {
        var DAY_MILLISECONDS = 24 * 60 * 60 * 1000

        if (!$scope.fromDate) {
          const refDate = new Date(new Date().getTime()).setHours(0, 0, 0, 0)
          $scope.fromDate = refDate - (DAY_MILLISECONDS * 20)
        }
        if (!$scope.endDate) {
          $scope.endDate = $scope.fromDate + (DAY_MILLISECONDS * 25)
        }
        Business.getMyDepartments().$promise.then(function (response) {
          $scope.permittedDepartments = response.departments
          $scope.limited = response.limited
          if (!$scope.limited) {
            $scope.permittedDepartments = [{id: 'all', title: translateFilter('department.allDepartment')},...$scope.permittedDepartments]
          }
          $scope.selectedDepartment = $scope.permittedDepartments[0]
          $scope.search()
        })
        $scope.dateFormats = [
          'dd-MMMM-yyyy',
          'yyyy/MM/dd',
          'dd.MM.yyyy',
          'shortDate',
          'MM'
        ]
        $scope.isAdvance = false
        $scope.isBasic = true
        //$scope.radioModel = 'monthly';
        $scope.showAdvance = function () {
          $scope.isAdvance = false
          $scope.isBasic = true
        }
        $scope.showBasic = function () {
          $scope.isAdvance = true
          $scope.isBasic = false
        }

        $scope.startDateCalendar = function ($event) {
          $event.preventDefault()
          $event.stopPropagation()
          $scope.startDateCalendarIsOpen = true
          $scope.endDateCalendarIsOpen = false
        }
        $scope.endDateCalendar = function ($event) {
          $event.preventDefault()
          $event.stopPropagation()
          $scope.endDateCalendarIsOpen = true
          $scope.startDateCalendarIsOpen = false
        }
        $scope.dateOptions = {
          formatYear: 'yy',
          startingDay: 6
        }
        $scope.dateFormat = $scope.dateFormats[0]

        $scope.search = function () {
          fromDate = new Date($scope.fromDate).setHours(0, 0, 0, 0)
          endDate = new Date($scope.endDate).setHours(0, 0, 0, 0)
          if (endDate <= fromDate) {
            appMessenger.showError('dashboard.endDateIncorrect')
            return
          }
          var result = {}
          result.fromDate = fromDate
          result.endDate = endDate
          result.departmentId = $scope.selectedDepartment ? $scope.selectedDepartment.id : null
          $scope.updateDashboard({option: result})
        }
      },
      templateUrl:
        PREFIX + 'app/widgets/datePickerAdvance/tpl/datePickerAdvance.html'
    }
  }
])
