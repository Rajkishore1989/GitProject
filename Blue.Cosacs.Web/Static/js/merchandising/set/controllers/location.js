define([
    'angular',
    'underscore',
    'moment'],

function (angular, _, moment) {
    'use strict';

    return function ($scope, pageHelper) {
        var editing = false,
            readonly = $scope.$parent.isReadonly(),
            beforeEditClone;

        function canEdit() {
            return !readonly &&
                !editing &&
                !$scope.$parent.isEditing() &&
                !$scope.$parent.isSaving();
        }

        function canAccept(form) {
            return !readonly && form.$valid && editing && !$scope.$parent.isSaving();
        }

        function canCancel() {
            return !readonly && editing && !$scope.$parent.isSaving();
        }

        function canRemove(effectiveDate) {
            return !readonly && canEdit() && !$scope.$parent.isSaving() && (moment(effectiveDate).isAfter(moment()) || $scope.locationComponents.length === 0);
        }

        function edit() {
            if (!canEdit) {
                return;
            }
            beforeEditClone = angular.copy($scope.location);

            setEditing(true);
        }

        function accept(form) {
            if (!canAccept(form)) {
                return;
            }
            
            var err = $scope.$parent.saveLocation($scope.location.effectiveDate,
                $scope.location.fascia,
                $scope.location.locationId,
                $scope.location.regularPrice,
                $scope.location.dutyFreePrice,
                $scope.location.cashPrice);

            setEditing(false);
        }

        function cancel() {
            if (!canCancel) {
                return;
            }

            $scope.location = beforeEditClone;
            setEditing(false);
        }

        function setEditing(value) {
            editing = value;
            $scope.$parent.setEditing(value);
        }

        function isEditing() {
            return editing;
        }

        function total(column) {
            var totes = 0,
                idx = 0,
                p;

            for (idx; idx < $scope.locationComponents.length; idx += 1) {
                p = $scope.locationComponents[idx];
                totes += p[column] * (_.isNumber(p.quantity) ? p.quantity : 0);
            }
            return totes;
        }

        function totalIncTax(column) {
            var totIncTax = 0,
                idx,
                p;

            for (idx = 0; idx < $scope.locationComponents.length; idx += 1) {
                p = $scope.locationComponents[idx];
                totIncTax += (p[column] * (1 + p.taxRate)) *
                    (_.isNumber(p.quantity) ? p.quantity : 0);
            }
            return totIncTax;
        }

        function avgTax(column) {
            var totes = 0,
                totIncTax = 0,
                idx = 0,
                p;

            for (idx; idx < $scope.locationComponents.length; idx += 1) {
                p = $scope.locationComponents[idx];
                totes += p[column] * (_.isNumber(p.quantity) ? p.quantity : 0);
                totIncTax += (p[column] * (1 + p.taxRate)) *
                    (_.isNumber(p.quantity) ? p.quantity : 0);
            }
            return toFixedDown(((totIncTax - totes) / totes),6);
        }

        function toFixedDown(Number, digits) {
            var re = new RegExp("(\\d+\\.\\d{" + digits + "})(\\d)"),
                m = Number.toString().match(re);
            return m ? parseFloat(m[1]) : Number.valueOf();
        }

        $scope.locationComponents = $scope.$parent.components($scope.location);

        $scope.total = total;
        $scope.canEdit = canEdit;
        $scope.canAccept = canAccept;
        $scope.canCancel = canCancel;
        $scope.canRemove = canRemove;
        $scope.edit = edit;
        $scope.accept = accept;
        $scope.cancel = cancel;
        $scope.isEditing = isEditing;
        $scope.totalIncTax = totalIncTax;
        $scope.avgTax = avgTax;
    };


   
});
