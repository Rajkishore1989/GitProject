define([
    'angular',
    'underscore',
    'url'
],
    function (angular, _, url) {
        'use strict';
    
        var settingsSources = [
            'Blue.Cosacs.Merchandising.Fascia',
            'Blue.Cosacs.Merchandising.StoreType',
            'Blue.Config.ContactType'
        ];

        return function ($scope, $http, $location, pageHelper, user) {

            pageHelper.getSettings(settingsSources, function (options) {
                $scope.options = options;
                $scope.$apply();
            });

            $scope.$watch('location', function (location) {
                location.contacts = location.contacts || [];
                if (location.contacts.length < 1) {
                    $scope.addContact();
                }
            });

            $scope.readOnly = !user.hasPermission("LocationEdit");

            $scope.addContact = function () {
                $scope.location.contacts.push({
                    type: 'Email',
                    value: ''
                });
            };

            $scope.updateContact = function(contact) {
                if (!contact.key || contact.key.length === 0) {
                    contact.value = '';
                }

                if ($scope.vm.supplier.contacts.length > 1) {
                    $scope.removeContact(contact);
                }
            };

            $scope.removeContact = function (contact) {
                $scope.location.contacts = _.reject($scope.location.contacts, function (c) { return c === contact; });
            };

            $scope.save = function() {
                $http.post(url.resolve($scope.routes.save), $scope.location)
                    .success(function(response) {
                        $scope.location.id = response.data.location.id;
                        pageHelper.setTitle('Location ' + response.data.location.locationId);
                        $location.path($scope.routes.route + '/Detail/' + response.data.location.id);
                        pageHelper.notification.show('Location saved successfully.');
                    })
                    .error(function(response) {
                        pageHelper.notification.showPersistent(response.message);
                    });
            };

            $scope.$watch('location.fascia', function (val) {
                $scope.locationForm.fascia.$setValidity('required', !!val);
            });

            $scope.$watch('location.storeType', function (val) {
                $scope.locationForm.storeType.$setValidity('required', !!val);
            });

        };
    });