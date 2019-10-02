/*global define,console*/
define(['jquery', 'underscore', 'url', 'module-activator', 'lib/jquery.pjax', 'single-click'],
    function ($, _, urlHelper, moduleActivator, singleClick) {
    "use strict";
    var activateModules = function () {
        return moduleActivator.execute($(options.container));
    },
    containerId = '#center',
    options = {
        timeout: 5000000,
        container: containerId
    },
    pjaxEnabled = $('body').hasClass('pjax'),
    uniqueId = function () {
        return new Date().getTime();
    };

    if (!pjaxEnabled) {
        return {
            go: function (href) {
                window.location = urlHelper.resolve(href);
                return window.location;
            },
            init: function () {
                return activateModules();
            },
            push: function (title, url) {
                return window.history.pushState(null, title, url);
            },
            set: function (container) {
            }
        };
    }
    return {
        enabled: pjaxEnabled,
        go: function (href, pjax) {
            if (pjax === null) {
                pjax = true;
            }
            if (pjax) {
                return $.pjax({
                    url: urlHelper.resolve(href),
                    container: options.container
                });
            } else {
                window.location = urlHelper.resolve(href);
                return window.location;
            }
        },
        push: function (title, url) {
            var state = {
                id: uniqueId(),
                url: url,
                title: title,
                container: containerId,
                timeout: options.timeout,
                fragment: null
            };
            return window.history.pushState(state, title, url);
        },
        init: function () {
            $(document).pjax("a:not([target],[href=#],.pjax-off)", containerId, options);
            $.pjax.defaults.timeout = false;
            $('form[method=get][action]:not(.pjax-off)').live('submit', function (e) {
                var url;
                url = $(this).attr('action') + '?' + $(this).serialize();
                $.pjax(_.defaults({
                    url: url
                }, options));
                return e.preventDefault();
            });
            $(options.container).on('pjax:start', function () {
                return console.log('pjax:start');
            }).on('pjax:end', function () {
                console.log('pjax:end');
                singleClick.bind();
                // go to the top of the page when navigating with pjax
                $('#body').scrollTop(0);
                return activateModules();
            }).on('pjax:timeout', function (event) {
                // Prevent default timeout redirection behavior
                event.preventDefault();
                return false;
            });
            return activateModules();
        },
        set: function (container) {
            if (container) {
                return $(container).find('a:not([target],[href=#],.pjax-off)').pjax(options);
            } else {
                return $('a:not([target],[href=#],.pjax-off)').pjax(options);
            }
        }
    };
});
