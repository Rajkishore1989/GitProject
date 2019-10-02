/* global define*/
define(['jquery', 'underscore', 'lookup', 'chosen.jquery'], function ($, _, lookup) {
    "use strict";
    var optionTemplate = _.template("<option value='<%- k %>'><%- v %></option>"),
        methods = {
            options: function ($el, rows) {
                var k, v;
                $el.html('');
                $el.append('<option />');
                if (rows) {
                    for (k in rows) {
                        v = rows[k];
                        $el.append(optionTemplate({
                            k: k,
                            v: v
                        }));
                    }
                }
                if ($el.hasClass('chzn-done')) {
                    $el.trigger("liszt:updated");
                } else {
                    $el.chosen($el.data('chosenOptions'));
                }
            },
            init: function (el) {
                var $el = $(el),
                    input = null,
                    pickListId,
                    _this = this;
                if (el.tagName !== 'SELECT' && el.tagName !== 'INPUT') {
                    throw "$.pickList plugin can only be used in SELECT or INPUT elements";
                }
                if (el.tagName === 'INPUT' &&
                    ($el.next().length === 0 ||
                     $el.next().length > 0 && $el.next()[0].tagName !== 'SELECT')) {
                    input = $el.hide();
                    $el = input.after('<SELECT></SELECT>')
                        .next()
                        .data(input.data())
                        .attr('style', input.attr('style'));
                    $el.on('change', function () {
                        input.val($(this).val());
                    });
                }
                pickListId = $el.data('pickListId');
                if (!(pickListId)) {
                    throw el +
                        ' missing the data-pick-list-id attribute with the name of the Pick List to use';
                }
                lookup.populate(pickListId, function (rows) {
                    _this.options($el, rows);
                    if (input) {
                        $el.val(input.val()).trigger("liszt:updated");
                    }
                });
            }
        };
        $.fn.extend({
            pickList: function (options) {
                var self = $.fn.pickList;
                _.defaults(options || (options = {}), {
                    no_results_text: "No results matched",
                    allow_single_deselect: true
                });
                this.each(function (i, el) {
                    $(el).data('chosenOptions', options);
                    self.init(el);
                });
            }
        });
    $.extend($.fn.pickList, methods);
    return {
        k2v: lookup.k2v,
        populate: lookup.populate,
        // obsolete. do not use this method!
        loadAll: lookup.loadAll
    };
});
