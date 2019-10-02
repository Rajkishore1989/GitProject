/*global define*/
define(['angular', 'underscore', 'moment'],
    function (angular, _, moment) {
        'use strict';
        var humanize = function () {
            return function (input) {
                return _.str.humanize(input);
            };
        };

        var titleize = function () {
            return function (input) {
                return _.str.titleize(input);
            };
        };

        var linebreak = function () {
            return function (input) {
                return input.replace(/[\r,]/g, "<br>");
            };
        };

        var isNullFn = function () {
            return function (input, replaceText) {
                if (input) {
                    return input;
                }
                return replaceText;
            };
        };

        var stringList = function () {
            return function (input) {
                return _.isArray(input) ? input.join(',') : 'Unknown';
            };
        };

        var length = function () {
            return function (input) {
                return _.isArray(input) ? input.length : 0;
            };
        };

        var fromNow = function () {
            return function (input) {
                return moment(input).fromNow();
            };
        };

        var fromNowDays = function () {
            return function (input) {
                var now = moment();
                var diff = now.diff(input, 'days');
                var msg = "";

                if (diff === 0) {
                    msg = "today";
                } else {
                    msg = moment(input).fromNow();
                }

                return msg;
            };
        };

        var calendar = function () {
            return function (input) {
                return moment(input).calendar();
            };
        };

        var momentFn = function () {
            return function (dateString, format) {
                if (dateString !== undefined && dateString !== null && dateString !== "") {
                    return moment(dateString).format(format);
                }
            };
        };

        var chargeType = function () {
            return function (charges, chargeTo) {
                return charges[chargeTo] || 0;
            };
        };

        var pad = function () {
            return function (num, size) {
                var s = num + "";
                while (s.length < size) s = "0" + s;
                return s;
            };
        };

        var stringFormat = function () {
            return function (str) {
                if (!arguments.length || arguments.length <= 1)
                    return str;

                var args = typeof arguments[1];
                var indx = ("string" == args || "number" == args) ? 0 : 1;

                args = (("string" == args || "number" == args) ? arguments : arguments[1]);

                for (var arg in args) {
                    if (indx > 0)
                        str = str.replace(new RegExp("\\{" + arg + "\\}", "gi"), args[arg]);

                    indx += 1;
                }

                return str;
            };
        };

        var stringBuilder = function () {
            return function (str, list, start, limit) {
                var retStr = '';

                if (!list.length)
                    return str;

                if (!start)
                    start = 0;

                if (!limit)
                    limit = list.length;

                for (var i = start; i < limit; i++) {
                    retStr += str.replace(new RegExp("\\{0\\}", "gi"), list[i]);
                }

                return retStr;
            };
        };

        return angular.module('cosacs.filters', [])
            .filter('titleize', titleize)
            .filter('humanize', humanize)
            .filter('linebreak', linebreak)
            .filter('isNull', isNullFn)
            .filter('stringList', stringList)
            .filter('length', length)
            .filter('fromNow', fromNow)
            .filter('fromNowDays', fromNowDays)
            .filter('calendar', calendar)
            .filter('moment', momentFn)
            .filter('chargeType', chargeType)
            .filter('pad', pad)
            .filter('stringFormat', stringFormat)
            .filter('stringBuilder', stringBuilder);


    });