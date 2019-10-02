/*global define*/
define(['jquery', 'underscore', 'url', 'json'], function ($, _, url) {
    "use strict";
    var allocate = function (sequence, success) {
            return $.post(url.resolve('/HiLo/Allocate'), {
                sequence: sequence
            }, function (data) {
                return success(_.extend(data, {
                    currentLo: 0
                }));
            });
        },
        key = function (sequence) {
            return "HiLo:" + sequence;
        },
        nextIdStoreAndReturn = function (sequence, state, success) {
            write(sequence, state);
            return success(state.currentHi + state.currentLo);
        },
        read = function (sequence) {
            var state = storage[key(sequence)];

            if (state !== undefined && state !== null) {
                return JSON.parse(state);
            } else {
                return state;
            }
        }, storage = localStorage,
        write = function (sequence, value) {
            var s = storage[key(sequence)] = JSON.stringify(value);
            return s;
        };

    return {
        nextId: function (sequence, success, allocateOverride) {
            var alloc = allocateOverride || allocate,
                state = read(sequence);

            if ((state === null || state === undefined) || (state.currentHi + state.currentLo + 1 >= state.currentHi + state.maxLo)) {
                return alloc(sequence, function (state) {
                    return nextIdStoreAndReturn(sequence, state, success);
                });
            } else {
                state.currentLo += 1;
                return nextIdStoreAndReturn(sequence, state, success);
            }
        },
        clear: function (sequence) {
            return storage.removeItem(key(sequence));
        }
    };
});
