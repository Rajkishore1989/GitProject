/*global define*/
define(['underscore', 'url', 'moment', 'alert', 'notification', 'localisation', 'jquery.pickList', 'angularShared/interceptor'],

function (_, url, moment, alert, notification, localisation) {
    'use strict';

    var technicianPaymentsDisplayController = function ($scope, xhr) {

        var dateFormat = 'Do MMMM YYYY';
        var state = {
            'Deleted': 'D',
            'Held': 'H',
            'Paid': 'P',
            'Available': ''
        };

        var showAlert = function () {
            return alert('Changes have made by another user. No records updated. Please refresh screen.', 'Records not updated.');
        };
        var revState = _.invert(state);
        $scope.holdAll = true;
        $scope.culture = localisation.getSettings();

        $scope.state = state;
        var filterValue;

        var displayPaymentRange = function (dateFrom, dateTo, sr) {
            var returnValue = '';

            if (dateFrom && dateTo) {
                returnValue = moment(dateFrom).format(dateFormat) + " to " + moment(dateTo).format(dateFormat);
            }
            if (dateFrom && !dateTo) {
                returnValue = "Displaying " + moment(dateFrom).format(dateFormat) + " to today";
            }
            if (!dateFrom && dateTo) {
                returnValue = "Displaying all payments to " + moment(dateTo).format(dateFormat);
            }

            if (!dateFrom && !dateTo) {
                if (!sr) {
                    returnValue = "Displaying last 30 days";
                }
            }

            if (sr) {
                returnValue += (returnValue.length > 0 ? ' and ' : 'Displaying ') + ' Service No ' + sr;
            }

            return returnValue;
        };

        var getByDate = function (technician, type, dateFrom, dateTo, sr) {
            dateFrom = dateFrom ? dateFrom.toISOString() : null;
            dateTo = dateTo ? dateTo.toISOString() : null;
            xhr({
                url: url.resolve('/Service/TechnicianPayments/GetPayments'),
                method: "GET",
                params: {
                    TechnicianId: technician,
                    DateFrom: dateFrom,
                    DateTo: dateTo,
                    TypeFilter: type,
                    ServiceRequest: sr
                }
            })
                .success(function (data) {
                $scope.Payments = data;
                $scope.paymentRangeText = displayPaymentRange(dateFrom, dateTo, sr);
                $scope.exportIds = listRequestId($scope.Payments);
            });
        };

        var listRequestId = function (payments) {
            if (payments.length > 0) {
                var ids = _.pluck(payments, 'RequestId').join();
                return ids;
            }
        };

        var pay = function () {
            var payments = _.filter($scope.Payments, function (payment) {
                return payment.selected;
            });
            var ids = _.pluck(payments, 'RequestId');
            if (ids.length > 0) {
                xhr({
                    url: url.resolve('/Service/TechnicianPayments/Pay'),
                    method: "POST",
                    data: {
                        ids: ids
                    }
                }).success(function (data) {
                    if (data) {
                        _.each(payments, function (payment) {
                            payment.State = state.Paid;
                        });
                        notification.show('Selected payments marked as Paid');
                    } else {
                        showAlert();
                    }
                });
            }
        };

        $scope.$on('myPayment.export', function () {
            var urlToFile = 'Service/TechnicianPayments/Export?ids=' + encodeURIComponent($scope.exportIds);

            return url.open(urlToFile);
        });

        $scope.$on('myPayment.print', function (event, data) {
            var urlToFile = 'Service/TechnicianPayments/print?ids=' + encodeURIComponent($scope.exportIds) +
                "&Technician=" + encodeURIComponent(data.technician) +
                "&DateFrom=" + encodeURIComponent(data.dateFrom === undefined ? '' : data.dateFrom.toISOString()) +
                "&DateTo=" + encodeURIComponent(data.dateTo === undefined ? '' : data.dateTo.toISOString()) +
                "&TypeFilter=" + encodeURIComponent(data.type) +
                "&ServiceRequest=" + encodeURIComponent(data.sr) +
                "&TechnicianId=" + encodeURIComponent(data.technicianId);

            return url.open(urlToFile);
        });

        $scope.$on('myPayment.search', function (event, data) {
            getByDate(data.technician, data.type, data.dateFrom, data.dateTo, data.sr);
            filterValue = data.type === "" ? null : data.type;
        });

        $scope.$on('myPayment.clear', function (event, data){
            $scope.Payments = null;
            $scope.paymentRangeText = null;
            $scope.exportIds = null;
        });

        $scope.$on('myPayment.pay', function () {
            pay();
        });

        $scope.retTotCost = function () {
            if ($scope.Payments && $scope.Payments.length > 0) {
                return _.reduce(_.pluck($scope.Payments, 'Total'), function (memo, payment) {
                    return memo + payment;
                });
            }
        };

        $scope.remove = function (id, pState) {
            if (!pState) {
                xhr.get(url.resolve('/Service/TechnicianPayments/RemovePayment/') + id)
                    .success(function (data) {
                    if (data) {
                        var payment = _.find($scope.Payments, function (payment) {
                            return payment.RequestId === id;
                        });
                        payment.State = state.Deleted;
                        notification.show('Selected payment marked as Deleted');
                    } else {
                        showAlert();
                    }
                });
            }
        };

        $scope.hold = function (id, pState) {
            if (!pState || pState === state.Held) {
                xhr.get(url.resolve('/Service/TechnicianPayments/HoldPayment/') + id + '?hold=' + !pState)
                    .success(function (data) {
                    if (data) {
                        var payment = _.find($scope.Payments, function (payment) {
                            return payment.RequestId === id;
                        });
                        payment.State = pState ? state.Available : state.Held;
                        if (!payment.State) {
                            notification.show('Selected payments removed from Hold');
                        } else {
                            notification.show('Selected payments marked as Held');
                        }
                    } else {
                        showAlert();
                    }
                });
            }
        };

        $scope.allSelected = function () {
            _.each($scope.Payments, function (payment) {
                if (!payment.State) {
                    payment.selected = $scope.selectAll;
                }
            });
        };

        $scope.setHold = function () {
            var changeList = [];
            _.each($scope.Payments, function (payment) {
                if (payment.State === state.Held || !payment.State) {
                    payment.State = $scope.holdAll ? 'H' : null;
                    changeList.push(payment.RequestId);
                }
            });
            $scope.holdAll = !$scope.holdAll;
            if (changeList.length > 0) {
                xhr({
                    url: url.resolve('/Service/TechnicianPayments/HoldAll'),
                    method: "POST",
                    data: {
                        Ids: changeList,
                        hold: !$scope.holdAll
                    }
                }).success(function (data) {
                    if (!data) {
                        showAlert();
                    } else {
                        if ($scope.holdAll) {
                            notification.show('All payments removed from Hold');
                        } else {
                            notification.show('All payments marked as Held');
                        }
                    }
                });
            }
        };

        $scope.clickState = function (button, pState) {
            var icon = (pState === state.Deleted && pState !== state.Held) || pState === state.Paid ? 'disabled ' : 'click ';
            icon = icon + (pState === state.Held ? 'lock' : 'unlock');
            return icon;
        };

        $scope.stateText = function (pState) {
            return revState[pState] ? revState[pState] : 'Pending';
        };

        $scope.goRequest = function (id) {
            return url.resolve('Service/Requests/') + id;
        };

        if ($scope.User) {
            getByDate($scope.User, null, $scope.dateFrom);
        }
    };

    technicianPaymentsDisplayController.$inject = ['$scope', 'xhr'];
    return technicianPaymentsDisplayController;
});