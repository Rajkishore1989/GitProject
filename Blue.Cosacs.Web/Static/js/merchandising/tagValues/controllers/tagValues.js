define([
    'angular',
    'underscore'],
function (angular, _) {
    'use strict';

    return function ($scope, user) {
        $scope.$watch('tagValues', function() {
            // done this way instead of group by as the values must show according to id not alphabetically
            $scope.hierarchies = _.chain($scope.tags).map(function(t) {
                return angular.copy(t.level);
            }).unique(function(h) { return h.id; }).sortBy(function(h) { return h.id; }).value();

            _.each($scope.tags, function(t) {
                var hierarchy = _.chain($scope.hierarchies).filter(function(h) {
                    return h.name === t.level.name;
                }).first().value();

                hierarchy.tags = hierarchy.tags || [];
                hierarchy.tags.push(angular.copy(t));
            });
        });

        function checkAllConditions(tag) {
            var oneSet = _.some(tag.repossessedConditions, function (p) { return p.percentage || p.percentage === 0; });
            var allSet = _.every(tag.repossessedConditions, function (p) { return p.percentage || p.percentage === 0; });

            return allSet === oneSet;
        }

        $scope.checkAllConditions = checkAllConditions;
        $scope.levelFilter = '';
        $scope.tagFilter = '';
        $scope.canEditConditions = user.hasPermission('TagConditionValuesEdit');
        $scope.canEditFyw = user.hasPermission('TagFirstYearWarrantyEdit');
        $scope.readOnly = !$scope.canEditConditions && !$scope.canEditFyw;
    };
});