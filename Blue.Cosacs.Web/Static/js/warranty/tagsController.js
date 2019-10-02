/*global define*/
define(['angular', 'jquery', 'underscore', 'url', 'pjax', 'alert', 'notification'],
function (angular, $, _, url, pjax, alert, notification) {
    'use strict';

    var getWarrantyData = function (data) {
        var warrantyData = data;

        warrantyData.Levels = _.sortBy(warrantyData.Levels, function (level) {
            return level.Id;
        });

        warrantyData.Tags = _.sortBy(warrantyData.Tags, function (tag) {
            return tag.Level.Id;
        });

        _.each(warrantyData.Levels, function (level) {
            var tags = _.filter(warrantyData.Tags, function (tag) {
                return tag.Level.Id === level.Id;
            });
            level.Tags = tags;
        });

        return warrantyData;
    };

    var tagsController = function ($scope, $attrs, xhr) {

        $scope.warrantyData = getWarrantyData(JSON.parse($attrs.warrantyData || '{ "Levels": [], "Tags": [] }'));

        $scope.modalOptions = {
            backdropFade: true,
            dialogFade: true
        };

        var saveLevel = function (level) {
            xhr({
                method: 'PUT',
                url: url.resolve('/Warranty/Levels/' + level.Id),
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
                url: url.resolve('/Warranty/Levels/'),
                data: {
                    Name: newLevelName
                }
            }).success(function (data) {
                scope.warrantyData.Levels.push({
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
                url: url.resolve('/Warranty/Levels/' + level.Id)
            }).success(function () {
                scope.warrantyData.Levels = _.reject(scope.warrantyData.Levels, function (item) {
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
                url: url.resolve('/Warranty/Tags/' + tag.Id),
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

        var saveTag = function (tag, level) {

            // 'Unassigned' tag being given a name.
            // Need to create a new tag, and reassign the 'Unassgigned' warranties to the new tag.
            if (tag.Id === 0) {
                newTag(tag.editedName, level, function (data) {
                    assignWarrantyTag(level.Id, data.Tag.Id);
                });
            } else {
                saveEditedTag(tag, level);
            }
        };

        var newTag = function (newTagName, level, successCallback) {
            xhr({
                method: 'POST',
                url: url.resolve('/Warranty/Tags/'),
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
                        WarrantyCount: 0,
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

        var deleteTag = function (tag, level) {
            xhr({
                method: 'DELETE',
                url: url.resolve('/Warranty/Tags/' + tag.Id)
            }).success(function (data) {
                if (data.Success) {
                    $scope.warrantyData = getWarrantyData(data.HierarchyData);
                    notification.show('Tag ' + tag.Name + ' under Level ' + level.Name + ' deleted');
                }
                else {
                    alert(data.Error, 'Error');
                }
            }).error(function (data, status) {
                if (status === 400) {
                    alert('There was an error trying to delete the Tag', 'Error');
                }
            });
        };

        var changeWarrantyTag = function (sourceTagId, destinationTagId) {
            xhr({
                method: 'POST',
                url: url.resolve('/Warranty/WarrantyAPI/ChangeWarrantyTag'),
                data: {
                    sourceTagId: sourceTagId,
                    destinationTagId: destinationTagId
                }
            }).success(function (data) {
                if (data.Success) {
                    $scope.warrantyData = getWarrantyData(data.HierarchyData);
                    $scope.$broadcast('warranties:move:success');
                } else {
                    $scope.$broadcast('warranties:move:fail', data);
                }
            }).error(function (data) {
                $scope.$broadcast('warranties:move:fail', data);
            });
        };

        var assignWarrantyTag = function (levelId, tagId) {
            xhr({
                method: 'POST',
                url: url.resolve('/Warranty/WarrantyAPI/AssignWarrantyTag'),
                data: {
                    levelId: levelId,
                    tagId: tagId
                }
            }).success(function (data) {
                if (data.Success) {
                    $scope.warrantyData = getWarrantyData(data.HierarchyData);
                    $scope.$broadcast('warranties:move:success');
                } else {
                    $scope.$broadcast('warranties:move:fail', data);
                }
            }).error(function (data) {
                $scope.$broadcast('warranties:move:fail', data);
            });
        };

        var moveWarranties = function (sourceTag, destinationTag) {

            if (sourceTag.Id === 0) {
                assignWarrantyTag(sourceTag.Level.Id, destinationTag.Id);
            } else {
                changeWarrantyTag(sourceTag.Id, destinationTag.Id);
            }

        };

        return {
            saveLevel: saveLevel,
            newLevel: newLevel,
            deleteLevel: deleteLevel,
            saveTag: saveTag,
            newTag: newTag,
            deleteTag: deleteTag,
            moveWarranties: moveWarranties
        };

    };

    tagsController.$inject = ['$scope', '$attrs', 'xhr'];

    return tagsController;
});