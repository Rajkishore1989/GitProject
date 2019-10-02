/*global define*/
define([],

function () {
    'use strict';
    return function () {
        this.getSearchUrl = function (fieldName, values) {
            var searchParams = {
                query: '',
                facetFields: {}
            };
            searchParams.facetFields[fieldName] = { Values: values };

            return 'q=' + JSON.stringify(searchParams);
        };
        this.getWarrantyTypes = function () {
            return [{ key: 'F', value: 'Free' },
                    { key: 'E', value: 'Extended' },
                    { key: 'I', value: 'Instant Replacement' }];
        };
    };
});
