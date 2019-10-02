/*global define*/
define(['jquery', 'underscore', 'jquery.pickList'], function ($, _, pickList) {
    "use strict";

    return {
        init: function () {
            $(".createdBy").each(function () {
                var _this = $(this),
                    key = _this.text().trim();
                if (key) {
                    pickList.k2v('EMPEENO', key, function (rows) {
                        _this.text(key + " - " + rows[key]);
                    });
                }
            });
            $(".branchNo").each(function () {
                var _this = $(this),
                    key = _this.text().trim();
                if (key) {
                    pickList.k2v('BRANCH', key, function (rows) {
                        _this.text(rows[key]);
                    });
                }
            });
        }
    };
});
