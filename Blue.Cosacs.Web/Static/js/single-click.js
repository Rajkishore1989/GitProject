/*global define*/
define(['jquery'], function ($) {

    var bind = function () {
		$('a.btn.single-click, button.single-click').on('click', function (e) {
            var button = $(e.currentTarget);

            if (!button.attr('disabled')) {
                setTimeout(function () {
					button.attr('disabled', true).addClass('disabled');
				}, 0);
            }
        });

        $(document).bind('ajaxComplete', function () {
			$('.single-click.disabled').removeClass('disabled').attr('disabled', false);
        });
    };

	var reset = function () {
		setTimeout(function () {
			$('.single-click.disabled').removeClass('disabled').attr('disabled', false);
		}, 10);
	};

    return {
        bind: bind,
        reset: reset
    };
});