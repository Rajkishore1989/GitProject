/*global define*/
define(['jquery', 'url'], function($, url) {
    'use strict';

    var fetchLocalisationSettings = function() {
        var dfd = $.Deferred();
        $.ajax({
            async: false,
            url: url.resolve('/Localisation'),
            success: function(data) {
                localStorage.Localisation = JSON.stringify(data);
                dfd.resolve(data);
            },
            error: function() {
                dfd.reject();
            }
        });

        return dfd.promise();
    };

    return {
        fetchLocalisationSettings: fetchLocalisationSettings,
        getSettings: function() {
            var settingsString = localStorage.Localisation;
            var settings;
            if (settingsString !== null && settingsString !== undefined) {
                settings = JSON.parse(settingsString);
            } else {
                fetchLocalisationSettings();
                settings = {
                    CurrencySymbol: '',
                    DecimalPlaces: 0
                };
            }

            return settings;
        }
    };
});