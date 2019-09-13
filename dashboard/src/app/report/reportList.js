/**
 * Created by hamidehnouri on 1/22/2019 AD.
 */

app.controller('reportList', [
  '$scope',
  '$state',
  '$log',
  'translateFilter',
  'translateNumberFilter',
  'Business',
  'Member',
  'uiGridConstants',
  '$http',
  'genericService',
  'Session',
  '$uibModal',
  'PREFIX',
  'appMessenger',
  'PersianDateService',
  'englishNumberFilter',
  'BigFile',
  function (
    $scope,
    $state,
    $log,
    translateFilter,
    translateNumberFilter,
    Business,
    Member,
    uiGridConstants,
    $http,
    genericService,
    Session,
    $uibModal,
    PREFIX,
    appMessenger,
    PersianDateService,
    englishNumberFilter,
    BigFile
  ) {
    var businessId = Session.business.id
    $scope.syslogReportCount = 0
    $scope.netflowReportCount = 0
    $scope.allReports = [
      'Netflow',
      'WebProxy',
      'DNS'
    ]
    Business.findById({id: businessId}).$promise.then(
      function (business) {
        $scope.business = business
        // if (business.netflowReportCount) {
        //   $scope.netflowReportCount = business.netflowReportCount
        // }
        // if (business.syslogReportCount) {
        //   $scope.syslogReportCount = business.syslogReportCount
        // }
      },
      function (err) {
        appMessenger.showError('error.generalError')
      }
    )

    $scope.paginationOptions = {
      pageNumber: 1,
      itemPerPage: 10,
      sort: null
    }
    $scope.gridOptions = {
      enableSorting: true,
      enablePaginationControls: false,
      enableRowSelection: true,
      enableSelectAll: true,
      multiSelect: true,
      selectionRowHeaderWidth: 35,
      rowHeight: 36,
      showGridFooter: true,
      enableColumnResizing: true,
      minRowsToShow: 11,
      columnDefs: [
        {
          displayName: 'report.reportTitle',
          field: 'title',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
        },
        {
          displayName: 'report.type',
          field: 'type',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellTemplate:
            '<div class="ui-grid-cell-contents" ng-if="row.entity.from">{{row.entity.type.capitalize()  }}</div>',

        },
        {
          displayName: 'report.reportFormat',
          field: 'type',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellTemplate:
            '<div class="ui-grid-cell-contents">{{row.entity.reportType.capitalize()  | translate }}</div>',

        },
        {
          displayName: 'report.from',
          field: 'from',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellTemplate:
            '<div class="ui-grid-cell-contents" ng-if="row.entity.from">{{row.entity.from |  translateDate | translateNumber }}</div>',

        },
        {
          displayName: 'report.to',
          field: 'to',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellTemplate:
            '<div class="ui-grid-cell-contents" ng-if="row.entity.to">{{row.entity.to |  translateDate | translateNumber }}</div>'
        },
        {
          displayName: 'report.status',
          field: 'status',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellTemplate:
            '<div class="ui-grid-cell-contents">{{"report." + row.entity.status  | translate }}</div>'
        },
        {
          displayName: 'general.download',
          field: 'download',
          width: 100,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellClass: 'center',
          headerCellClass: 'headerCenter',
          cellTemplate: '<a class="btn btn-block" ng-class ="{\'disabled\': row.entity.status !== \'ready\' || !row.entity.fileName  ,\'btn-info\': row.entity.status === \'ready\' && row.entity.fileName}" ' +
            'ng-click="grid.appScope.downloadReport(row)"><i class="fa  fa-download"></i></a>'
        },
        {
          displayName: 'general.remove',
          field: 'delete',
          width: 100,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellClass: 'center',
          headerCellClass: 'headerCenter',
          cellTemplate:
            '<a class="btn btn-link" ng-click="grid.appScope.removeReport(row)"><i class="fa  fa-trash"></i></a>',
        },
      ],
      onRegisterApi: function (gridApi) {
        $scope.gridApi = gridApi
        $scope.gridApi.core.on.sortChanged($scope, function (grid, sortColumns) {
          if (sortColumns.length == 0) {
            $scope.paginationOptions.sort = null
          } else {
            $scope.paginationOptions.sort =
              sortColumns[0].name +
              ' ' +
              sortColumns[0].sort.direction.toUpperCase()
          }
          getPage()
        })
      }
    }

    $scope.addReport = function (param) {
      Business.loadMembersUsernames({businessId: businessId}).$promise.then(
        function (result) {
          $scope.members = result.members
          Business.loadNasTitles({businessId: businessId}).$promise.then(
            function (result) {
              $scope.nas = result.nas
              $scope.report = {
                status: 'scheduled',
                creationDate: new Date().getTime(),
                businessId: businessId
              }
              $uibModal.open({
                backdrop: true,
                animation: true,
                keyboard: true,
                backdropClick: true,
                size: 'md',
                scope: $scope,
                templateUrl: PREFIX + 'app/report/tpl/reportForm.html',
                controller: [
                  '$scope',
                  '$uibModalInstance',
                  function ($scope, $uibModalInstance) {
                    $scope.loading = false
                    $scope.options = {
                      cancelBtnLabel: 'general.cancel',
                      saveBtnLabel: 'general.save'
                    }
                    if (param === 'Netflow') {
                      $scope.options.title = 'report.addNetflowReport'
                      $scope.options.reportType = 'netflow'
                    } else if (param === 'WebProxy') {
                      $scope.options.title = 'report.addWebproxyReport'
                      $scope.options.reportType = 'webproxy'
                    } else if (param === 'DNS') {
                      $scope.options.title = 'report.addWebproxyReport'
                      $scope.options.reportType = 'dns'
                    }
                    $scope.protocols = ['TCP/UDP', 'TCP', 'UDP']
                    $scope.report.protocol = $scope.protocols[0]
                    // Persian date picker methods
                    $scope.dateOptions = {
                      formatYear: 'yy',
                      startingDay: 6
                    }
                    $scope.dateFormats = [
                      'dd-MMMM-yyyy',
                      'yyyy/MM/dd',
                      'dd.MM.yyyy',
                      'shortDate'
                    ]
                    $scope.dateFormat = $scope.dateFormats[0]
                    $scope.disabled = function (date, mode) {
                      return mode === 'day' && date.getDay() === 5
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
                    // --> for calendar bug
                    $scope.$watch('report.from', function (newValue, oldValue) {
                      $scope.startDateCalendarIsOpen = false
                    })
                    $scope.$watch('report.to', function (newValue, oldValue) {
                      $scope.endDateCalendarIsOpen = false
                    })
                    $scope.resetCalendar = function () {
                      $scope.endDateCalendarIsOpen = false
                      $scope.startDateCalendarIsOpen = false
                    }
                    $scope.cancel = function () {
                      $uibModalInstance.close()
                    }
                    $scope.save = function () {
                      $scope.loading = true
                      if ($scope.report.member) {
                        var memberId = $scope.report.member[0].id
                        var username = $scope.report.member[0].username
                        delete $scope.report.member
                        $scope.report.memberId = memberId
                      }
                      $scope.report.username = username
                      $scope.report.type = $scope.options.reportType
                      if ($scope.report.from) {
                        var from = new Date($scope.report.from)
                        $scope.report.from = from.getTime()
                      }
                      if ($scope.report.to) {
                        var to = new Date($scope.report.to)
                        $scope.report.to = to.getTime()
                      }
                      if (!$scope.report.title) {
                        var time = new Date($scope.report.creationDate)
                        var year = PersianDateService.getFullYear(time)
                        var month = PersianDateService.getMonth(time) + 1
                        var day = PersianDateService.getDate(time)
                        $scope.report.title = translateNumberFilter(year + '/' + month + '/' + day)
                        /*if(username){
                          $scope.report.title =   username + ' ' + $scope.report.title
                        }*/
                      }
                      if ($scope.report.method) {
                        $scope.report.method = $scope.report.method.split(' ')
                      }
                      if ($scope.report.dstPort) {
                        $scope.report.dstPort = englishNumberFilter($scope.report.dstPort)
                        $scope.report.dstPort = $scope.report.dstPort.split(' ')
                      }
                      if ($scope.report.srcPort) {
                        $scope.report.srcPort = englishNumberFilter($scope.report.srcPort)
                        $scope.report.srcPort = $scope.report.srcPort.split(' ')
                      }
                      appMessenger.showSuccess('report.reportSaverWait')
                      Business.reports.create({id: businessId}, $scope.report).$promise.then(
                        function (res) {
                          $scope.loading = false
                          appMessenger.showSuccess('report.createSuccessFull')
                          $uibModalInstance.close()
                          getPage()
                        },
                        function (err) {
                          appMessenger.showError('report.createUnSuccessFull')
                        }
                      )
                    }
                  }
                ]
              })
            },
            function (error) {
              $log.error(error)
            }
          )
        },
        function (error) {
          $log.error(error)
        }
      )
    }

    $scope.removeReport = function (row) {
      genericService.showConfirmDialog({
        title: 'general.warning',
        message: 'general.areYouSure',
        noBtnLabel: 'general.no',
        yesBtnLabel: 'general.yes',
        yesCallback: function () {
          var reportId = row.entity.id
          var index = $scope.gridOptions.data.indexOf(row.entity)
          Business.reports
            .destroyById({id: businessId}, {fk: reportId})
            .$promise.then(
            function (res) {
              //todo: also delete related file
              if (row.entity.fileName) {
                const fileName = row.entity.fileName
                const container = row.entity.container
                BigFile.removeFile({container: container, file: fileName})
                  .$promise.then(
                  function (res) {
                    appMessenger.showSuccess('report.removeFileSuccessFull')
                  },
                  function (err) {
                    appMessenger.showError('report.removeFileUnSuccessFull')
                  }
                )
              }
              $scope.gridOptions.data.splice(index, 1)
              appMessenger.showSuccess('report.removeSuccessFull')
            },
            function (err) {
              appMessenger.showError('report.removeUnSuccessFull')
            }
          )
        },
        NoCallback: function () {
        }
      })
    }

    $scope.removeReports = function () {
      var reportIds = []
      var selectedRows = $scope.gridApi.selection.getSelectedRows()
      angular.forEach(selectedRows, function (selectedRow) {
        if (selectedRow.id) {
          reportIds.push(selectedRow.id)
        }
      })
      //todo: also delete related files
      if (reportIds.length != 0) {
        genericService.showConfirmDialog({
          title: 'general.warning',
          message: 'general.areYouSure',
          noBtnLabel: 'general.no',
          yesBtnLabel: 'general.yes',
          yesCallback: function () {
            Business.destroyReportsById({
              businessId: businessId,
              reportIds: reportIds
            }).$promise.then(
              function (result) {
                $scope.gridApi.selection.clearSelectedRows()
                getPage()
                appMessenger.showSuccess('report.removeSuccessFull')
              },
              function (err) {
                appMessenger.showError('report.removeUnSuccessFull')
              }
            )
          },
          NoCallback: function () {
          }
        })
      } else {
        appMessenger.showInfo('report.noReportToRemove')
      }
    }

    $scope.downloadReport = function (row) {
      var reportId = row.entity.id
      Business.reports.findById({id: businessId, fk: reportId}).$promise.then(
        function (report) {
          var fileName = report.fileName
          var container = report.container
          if (fileName && container) {
            window.location.href =
              Window.API_URL +
              '/api/BigFiles/{0}/download/{1}'
                .replace('{0}', container)
                .replace('{1}', fileName)
          } else {
            appMessenger.showError('report.noReportsToDownload')
          }
        },
        function (error) {
          appMessenger.showError('report.noReportsToDownload')
        }
      )
    }

    $scope.$watch('paginationOptions.itemPerPage', function (newValue, oldValue) {
      getPage()
    })

    $scope.pageChanges = function () {
      getPage()
    }

    var getPage = function (inputFilter) {
      $scope.gridApi.selection.clearSelectedRows()
      switch ($scope.paginationOptions.sort) {
        case uiGridConstants.ASC:
          break
        case uiGridConstants.DESC:
          break
        default:
          break
      }
      var options = {filter: {}}
      if (inputFilter) {
        options.filter.where = inputFilter
      }
      options.id = businessId
      options.filter.sort = $scope.paginationOptions.sort
      options.filter.skip =
        ($scope.paginationOptions.pageNumber - 1) *
        $scope.paginationOptions.itemPerPage
      options.filter.limit = $scope.paginationOptions.itemPerPage
      Business.reports
        .count({id: businessId, where: inputFilter})
        .$promise.then(
        function (result) {
          $scope.gridOptions.totalItems = result.count
          $scope.paginationOptions.totalItems = result.count
        },
        function (error) {
          $log.error(error)
        }
      )
      Business.reports(options).$promise.then(
        function (reports) {
          $scope.gridOptions.data = reports
        },
        function (error) {
          $log.error(error)
        }
      )
    }
  }
])
