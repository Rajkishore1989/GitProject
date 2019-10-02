define([
    'angular',
    'underscore',
    'moment',
    'url',
    'jquery',
    'lib/select2'],

function (angular, _, moment, url, $) {
    'use strict';

    var settingsSources = [
        'Blue.Cosacs.Merchandising.ProductTags',
        'Blue.Cosacs.Merchandising.Fascia'
    ];

    return function ($scope, $location, $timeout, pageHelper, helpers, setResourceProvider, productResourceProvider,
                     taggingResourceProvider, user) {
        var editing = false,
            saving = false,
            readonly = !user.hasPermission('SetsEdit');
        $scope.today = moment().format('YYYY-MM-DD');

        $scope.dateFormat = pageHelper.dateFormat;

        pageHelper.getSettings(settingsSources, function (options) {
            $scope.options = options;
            $scope.$apply();
        });

        $timeout(function () {
            // current jqueryui datepicker directive doesnt support setting mindate
            $('#effectiveDate').datepicker('option', 'minDate', new Date());
        }, 0);

        $scope.$watch('vm', function (vm) {
            $scope.listOptions = {
                location: vm.locations
            };
            $scope.uniqueComponents = _.chain(vm.set.components)
                .uniq(function (comp) { 
                    return comp.productId; 
                })
                .sortBy(function(comp){
                    return comp.setProductId;
                })
                .value();

            if (typeof vm.set.id === 'undefined') {
                $scope.vm.set.id = 0;
            }

            initializeTags(vm.set);
            initializePrice(vm.set);
            refreshTitle($scope.vm.set);

            $scope.hierarchy = $scope.vm.set.hierarchy || [];
            $scope.hierarchyOptions = $scope.vm.hierarchyOptions || [];
        });

        function save() {
            if ($scope.rootForm.$invalid) {
                return;
            }

            $scope.saving = true;
            setResourceProvider
                .save($scope.vm.set)
                .then(
                function (response) {
                    $scope.vm.set.id = response.set.id;
                    $scope.vm.set.sku = response.set.sku;

                    refreshTitle($scope.vm.set);
                    $location.path(url.resolve('Merchandising/Set/Detail/' + $scope.vm.set.id));
                    pageHelper.notification.show('Set saved successfully.');
                    $scope.saving = false;
                }, function () {
                    $scope.saving = false;
                });
        }

        function saveProductTags () {
            if ($scope.vm.set.product !== null) {
                taggingResourceProvider.saveProductTags($scope.vm.set.id, $scope.selectedTags);
            }
        }

        function setSaving(value) {
            saving = value;
        }

        function isSaving() {
            return saving;
        }

        function setEditing(value) {
            editing = value;
        }

        function isEditing() {
            return editing;
        }

        function isLocked() {
            return isEditing() || isSaving() || isReadonly();
        }

        function isReadonly() {
            return readonly;
        }

        function canAddComponents() {
            return !isLocked() && !isSaving();
        }

        function canRemoveComponents() {
            return $scope.uniqueComponents.length > 1 && !isLocked() && !isSaving();
        }

        function canAddLocations() {
            return !readonly && $scope.vm.set.id > 0 && $scope.uniqueComponents.length > 0;
        }

        function allComponentsAllLocations() {
            return _.every($scope.vm.set.locations, function (loc) {
                    return _.every($scope.uniqueComponents, function (component) {
                        return _.find($scope.vm.set.components, function (comp) {
                            return comp.productId === component.productId && comp.locationId === loc.locationId && comp.fascia === loc.fascia;
                        });
                    });
             });
        }

        function isValid() {
            var effectiveLocations = _.find($scope.vm.set.locations, function(loc) {
                return new Date(loc.effectiveDate) <= new Date();
            });

            return $scope.uniqueComponents &&
                $scope.uniqueComponents.length > 0 &&
                !isEditing() &&
                $scope.vm.set.locations.length > 0 &&
                effectiveLocations &&
                allComponentsAllLocations();
        }

        function getStatuses() {
            var nonActive = _.findWhere($scope.vm.statuses, { name: "Non Active" });

            if (isValid())
            {
                if (_.where($scope.vm.statuses, { 'id': $scope.vm.set.status }).length < 1) {
                    $scope.vm.set.status = _.findWhere($scope.vm.statuses, { name: "Active New" }).id;
                }

                if ($scope.vm.set.status === nonActive.id) {
                    $scope.vm.set.status = _.findWhere($scope.vm.statuses, { name: "Non Active" }).id;
                }
                return $scope.vm.statuses;
            }
            else {
                if (_.where($scope.vm.statuses, { 'id': $scope.vm.set.status }).length ==1) {
                    var status = _.findWhere($scope.vm.statuses, { 'id': $scope.vm.set.status });
                    $scope.vm.set.status = status.id;
                    return [status];
                }

                $scope.vm.set.status = nonActive.id;
                return [nonActive];
            }
        }

        function addComponent() {
            $scope.setEditing(true);

            var newComponent = {
                productId: null,
                sku: '',
                longDescription: '',
                setProductId: 0,
                quantity: 1
            };

            $scope.uniqueComponents.push(newComponent);
            $scope.setEditing(false);
        }

        function acceptComponent(id, sku, quantity) {
            saving = true;
            $scope.setEditing(true);
            setResourceProvider.addComponent($scope.vm.set.id, id, sku, quantity).then(function (result) {
                $scope.vm = result;
                saving = false;
                $scope.setEditing(false);
            });
        }

        function removeComponent(component) {
            saving = true;
            setResourceProvider.removeComponent($scope.vm.set.id, component.sku).then(function (result) {
                saving = false;
                $scope.uniqueComponents = _.reject($scope.uniqueComponents, function (c) {
                    return c === component;
                });
            });
        }

        function cancelComponent(component) {
            $scope.uniqueComponents = _.reject($scope.uniqueComponents, function (c) {
                return c === component;
            });
        }

        function saveLocation(effectiveDate, fascia, locationId, regularPrice, dutyFreePrice, cashPrice) {

            var result;
            $scope.setEditing(true);
            setResourceProvider.saveLocation($scope.vm.set.id, effectiveDate, fascia, locationId, regularPrice, dutyFreePrice, cashPrice).then(function (result) {
                $scope.vm = result;
                $scope.setEditing(false);
            }, function(err) {
                pageHelper.notification.show(err.message);
                result = err;
                $scope.setEditing(false);
            });
            return result;
        }

        function addLocation(effectiveDate, fascia, locationId) {
            if (isNull(effectiveDate)) {
                pageHelper.notification.show("Effective date must be selected");
                return;
            }
            var found = _.where($scope.vm.set.locations, { effectiveDate: effectiveDate, locationId: parseInt(locationId,10), fascia: fascia });
            if (found.length === 0) {
                $scope.setEditing(true);
                saveLocation(effectiveDate, fascia, locationId, 0, 0, 0);
                $scope.fasciaSelection = null;
                $scope.locationSelection = null;
                $scope.effectiveDate = null;
            }
        }

        function removeLocation(effectiveDate, fascia, locationId) {
            setResourceProvider.removeLocation($scope.vm.set.id, effectiveDate, fascia, locationId).then(function (result) {
                $scope.vm.set.locations = _.reject($scope.vm.set.locations, function (l) {
                    return l.effectiveDate == effectiveDate && l.locationId === locationId && l.fascia === fascia;
                });
            });
        }

        function isNull(thing)
        {
            return thing === null || thing === undefined;
        }

        function initializeTags(set) {
            $scope.selectedTags = set.tags || [];
        }

        function initializePrice(set) {
            if (set.price < 1) {
                set.price = null;
            }
        }

        function refreshTitle(set) {
            pageHelper.setTitle(set.sku ? 'Set ' + set.sku: 'Create Set');
        }

        function components(loc) {

            if (typeof loc === 'undefined' || loc === null) {
                return $scope.uniqueComponents;
            }

            var result = _.chain($scope.vm.set.components)
                            .filter(function (l) { return l.locationId === loc.locationId && l.fascia === loc.fascia; })
                            .groupBy("productId")
                            .map(function (value, key) { return currentPrice(value, loc.effectiveDate); })
                            .value();

            return result;
        }

        function currentPrice(prices, effectiveDate) {
            var maxprice = _.chain(prices)
                    .filter(function (price) {
                        return price.priceEffectiveDate <= effectiveDate;
                    })
                    .max(function (price) { return new Date(price.priceEffectiveDate); })
                    .value();
            return maxprice;
        }

        function validComponentPrices(thisCom) {
            if (thisCom.productId === null && isLocked()) {
                return true;
            }

            return _.all($scope.vm.set.locations, function (loc) {
                return _.filter($scope.vm.set.components, function (comp) {
                    return thisCom.productId === comp.productId &&
                        ((!comp.locationId ||comp.locationId === loc.locationId) &&
                           (!comp.fascia || comp.fascia === loc.fascia)) &&
                        (comp.cashPrice !== null &&
                        comp.regularPrice !== null &&
                        comp.dutyFreePrice !== null);
                }).length > 0;
            });
        }

        function hasComponents() {
            return $scope.uniqueComponents.length > 0;
        }

        function saveHierarchySettings(tag, level) {
            if ($scope.vm.product !== null) {
                $scope.saving = true;
                taggingResourceProvider.saveHierarchySettings($scope.vm.set.id, level, tag).then(function () {
                    pageHelper.notification.show('Set hierarchy successfully updated.');
                    $scope.saving = false;
                }, function () {
                    $scope.saving = false;
                });
            }
        }

        $scope.canAddComponents = canAddComponents;
        $scope.canRemoveComponents = canRemoveComponents;
        $scope.addComponent = addComponent;
        $scope.acceptComponent = acceptComponent;
        $scope.removeComponent = removeComponent;
        $scope.cancelComponent = cancelComponent;
        $scope.addLocation = addLocation;
        $scope.saveLocation = saveLocation;
        $scope.removeLocation = removeLocation;
        $scope.isLocked = isLocked;
        $scope.isReadonly = isReadonly;
        $scope.isEditing = isEditing;
        $scope.setEditing = setEditing;
        $scope.isSaving = isSaving;
        $scope.setSaving = setSaving;
        $scope.components = components;
        $scope.validComponentPrices = validComponentPrices;
        $scope.canAddLocations = canAddLocations;
        $scope.getStatuses = getStatuses;
        $scope.save = save;
        $scope.saveProductTags = saveProductTags;
        $scope.hasComponents = hasComponents;
        $scope.saveHierarchySettings = saveHierarchySettings;

    };
});
