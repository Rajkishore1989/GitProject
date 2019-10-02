define([
    'angular',
    'underscore',
    'url'
],
function (angular, _, url) {
    'use strict';

    return function ($scope, $filter, pageHelper, goodsCostingResourceProvider) {
        var confirmed = false;
        $scope.saving = false;


        $scope.$watch('goodsCost', function (goodsCost) {
            $scope.vendorsList = _.uniq(_.map(goodsCost.purchaseOrders, function(po) {
                return { vendorId : po.vendorId, vendor : po.vendor };
            }));
        });

        function updateTitle() {
            pageHelper.setTitle('Verify Goods Receipt Costs');
        }

        function canConfirm() {
            return !$scope.saving && !confirmed;
        }

        function generateUrl(link) {
            return url.resolve(link);
        }

        function costNotUpdated(product) {
            return product.lastCostsConfirmedDate > product.landedCostLastUpdated;
        }

        $scope.$watch('goodsCost.approvedById', function (approvedById) {
            $scope.isApproved = approvedById > 0;
        });

        $scope.$watch('goodsCost.confirmed', function (costsConfirmed) {
            confirmed = costsConfirmed;
        });
        
        function confimCost() {
            if (!canConfirm()) {
                return;
            }

            $scope.saving = true;
            goodsCostingResourceProvider.confimCost($scope.goodsCost.id).then(function (result) {
                $scope.saving = false;
                confirmed = true;
                pageHelper.notification.show('Goods receipt costs have been verified.');
            }, function (err) {
                $scope.saving = false;
            });
        }
        
        $scope.canConfirm = canConfirm;
        $scope.confimCost = confimCost;
        $scope.generateUrl = generateUrl;
        $scope.costNotUpdated = costNotUpdated;

        updateTitle();
    };
});
