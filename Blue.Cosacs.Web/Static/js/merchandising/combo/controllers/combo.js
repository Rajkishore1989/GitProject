define([
        'angular',
        'underscore',
        'moment',
        'url',
        'jquery',
        'lib/select2'
    ],
    function(angular, _, moment, url, $) {
        'use strict';

        var settingsSources = [
            'Blue.Cosacs.Merchandising.ProductTags',
            'Blue.Cosacs.Merchandising.Fascia'
        ];

        return function($scope, $location, $timeout, pageHelper,user, helpers, comboResourceProvider, productResourceProvider, taggingResourceProvider) {
            var editing = false,
                saving = false,
                readonly = !user.hasPermission("ComboEdit");

            $scope.today = moment().format('YYYY-MM-DD');
            $scope.dateFormat = pageHelper.dateFormat;

            //$timeout(function () {
            //    // current jqueryui datepicker directive doesnt support setting mindate
            //    $('#startDate').datepicker('option', 'minDate', new Date());
            //    $('#endDate').datepicker('option', 'minDate', new Date());
            //}, 0);

            //$scope.updateValidEndDate = function (startDate) {
            //    $timeout(function () {
            //        $('#endDate').datepicker('option', 'minDate', new Date(startDate));
            //    }, 0);
            //};

            pageHelper.getSettings(settingsSources, function (options) {
                $scope.options = options;
                $scope.$apply();
            });

           
            //function validateDates() {
            //    var startBeforeOrOnEnd = $scope.vm.combo.startDate <= $scope.vm.combo.endDate;
            //    $scope.rootForm.startDate.$setValidity('range', startBeforeOrOnEnd);
            //    $scope.rootForm.endDate.$setValidity('range', startBeforeOrOnEnd);
            //}
            function hasStarted() {
                return $scope.vm.combo.sku && new Date($scope.vm.combo.startDate) <= new Date();
            }

            function initCombo() {
                
              //Change for ZEN/UNC/CRF/CR2018-011 Pricing Promotion - Happy Hour
              
                $scope.vm.combo.startTime = moment($scope.vm.combo.startDate) ? moment($scope.vm.combo.startDate).format('HH:mm') : null;
                $scope.vm.combo.endTime = moment($scope.vm.combo.endDate) ? moment($scope.vm.combo.endDate).format('HH:mm') : null;

                $scope.vm.combo.startDate = moment($scope.vm.combo.startDate).format('YYYY-MM-DD');
                $scope.vm.combo.endDate = moment($scope.vm.combo.endDate).format('YYYY-MM-DD');

                

                if ($scope.vm.combo.startTime != null && $scope.vm.combo.endTime != null) {
                    $("#chkhideshow").prop("checked", true);

                    $('#hasallow').show();

                }

               
            }

            $scope.$watch('vm', function(vm) {
                initCombo();
                initializeTags(vm.combo);
               
                //Strip time from dates
                //if ($scope.vm.combo.startDate) {
                //    $scope.vm.combo.startDate = pageHelper.localDate($scope.vm.combo.startDate);
                //}
                //
                //if ($scope.vm.combo.endDate) {
                //    $scope.vm.combo.endDate = pageHelper.localDate($scope.vm.combo.endDate);
                //}


                $scope.uniqueComponents = _.uniq(vm.combo.components, function(comp) { return comp.productId; });
                if (typeof vm.combo.id === 'undefined') {
                    $scope.vm.combo.id = 0;
                }

                $scope.listOptions = {
                    location: vm.locations
                };

                $scope.hierarchy = $scope.vm.combo.hierarchy || [];
                $scope.hierarchyOptions = $scope.vm.hierarchyOptions || [];
                //$scope.$watch('vm.combo.startDate', function() {
                //    validateDates();
                //});

                //$scope.$watch('vm.combo.endDate', function() {
                //    validateDates();
                //});
            });

            function save() {

                
                if ($scope.rootForm.$invalid) {
                    return;
                }

                 //Change for ZEN/UNC/CRF/CR2018-011 Pricing Promotion - Happy Hour
                var StartTimecom = moment($scope.vm.combo.startDate).format('YYYY-MM-DD') + 'T' + $scope.vm.combo.startTime;
                var combinedStartTime = new Date(StartTimecom);
                var EndTimecom = moment($scope.vm.combo.endDate).format('YYYY-MM-DD') + 'T' + $scope.vm.combo.endTime;
                var combinedEndTime = new Date(EndTimecom);

                
                $scope.vm.combo.startDate = combinedStartTime;
                $scope.vm.combo.endDate = combinedEndTime
                //$scope.saving = true;
                
                comboResourceProvider
                    .save($scope.vm.combo)
                    .then(
                        function(response) {
                            $scope.vm.combo = response.combo;
                            initCombo();
                            refreshTitle($scope.vm.combo);
                            $location.path(url.resolve('Merchandising/Combo/Detail/' + $scope.vm.combo.id));
                            pageHelper.notification.show('Combo saved successfully.');
                            $scope.saving = false;
                    },
                    function () {
                            $scope.saving = false;
                        });
            }

            function saveProductTags() {
                if ($scope.vm.combo.product !== null) {
                    taggingResourceProvider.saveProductTags($scope.vm.combo.id, $scope.selectedTags);
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
                return !readonly && $scope.vm.combo.id > 0 && $scope.uniqueComponents.length > 0;
            }

            function getStatuses() {
                var nonActive = _.findWhere($scope.vm.statuses, { name: "Non Active" });
                if ($scope.uniqueComponents && $scope.uniqueComponents.length > 0 && $scope.vm.combo.comboPrices.length > 0 && !isEditing() && new Date($scope.vm.combo.startDate) <= new Date()) {
                    if (_.where($scope.vm.statuses, { 'id': $scope.vm.combo.status }).length < 1 || $scope.vm.combo.status === nonActive.id) {
                        $scope.vm.combo.status = _.findWhere($scope.vm.statuses, { name: "Active New" }).id;
                    }
                    return $scope.vm.statuses;
                }
                else {
                    $scope.vm.combo.status = nonActive.id;
                    return [nonActive];
                }
            }

            function addComponent() {
                $scope.setEditing(true);

                var newComponent = {
                    productId: null,
                    sku: '',
                    longDescription: '',
                    quantity: 1
                };

                $scope.uniqueComponents.push(newComponent);
                $scope.setEditing(false);
            }

            function acceptComponent(comboProductId, id, quantity) {
                saving = true;
                $scope.setEditing(true);

                comboResourceProvider.addComponent($scope.vm.combo.id, comboProductId, id, quantity).then(function (result) {
                    $scope.vm = result;
                    saving = false;
                    $scope.setEditing(false);
                });
            }

            function removeComponent(component) {
                saving = true;
                comboResourceProvider.removeComponent($scope.vm.combo.id, component.sku).then(function(result) {
                    $scope.vm = result;
                    saving = false;
                });
            }

            function cancelComponent(component) {
                $scope.uniqueComponents = _.reject($scope.uniqueComponents, function (c) {
                    return c === component;
                });
            }

            function saveLocation(fascia, locationId, locationPrices) {
                $scope.setEditing(true);

                comboResourceProvider.saveLocation($scope.vm.combo.id, fascia, locationId, locationPrices).then(function (result) {
                    $scope.vm = result;
                    $scope.setEditing(false);
                }, function(err) {
                    pageHelper.notification.show(err.message);
                    $scope.setEditing(false);
                });
            }

            function addLocation(fascia, locationId) {
                var found = _.where($scope.vm.combo.locations, { locationId: parseInt(locationId, 10) });
                if (found.length === 0) {
                    $scope.setEditing(true);
                    saveLocation(fascia, locationId, {});
                    $scope.fasciaSelection = null;
                    $scope.locationSelection = null;
                }
            }

            function removeLocation(fascia, locationId) {
                comboResourceProvider.removeLocation($scope.vm.combo.id, fascia, locationId).then(function(result) {
                    $scope.vm.combo.comboPrices = _.reject($scope.vm.combo.comboPrices, function(l) {
                        return l.locationId === locationId && l.fascia === fascia;
                    });
                });
            }

            function initializeTags(set) {
                $scope.selectedTags = set.tags || [];
            }

            function refreshTitle(combo) {
                pageHelper.setTitle(combo.sku ? 'Combo #' + combo.sku : 'Create Combo');
            }

            function validComponentPrices(thisCom) {
                if (thisCom.productId === null && isLocked())
                    return true;
                    return _.all($scope.vm.combo.comboPrices, function (loc) {
                        return _.filter($scope.vm.combo.components, function (comp) {
                            return thisCom.productId === comp.productId &&
                                (comp.locationId === loc.locationId || comp.locationId === null) &&
                                (comp.fascia === loc.fascia || comp.fascia === null) &&
                                (comp.cashPrice !== null &&
                                comp.regularPrice !== null &&
                                comp.dutyFreePrice !== null);
                        }).length > 0;
                    });
            }

            function components(loc) {

                if (typeof loc === 'undefined' || loc === null) {
                    return $scope.uniqueComponents;
                }

                var result = _.filter($scope.vm.combo.components, function (comp) {
                    return (comp.locationId === loc.locationId && comp.fascia === loc.fascia);
                });

                return result;
            }

            function hasComponents() {
                return $scope.uniqueComponents.length > 0;
            }

            function saveHierarchySettings(tag, level) {
                if ($scope.vm.product !== null) {
                    $scope.saving = true;
                    taggingResourceProvider.saveHierarchySettings($scope.vm.combo.id, level, tag)
                        .then(function () {
                        pageHelper.notification.show('Combo hierarchy successfully updated.');
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
            $scope.hasStarted = hasStarted;
            $scope.saveProductTags = saveProductTags;
            $scope.save = save;
            $scope.getStatuses = getStatuses;
            $scope.hasComponents = hasComponents;
            $scope.saveHierarchySettings = saveHierarchySettings;

        };
    });