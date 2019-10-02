define(['angular', 'url', 'underscore'],
function (angular, url, _) {
    'use strict';
    return function (user, pageHelper, costsResourceProvider, productResourceProvider, $rootScope) {
        return {
            restrict: 'E',
            scope: {
                costPrice: '=',
                currencies: '=',
                product: '=',
                productType: '=',
                PreviousProductType: '='
            },
            templateUrl: url.resolve('/Static/js/merchandising/product/templates/costControls.html'),
            link: function (scope, element, attrs) {

                scope.canView = user.hasPermission("CostPriceView");
                
                scope.canEdit = user.hasPermission("CostPriceEdit") && scope.productType !== "RepossessedStock";
                scope.localCurrency = pageHelper.localisation.localCurrency;

                scope.canSave = function (form) {
                    return scope.canEdit && form.$valid;
                };
        
                scope.ok = function (form) {
                    debugger
                    if (scope.product.previousProductType == 'RegularStock') {
                        scope.costPrice.averageWeightedCost = form;

                    }

                }
                scope.save = function () {
                    scope.saving = true;
                    scope.costPrice.productId = scope.product.id;
                    
                    if (scope.product.previousProductType =='RegularStock') {
                        scope.costPrice.averageWeightedCost = scope.costPrice.lastLandedCost;
                    
                    }
                   
                
                    return costsResourceProvider
                        .save(scope.costPrice)
                        .then(function (response) {
                            scope.costPrice.id = response.id;
                            pageHelper.notification.show('Cost price saved successfully');
                            productResourceProvider.getProductStatusUpdate(scope.product.id).then(function (result) {
                                scope.product.status = result.status;
                            });

                            $rootScope.$broadcast("productUpdated");
                            scope.saving = false;
                        }, function (response) {
                            pageHelper.notification.show(response.message);
                        });
                };
            }
        };
    };
});