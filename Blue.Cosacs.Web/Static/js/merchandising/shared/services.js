define([
        'angular',
        'merchandising/shared/services/pageHelper',
        'merchandising/shared/services/taxHelper',
        'merchandising/shared/services/dateHelper',
        'merchandising/shared/services/reportHelper',
        'merchandising/shared/services/helpers',
        'merchandising/shared/services/apiResourceHelper',
        'merchandising/shared/services/locationResourceProvider',
        'merchandising/shared/services/hierarchyResourceProvider',
        'merchandising/shared/services/productResourceProvider',
        'merchandising/shared/services/purchaseResourceProvider',
        'merchandising/shared/services/taggingResourceProvider',
        'merchandising/shared/services/taxRateResourceProvider',
        'merchandising/shared/services/userResourceProvider',
        'merchandising/shared/services/vendorResourceProvider',
        'merchandising/shared/services/periodProvider',
        'facetsearch/controller',
        'facetsearch/directive'
    ],
    function (angular, pageHelper, taxHelper, dateHelper, reportHelper, helpers, apiResourceHelper, locationResourceProvider, hierarchyResourceProvider,
        productResourceProvider, purchaseResourceProvider, taggingResourceProvider,
        taxRateResourceProvider, userResourceProvider, vendorResourceProvider, periodProvider,
        facetController, facetDirective, localisation) {
        'use strict';
        // https://stackoverflow.com/questions/15666048/service-vs-provider-vs-factory

        return angular.module('merchandising.services', [])
            .service('pageHelper', ['$q', pageHelper])
            .service('dateHelper', dateHelper)
            .service('reportHelper', ['$http', 'pageHelper', reportHelper])
            .service('helpers', helpers)
            .service('taxHelper', ['$http', '$q', 'taxRateResourceProvider', taxHelper])
            .service('apiResourceHelper', ['$q', 'pageHelper', '$resource', 'helpers', apiResourceHelper])
            .service('locationResourceProvider', ['$q', '$resource', 'apiResourceHelper', locationResourceProvider])
            .service('hierarchyResourceProvider', ['$q', '$resource', 'apiResourceHelper', hierarchyResourceProvider])
            .service('productResourceProvider', ['$q', '$resource', 'apiResourceHelper', productResourceProvider])
            .service('purchaseResourceProvider', ['$q', '$resource', 'apiResourceHelper', purchaseResourceProvider])
            .service('taggingResourceProvider', ['$q', '$resource', 'apiResourceHelper', taggingResourceProvider])
            .service('taxRateResourceProvider', ['$q', '$resource', 'apiResourceHelper', taxRateResourceProvider])
            .service('userResourceProvider', ['$q', '$resource', 'apiResourceHelper', userResourceProvider])
            .service('vendorResourceProvider', ['$q', '$resource', 'apiResourceHelper', vendorResourceProvider])
            .service('periodProvider', ['$q', '$resource', 'apiResourceHelper', periodProvider])
            .controller('FacetController', facetController)
            .directive('facetsearch', facetDirective);
    });