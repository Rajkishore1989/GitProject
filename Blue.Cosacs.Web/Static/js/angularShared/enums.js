/*global define*/
define(['angular'],
    function (angular) {
        'use strict';


        return angular.module('cosacs.enums', [])
            .factory('Enum', function () {
                var warrantyTypeEnum = Object.freeze({Extended: 'E', Free: 'F', InstantReplacement: 'I' });
                var serviceTypeEnum = Object.freeze({
                    SE: 'Service Request External',
                    SI: 'Service Request Internal',
                    IE: 'Installation External',
                    II: 'Installation Internal',
                    S: 'Stock Repair'});

                return {
                    WarrantyTypeEnum: warrantyTypeEnum,
                    ServiceTypeEnum: serviceTypeEnum
                };

            });

    });
