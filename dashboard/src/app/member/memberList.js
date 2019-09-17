/**
 * Created by hamidehnouri on 8/8/2016 AD.
 */

app.controller('memberList', [
  '$scope',
  '$state',
  '$log',
  'translateFilter',
  'Business',
  'InternetPlan',
  'Member',
  'uiGridConstants',
  '$http',
  'genericService',
  'Session',
  '$uibModal',
  'PREFIX',
  'appMessenger',
  'translateNumberFilter',
  'englishNumberFilter',
  'credit',
  'FileSaver',
  'Blob',
  function (
    $scope,
    $state,
    $log,
    translateFilter,
    Business,
    InternetPlan,
    Member,
    uiGridConstants,
    $http,
    genericService,
    Session,
    $uibModal,
    PREFIX,
    appMessenger,
    translateNumberFilter,
    englishNumberFilter,
    credit,
    FileSaver,
    Blob
  ) {
    var businessId = Session.business.id
    $scope.searchFilter = {
      department: null,
      internetPlan: null
    }
    $scope.allInternetPlans = []
    $scope.permittedDepartments = []

    Business.getMyDepartments().$promise.then(function (response) {
      $scope.permittedDepartments = response.departments
    })
    Business.internetPlans({id: businessId}).$promise.then(
      function (internetPlans) {
        $scope.allInternetPlans = internetPlans
      })

    $scope.memberUsername = ''
    $scope.isSearching = false
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
          displayName: 'member.username',
          field: 'username',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          cellTemplate:
            '<a class="btn btn-link" ng-click="grid.appScope.editMember(row)">{{row.entity.username}}</a>',
          headerCellFilter: 'translate'
        },
        {
          displayName: 'member.internetPackage',
          field: 'internetPlanName',
          width: 100,
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellTemplate:
            '<div class="ui-grid-cell-contents"><span ng-if="row.entity.internetPlanName">{{row.entity.internetPlanName}}</span><span ng-if="!row.entity.internetPlanName">-</span></div>'
        },
        {
          displayName: 'dashboard.upload',
          field: 'upload',
          width: 100,
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellTemplate:
            '<div class="ui-grid-cell-contents" dir="ltr">{{row.entity.upload  | humanSize | translateNumber }}</div>'
        },
        {
          displayName: 'dashboard.download',
          field: 'download',
          width: 100,
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellTemplate:
            '<div class="ui-grid-cell-contents" dir="ltr">{{row.entity.download  | humanSize | translateNumber }}</div>'
        },
        {
          displayName: 'member.active',
          field: 'active',
          width: 90,
          enableColumnMenu: false,
          enableHiding: false,
          enableSorting: false,
          headerCellFilter: 'translate',
          cellClass: 'center',
          headerCellClass: 'headerCenter',
          cellTemplate:
            '<a class="btn btn-link" ng-click="grid.appScope.activateMember(row)" uib-popover={{grid.appScope.activateMemberHelpText}} popover-trigger="mouseenter"' +
            'popover-placement="right"><i class="fa fa-circle-o" ng-if="!row.entity.active"></i>' +
            '<i class="fa fa-dot-circle-o text-info" ng-if="row.entity.active"></i></a>'
        },
        {
          displayName: 'member.refresh',
          field: 'refresh',
          width: 90,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellClass: 'center',
          headerCellClass: 'headerCenter',
          cellTemplate:
            '<a class="btn btn-link" type="button" ng-click="grid.appScope.refreshPlan(row)" uib-popover={{grid.appScope.refreshPlanHelpText}} popover-trigger="mouseenter"' +
            'popover-placement="right"><i class="fa  fa-refresh"></i></a>'
        },
        {
          displayName: 'member.modifyPassword',
          field: 'passwordText',
          width: 90,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellClass: 'center',
          headerCellClass: 'headerCenter',
          cellTemplate:
            '<a class="btn btn-link" ng-click="grid.appScope.editPassword(row.entity)"><i class="fa fa-key"></i></a>'
        },
        {
          displayName: 'member.showPlanHistory',
          field: 'showPlanHistory',
          width: 95,
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          cellClass: 'center',
          headerCellFilter: 'translate',
          cellTemplate:
            '<div class="ui-grid-cell-contents" ng-click="grid.appScope.showPlanHistory(row)" uib-popover={{grid.appScope.showPlanHistoryHelpText}} popover-trigger="mouseenter"' +
            'popover-placement="right"><i class="fa fa-history"></i></div>'
        },
        // {
        //   displayName: 'general.edit',
        //   field: 'edit',
        //   width: 100,
        //   enableColumnMenu: false,
        //   headerCellFilter: 'translate',
        //   cellClass: 'center',
        //   headerCellClass: 'headerCenter',
        //   cellTemplate:
        //     '<a class="btn btn-link" ng-click="grid.appScope.editMember(row)"><i class="fa  fa-pencil"></i></a>'
        // },
        {
          displayName: 'general.remove',
          field: 'delete',
          width: 95,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellClass: 'center',
          headerCellClass: 'headerCenter',
          cellTemplate:
            '<a class="btn btn-link" ng-click="grid.appScope.removeMember(row)"><i class="fa  fa-trash"></i></a>'
        }
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
    $scope.refreshPlanHelpText = translateFilter('help.memberRefreshPlan')
    $scope.activateMemberHelpText = translateFilter('help.activateMember')
    $scope.showPlanHistoryHelpText = translateFilter('help.showPlanHistory')

    $scope.addMember = function () {
      $scope.member = {
        active: true,
        subscriptionDate: new Date().getTime(),
        creationDate: new Date().getTime(),
        businessId: businessId,
        departments: [],
        selectedInternetPlan: null
      }
      Business.departments({id: businessId}).$promise.then((allDepartments) => {
        Business.internetPlans({id: businessId}).$promise.then(
          function (internetPlans) {
            if (internetPlans.length != 0) {
              $scope.internetPlans = internetPlans
              $scope.member.selectedInternetPlan = $scope.internetPlans[0]
              $uibModal.open({
                backdrop: true,
                animation: true,
                keyboard: true,
                backdropClick: true,
                size: 'md',
                scope: $scope,
                templateUrl: PREFIX + 'app/member/tpl/memberForm.html',
                controller: [
                  '$scope',
                  '$uibModalInstance',
                  function ($scope, $uibModalInstance) {
                    $scope.departments = allDepartments
                    $scope.options = {
                      title: 'member.addMember',
                      cancelBtnLabel: 'general.cancel',
                      saveBtnLabel: 'general.save',
                      saveAndSendBtnLabel: 'general.saveAndSendPass',
                      newMember: true
                    }

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
                    }
                    // --> for calendar bug
                    $scope.$watch('member.birthday', function (
                      newValue,
                      oldValue
                    ) {
                      $scope.startDateCalendarIsOpen = false
                    })
                    // <-- for calendar bug
                    $scope.cancel = function () {
                      $uibModalInstance.close()
                    }
                    $scope.save = function (sendMessage) {
                      $scope.member.departments = $scope.member.departments.map((department) => {
                        return department.id
                      })
                      if ($scope.member.birthday) {
                        var birthday = new Date($scope.member.birthday)
                        $scope.member.birthday = birthday.getTime()
                      }
                      if ($scope.member.mobile) {
                        $scope.member.mobile = englishNumberFilter(
                          $scope.member.mobile
                        )
                      }
                      var planId = $scope.member.selectedInternetPlan.id
                      delete $scope.member.selectedInternetPlan
                      Business.members
                        .create({id: businessId}, $scope.member)
                        .$promise.then(
                        function (res) {
                          var memberId = res.id
                          InternetPlan.assignPlanToMember({
                            memberId: memberId,
                            planId: planId
                          }).$promise.then(
                            function (res) {
                              if (sendMessage) {
                                $scope.sendPassword(memberId)
                              }
                              appMessenger.showSuccess(
                                'member.createSuccessFull'
                              )
                              getPage()
                              $uibModalInstance.close()
                            },
                            function (error) {
                              appMessenger.showError(
                                'member.assignInternetPlanUnSuccessFull'
                              )
                            }
                          )
                        },
                        function (err) {
                          appMessenger.showError('member.createUnSuccessFull')
                          if (err.status == 422) {
                            appMessenger.showError('member.usernameNotValid')
                          }
                        }
                      )
                    }
                  }
                ]
              })
            } else {
              appMessenger.showWarning('member.pleaseCreateAnInternetPlan')
            }
          },
          function (error) {
            $log.error(error)
            appMessenger.showError('error.generalError')
          }
        )
      })

    }

    $scope.sendPassword = function (memberId) {
      Member.sendPassword({
        memberId: memberId,
        businessId: businessId
      }).$promise.then(
        function (result) {
          appMessenger.showSuccess('member.passwordSentSuccessFull')
        },
        function (error) {
          if (error && error.data.error && error.data.error.message) {
            appMessenger.showError(error.data.error.message)
            return
          } else if (
            error == 'memberNotFound' ||
            error == 'noMobileNumber' ||
            error == 'balanceNotEnough'
          ) {
            appMessenger.showError('member.' + error)
            appMessenger.showError('error.generalError')
            return
          } else {
            appMessenger.showError('member.passwordSentUnSuccessFull')
            appMessenger.showError('error.generalError')
          }
        }
      )
    }

    $scope.editMember = function (row) {
      var memberId = row.entity.id
      Member.loadMember({
        businessId: businessId,
        memberId: memberId
      }).$promise.then(
        function (member) {
          Business.departments({id: businessId}).$promise.then(function (allDepartments) {
            $uibModal.open({
              backdrop: true,
              animation: true,
              keyboard: true,
              backdropClick: true,
              size: 'md',
              scope: $scope,
              templateUrl: PREFIX + 'app/member/tpl/memberForm.html',
              controller: [
                '$scope',
                '$uibModalInstance',
                function ($scope, $uibModalInstance) {
                  $scope.options = {
                    title: 'member.editMember',
                    cancelBtnLabel: 'general.cancel',
                    saveBtnLabel: 'general.save',
                    saveAndSendBtnLabel: 'general.saveAndSend',
                    newMember: false
                  }
                  var memberId = row.entity.id
                  $scope.member = member
                  $scope.member.username = $scope.member.username.split('@')[0]
                  if (member.mobile) {
                    member.mobile = translateNumberFilter(member.mobile)
                  }
                  $scope.member.selectedInternetPlan = null
                  Business.internetPlans({id: businessId}).$promise.then(
                    function (internetPlans) {
                      $scope.internetPlans = internetPlans
                      angular.forEach(internetPlans, function (internetPlan) {
                        if (internetPlan.id == member.internetPlanId) {
                          $scope.member.selectedInternetPlan = internetPlan
                        }
                      })
                    },
                    function (error) {
                      $log.error(error)
                    }
                  )
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
                  }
                  // --> for calendar bug
                  $scope.$watch('member.birthday', function (newValue, oldValue) {
                    $scope.startDateCalendarIsOpen = false
                  })
                  // <-- for calendar bug
                  $scope.member.departments = allDepartments.filter((dep) => {
                    return member.departments && member.departments.indexOf(dep.id) !== -1
                  })

                  $scope.departments = allDepartments

                  $scope.cancel = function () {
                    $uibModalInstance.close()
                  }
                  $scope.save = function () {
                    $scope.member.departments = $scope.member.departments.map((department) => {
                      return department.id
                    })
                    if ($scope.member.birthday) {
                      $scope.member.birthday = $scope.member.birthday.getTime()
                    }
                    if ($scope.member.mobile) {
                      $scope.member.mobile = englishNumberFilter(
                        $scope.member.mobile
                      )
                    }
                    if (!$scope.member.selectedInternetPlan) {
                      appMessenger.showError('member.pleaseSelectAnInternetPlan')
                    } else {
                      var planId = $scope.member.selectedInternetPlan.id
                      delete $scope.member.selectedInternetPlan
                      Business.members
                        .updateById(
                          {
                            id: businessId,
                            fk: memberId
                          },
                          $scope.member
                        )
                        .$promise.then(
                        function (res) {
                          if (planId != res.internetPlanId) {
                            InternetPlan.assignPlanToMember({
                              memberId: memberId,
                              planId: planId
                            }).$promise.then(
                              function (res) {
                                appMessenger.showSuccess(
                                  'member.updateSuccessFull'
                                )
                                getPage()
                                $uibModalInstance.close()
                              },
                              function (err) {
                                appMessenger.showError(
                                  'member.assignInternetPlanUnSuccessFull'
                                )
                              }
                            )
                          } else {
                            appMessenger.showSuccess(
                              'member.updateSuccessFull'
                            )
                            getPage()
                            $uibModalInstance.close()
                          }
                        },
                        function (err) {
                          appMessenger.showError('member.updateUnSuccessFull')
                          if (err.status == 422) {
                            appMessenger.showError('member.duplicateUsername')
                          }
                        }
                      )
                    }
                  }
                  $scope.password = function () {
                    $uibModalInstance.close()
                    $scope.editPassword(row.entity)
                  }
                }
              ]
            })
          })
        },
        function (error) {
          $log.error(error)
          appMessenger.showError('error.generalError')
        }
      )
    }
    $scope.createMemberByGroup = function () {
      Business.internetPlans({id: businessId}).$promise.then(
        function (internetPlans) {
          if (internetPlans.length != 0) {
            $scope.internetPlans = internetPlans
            $uibModal.open({
              backdrop: true,
              animation: true,
              keyboard: true,
              backdropClick: true,
              size: 'lg',
              scope: $scope,
              templateUrl: PREFIX + 'app/member/tpl/memberByGroupForm.html',
              controller: [
                '$scope',
                '$uibModalInstance',
                function ($scope, $uibModalInstance) {
                  $scope.cancel = function () {
                    $uibModalInstance.close()
                  }
                  $scope.loading = false
                  $scope.memberByGroup = {
                    businessId: businessId,
                    count: 3,
                    helpLanguageCode: 'fa',
                    duration: 30,
                    internetPlan: $scope.internetPlans[0]
                  }
                  $scope.save = function () {
                    var validationError = false
                    if ($scope.memberByGroup.mobile) {
                      $scope.memberByGroup.mobile = englishNumberFilter(
                        $scope.memberByGroup.mobile
                      )
                    }
                    if (
                      $scope.memberByGroup.mobile &&
                      $scope.memberByGroup.mobile.length < 10
                    ) {
                      validationError = true
                      appMessenger.showError('member.memberByGroupCheckMobile')
                    }
                    if ($scope.memberByGroup.internetPlan) {
                      $scope.memberByGroup.internetPlanId =
                        $scope.memberByGroup.internetPlan.id
                    } else {
                      validationError = true
                      appMessenger.showError(
                        'member.memberByGroupRequiredInternetPlan'
                      )
                    }
                    if (
                      !$scope.memberByGroup.mobile &&
                      !$scope.memberByGroup.reserveCode &&
                      !$scope.memberByGroup.tourCode &&
                      !$scope.memberByGroup.passportNumber &&
                      !$scope.memberByGroup.nationalCode
                    ) {
                      validationError = true
                      appMessenger.showError(
                        'member.memberByGroupRequiredField'
                      )
                    }
                    if (
                      !$scope.memberByGroup.count ||
                      ($scope.memberByGroup.count < 3 ||
                        $scope.memberByGroup.count > 30)
                    ) {
                      validationError = true
                      appMessenger.showError('member.memberByGroupCheckCount')
                    }
                    if (!validationError) {
                      if (
                        $scope.memberByGroup.internetPlan &&
                        $scope.memberByGroup.internetPlanId
                      ) {
                        delete $scope.memberByGroup.internetPlan
                      }
                      $scope.loading = true
                      Member.createMembersByGroup(
                        $scope.memberByGroup
                      ).$promise.then(
                        function (renderedHtmlAsString) {
                          var data = new Blob([renderedHtmlAsString.html], {
                            type: 'text/html'
                          })
                          FileSaver.saveAs(data, 'users.html')
                          appMessenger.showSuccess(
                            'member.memberByGroupCreateSuccessfully'
                          )
                          $uibModalInstance.close()
                          $scope.loading = false
                          getPage()
                        },
                        function (error) {
                          $log.error(error)
                          $scope.loading = false
                          appMessenger.showError('error.generalError')
                        }
                      )
                    }
                  }
                }
              ]
            })
          } else {
            appMessenger.showWarning('member.pleaseCreateAnInternetPlan')
          }
        },
        function (error) {
          $log.error(error)
          appMessenger.showError('error.generalError')
        }
      )
    }
    $scope.showCsvForm = function () {
      Business.internetPlans({id: businessId}).$promise.then(
        function (internetPlans) {
          $uibModal.open({
            backdrop: true,
            animation: true,
            keyboard: true,
            backdropClick: true,
            scope: $scope,
            templateUrl: PREFIX + 'app/member/tpl/bulkMemberCsvForm.html',
            controller: [
              '$scope',
              '$uibModalInstance',
              function ($scope, $uibModalInstance) {
                $scope.csvString = ''
                internetPlans.push({id: null, name: '---'})
                internetPlans = internetPlans.reverse()
                $scope.internetPlans = internetPlans
                $scope.selectedInternetPlan = null
                $scope.cancel = function () {
                  $uibModalInstance.close()
                }
                $scope.uploadCsv = function () {
                  $uibModalInstance.close()
                  appMessenger.showSuccess(
                    'member.membersImportedSuccessfully'
                  )
                  var internetPlanId = null
                  if (
                    $scope.selectedInternetPlan &&
                    $scope.selectedInternetPlan.id
                  ) {
                    internetPlanId = $scope.selectedInternetPlan.id
                  }
                  Member.importMemberFromCsv({
                    businessId: businessId,
                    csvString: $scope.csvString,
                    internetPlanId: internetPlanId
                  }).$promise.then(
                    function (result) {
                      $uibModalInstance.close()
                    },
                    function (error) {
                      appMessenger.showError('member.failedToImportMembers')
                    }
                  )
                }
              }
            ]
          })
        },
        function () {}
      )
    }
    $scope.removeMember = function (row) {
      genericService.showConfirmDialog({
        title: 'general.warning',
        message: 'general.areYouSure',
        noBtnLabel: 'general.no',
        yesBtnLabel: 'general.yes',
        yesCallback: function () {
          var memberId = row.entity.id
          var index = $scope.gridOptions.data.indexOf(row.entity)
          Business.members
            .destroyById({id: businessId}, {fk: memberId})
            .$promise.then(
            function (business) {
              $scope.gridOptions.data.splice(index, 1)
              appMessenger.showSuccess('member.removeSuccessFull')
            },
            function (err) {
              appMessenger.showError('member.removeUnSuccessFull')
            }
          )
        },
        NoCallback: function () {}
      })
    }
    $scope.removeMembers = function () {
      var memberIds = []
      var selectedRows = $scope.gridApi.selection.getSelectedRows()
      angular.forEach(selectedRows, function (selectedRow) {
        if (selectedRow.id) {
          memberIds.push(selectedRow.id)
        }
      })
      if (memberIds.length != 0) {
        genericService.showConfirmDialog({
          title: 'general.warning',
          message: 'general.areYouSure',
          noBtnLabel: 'general.no',
          yesBtnLabel: 'general.yes',
          yesCallback: function () {
            Business.destroyMembersById({
              businessId: businessId,
              memberIds: memberIds
            }).$promise.then(
              function (result) {
                $scope.gridApi.selection.clearSelectedRows()
                getPage()
                appMessenger.showSuccess('member.removeSuccessFull')
              },
              function (err) {
                appMessenger.showError('member.removeUnSuccessFull')
              }
            )
          },
          NoCallback: function () {}
        })
      } else {
        appMessenger.showInfo('member.noMemberToRemove')
      }
    }
    $scope.editPassword = function (member) {
      var memberId = member.id
      Member.loadMemberPassword({
        businessId: businessId,
        memberId: memberId
      }).$promise.then(
        function (res) {
          $uibModal.open({
            backdrop: true,
            animation: true,
            keyboard: true,
            backdropClick: true,
            scope: $scope,
            templateUrl: PREFIX + 'app/member/tpl/passwordForm.html',
            controller: [
              '$scope',
              '$uibModalInstance',
              function ($scope, $uibModalInstance) {
                $scope.options = {
                  title: 'member.editPassword',
                  cancelBtnLabel: 'general.cancel',
                  saveBtnLabel: 'general.save',
                  saveAndSendBtnLabel: 'general.saveAndSendPass',
                  sendBtnLabel: 'general.sendPass'
                }
                $scope.newPassword = null
                $scope.currentPassword = res.passwordText
                $scope.cancel = function () {
                  $uibModalInstance.close()
                }
                $scope.save = function (sendMessage) {
                  $uibModalInstance.close()
                  if ($scope.newPassword) {
                    Business.members
                      .updateById(
                        {
                          id: businessId,
                          fk: memberId
                        },
                        {passwordText: $scope.newPassword}
                      )
                      .$promise.then(
                      function (res) {
                        appMessenger.showSuccess(
                          'member.passwordChangeSuccessFull'
                        )
                        if (sendMessage) {
                          $scope.sendPassword(memberId)
                        }
                        getPage()
                      },
                      function (err) {
                        appMessenger.showError(
                          'member.passwordChangeUnSuccessFull'
                        )
                      }
                    )
                  } else if (sendMessage) {
                    $scope.sendPassword(memberId)
                  }
                }
              }
            ]
          })
        },
        function (error) {
          $log.error(error)
          appMessenger.showError('error.generalError')
        }
      )
    }
    $scope.refreshPlan = function (row) {
      var memberId = row.entity.id
      Member.loadMember({
        businessId: businessId,
        memberId: memberId
      }).$promise.then(function (member) {
        $uibModal.open({
          backdrop: true,
          animation: true,
          keyboard: true,
          backdropClick: true,
          templateUrl: PREFIX + 'app/common/tpl/areYouSure.html',
          controller: [
            '$scope',
            '$uibModalInstance',
            function ($scope, $uibModalInstance) {
              $scope.options = {
                title: 'member.refreshInternetPlan',
                message: 'member.areYouSureRefreshPlan',
                noBtnLabel: 'general.no',
                yesBtnLabel: 'general.yes'
              }
              $scope.no = function () {
                $uibModalInstance.close()
              }
              $scope.yes = function () {
                InternetPlan.assignPlanToMember({
                  memberId: memberId,
                  planId: member.internetPlanId
                }).$promise.then(
                  function (res) {
                    appMessenger.showSuccess('member.refreshPlanSuccessFull')
                    getPage()
                    $uibModalInstance.close()
                  },
                  function (err) {
                    appMessenger.showError('member.refreshPlanUnSuccessFull')
                  }
                )
              }
            }
          ]
        })
      })
    }
    $scope.activateMember = function (row) {
      var memberId = row.entity.id
      Member.loadMember({
        businessId: businessId,
        memberId: memberId
      }).$promise.then(function (member) {
        $uibModal.open({
          backdrop: true,
          animation: true,
          keyboard: true,
          backdropClick: true,
          templateUrl: PREFIX + 'app/common/tpl/areYouSure.html',
          controller: [
            '$scope',
            '$uibModalInstance',
            function ($scope, $uibModalInstance) {
              $scope.options = {
                title: 'member.status',
                message: 'member.areYouSureChangeStatus',
                noBtnLabel: 'general.no',
                yesBtnLabel: 'general.yes'
              }
              $scope.no = function () {
                $uibModalInstance.close()
              }
              $scope.yes = function () {
                var active = member.active
                active = !active
                Business.members
                  .updateById(
                    {
                      id: businessId,
                      fk: memberId
                    },
                    {active: active}
                  )
                  .$promise.then(
                  function (res) {
                    appMessenger.showSuccess(
                      'member.changeStatusSuccessFull'
                    )
                    getPage()
                  },
                  function (err) {
                    appMessenger.showError(
                      'member.changeStatusUnSuccessFull'
                    )
                  }
                )
                $uibModalInstance.close()
              }
            }
          ]
        })
      })
    }
    $scope.sendMessageToAll = function () {
      $uibModal.open({
        backdrop: true,
        animation: true,
        keyboard: true,
        backdropClick: true,
        scope: $scope,
        templateUrl: PREFIX + 'app/member/tpl/messageForm.html',
        controller: [
          '$scope',
          '$uibModalInstance',
          function ($scope, $uibModalInstance) {
            $scope.options = {
              title: 'message.sendMessage',
              cancelBtnLabel: 'general.cancel',
              saveBtnLabel: 'message.reviewAndSend',
              message: {}
            }
            $scope.cancel = function () {
              $uibModalInstance.close()
            }
            $scope.send = function (message) {
              if (message.body) {
                Member.getSmsCostForAllMembers({
                  businessId: businessId,
                  messageText: message.body
                }).$promise.then(
                  function (result) {
                    $uibModalInstance.close()
                    $scope.showSendMessageConfirmDialog(result)
                  },
                  function (error) {
                    appMessenger.showError('error.generalError')
                  }
                )
              } else {
                appMessenger.showError('message.requiredMessageBody')
              }
            }
          }
        ]
      })
    }
    $scope.showSendMessageConfirmDialog = function (message) {
      $uibModal.open({
        backdrop: true,
        animation: true,
        keyboard: true,
        backdropClick: true,
        scope: $scope,
        templateUrl: PREFIX + 'app/member/tpl/messageConfirmDialog.html',
        controller: [
          '$scope',
          '$uibModalInstance',
          function ($scope, $uibModalInstance) {
            $scope.options = {
              cancelBtnLabel: 'general.cancel',
              messageText: message.messageText,
              receptorsLength: message.receptorsLength,
              totalCost: message.totalCost,
              balance: message.balance,
              balanceEnough: message.balanceEnough
            }

            if (message.receptorsLength == 0) {
              $scope.options.title = 'error.error'
            } else if (message.balanceEnough) {
              $scope.options.title = 'message.confirmAndSend'
            } else {
              $scope.options.title = 'business.balanceNotEnough'
            }

            $scope.cancel = function () {
              $uibModalInstance.close()
            }
            $scope.send = function () {
              Member.sendMessageToAll({
                messageText: message.messageText,
                businessId: businessId
              }).$promise.then(
                function (result) {
                  $uibModalInstance.close()
                  appMessenger.showSuccess('message.messageSentSuccessFull')
                },
                function (error) {
                  if (error && error.data.error && error.data.error.message) {
                    appMessenger.showError(error.data.error.message)
                  } else {
                    appMessenger.showError('error.generalError')
                  }
                }
              )
            }
            $scope.increaseCredit = function () {
              $uibModalInstance.close()
              credit.showIncreaseCreditForm({
                title: 'business.smsCharge',
                cancelBtnLabel: 'general.cancel',
                submitBtnLabel: 'business.sendToBank',
                message: 'business.yourSMSCredit',
                balance: message.balance,
                requiredCredit: message.totalCost,
                description: 'smsCharge',
                chargedBy: 'business',
                businessId: businessId,
                saveCallback: function () {},
                cancelCallback: function () {}
              })
            }
          }
        ]
      })
    }
    $scope.searchMember = function () {
      if ($scope.memberUsername) {
        $scope.isSearching = true
        var usernamePattern =
          '/' + $scope.memberUsername + '.*@' + businessId + '$/i'
        var filter = {username: {regexp: usernamePattern}}
        getPage(filter)
      } else {
        getPage()
      }
    }
    $scope.clearSearch = function () {
      if ($scope.memberUsername) {
        $scope.memberUsername = ''
        getPage()
      }
    }
    $scope.showPlanHistory = function (row) {
      $scope.businessId = businessId
      $scope.memberId = row.entity.id
      Member.loadMember({
        businessId: businessId,
        memberId: $scope.memberId
      }).$promise.then(
        function (member) {
          $scope.member = member
          $uibModal.open({
            backdrop: true,
            animation: true,
            keyboard: true,
            backdropClick: true,
            size: 'lg',
            scope: $scope,
            templateUrl: PREFIX + 'app/member/tpl/planHistoryList.html',
            controller: 'planHistoryList'
          })
        },
        function (error) {
          $log.error(error)
          appMessenger.showError('error.generalError')
        }
      )
    }

    $scope.$watch('memberUsername', function (newValue, oldValue) {
      if (newValue != oldValue && newValue.length == 0) {
        getPage()
      }
    })

    $scope.$watch('paginationOptions.itemPerPage', function (
      newValue,
      oldValue
    ) {
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
      options.filter.fields = {internetPlanHistory: false}
      Business.members
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
      Business.members(options).$promise.then(
        function (members) {
          Business.internetPlans({id: businessId}).$promise.then(
            function (internetPlans) {
              Member.loadMemberUsage({members: members}).$promise.then(
                function (usage) {
                  for (var i = 0; i < members.length; i++) {
                    members[i].upload = 0
                    members[i].download = 0
                    var memberId = members[i].id
                    if (usage[memberId]) {
                      members[i].upload = usage[memberId].upload
                      members[i].download = usage[memberId].download
                    }
                    members[i].username = members[i].username.split('@')[0]
                    members[i].internetPlanName = '-'
                    angular.forEach(internetPlans, function (internetPlan) {
                      if (members[i].internetPlanId == internetPlan.id) {
                        members[i].internetPlanName = internetPlan.name
                      }
                    })
                  }
                  $scope.isSearching = false
                  $scope.gridOptions.data = members
                },
                function (err) {
                  $log.error(err)
                }
              )
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
  }
])
