/**
 * Created by rezanazari on 7/4/17.
 */
app.directive('remainBulk', [
  'PREFIX',
  '$log',
  function(PREFIX, $log) {
    return {
      scope: {
        params: '=options',
      },

      controller: function($scope) {
        $scope.percent = 0;
        checkBulk();
        $scope.$watch('params.remainBulk', function(newVal, oldVal) {
          if (typeof newVal !== 'undefined') {
            checkBulk();
          }
        });
        function checkBulk() {
          if (
            $scope.params.remainBulk.value === '' ||
            $scope.params.remainBulk.value === 'undefined' ||
            $scope.params.bulk === 'undefined'
          ) {
            $scope.params.remainBulk.value = '';
            $scope.percent = 0;
          } else if ($scope.params.remainBulk.value === -1) {
            $scope.params.remainBulk.value = 'unlimited';
            $scope.percent = 100;
          } else if (
            $scope.params.remainBulk.value !== -1 &&
            $scope.params.bulk !== 0
          ) {
            if ($scope.params.extraBulk == 0) {
              var extraBulk = 0;
              var remainBulk = 0;
              switch ($scope.params.remainBulk.type) {
                case 'KB':
                  extraBulk = $scope.params.extraBulk * 1024 * 1024;
                  remainBulk = (
                    $scope.params.remainBulk.value /
                    1024 /
                    1024
                  ).toFixed(0);
                  break;
                case 'MB':
                  extraBulk = $scope.params.extraBulk * 1024;
                  remainBulk = ($scope.params.remainBulk.value / 1024).toFixed(
                    0,
                  );
                  break;
                case 'GB':
                  extraBulk = $scope.params.extraBulk;
                  remainBulk = $scope.params.remainBulk.value.toFixed(0);
                  break;
              }
              var originalBulk = extraBulk + Number($scope.params.bulk);
              $scope.params.remainBulk.type = 'GB';
              $scope.params.remainBulk.value = remainBulk;
              $scope.percent = Math.round(
                ($scope.params.remainBulk.value / originalBulk) * 100,
              );
            } else {
              $scope.percent = Math.round(
                ($scope.params.remainBulk.value / $scope.params.bulk) * 100,
              );
            }
          }
          $scope.chartOption = {
            percent: $scope.percent,
            lineWidth: 5,
            trackColor: $scope.params.color.light,
            barColor: $scope.params.color.primary,
            scaleColor: false,
            size: 115,
            rotate: 0,
            lineCap: 'butt',
          };
        }
      },
      templateUrl: PREFIX + 'app/widgets/remainBulk/tpl/remainBulk.html',
    };
  },
]);
