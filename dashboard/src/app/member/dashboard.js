/**
 * Created by rezanazari on 7/3/17.
 */
'use strict';

/* Controllers */

app.controller ( 'memberDashboardCtrl', ['$scope', '$log', 'Member', 'Session', 'appMessenger', function ( $scope, $log, Member, Session, appMessenger ) {

	if ( Session.member == null ) {
		return;
	}
	$scope.color = {
		primary: '#7266ba',
		info:    '#23b7e5',
		success: '#27c24c',
		warning: '#fad733',
		danger:  '#f05050',
		light:   '#e8eff0',
		dark:    '#3a3f51',
		black:   '#1c2b36'
	};
	$scope.planParams = {
		planDeleted: false,
		startDate:   Session.member.subscriptionDate,
		color:       $scope.color,
		package:     {
			name:     "",
			type:     "",
			duration: 0,
			speed:    {
				value: 0,
				type:  ''
			}
		}
	};
	$scope.bulkParams = {
		color:      $scope.color,
		remainBulk: {value: 0, type: ''},
		bulk:       0
	};
	$scope.timeParams = {
		color:        $scope.color,
		timeDuration: 0,
		remainTime:   0
	};
	$scope.usageParams = {
		color: $scope.color
	};

	var businessId = Session.member.businessId;
	var memberId = Session.member.id;

	Member.getMemberBalance ( {
		businessId: businessId,
		memberId:   memberId
	} ).$promise.then ( function ( balance ) {
		$scope.package = {};
		$scope.package.name = balance.name;
		$scope.package.type = balance.type;
		$scope.package.duration = balance.duration;
		$scope.package.speed = balance.speed;

		if ( balance.fromToCheck ) {
			$scope.package.hourly = true;
			$scope.package.fromHour = balance.fromHour;
			$scope.package.toHour = balance.toHour;
			$scope.package.fromMinute = balance.fromMinute;
			$scope.package.toMinute = balance.toMinute;
		}
		$scope.planParams.package = $scope.package;
		$scope.bulkParams.remainBulk = balance.bulk;
		$scope.bulkParams.bulk = balance.originalBulk;
		$scope.bulkParams.extraBulk = balance.extraBulk;
		$scope.timeParams.timeDuration = balance.originalTimeDuration;
		$scope.timeParams.remainTime = balance.timeDuration;
	}, function ( error ) {
		$log.error ( error );
		if ( error.status == 500 && error.data.error.message == 'plan not found' ) {
			$scope.planParams.planDeleted = true;
		}
	} );
}] );
