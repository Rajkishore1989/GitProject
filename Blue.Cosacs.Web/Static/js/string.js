/*global define*/
define(['jquery'], function () {
    "use strict";
    return  {
        startsWith: function (s, match) {
            return s[0] === match;
        },
        endsWith: function (s, match) {
            return s.match(match + '$') === match;
        },
        trim: function (s) {
            return s.replace(/^[\s\xA0]+/, "").replace(/[\s\xA0]+$/, "");
        },
        ltrim: function (s, c) {
            var l = 0;
            if (!c) {
                c = ' ';
            }
            while (l < s.length && s[l] === c) {
                l += 1;
            }
            return s.substring(l, s.length);
        },
        rtrim: function (s, c) {
            var r = s.length - 1;
            if (!c) {
                c = ' ';
            }
            while (r > 0 && s[r] === c) {
                r -= 1;
            }
            return s.substring(0, r + 1);
        }
    };
});
