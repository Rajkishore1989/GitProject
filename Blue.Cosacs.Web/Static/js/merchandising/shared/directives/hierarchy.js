define(['angular', 'url', 'underscore'],
function (angular, url, _) {
    'use strict';
    return function() {
        return {
            restrict: 'E',
            scope: {
                options: '=',
                selections: '=',
                editable: '&',
                callback: '&',
                placeholder: '@',
                label: '&'
            },
            templateUrl: url.resolve('/Static/js/merchandising/shared/templates/hierarchyControls.html'),
            link: function (scope, element, attr)  {
                scope.hasCustomLabel = function(){
                    return _.isUndefined(attr.label);

                    //here should say if it decide if shows the normal label when is in readonly mode
                    //or if it is going to invoke the function  label
                    //this is done because on service request is saving (or will be) the whole string of hierarchytag
                };
            }
        };
    };
});