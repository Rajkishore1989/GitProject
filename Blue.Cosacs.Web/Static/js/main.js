/*global define*/
require(['jquery', 'spa', 'exception-logger', 'pjax', 'single-click', 'dropdown'],
    function ($, spa, exceptionLogger, pjax, singleClick) {
	"use strict";

	exceptionLogger.init();
	spa.start({
		cleanUpBeforeNavigate: function() {
			return $('.tooltip').remove();
		}
	});

    singleClick.bind();

	return pjax.init();
});
