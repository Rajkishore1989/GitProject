/*global define*/
define(['underscore','angular', 'moment', 'angularShared/app', 'notification', 'angularShared/interceptor', 'angularShared/loader',
    'url', 'merchandising/hierarchy/controllers/productHierarchy', 'angular.ui', 'angular.bootstrap'],

    function (_, angular, moment, app, notification, interceptor, loader, url) {
        'use strict';
        return {
            init: function ($el) {
                var branchOpeningHoursController = function ($scope, xhr){
                    $scope.openingHours = [];

                    $scope.save = function(){
                        xhr.post(url.resolve('/admin/BranchOpeningHours'),
                            $scope.openingHours
                        )
                        .success(function (data){
                           notification.show(data.Message);
                        });
                        return false;
                    };
                    xhr.get(url.resolve('/admin/BranchOpeningHours/GetData'))
                        .success(function (data) {
                                $scope.openingHours = data;
                            });
                };
                app().controller('branchOpeningHoursController', ['$scope', 'xhr', branchOpeningHoursController]);

                return angular.bootstrap($el, ['myApp']);
            }
        };
    });