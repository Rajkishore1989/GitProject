/*global define*/
define(['jquery', 'datepicker'], function($) {
    "use strict";

    var filterBySelection = function(selector, input) {
        return $(selector).on('click', function() {
            $(input).val($(this).text());
            return $('.search').click();
        });
    };

    var clear = function () {
      $('.clear').on('click', function() {
          clearValue('#Category');
          clearValue('#Type');
          clearValue('#EventBy');
          $('.search').click();
      });
    };

    var clearValue = function (selector) {
      $(selector).val("");
    };

    return {
        init: function($el) {
            $('input.date').datepicker({
              dateFormat: "D, d M, yy",
              changeMonth: true,
              changeYear: true
            });
            filterBySelection('.event > .category', '#Category');
            filterBySelection('.event > .type', '#Type');
            filterBySelection('.event > .by', '#EventBy');
            return clear();
        }
    };
});