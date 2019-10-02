define([
        'angular',
        'underscore',
        'url',
        'moment'
    ],
    function (angular, _, url) {
        'use strict';
        return function ($scope, $timeout, pageHelper, $http) {
            function reset() {
                $scope.results = {bulk: [], validation: []};
                $scope.query = {};
                $scope.query.bulk = true;
            }


            $scope.search = function () {
                $scope.results = {bulk: [], validation: []};
                $http({
                    method: 'GET',
                    url: 'CintError/Search',
                    params: $scope.query
                })
                    .success(function (result) {
                        if ($scope.query.bulk) {
                            $scope.results.bulk = result.data;
                        }
                        else {
                            $scope.results.validation = result.data;
                        }
                    });
            };

            var output = function (result) {
                var file = new Blob([result.export], {
                    type: 'application/csv'
                });
                var fileURL = URL.createObjectURL(file);
                var a = document.createElement('a');
                a.href = fileURL;
                a.target = '_blank';
                a.download = result.filename;
                document.body.appendChild(a);
                a.click();
            };

            $scope.export = function () {
                $http({
                    method: 'GET',
                    url: 'CintError/export',
                    params: $scope.query
                })
                    .success(function (result) {
                        output(result.data);
                    });
            };

            $scope.reset = reset;
            reset();


            $scope.dateFormat = function (date){
                if (!date) {
                    return;
                }
               return moment(date).format("DD MMM YYYY HH:mm");
            };
            $scope.query = {};
        };
    });
