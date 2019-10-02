/*global define*/
define(['angular', 'jquery', 'underscore', 'url', 'pjax'], function (angular, $, _) {
	'use strict';
	var touchFriendlyController = function ($scope, dialog, search) {
		$scope.search = search;

		$scope.searchValueSelected = function (e) {
			var result = {};
			e.preventDefault();
			var target = $(e.currentTarget);
			var field = target.parent().parent().data('field');
			var value = target.data('value');

			$('.facet-field[data-field="' + field + '"]')
				.find('.field-value[data-value="' + value + '"]').toggleClass('selected');

			dialog.close(result);
		};
	};

	return touchFriendlyController;
});
