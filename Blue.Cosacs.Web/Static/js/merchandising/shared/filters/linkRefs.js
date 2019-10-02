define(['url'],
function (url) {
    'use strict';

    return function ($sanitize, refLinkConfig) {
        var createPattern = function (signature, ref) {
            return new RegExp(signature.source + ref.source, 'igm');
        };

        var createTransformer = function (transform, refExtractor, setting) {
            return function (s) {
                return transform(s, setting, refExtractor);
            };
        };

        var replaceAll = function (text, pattern, transform) {
            return text ? text.replace(pattern, transform) : '';
        };

        var extractRef = function (text, signaturePattern, refPattern) {
            return text.replace(signaturePattern, '').match(refPattern);
        };

        var createLink = function (text, setting, refExtractor) {
            return '<a href="' + (url.resolve(setting.route) + refExtractor(text, setting.signature, setting.ref)).toLowerCase() + '">' + text.toUpperCase() + '</a>';
        };

        return function (text) {
            text = $sanitize(text);
            var i = refLinkConfig.length;

            while (text && i--) {
                refLinkConfig[i].signature = new RegExp(refLinkConfig[i].signature.source, 'i');
                refLinkConfig[i].ref = new RegExp(refLinkConfig[i].ref.source, 'i');
                text = replaceAll(text,
                    createPattern(refLinkConfig[i].signature, refLinkConfig[i].ref),
                    createTransformer(createLink, extractRef, refLinkConfig[i]));
            }
            return text;
        };
    };
});
