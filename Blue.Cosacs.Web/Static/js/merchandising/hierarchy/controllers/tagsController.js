define(['angular', 'jquery', 'underscore', 'url', 'pjax', 'alert', 'notification'],
       function (angular, $, _, url, pjax, alert, notification) {
           'use strict';

        var getHierarchyData = function (data) {
            var hierarchyData = data;

            hierarchyData.Levels = _.sortBy(hierarchyData.Levels, function (level) {
                return level.Id;
            });

            hierarchyData.Tags = _.sortBy(hierarchyData.Tags, function (tag) {
                return tag.Level.Id;
            });

            _.each(hierarchyData.Levels, function (level) {
                var tags = _.filter(hierarchyData.Tags, function (tag) {
                    return tag.Level.Id === level.Id;
                });
                level.Tags = tags;
            });

            return hierarchyData;
        };

        var tagsController = function ($scope, $attrs, xhr) {
            
            $scope.hierarchyData = getHierarchyData(JSON.parse($attrs.merchandisingData || '{ "Levels": [], "Tags": [] }'));

            $scope.modalOptions = {
                backdropFade: true,
                dialogFade: true
            };

            var saveLevel = function (level) {
                xhr({
                    method: 'PUT',
                    url: url.resolve('/Merchandising/Levels/' + level.Id),
                    data: {
                        Name: level.editedName
                    }
                }).success(function () {
                    level.Name = level.editedName;
                    level.isEditing = false;
                    notification.show('Level ' + level.Name + ' saved');
                }).error(function (data, status) {
                    if (status === 400) {
                        if (data.Message === 'Duplicate') {
                            alert('There is already a Level with the same name', 'Error');
                        } else {
                            alert('There was an error trying to save the Level', 'Error');
                        }
                    }
                });
            };

            var newLevel = function (newLevelName) {
                var scope = $scope;
                xhr({
                    method: 'POST',
                    url: url.resolve('/Merchandising/Levels/'),
                    data: {
                        Name: newLevelName
                    }
                }).success(function (data) {
                    scope.hierarchyData.Levels.push({
                        Id: data.Level.Id,
                        Name: data.Level.Name,
                        Tags: []
                    });
                    notification.show('Level ' + data.Level.Name + ' created');
                    scope.newLevelName = '';
                    newLevelName = '';
                }).error(function (data, status) {
                    if (status === 400) {
                        if (data.Message === 'Duplicate') {
                            alert('There is already a Level with the same name', 'Error');
                        } else {
                            alert('There was an error trying to save the Level', 'Error');
                        }
                    }
                });
            };

            var deleteLevel = function (level) {
                var scope = $scope;
                xhr({
                    method: 'DELETE',
                    url: url.resolve('/Merchandising/Levels/' + level.Id)
                }).success(function () {
                    scope.hierarchyData.Levels = _.reject(scope.hierarchyData.Levels, function (item) {
                        return item.Id === level.Id;
                    });
                    notification.show('Level ' + level.Name + ' deleted');
                }).error(function (data, status) {
                    if (status === 400) {
                        alert('There was an error trying to delete the Level', 'Error');
                    }
                });
            };

            var saveEditedTag = function (tag, level) {
                xhr({
                    method: 'PUT',
                    url: url.resolve('/Merchandising/Tags/' + tag.Id),
                    data: {
                        Name: tag.editedName,
                        Level: tag.Level
                    }
                }).success(function () {
                    tag.Name = tag.editedName;
                    tag.isEditing = false;
                    notification.show('Tag ' + tag.Name + ' under Level ' + level.Name + ' saved');
                }).error(function (data, status) {
                    if (status === 400) {
                        if (data.Message === 'Duplicate') {
                            alert('There is already a Tag with the same name', 'Error');
                        } else {
                            alert('There was an error trying to save the Tag', 'Error');
                        }
                    }
                });
            };



            var newTag = function (newTagName, level, successCallback) {
                xhr({
                    method: 'POST',
                    url: url.resolve('/Merchandising/Tags/'),
                    data: {
                        Name: newTagName,
                        Level: level
                    }
                }).success(function (data) {
                    if (_.isFunction(successCallback)) {
                        successCallback(data);
                    } else {
                        level.Tags.push({
                            Id: data.Tag.Id,
                            Name: data.Tag.Name,
                            Level: {
                                Id: level.Id,
                                Name: level.Name
                            }
                        });
                    }

                    notification.show('Tag ' + data.Tag.Name + ' created under Level ' + level.Name);
                    level.newTagName = '';
                    newTagName = '';
                }).error(function (data, status) {
                    if (status === 400) {
                        if (data.Message === 'Duplicate') {
                            alert('There is already a Tag with the same name', 'Error');
                        } else {
                            alert('There was an error trying to save the Tag', 'Error');
                        }
                    }
                });
            };

            var saveTag = function (tag, level) {

                // 'Unassigned' tag being given a name.
                // Need to create a new tag, and reassign the 'Unassgigned' warranties to the new tag.
                if (tag.Id === 0) {
                    newTag(tag.editedName, level, function (data) {
                    });
                } else {
                    saveEditedTag(tag, level);
                }
            };

            var deleteTag = function (tag, level) {
                xhr({
                    method: 'DELETE',
                    url: url.resolve('/Merchandising/Tags/' + tag.Id)
                }).success(function (response) {
                    $scope.hierarchyData = getHierarchyData(response.data);
                    notification.show('Tag ' + tag.Name + ' under Level ' + level.Name + ' deleted');
                }).error(function (err) {
                    if (err.message) {
                        notification.showPersistent(err.message);
                    }
                });
            };

            return {
                saveLevel: saveLevel,
                newLevel: newLevel,
                deleteLevel: deleteLevel,
                saveTag: saveTag,
                newTag: newTag,
                deleteTag: deleteTag
            };

        };
        tagsController.$inject = ['$scope', '$attrs', 'xhr'];

        return tagsController;
    });