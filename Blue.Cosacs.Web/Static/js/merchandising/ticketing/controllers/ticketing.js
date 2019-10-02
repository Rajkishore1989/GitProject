define([
        'angular',
        'url'
    ],
    function(angular, url) {
        'use strict';

        return function($scope) {
            $scope.Download = function() {
                var urlToFile = 'Merchandising/Ticketing/Export';
                return url.open(urlToFile);
            };
        };
    });
