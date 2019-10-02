/*global define*/
define(['jquery', 'underscore', 'angular', 'angularShared/app', 'url', 'moment', 'notification', 'jquery.pickList', 'alert', 'lib/select2'],
    function ($, _, angular, app, url, moment, notification, pickList, alert) {
        'use strict';

        return {
            init: function ($el) {

                var supplierCostsCtrl = function ($scope, xhr) {

                    $scope.MasterData = {};
                    $scope.supplierBtnDisable = true;
                    $scope.loaded = false;
                    $scope.numRows = 5;
                    $scope.selectedSupplier = "";

                    var safeApply = function (fn) {
                        var phase = $scope.$root.$$phase;
                        if (phase == '$apply' || phase == '$digest')
                            $scope.$eval(fn);
                        else
                            $scope.$apply(fn);
                    };


                    $scope.loadData = function () {
                        xhr.get(url.resolve('/Service/SupplierCosts/GetSupplierCosts?supplier=') + $scope.supplier)
                            .success(function (data) {
                                $scope.costs = data.costs;
                                $scope.loaded = true;
                                $scope.costMatrix.$pristine = true;
                                $scope.noProductsMessage = data.costs.length === 0;
                            });
                    };

                    $scope.removeSupplierCost = function (i) {
                        $scope.costs.splice(i, 1);
                    };

                    $scope.addRows = function () {
                        for (var i = 0; i < $scope.numRows; i++) {
                            $scope.costs.push({ product: '', month: '', partType: '', partPcent: '', partVal: '', labourPcent: '', labourVal: '', additionalPcent: '', additionalVal: '' });
                        }
                    };

                    $scope.save = function () {
                        xhr.put(url.resolve('/Service/SupplierCosts/Save'), {supplierCosts : { supplier: $scope.supplier, costs: $scope.costs}})
                            .success(function (data) {
                                if (data.Result == 1) {
                                    notification.show("Supplier Contractual Costs saved successfully.", "Changes Saved");
                                } else {
                                    alert(data.Message, "Error Saving Changes");
                                }                              
                            }).error(function() {

                        });
                    };

                    $scope.products = function () {
                        return _.pluck(_.values($scope.costs), "product");
                    };
                    $scope.parts = function () {
                        return _.pluck(_.values($scope.costs), "partType");
                    };

                    //Validation checks on percentages and values entered
                    $scope.checkPcent = function (Pcent) {
                        return !(Pcent > 100 || ( Pcent < 0));
                    };

                    $scope.checkVal = function (Val) {
                        return !(Val > 1000000 || (Val < 0));
                    };

                    $scope.saveEnabled = function () {
                        return !$scope.costMatrix.$pristine && $scope.costMatrix.$valid;
                    };

                    $scope.hasError = function () {
                        return this.$invalid;
                    };

                    pickList.populate('ServiceSupplier', function (data) {
                        safeApply(function () {
                            $scope.MasterData.ServiceSuppliers = _.keys(data);
                        });
                    });

                    pickList.populate('Blue.Cosacs.Service.ServicePartMonth', function (data) {
                        safeApply(function () {
                            $scope.MasterData.ServicePartMonths = _.values(data);
                        });
                    });
                };

                supplierCostsCtrl.$inject = ['$scope', 'xhr'];

                app().controller('supplierCostsCtrl', supplierCostsCtrl);
                return angular.bootstrap($el, ['myApp']);

            }
        };
    });