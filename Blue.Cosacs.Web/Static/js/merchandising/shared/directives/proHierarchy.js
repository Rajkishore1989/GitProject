define(['angular', 'url', 'underscore'],
function (angular, url, _) {
    'use strict';
    return function(hierarchyRepo) {
        return {
            restrict: 'E',
            scope: {
                ngModel: '=',
                readonly: '&',
                valueProperty: '@',
                placeholder: '@',
                name: '@',
                horizontal: '='
            },
            templateUrl: url.resolve('/Static/js/merchandising/shared/templates/pro-hierarchy.html'),
            link: function (scope) {

                function transformTags(options) {
                    scope.valueProperty = scope.valueProperty || 'id';
                    // adapt data to diego's list control {k:v..kn:vn}
                    _.each(options, function (level) {
                        level.tags = _.object(_.map(level.tags, function (tag) {
                            return [tag[scope.valueProperty], tag.name];
                        }));
                        return level;
                    });
                }

                hierarchyRepo.get().then(function (options) {
                    transformTags(options);
                    scope.options = options;
                });

                scope.$watch('ngModel', function(ngModel) {
                    var model = {};
                    _.each(ngModel, function(v, k) {
                        if (v) {
                            model[k] = v;
                        }
                    });
                    scope.ngModel = model;
                }, true);
            }
        };
    };
});