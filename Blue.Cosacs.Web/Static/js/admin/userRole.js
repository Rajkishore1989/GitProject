(function() {

  define(['url', 'confirm', 'lib/jquery.containsCaseInsensitive'], function(url, confirm) {
    return {
      init: function($el) {
        var search, unAssign;
        search = function(s) {
          if (typeof s.length === 'undefined' || s.length === 0) {
            $el.find('tbody > tr').show();
          } else {
            $el.find('tbody > tr').hide();
            $el.find("tbody > tr > td:containsNC('" + s + "')").parent('tr').show();
          }
          return $el.find('table tr:not(.hide)').filter(":odd").addClass('tableShade');
        };
        $el.find('#searchBox').keyup(function() {
          return search($(this).val());
        });
        unAssign = function(RoleId, UserId, item) {};
        $el.find('.glyphicons.bin').click(function() {
          var $tr, roleId, userId, userName;
          $tr = $(this).parents('tr:first');
          roleId = $el.find('.userRole').data('roleid');
          userId = $tr.data('id');
          userName = $tr.text();
          return confirm("Are you sure you want to remove " + userName + " from this role?", "Remove Role", function(ok) {
            if (ok) {
              return $.ajax({
                type: 'POST',
                url: url.resolve('/Admin/Roles/UnassignUser'),
                data: {
                  roleId: roleId,
                  userId: userId
                },
                success: function() {
                  return $tr.remove();
                }
              });
            }
          });
        });
        $el.find('#searchBox').on('search', search);
        return $el.find('table tr:not(.hide)').filter(":odd").addClass('tableShade');
      }
    };
  });

}).call(this);
