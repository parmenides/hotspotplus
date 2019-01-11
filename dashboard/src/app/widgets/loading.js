/**
 * Created by rezanazari on 10/31/16.
 */
app.directive( 'loading', function () {
	return {
		restrict: 'E',
		replace:  true,
		template: '<div class="loading" ng-class="' +
		          "{'text-gray-ltr': !loading," +
		          "'text-gray-dr':loading}" +
		          '"><i ng-class="' +
		          "{'fa-circle-o-notch fa-spin':loading," +
		          "'fa-check':!loading}" +
		          '"class="fa fa-fw fa-lg"></i><span class="sr-only"></span>',
		link:     function ( scope, element, attr ) {
		}
	}
} )
