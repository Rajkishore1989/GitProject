/*global define */
define(['underscore', 'angular', 'Config/decisionTable', 'url'], function (_, angular, DecisionTable, url) {
    'use strict';
    return {
        watch:function ($scope, decisionTable) {
            $scope.$watch(function (scope) {
                return angular.toJson(decisionTable.watch(scope));
            }, function () {
                decisionTable.evaluate($scope);
            });
        },
        load: function ($http, names, callback) {
            $http.post(url.resolve('/Config/DecisionTable/Load/'), JSON.stringify({decisionTableTypes:names}))
                .success(function (data) {
                    _.map(data, function (dtData) {
                        var dataObj = JSON.parse(dtData.Value);

                        var newTable = {
                            actions:_.map(dataObj.actions, function (action) {
                                return action.expression;
                            }),
                            conditions:_.map(dataObj.conditions, function (condition) {
                                return condition.expression;
                            }),
                            rules:dataObj.rules,
                            extensions:dataObj.extensions
                        };

                        callback(dtData.Key, new DecisionTable(newTable, dtData.Key));
                    });
                });
        }
    };
});
