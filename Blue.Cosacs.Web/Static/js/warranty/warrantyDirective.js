/*global define*/
define(['angular', 'jquery', 'underscore', 'url', 'notification'],

function (angular, $, _, url, notification) {
	'use strict';
	var warrantyDirective = function ($timeout, $dialog, facetService) {
		return {
			restrict: 'EA',
			controller: 'TagsController',
			transclude: false,
			replace: true,
			templateUrl: url.resolve('/Static/js/warranty/templates/warrantyStructure.html'),
			link: function (scope, element, attrs, controller) {

				$timeout(function () {

					$('.warranty-container').on('mouseenter', '.tag', function (e) {
						$(e.currentTarget)
							.addClass('active')
							.find('.actions').addClass('active');
					});

					$('.warranty-container').on('mouseleave', '.tag', function (e) {
						$(e.currentTarget)
							.removeClass('active')
							.find('.actions').removeClass('active');
					});

					$('.warranty-container').on('focus', '.tag.new input', function (e) {
						$(e.currentTarget)
							.parent().parent().addClass('active')
							.find('.actions').addClass('active');
					});

					$('.warranty-container').on('blur', '.tag.new input', function (e) {
						//$(e.currentTarget)
							//.parent().parent().removeClass('active')
							//.find('.actions').removeClass('active');
					});

				}, 0);

				scope.saveNewLevel = function () {
					if (this.newLevelName !== '') {
						controller.newLevel(this.newLevelName);
						$('input').blur();
					}
				};

				scope.editLevel = function ($event) {

					_.each(scope.warrantyData.Levels, function (level) {
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

					_.each(scope.warrantyData.Tags, function (tag) {
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

					var warrantyCount = _.reduce(level.Tags, function (total, tag) {
						return total + tag.WarrantyCount;
					}, 0);

					var deleteConfirmation = $dialog.messageBox('Confirm Level Delete',
						'You have chosen to delete the Level "' + level.Name + '".all ' + warrantyCount + ' warranties will lose their Tag data for this Level. Are you sure you want to do this?', [{
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
						'". If you proceed, all ' + tag.WarrantyCount + ' warranties that use this Tag will have no Tag for this Level. Are you sure you want to do this?', [{
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

				var clearMoveSelections = function () {
					scope.moveSource = undefined;
					scope.moveDestination = undefined;
					scope.moveDestinationSelected = false;
					scope.moveTagFilter = '';
					$('.destination-selector .tag').removeClass('selected');
				};

				scope.moveTagItems = function () {
					if (this.tag.WarrantyCount === 0) {
						return;
					}

					clearMoveSelections();

					scope.moveSource = this.tag;
					scope.moveTagLevel = this.level;
					scope.moveTagLevel.filteredTags = _.reject(scope.moveTagLevel.Tags, function (tag) {
						return tag.Id === scope.moveSource.Id;
					});

					if (scope.moveTagLevel.filteredTags.length === 0) {
						return;
					}

					scope.showMoveDialog = true;
					scope.moveStepOne = true;
					scope.moveStepTwo = false;
				};

				scope.cancelMove = function () {
					scope.showMoveDialog = false;
					scope.showMoveConfirmation = false;
					clearMoveSelections();
				};

				scope.selectMoveDestination = function ($event) {
					$('.destination-selector .tag').removeClass('selected');
					$($event.currentTarget).addClass('selected');
					scope.moveDestination = this.tag;
					scope.moveDestinationSelected = true;
				};

				scope.requestMoveWarranties = function () {
					scope.moveStepOne = false;
					scope.moveStepTwo = true;
				};

				scope.moveWarranties = function () {
					controller.moveWarranties(scope.moveSource, scope.moveDestination);
				};

				scope.getWarrantySearchLink = function () {
					var searchParams = facetService.getSearchUrl('Level_' + this.level.Id, [this.tag.Name]);
					return url.resolve('Warranty/Warranties/Index?' + searchParams);
				};

				scope.$on('warranties:move:success', function () {
					scope.showMoveDialog = false;
					clearMoveSelections();
					notification.show('Warranties moved successfully');
				});

				scope.$on('warranties:move:fail', function (event, data) {
					scope.showMoveDialog = false;
					scope.moveStepOne = false;
					scope.moveStepTwo = false;
					clearMoveSelections();
					notification.showPersistent('The Warranties could not be moved. Reason: ' + data.Reason);
				});
			}
		};
	};

	return warrantyDirective;
});