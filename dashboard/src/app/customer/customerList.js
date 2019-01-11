/**
 * Created by payamyousefi on 7/13/16.
 */

app.controller( 'customerList', [ '$scope', '$log', 'translateFilter', 'Customer', 'uiGridConstants', 'genericService',
	function ( $scope, $log, translateFilter, Customer, uiGridConstants, genericService ) {
		$scope.paginationOptions = {
			pageNumber:  1,
			itemPerPage: 10,
			sort:        null
		}
		$scope.gridOptions = {
			enableSorting:            true,
			enablePaginationControls: false,
			enableRowSelection:       false,
			enableSelectAll:          false,
			selectionRowHeaderWidth:  35,
			rowHeight:                35,
			showGridFooter:           true,
			enableColumnResizing:     true,
			columnDefs:               [
				{
					displayName:      'general.name',
					field:            'fullName',
					enableHiding:     false,
					enableSorting:    false,
					enableColumnMenu: false,
					headerCellFilter: 'translate'
				},
				{
					displayName:      'general.mobile',
					field:            'mobile',
					enableHiding:     false,
					enableSorting:    false,
					enableColumnMenu: false,
					headerCellFilter: 'translate'
				},
				{
					displayName:      'general.email',
					field:            'email',
					enableHiding:     false,
					enableSorting:    false,
					enableColumnMenu: false,
					headerCellFilter: 'translate'
				},
				{
					displayName:      'general.remove',
					field:            'delete',
					width:            60,
					enableHiding:     false,
					enableSorting:    false,
					enableColumnMenu: false,
					headerCellFilter: 'translate',
					cellTemplate:     '<a class="btn btn-link" style="color: #f05050;" ng-click="grid.appScope.deleteCustomer(row)" ><i class="fa fa-fw fa-trash"></i></a>'
				}
			],
			onRegisterApi:            function ( gridApi ) {
				$scope.gridApi = gridApi
				$scope.gridApi.core.on.sortChanged( $scope, function ( grid, sortColumns ) {
					if ( sortColumns.length == 0 ) {
						$scope.paginationOptions.sort = null
					} else {
						$scope.paginationOptions.sort = sortColumns[ 0 ].name + ' ' + sortColumns[ 0 ].sort.direction.toUpperCase()
					}
					getPage ()
				} )
			}
		}

		$scope.deleteCustomer = function ( row ) {
			genericService.showConfirmDialog( {
				title:       'general.warning',
				message:     'general.areYouSure',
				noBtnLabel:  'general.no',
				yesBtnLabel: 'general.yes',
				yesCallback: function () {
					var customerId = row.entity.id
					var index = $scope.gridOptions.data.indexOf( row.entity )

					/* Customer.members({id: customerId}).$promise.then(function(result){
					 },function(error){
					 }); */
					Customer.members.destroyAll( { id: customerId } ).$promise.then( function ( result ) {
						Customer.deleteById( { id: customerId } ).$promise.then( function ( res ) {
							$scope.gridOptions.data.splice( index, 1 )
						}, function ( err ) {
							$log.error( 'Customer not deleted:', err )
						} )
					}, function ( error ) {
					} )
				},
				NoCallback:  function () {
				}
			} )
		}

		$scope.$watch( 'paginationOptions.itemPerPage', function ( oldValue, newValue ) {
			getPage ()
		} )

		$scope.pageChanges = function () {
			getPage ()
		}

		var getPage = function () {
			switch ( $scope.paginationOptions.sort ) {
				case uiGridConstants.ASC:
					break
				case uiGridConstants.DESC:
					break
				default:
					break
			}
			var options = { filter: {} }
			options.filter.sort = $scope.paginationOptions.sort
			options.filter.skip = ($scope.paginationOptions.pageNumber - 1) * $scope.paginationOptions.itemPerPage
			options.filter.limit = $scope.paginationOptions.itemPerPage

			Customer.count().$promise.then( function ( result ) {
				$scope.gridOptions.totalItems = result.count
				$scope.paginationOptions.totalItems = result.count
			}, function ( error ) {
				$log.error( error )
			} )
			Customer.find( options ).$promise.then( function ( customers ) {
				$scope.gridOptions.data = customers
			}, function ( error ) {
				$log.error( error )
			} )
		}
	} ] )
