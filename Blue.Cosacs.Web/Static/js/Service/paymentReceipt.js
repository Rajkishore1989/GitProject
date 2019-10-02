/*global define*/
define(['angular', 'angularShared/app', 'angular.ui', 'angular.bootstrap'],
    function (angular, app) {
        'use strict';



                var paymentReceiptController = function ($scope, $location) {
                    $scope.data = $location.search();
                };

                paymentReceiptController.$inject = ['$scope', '$location'];

                return paymentReceiptController;
//                app().controller('PaymentReceiptController', paymentReceiptController);
//
//                return angular.bootstrap($el, ['myApp']);

        }    );
