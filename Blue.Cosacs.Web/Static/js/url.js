/*global define*/

define(['jquery', 'string'], function ($, str) {
    'use strict';
    var baseUrl, resolve, resolveImageFile;
    baseUrl = $('body').data('baseUrl') || '';
    resolve = function (partialUrl) {
        if (/https?\:\/\//.test(partialUrl)) {
            return partialUrl;
        } else if (partialUrl.indexOf(baseUrl) === 0) {
            return partialUrl;
        } else {
            return baseUrl + str.ltrim(partialUrl, '/');
        }
    };

    resolveImageFile = function (fileGuid) {
        var resolvedUrl = "";
        if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(fileGuid)) {
            var tmpImageTmpUrl = "/Files/Read/" + fileGuid;
            resolvedUrl = resolve(tmpImageTmpUrl);
        }
        return resolvedUrl;
    };

    var getParameter = function (name) {
        var param = (new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [ ""])[1];
        if (typeof param === 'string') {
            return decodeURIComponent(param.replace(/\+/g, '%20')) || null;
        }
    };

    function go(partialUrl) {
        var url = resolve(partialUrl);
        var link = $("<a href='" + url + "'/>");
        $('body').append(link);
        link.click();
        link.remove();
        return url;
    }

    function download(data, headers) {
        var a = document.createElement('a');
        a.href = 'data:attachment/csv;charset=utf-8,' + encodeURI(data);
        a.target = '_blank';
        a.download = headers()['content-disposition'].split('"')[1];
        document.body.appendChild(a);
        a.click();
    }

    return {
        resolve: resolve,
        resolveImageFile: resolveImageFile,
        go: go,
        download: download,
        open: function (partialUrl) {
            return window.open(resolve(partialUrl));
        },
        getParameter: getParameter
    };
});