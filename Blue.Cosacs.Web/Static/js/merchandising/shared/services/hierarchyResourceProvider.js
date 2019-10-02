define(['angular', 'underscore'],
function(angular, _) {
    "use strict";

    return function($q, $resource, apiResourceHelper) {

        var that = this,
            actions = apiResourceHelper.getDefaultActions(),
            resource = apiResourceHelper.createResource('/Merchandising/Hierarchy/Get', { }, actions);

        apiResourceHelper.createActions(actions);

        that.get = function () {
            return apiResourceHelper.get(resource, { });
        };

        that.getLevels = function () {
            function getLevel(hierarchy, levelName) {
                return _.object(_.map(_.where(hierarchy, { name: levelName })[0].tags, function(tag) {
                    return [tag.name, tag.name];
                }));
            }

            var defer = $q.defer();
            that.get().then(function(hierarchy) {
                defer.resolve({
                    divisions: getLevel(hierarchy, 'Division'),
                    departments: getLevel(hierarchy, 'Department'),
                    classes: getLevel(hierarchy, 'Class')
                });
            }, function(err) { defer.reject(err); });
            return defer.promise;
        };

    };
});