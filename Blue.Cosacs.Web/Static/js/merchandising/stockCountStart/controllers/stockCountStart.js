define([
    'angular',
    'underscore',
    'url'],

function (angular, _, url) {
    'use strict';

    return function ($scope, pageHelper, stockCountRepo, $http) {
        $scope.saving = false;
        $scope.saved = false;
        
        function canSave(form) {
            return !$scope.saved && !$scope.saving && form.$valid;
        }

        function getTag(tag) {
            return tag || 'Any';
        }

        function generateUrl (link) {
            return url.resolve(link);
        }

        function save(form) {
            if (!canSave(form)) {
                return;
            }

            $scope.saving = true;

            stockCountRepo.start($scope.countStart.stockCountId)
                .then(function() {
                    $scope.saving = false;
                    $scope.saved = true;
                    window.location.replace('/Cosacs/Merchandising/StockCount/Detail/' + $scope.countStart.stockCountId);
                }, function(err) {
                    $scope.saving = false;
                    if (err && err.message) {
                        pageHelper.notification.showPersistent(err.message);
                    }
                });
        }

        $scope.load = function(id) {
            $http.get('/Cosacs/Merchandising/StockCountStart/' + id)
                .then(function(result) {
                    $scope.countStart = result.data.data;
                });
        };

        $scope.canSave = canSave;
        $scope.save = save;
        $scope.getTag = getTag;
        $scope.generateUrl = generateUrl;
    };
});
