(function () {

    define(['jquery', 'underscore', 'backbone', 'form-inline', 'url', 'lib/select2', 'jquery.pickList'], function ($, _, backbone, formInline, url) {
        return {
            init: function ($el) {
                $('#payments').height($(window).height());

                var form = formInline.init($el);
                form.on('edit', function (row) {
                    return row.find('#SendingBranch, #ReceivingBranch, #Size').pickList();
                });
            }
        };
    });

}).call(this);
