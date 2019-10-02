define([
        'angular',
        'merchandising/shared/services/dateHelper',
        'merchandising/shared/directives/createGoodsReceipt',
        'merchandising/shared/directives/currency',
        'merchandising/shared/directives/datetime',
        'merchandising/shared/directives/disabledOptions',
        'merchandising/shared/directives/hierarchy',
        'merchandising/shared/directives/integer',
        'merchandising/shared/directives/keypress',
        'merchandising/shared/directives/pagination',
        'merchandising/shared/directives/percentage',
        'merchandising/shared/directives/pricePanel',
        'merchandising/shared/directives/proHierarchy',
        'merchandising/shared/directives/refLink',
        'merchandising/shared/directives/tagging',
        'merchandising/shared/directives/taxInput',
        'merchandising/shared/directives/taxRateGrid',
        'merchandising/shared/directives/searchDropdown',
        'merchandising/shared/directives/columnSelect'
    ],
    function (angular,
        dateHelper,
        createGoodsReceipt,
        currency,
        dateTime,
        disabledOptions,
        hierarchy,
        integer,
        keypress,
        pagination,
        percentage,
        pricePanel,
        proHierarchy,
        refLink,
        tagging,
        taxInput,
        taxRateGrid,
        searchDropdown,
        columnSelect) {

        'use strict';

        return angular.module('merchandising.directives', [])
            .directive('pbCreateGoodsReceipt', [createGoodsReceipt])
            .directive('pbCurrency', ['pageHelper', currency])
            .directive('pbDateTime', ['dateHelper', dateTime])
            .directive('pbDisabledOptions', ['$parse', disabledOptions])
            .directive('pbHierarchy', [hierarchy])
            .directive('pbInteger', ['pageHelper', integer])
            .directive('pbKeypress', keypress)
            .directive('pbPagination', ['pageHelper', 'helpers', pagination])
            .directive('pbPercentage', ['pageHelper', percentage])
            .directive('pbPricePanel', ['pageHelper', pricePanel])
            .directive('pbProHierarchy', ['hierarchyResourceProvider', proHierarchy])
            .directive('pbRefLink', refLink)
            .directive('pbTagList', tagging)
            .directive('pbTaxInput', taxInput)
            .directive('pbTaxRateGrid', ['pageHelper', 'taxRateResourceProvider', 'taxHelper', taxRateGrid])
            .directive('pbSearchDropdown', searchDropdown)
            .directive('pbColumnSelect', columnSelect);
    });