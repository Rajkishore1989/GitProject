(function() {

  define(['jquery', 'url'], function($, url) {
    return {
      init: function($el) {
        return $el.find('.action-kill-session').on('click', function(e) {
          var $tr, userid;
          $tr = $(this).parents('tr');
          userid = $tr.data('userid');
          return $.post(url.resolve('/Admin/Sessions/Kill'), {
            userid: userid
          }, function() {
            return $tr.remove();
          });
        });
      }
    };
  });

}).call(this);
