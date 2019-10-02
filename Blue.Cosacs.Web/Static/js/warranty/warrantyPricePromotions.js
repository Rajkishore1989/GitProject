/*global define, console */
define(['moment', 'underscore', 'angular', 'angularShared/app', 'url', 'angular.ui', 'angular.bootstrap', 'lib/select2', 'jquery.ui'],

function (moment, _, angular, app, url) {
    'use strict';

    return {
        init: function ($el) {
            var warrantyPricePromotionsController = function($scope, xhr, $location) {
                $scope.AllowEdit = false;
                $scope.filterPromotions = $location.search();
                $scope.moment = moment;

                xhr({
                    method: 'POST',
                    url: url.resolve('Warranty/WarrantyPromotions/GetPromotionsForWarrantyPrice'),
                    data: $scope.filterPromotions
                }).success(function (data) {
                    if (data) {
                        $scope.promotions = $scope.populateExistingPromotions(data);
                    }
                })
                .error(function (error, text) {
                    console.log('error creating return percentage ' + error + ' ' + text);
                });

                $scope.populateExistingPromotions = function (allPromotions) {

                    _.each(allPromotions, function (singlePromotion) {
                        singlePromotion.Filters = [];

                        if (singlePromotion.PercentageDiscount > 0) {
                            singlePromotion.IsPercentage = true;
                            singlePromotion.PromotionAmount = singlePromotion.PercentageDiscount;
                        } else if (singlePromotion.RetailPrice > 0) {
                            singlePromotion.IsPercentage = false;
                            singlePromotion.PromotionAmount = singlePromotion.RetailPrice;
                        }

                        singlePromotion.startDate = moment(singlePromotion.StartDate).toDate();
                        singlePromotion.endDate = moment(singlePromotion.EndDate).toDate();
                        singlePromotion.StartDate = singlePromotion.startDate.toISOString();
                        singlePromotion.EndDate = singlePromotion.endDate.toISOString();

                        singlePromotion.Filters.push({
                            name: 'Store Type',
                            value: singlePromotion.BranchType || 'All'
                        });

                        singlePromotion.Filters.push({
                            name: 'Store Location',
                            value: singlePromotion.BranchNumber !== null && singlePromotion.BranchName !== null ?
                                singlePromotion.BranchNumber + ' - ' + singlePromotion.BranchName : 'All'
                        });

                        if (singlePromotion.WarrantyNumber) {
                            singlePromotion.Filters.push({
                                name: 'Warranty',
                                value: singlePromotion.WarrantyNumber,
                                WarrantyId: singlePromotion.WarrantyId,
                                wurl: url.resolve('/Warranty/Warranties/') + singlePromotion.WarrantyId
                            });
                        }
                    });

                    return allPromotions;
                };
            };

            warrantyPricePromotionsController.$inject = ['$scope', 'xhr', '$location'];

            app().controller('WarrantyPricePromotionsController', warrantyPricePromotionsController);

            return angular.bootstrap($el, ['myApp']);

        }
    };
});
