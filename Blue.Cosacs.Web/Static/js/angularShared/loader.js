/*global define*/
define(['jquery'], function ($) {
    'use strict';
    return function ($http) {
        $http.defaults.transformRequest.push(function (data) {
            $('#loader').show();
            return data;
        });
        $http.defaults.transformResponse.push(function (data) {
            $('#loader').hide();
            return data;
        });
        return $http;
    };
});