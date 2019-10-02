/*global define*/
define(['underscore', 'lookup'],
    function (_, lookup) {
        'use strict';

        var lookupFun = function ($q) {
            var that = this;

            that.k2v = function (pickListId, ks) {
                var deferred = $q.defer();

                lookup.populate(pickListId, function (data) {
                    deferred.resolve(_.pick(data, ks));
                });

                return deferred.promise;
            };

            that.populate = function (pickListId) {
                var deferred = $q.defer();

                lookup.populate(pickListId, function (data) {
                    deferred.resolve(data);
                });

                return deferred.promise;
            };

            that.wrapList = function (data) {
                return {
                    allowClear: true,
                    data: _.map(data, function (value, key) {
                        return {
                            id: key,
                            text: value
                        };
                    })
                };
            };

            that.getValue = function (key, pickListId) {
                if (!pickListId || !key) {
                    return '';
                }
                var deferred = $q.defer();

                that.populate(pickListId).then(function (data) {
                    var ret = '';

                    if (data) {
                        ret = data[key] || ret;
                    }

                    deferred.resolve(ret);
                });

                return deferred.promise;
            };

            that.getMonths=function(){
                var months = [
                    {k: "01", v: "January"},
                    {k: "02", v: "February"},
                    {k: "03", v: "March"},
                    {k: "04", v: "April"},
                    {k: "05", v: "May"},
                    {k: "06", v: "June"},
                    {k: "07", v: "July"},
                    {k: "08", v: "August"},
                    {k: "09", v: "September"},
                    {k: "10", v: "October"},
                    {k: "11", v: "November"},
                    {k: "12", v: "December"}
                ];

                return months;
            };
        };

        lookupFun.$inject = ['$q'];

        return lookupFun;
    });
