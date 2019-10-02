define(['angular', 'angularShared/app', 'url', 'underscore', 'notification'],
function (angular, app, url, _, notification) {
    'use strict';
    return {
        init: function ($el) {
            
			var linkCtrl = function ($scope, $q, $timeout, xhr) {
                function getDataFromServer() {
                    var output= [],
                        deferred = $q.defer();

                    try {
                        output = { 0:'one', 1:'two', 2:'three'};
                        // asynchronous function, which calls
                        deferred.resolve(output);
                    } catch (e) {
                        deferred.reject(e);
                    }

                    return deferred.promise;
                }

                var getTechnicians = function() {
                    // the $http API is based on the deferred/promise APIs exposed by the $q service
                    // so it returns a promise for us by default
                    return xhr.get(url.resolve('/Service/TechnicianDiaries/GetTechnicians'))
                        .then(function(response) {
                            if (typeof response.data === 'object') {
                                var array = {};
                                _.each(response.data, function(singleVal) {
                                    array[singleVal.Id] = singleVal.Name;
                                });
                                return array;
                            }
                        });
                };

                $scope.selected = '0';
                $scope.$on('list.keychanged', function(event, data) {
                    notification.show('value selected: ' + data.value);
                });
                $scope.mylist = { 0:'oneygfiusgf sufy soufyg souyfgsoufgousdyfgsdu shbvd soaud osuad osau gdoyfgosuf gsoadufsoduf soduf sodufg s', 1:'two', 2:'three', 3:'four', 4:'five', 5:'six', 6:'seven', 7:'eight'};

                $scope.selected2 = null;
                $scope.mylist2 = [{ k: '0', v: 'one' }, { k: '1', v: 'two' }, { k: '2', v: 'three' }];

                $scope.selected3 = '0';
                $scope.mylist3 = function () {
                    return {0:'one', 1:'two', 2:'three'};
                };

                $scope.selected4 = 'two';
                $scope.mylist4 = function () {
                    return ['one', 'two', 'three'];
                };

                $scope.selected5 = '2';
                $scope.mylist5 = getDataFromServer();

                $scope.selected6 = '0';
                $scope.mylist6 = {0:'one', 1:'two', 2:'three'};

                var changValue = function() {
                    var num = Math.floor(Math.random() * (2 - 0 + 1)) + 1;
                    $scope.selected6 = num.toString();
                    $timeout(changValue, 5000);
                };

                //$timeout(changValue, 1000);

                $scope.selected7 = '0';
                $scope.mylist7 = function() {
                    return getDataFromServer();
                };

                $scope.selected8 = '98';

                $scope.selected9 = null;

                $scope.selected10 = null;
                $scope.disabled10 = true;

                $scope.selected11 = null;
                $scope.mylist11 = getTechnicians();
            };

            linkCtrl.$inject = ['$scope', '$q', '$timeout', 'xhr'];

            app().controller('ListTestCtrl', linkCtrl);
            return angular.bootstrap($el, ['myApp']);
        }
    };
});
