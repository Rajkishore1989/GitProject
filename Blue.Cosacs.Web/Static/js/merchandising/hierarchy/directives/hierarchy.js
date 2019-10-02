define(['angular', 'jquery', 'underscore', 'url', 'notification'],

function (angular, $, _, url, notification) {
	'use strict';
	var hierarchyDirective = function ($timeout, $dialog, user, facetService) {
		return {
			restrict: 'EA',
			controller: 'TagsController',
			transclude: false,
			replace: true,
			templateUrl: url.resolve('/Static/js/merchandising/hierarchy/templates/productHierarchy.html'),
			link: function (scope, element, attrs, controller) {

				$timeout(function () {

				    $('.hierarchy-container').on('mouseenter', '.tag', function (e) {
						$(e.currentTarget)
							.addClass('active')
							.find('.actions').addClass('active');
					});

				    $('.hierarchy-container').on('mouseleave', '.tag', function (e) {
						$(e.currentTarget)
							.removeClass('active')
							.find('.actions').removeClass('active');
					});

				    $('.hierarchy-container').on('focus', '.tag.new input', function (e) {
						$(e.currentTarget)
							.parent().parent().addClass('active')
							.find('.actions').addClass('active');
					});

				    $('.hierarchy-container').on('blur', '.tag.new input', function (e) {
						//$(e.currentTarget)
							//.parent().parent().removeClass('active')
							//.find('.actions').removeClass('active');
					});

				}, 0);

				scope.canEdit = user.hasPermission('HierarchyEdit');

				scope.saveNewLevel = function () {
					if (this.newLevelName !== '') {
						controller.newLevel(this.newLevelName);
						$('input').blur();
					}
				};

				scope.editLevel = function ($event) {

				    _.each(scope.hierarchyData.Levels, function (level) {
						level.isEditing = false;
					});

					this.level.editedName = this.level.Name;
					this.level.isEditing = true;

					$timeout(function () {
						$($event.currentTarget).parent().parent().find('input').focus();
					}, 0);
				};

				scope.cancelEditLevel = function () {
					this.level.isEditing = false;
					this.level.editedName = '';
				};

				scope.saveEditLevel = function () {
					if (typeof this.level.editedName === 'string' && this.level.editedName !== '') {
						controller.saveLevel(this.level);
					}
				};

				scope.cancelNewLevel = function () {
					this.newLevelName = '';
				};

				scope.saveNewTag = function () {
					if (this.level.newTagName) {
						controller.newTag(this.level.newTagName, this.level);
						$('input').blur();
					}
				};

				scope.editTag = function ($event) {

				    _.each(scope.hierarchyData.Tags, function (tag) {
						tag.isEditing = false;
					});

					this.tag.editedName = this.tag.Name;
					this.tag.isEditing = true;
					$timeout(function () {
						$($event.currentTarget).parent().parent().find('input').focus();
					}, 0);
				};

				scope.cancelEditTag = function () {
					this.tag.isEditing = false;
					this.tag.editedName = '';
				};

				scope.saveEditTag = function () {
					if (typeof this.tag.editedName === 'string' && this.tag.editedName !== '') {
						controller.saveTag(this.tag, this.level);
					}
				};

				scope.cancelNewTag = function () {
					this.level.newTagName = '';
				};

				scope.deleteLevel = function () {
					var level = this.level;

                    if (level && level.Tags &&  level.Tags.length >0){
                        var msg='You cannot delete this Level "' + level.Name + '" as it has tags attached to it. '+
                            'If you want to proceed, please individually delete each tag first.';
                        var dlg=$dialog.messageBox('Cannot Delete Level', msg, [{
                                label: 'OK',
                                result: 'ok',
                                cssClass: 'btn-primary'
                            }]);

                        dlg.open();

                        return;
                    }

					

					var deleteConfirmation = $dialog.messageBox('Confirm Level Delete',
						'You have chosen to delete the Level "' + level.Name + '". Are you sure you want to do this?', [{
						label: 'Delete',
						result: 'yes',
						cssClass: 'btn-primary'
					}, {
						label: 'Cancel',
						result: 'no'
					}]);

					deleteConfirmation.open().then(function (result) {
						if (result === 'yes') {
							controller.deleteLevel(level);
						}
					});
				};

				scope.deleteTag = function () {
					if (this.tag.Id === 0) {
						return;
					}

					var tag = this.tag;
					var level = this.level;
					var deleteConfirmation = $dialog.messageBox('Confirm Tag Delete', 'You have chosen to delete the Tag "' + tag.Name +
						'". Are you sure you want to do this?', [{
						label: 'Delete',
						result: 'yes',
						cssClass: 'btn-primary'
					}, {
						label: 'Cancel',
						result: 'no'
					}]);
					deleteConfirmation.open().then(function (result) {
						if (result === 'yes') {
							controller.deleteTag(tag, level);
						}
					});
				};



		
			}
		};
	};

	return hierarchyDirective;
});