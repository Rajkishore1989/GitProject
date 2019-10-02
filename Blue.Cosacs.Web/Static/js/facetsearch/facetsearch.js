/*global define*/

define(['facetsearch/controller', 'facetsearch/directive', 'angularShared/loader', 'angular'], function (facetController, facetDirective, loader) {
	angular.module('blue', [])
		.factory('myHttp', ['$http', '$rootScope', loader])
		.controller('FacetController', ['$scope', '$attrs', '$http', '$compile', facetController])
		.directive('facetsearch', ['myHttp', facetDirective]);
	// .controller('FacetController', ['$scope', '$attrs', '$http', '$compile', searchController])
	// .directive('facetsearch', ['$http', searchDirective]);
});