(function() {

  define(['jquery', 'underscore', 'backbone', 'form-inline', 'url', 'lib/select2', 'jquery.pickList'], function($, _, backbone, formInline, url) {
    return {
      init: function($el) {
        var fResult, fSelection, form, x;
        $('#trucks').height($(window).height());
        $el.find('.search #s_Branch, #s_DriverId, #s_Size').pickList();
        form = formInline.init($el);
        form.on('edit', function(row) {
          return row.find('#Branch, #DriverId, #Size').pickList();
        });
        $el.find("#filterDriverl").select2({
          placeholder: {
            title: "Search for a driver",
            id: ""
          },
          minimumInputLength: 3,
          ajax: {
            url: url.resolve('Trucks/GetDrivers'),
            dataType: 'jsonp',
            quietMillis: 100,
            data: function(term, page) {
              return {
                q: term,
                page_limit: 10,
                page: page
              };
            },
            results: function(data, page) {
              var more;
              alert('p');
              more = (page * 10) < data.total;
              return {
                results: data.drivers,
                more: more
              };
            }
          },
          formatResult: fResult,
          formatSelection: fSelection,
          formatNoMatches: x
        });
        x = function(term) {
          return alert(term);
        };
        fResult = function(data) {
          return '<table><tr><td>' + data.Id + '</td><td>' + data.Name + '</td></tr></table>';
        };
        fSelection = function(data) {
          return data.Name;
        };
      }
    };
  });

}).call(this);
