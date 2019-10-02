/*global define*/
define(['angular', 'jquery', 'underscore', 'jquery.pickList', 'alert','notification', 'url', 'config/decisionTableAngular', 'localisation', 'modal'],
    function (angular, $, _, pickList, alert,notification, url, decisionTableAngular, localisation) {
        'use strict';
        var paymentCtrl = function ($scope, $http, $rootScope) {
            $scope.MasterData = {};

            var payment;

            decisionTableAngular.load($http, ['SR.DecisionTable.Payment'], function (key, dt) {
                decisionTableAngular.watch($scope, $scope.tablePayment = dt);
            });

            $scope.sections = {
                chequeNumber: { visible: false },
                bank: { visible: false },
                cardType: { visible: false },
                cardNumber: { visible: false },
                bankAccountNumber: { visible: false },
                amountToPay: { visible: false },
                tendered: { visible: false },
                change: { visible: false },
                paymentMethodNotSupported: { visible: true },
                buttonPay: { visible: true }
            };
            $scope.payMethod = "0";

            var clear = function () {
                delete $scope.bankAccountNumber;
                delete $scope.bank;
                delete $scope.chequeNumber;
                delete $scope.cardType;
                delete $scope.cardNumber;
                if (payment && !payment.CustomerId) {
                    // CustomerId might be 0 or null, so deallocate it
                    delete payment.CustomerId;
                }
            };

            $scope.culture = localisation.getSettings();

            $scope.$on('makePayment', function (event, data) {
                $('#payment-modal').modal();
                if (data) {
                    payment = data;
                    $scope.amount = data.Amount ? Number(data.Amount.toFixed(2)) : 0;
                    $scope.balanceTotal = $scope.amount;
                }
            });

            var getUserBranch = function () {
                $http.get(url.resolve('/Admin/Users/GetLoggedInBranch'))
                    .success(function (data, status, headers, config) {
                        $scope.userBranch = data.UserBranch;
                    });
            };

            getUserBranch();

            var populatePickLists = function (list) {
                _.each(list, function (item) {
                    pickList.populate(item.name, function (data) {
                        $scope.MasterData[item.v] = data;
                    });
                });
            };
            var pickLists =
                [
                    { name: 'FPM', v: 'payMethods' },
                    { name: 'Bank', v: 'bank' },
                    { name: 'CCT', v: 'cardType' }
                ];
            populatePickLists(pickLists);

            $scope.rateDisplay = function () {
                if (canDisplayPrices()) {
                    return 'x ' + $scope.rate + ' = ' + $scope.rate * $scope.tendered;
                }
            };

            $scope.calChange = function () {
                if (canDisplayPrices()) {
                    var change = ($scope.amount - getTenderedAmount()) * -1;
                    return change < 0 ? 0 : change;
                }
            };

            var canDisplayPrices = function () {
                var paymentMethodInfo = getSelectedPaymentMethodInfo();
                if (paymentMethodInfo.isForeign) {
                    return $scope.rate && $scope.tendered;
                } else {
                    return true && $scope.tendered;
                }
            };

            var getTenderedAmount = function () {
                var paymentMethodInfo = getSelectedPaymentMethodInfo();
                if (paymentMethodInfo.isForeign) {
                    return $scope.rate * $scope.tendered;
                } else {
                    return $scope.tendered;
                }
            };

            var getSelectedPaymentMethodInfo = function () {
                var payMethod = $scope.payMethod;
                if ($scope.MasterData && $scope.MasterData.payMethods && payMethod) {
                    return { // on WinCosacs, foreign currency is configured with id >= 100
                        isForeign: parseInt(payMethod, 10) >= 100,
                        desc: $scope.MasterData.payMethods[payMethod]
                    };
                } else {
                    return { isForeing: null, desc: null };
                }
            };

            $scope.loadExchangeRate = function () {
                clear();
                if ($scope.payMethod >= 100) { // on WinCosacs, foreign currency is configured with id >= 100
                    $http.get(url.resolve('/Service/Payments/GetExchangeRate?payMethod=') + $scope.payMethod)
                        .success(function (data, status, headers, config) {
                            $scope.rate = data;
                        }).error(function (data, status, headers, config) {
                            alert('Could not load exchange rate.', 'Load Failed');
                        });
                }
                else {
                    $scope.rate = null;
                }
            };

            $scope.checkPay = function () {
                return !$scope.amount || !$scope.payMethod || !$scope.tendered;
            };

            $scope.savePayment = function () {
                var tendered = getTenderedAmount();
                payment.Amount = tendered > $scope.amount ? $scope.amount : tendered;
                payment.PayMethod = $scope.payMethod;
                payment.BankAccountNumber = $scope.bankAccountNumber;
                payment.Bank = $scope.bank;
                payment.ChequeNumber = $scope.chequeNumber;
                payment.Branch =  $scope.userBranch;

                $http.post(url.resolve('/Service/Payments/SavePayment'), payment)
                    .success(function (data, status, headers, config) {
                        notification.show('Payment saved successfully.', 'Save Successful.');
                        $('#payment-modal').modal('hide');
                        $rootScope.$broadcast('updatePaymentBalance',
                            { Amount: tendered > $scope.amount ? $scope.amount : tendered });

                        $rootScope.$broadcast('paymentDone',{
                            "payment": payment.Amount,
                            "tendered": tendered,
                            "payMethod": $scope.MasterData.payMethods[payment.PayMethod],
                            "balanceTotal": $scope.balanceTotal,
                            "change": $scope.calChange()
                        });
                    }).error(function (data, status, headers, config) {
                        alert('Payment could not be saved.', 'Payment Save Failed');
                    });
            };

            $scope.clear = function () {
                $scope.amount = payment.Amount;
                $scope.payMethod = "0";
                delete $scope.tendered;
                clear();
            };

            $scope.cancel = function () {
                $scope.clear();
                $('#payment-modal').modal('hide');
            };
        };
        paymentCtrl.$inject = ['$scope', '$http', '$rootScope'];
        return paymentCtrl;
    });
