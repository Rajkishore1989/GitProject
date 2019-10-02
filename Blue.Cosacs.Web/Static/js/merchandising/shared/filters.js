define([
        'angular',
        'merchandising/shared/filters/currency',
        'merchandising/shared/filters/date',
        'merchandising/shared/filters/dateTime',
        'merchandising/shared/filters/joinBy',
        'merchandising/shared/filters/keyFilter',
        'merchandising/shared/filters/linkRefs',
        'merchandising/shared/filters/percentage',
        'merchandising/shared/filters/resolveLink',
        'merchandising/shared/filters/titlecase',     
        'merchandising/shared/filters/chooseFilter'
    ],
    function (angular, currency, date, dateTime, joinBy, keyFilter, linkRefs, percentage, resolveLink, titlecase, chooseFilter) {
        'use strict';

        return angular.module('merchandising.filters', [])
            .filter('pbCurrency', ['pageHelper', currency])
            .filter('pbDate', ['pageHelper', '$filter', date])
            .filter('pbDateTime', ['pageHelper', '$filter', dateTime])
            .filter('pbJoinBy', joinBy)
            .filter('pbKeyFilter', keyFilter)
            .filter('pbLinkRefs', ['$sanitize', 'refLinkConfig', linkRefs])
            .filter('pbPercentage', [percentage])
            .filter('pbTitlecase', titlecase)
            .filter('pbResolveLink', resolveLink)    
            .filter('pbChooseFilter', ['$filter', 'pbCurrencyFilter', 'pbPercentageFilter', chooseFilter]);
    });