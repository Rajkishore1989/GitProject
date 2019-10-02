/* global define */
define(['jquery', 'underscore', 'jquery.pickList'], function ($, _, pickList) {
    "use strict";

    return {
        init: function () {

            $(".branchNo").each(function () {
                var _this = $(this);
                var key = _this.text().trim();
                if (key) {
                    pickList.k2v('BRANCH', key, function (rows) {
                        _this.text(rows[key]);
                    });
                }
            });
            $(".pickedBy,.checkedBy").each(function () {
                var _this = $(this);
                var key = _this.text().trim();
                if (key) {
                    pickList.k2v('EMPEENO', key, function (rows) {
                        _this.text(key + " - " + rows[key]);
                    });
                }
            });
        }
    };
});
