define([
    'angular',
    'underscore',
    'url'
],
function (angular, _, url) {
    'use strict';

    return function($scope, $timeout, pageHelper, promotionRepo, locationResourceProvider, reportHelper) {
        $scope.dateFormat = pageHelper.dateFormat;
        $scope.vm = {
            hasData: false,
            query: {},
            columns: [],
            gridTemplate: url.resolve('/static/js/merchandising/reports/promotionReport/templates/promoReportGrid.html')
        };

        function configureDatePicker() {
            $timeout(function () {
                $('.date').datepicker('option', 'maxDate', new Date());
            }, 0);
        }

        function addPromotion(promoId) {
            $scope.vm.query.promotions = $scope.vm.query.promotions || [];
            $scope.vm.query.promotionIds = $scope.vm.query.promotionIds || [];

            var promo =_.find($scope.vm.promotions, function(item) {
                return item.id === promoId;
            });

            $scope.vm.query.promotions.push(promo.name);
            $scope.vm.query.promotionIds.push(promoId);
        }

       function removePromotion(promoId) {
           $scope.vm.query.promotionIds = _.without($scope.vm.query.promotionIds, promoId);

           var promo = _.find($scope.vm.promotions, function (item) {
               return item.id === promoId;
           });
           $scope.vm.query.promotions = _.without($scope.vm.query.promotions, promo.name);
        }

        function resetPromotionIds() {
            $scope.vm.query.promotionIds = [];
            $scope.vm.selectedPromotions = [];
            $scope.vm.query.promotions = [];
        }

        function updateColumns() {
            if ($scope.vm.columns.length === 0) {
                _.each(['Location', 'Sku', 'Item Description', 'Quantity Sold', 'AWC', 'Promotion', 'Promotional Cash Price', 'Total Promo Cash Value', 'Promotional Margin', 'Total Promo Margin Value', 'Cash Price', 'Cash Margin'], function (col) {
                    $scope.vm.columns.push({ name: col, selected: true });
                });
            }
        }

        function print() {
            reportHelper.getPrint("PromotionReport", $scope.vm.query, $scope.vm.columns);
        }

        function getExport() {
            reportHelper.getExport("PromotionReport", $scope.vm.query);
        }

        function initializePageData() {
            pageHelper.setTitle('Promotions Report');

            locationResourceProvider.getList(false).then(function (locations) {
                $scope.vm.locations = locations;
            });

            pageHelper.getSettings(['Blue.Cosacs.Merchandising.Fascia'], function (options) {
                $scope.vm.fascias = options.fascia;
            });

            promotionRepo.getNames().then(function (names) {
                $scope.vm.promotions = names;
            });

            configureDatePicker();
        }


        $scope.updateColumns = updateColumns;
        $scope.resolve = url.resolve;
        $scope.search = promotionRepo.search;
        $scope.print = print;
        $scope.getExport = getExport;
        $scope.resetPromotionIds = resetPromotionIds;
        $scope.removePromotion = removePromotion;
        $scope.addPromotion = addPromotion;

        initializePageData();
    };
});
