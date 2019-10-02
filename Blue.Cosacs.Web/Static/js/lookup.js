/* global define,DEBUG*/
define(['jquery', 'underscore', 'url'], function ($, _, url) {
    "use strict";
    var L1 = {}, // in memory
        L2 = sessionStorage,
        deferredLoads = {},
        delay = 0;

    if (window.DEBUG) {
//        L2 =  {};
//        delay = 5000;
        L2 =  sessionStorage;
        delay = 0;
    }

    function storageKey(pickListId) {
        return 'PickList:' + pickListId;
    }

    function sync(ids, complete) {
        // the sort is to help with caching by URL if necessary
        $.getJSON(url.resolve('PickLists/Load?ids=' + ids.sort().join(',')), function (lists) {

            _.each(lists, function (list, listId) {
                // store it only if not already in L1
                if (!_.has(L1, listId)) {
                    L2[storageKey(listId)] = JSON.stringify(L1[listId] = list.rows);
                }
            });

            if (complete) {
                complete(lists);
            }
        });
    }

    function fullSync() {
        var dfl = deferredLoads;
        deferredLoads = {}; // clear the queue requests for lists

        sync(_.keys(dfl), function (lists) {
            _.each(lists, function (list, listId) {
                _.each(dfl[listId], function (callback) {
                    callback(list.rows);
                });
            });
        });
    }

    function deferSync(listId, callback) {
        if (_.isEmpty(deferredLoads)) {
            // only put in the request for the deferred fullSync if this is the first request
            setTimeout(fullSync, delay);
        }
        if (!_.has(deferredLoads, listId)) {
            deferredLoads[listId] = [];
        }
        deferredLoads[listId].push(callback);
    }

    function get(listId, callback) {
        // check L1
        if (_.has(L1, listId)) {
            callback(L1[listId]);
            return;
        }

        // L2
        var json = L2[storageKey(listId)];
        if (json) {
            callback(L1[listId] = $.parseJSON(json));
            return;
        }

        deferSync(listId, callback);
    }

    return {
        // pass the pickListId and array of keys to get the key-value pairs for
        k2v: function (pickListId, ks, callback) {
            get(pickListId, function (rows) {
                callback(_.pick(rows, ks));
            });
        },
        populate: function (pickListId, callback) {
            get(pickListId, callback);
        },
        // obsolete. do not use this method!
        loadAll: function (listIds, complete) {
            sync(listIds, complete);
        }
    };
});
