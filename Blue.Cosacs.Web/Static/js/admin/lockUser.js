(function() {

  define(['url', 'confirm', 'jquery', 'alert', 'lib/events'], function(url, confirm, $, alert, events) {
    return {
      init: function($el) {
        var submitRequest;
        submitRequest = function() {
          var message, title;
          message = '';
          title = '';
          if ($el.find('#buttonLockUser').attr('isLocked').toLowerCase() === 'true') {
            message = 'Are you sure you want to unlock this user?';
            title = 'Unlock User';
          } else {
            message = 'Are you sure you want to lock this user?';
            title = 'Lock User';
          }
          return confirm(message, title, function(ok) {
            var req,
              _this = this;
            if (ok) {
              req = {
                user: $el.find('#buttonLockUser').val()
              };
              return $.post(url.resolve('/Admin/Users/LockUser'), req, function(data, textStatus, jqXHR) {
                var element;
                if (data.Successful) {
                  element = $el.find('#buttonLockUser');
                  if (data.HaveBeenLocked) {
                    events.trigger('Admin.User.Lock', true);
                    element.html('Unlock User');
                  } else {
                    events.trigger('Admin.User.Lock', false);
                    element.html('Lock User');
                  }
                  return element.attr('isLocked', data.HaveBeenLocked);
                } else {
                  return alert(data.Message, title);
                }
              });
            }
          });
        };
        return $el.find('#buttonLockUser').on('click', submitRequest);
      }
    };
  });

}).call(this);
