define(['underscore'],
    function (_) {
        "use strict";

        var getAllPartsPrice = function (partsArray) {
            var tellyPartsArray = _.map(partsArray, function (part) {
                if (part.quantityPerCostPriceDisplayInfo == null || part.quantityPerCostPriceDisplayInfo <= 0)
                    part.quantityPerCostPriceDisplayInfo = (part.quantity || 0) * (part.price || 0);
                return part;
            });

            var allPartsPrice = _.reduce(tellyPartsArray, function(accum, part) {
                return part.quantityPerCostPriceDisplayInfo + accum;
            }, 0);

            return allPartsPrice;
        };

        var getMatrixCharges = function (chargesArray, chargesLabel, chargeType) {
            var chargesSubset = [];

            if (_.isEmpty(chargeType)) {
                chargesSubset = _.filter(chargesArray, function (charge) {
                    return charge.Label === chargesLabel;
                });
            } else {
                chargesSubset = _.filter(chargesArray, function (charge) {
                    return charge.Label === chargesLabel && charge.ChargeType === chargeType;
                });
            }

            var chargesVal = _.reduce(chargesSubset, function(accum, charge) {
                return charge.Value + accum;
            }, 0);

            return chargesVal;
        };

        var getClonedMockObj = function (mock) {
            var clone = {};

            for (var n in mock) {
                if (mock.hasOwnProperty(n)) {
                    if (typeof(mock[n])=="object" && mock[n] != null)
                        clone[n] = getClonedMockObj(mock[n]);
                    else
                        clone[n] = mock[n];
                }
            }
            return clone;
        };

        return {
            getAllPartsPrice: getAllPartsPrice,
            getMatrixCharges: getMatrixCharges,
            getClonedMockObj: getClonedMockObj
        };
    });