/**
 * Created by hamidehnouri on 8/8/2016 AD.
 */

app.controller('ticketListController', [
  '$scope',
  '$state',
  '$log',
  'translateFilter',
  'Campaign',
  'Ticket',
  'uiGridConstants',
  '$http',
  'genericService',
  'Session',
  '$uibModal',
  'PREFIX',
  'appMessenger',
  'Business',
  function(
    $scope,
    $state,
    $log,
    translateFilter,
    Campaign,
    Ticket,
    uiGridConstants,
    $http,
    genericService,
    Session,
    $uibModal,
    PREFIX,
    appMessenger,
    Business
  ) {
    if (Session.business) {
      businessId = Session.business.id;
    }

    $scope.Session = Session;
    $scope.paginationOptions = {
      pageNumber: 1,
      itemPerPage: 10,
      sort: null
    };

    $scope.gridOptions = {
      enableSorting: true,
      enablePaginationControls: false,
      enableRowSelection: false,
      enableSelectAll: false,
      selectionRowHeaderWidth: 35,
      rowHeight: 36,
      showGridFooter: true,
      enableColumnResizing: true,
      minRowsToShow: 11,
      columnDefs: [
        {
          displayName: 'ticket.subject',
          field: 'code',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellTemplate:
            '<a class="btn btn-link" ng-click="grid.appScope.showTicketDetails(row.entity.id)">{{row.entity.subject}}</a>'
        },

        {
          displayName: 'ticket.status',
          field: 'count',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellTemplate:
            '<div class="ui-grid-cell-contents">{{"ticket." + row.entity.response + "Response" | translate }}</div>'
        },
        {
          displayName: 'ticket.creationDate',
          field: 'creationDate',
          enableHiding: false,
          enableSorting: false,
          enableColumnMenu: false,
          headerCellFilter: 'translate',
          cellTemplate:
            '<div class="ui-grid-cell-contents">{{row.entity.creationDate |  persianDate : "fullDate" | translateNumber }}{{"general.,"| translate}}&nbsp;{{"general.hour"| translate}}:&nbsp;{{row.entity.creationDate |  date : "HH:mm" | translateNumber }}</div>'
        }
      ],
      onRegisterApi: function(gridApi) {
        $scope.gridApi = gridApi;
        $scope.gridApi.core.on.sortChanged($scope, function(grid, sortColumns) {
          if (sortColumns.length == 0) {
            $scope.paginationOptions.sort = null;
          } else {
            $scope.paginationOptions.sort =
              sortColumns[0].name +
              ' ' +
              sortColumns[0].sort.direction.toUpperCase();
          }
          getPage();
        });
      }
    };

    $scope.addTicket = function() {
      $uibModal.open({
        backdrop: true,
        animation: true,
        keyboard: true,
        backdropClick: true,
        size: 'lg',
        scope: $scope,
        templateUrl: PREFIX + 'app/ticket/tpl/ticketForm.html',
        controller: [
          '$scope',
          '$uibModalInstance',
          'Business',
          function($scope, $uibModalInstance, Business) {
            $scope.ticket = {
              creationDate: new Date().getTime(),
              status: 'open',
              department: 'support',
              businessTitle: Session.business.title,
              ticketCode: Math.floor(Math.random() * 9000) + 1000,
              mobile: Session.business.mobile,
              businessId: Session.business.id,
              response: 'customer',
              messages: []
            };
            $scope.message = {
              creationDate: new Date().getTime(),
              sendBy: 'customer'
            };
            $scope.cancel = function() {
              $uibModalInstance.close();
            };
            $scope.save = function(error) {
              $scope.ticket.messages.push($scope.message);
              Business.tickets
                .create({ id: Session.business.id }, $scope.ticket)
                .$promise.then(
                  function(res) {
                    appMessenger.showSuccess('ticket.createSuccessFull');
                    getPage();
                    $uibModalInstance.close();
                  },
                  function(err) {
                    appMessenger.showError('error.generalError');
                  }
                );
            };
          }
        ]
      });
    };

    $scope.showTicketDetails = function(ticketId) {
      $state.go('app.ticketDetails', { ticketId: ticketId });
    };

    $scope.$watch('paginationOptions.itemPerPage', function(
      oldValue,
      newValue
    ) {
      getPage();
    });

    $scope.pageChanges = function() {
      getPage();
    };
    var getPage = function(inputFilter) {
      switch ($scope.paginationOptions.sort) {
        case uiGridConstants.ASC:
          break;
        case uiGridConstants.DESC:
          break;
        default:
          break;
      }

      var options = { filter: {} };
      if (Session.userType === 'Business') {
        if (inputFilter) {
          options.filter.where = inputFilter;
        }
        Business.tickets
          .count({ id: businessId, where: inputFilter })
          .$promise.then(
            function(result) {
              $scope.gridOptions.totalItems = result.count;
              $scope.paginationOptions.totalItems = result.count;
            },
            function(error) {
              $log.error(error);
            }
          );
        options.id = businessId;
        options.filter.sort = $scope.paginationOptions.sort;
        options.filter.skip =
          ($scope.paginationOptions.pageNumber - 1) *
          $scope.paginationOptions.itemPerPage;
        options.filter.limit = $scope.paginationOptions.itemPerPage;
        Business.tickets(options).$promise.then(
          function(tickets) {
            $scope.isSearching = false;
            $scope.gridOptions.data = tickets;
          },
          function(error) {
            $log.error(error);
          }
        );
      } else if (Session.userType === 'Admin') {
        if (inputFilter) {
          options.filter.where = inputFilter;
        }
        Ticket.count({ where: inputFilter }).$promise.then(
          function(result) {
            $scope.gridOptions.totalItems = result.count;
            $scope.paginationOptions.totalItems = result.count;
          },
          function(error) {
            $log.error(error);
          }
        );

        options.id = businessId;
        options.filter.sort = $scope.paginationOptions.sort;
        options.filter.skip =
          ($scope.paginationOptions.pageNumber - 1) *
          $scope.paginationOptions.itemPerPage;
        options.filter.limit = $scope.paginationOptions.itemPerPage;
        Ticket.find(options).$promise.then(
          function(tickets) {
            $scope.isSearching = false;
            $scope.gridOptions.data = tickets;
          },
          function(error) {
            $log.error(error);
          }
        );
      }
    };
  }
]);
