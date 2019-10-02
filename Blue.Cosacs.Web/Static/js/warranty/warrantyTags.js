/*global define*/
define(['angular', 'jquery', 'underscore', 'url', 'angularShared/app',
	'warranty/tagsController', 'warranty/warrantyDirective', 'facetsearch/service', 'underscore.string', 'angular.ui', 'angular.bootstrap'],

function (angular, $, _, url, app, TagsController, warrantyDirective, facetService) {

	'use strict';

	return {
		init: function ($el) {
				app().service('facetService', facetService)
				.controller('TagsController', TagsController)
				.directive('warranty', ['$timeout', '$dialog', 'facetService', warrantyDirective]);

			return angular.bootstrap($el, ['myApp']);
		}
	};
});