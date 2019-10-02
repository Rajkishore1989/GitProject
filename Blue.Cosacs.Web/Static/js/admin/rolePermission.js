(function() {

  define(['url', 'lib/jquery.containsCaseInsensitive'], function(url) {
    return {
      init: function($el) {
        var postChange, search;
        $el.find('.clickable').click(function() {
          return $(this).parent('div').next('table').slideToggle("slow");
        });
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
        postChange = function(role, permission, allow, deny) {
          return $.ajax({
            type: 'POST',
            url: url.resolve('/Admin/Roles/AllowDeny'),
            data: {
              role: role,
              permission: permission,
              allow: allow,
              deny: deny
            }
          });
        };
        $el.find('.allow').click(function() {
          var row;
          row = $(this).parents('tr');
          row.find('.deny').attr('checked', false);
          return postChange($el.find('.rolePermissions').data('roleid'), row.data('id'), $(this).is(':checked'), false);
        });
        $el.find('.deny').click(function() {
          var row;
          row = $(this).parents('tr');
          $(this).parents('tr').find('.allow').attr('checked', false);
          return postChange($el.find('.rolePermissions').data('roleid'), row.data('id'), false, $(this).is(':checked'));
        });
        $el.find('.MultipleAllow').click(function() {
          var that, values;
          that = $(this);
          values = {
            CategoryId: $(this).attr('data'),
            RoleId: $el.find('.rolePermissions').data('roleid'),
            Allow: true,
            Check: $(this).is(':checked')
          };
          return $.ajax({
            url: url.resolve('/Admin/Roles/AllowDenyByCategory'),
            data: values,
            type: 'POST',
            success: function(data) {
              var tableContainer;
              that.parents('table').find('.allow').attr('checked', that.is(':checked'));
              tableContainer = that.parents('table');
              tableContainer.find('#MultipleDeny').attr('checked', false);
              return tableContainer.find('.deny').attr('checked', false);
            }
          });
        });
        $el.find('.MultipleDeny').click(function() {
          var that, values;
          that = $(this);
          values = {
            CategoryId: $(this).attr('data'),
            RoleId: $el.find('.rolePermissions').data('roleid'),
            Allow: false,
            Check: $(this).is(':checked')
          };
          return $.ajax({
            url: url.resolve('/Admin/Roles/AllowDenyByCategory'),
            data: values,
            type: 'POST',
            success: function(data) {
              var tableContainer;
              that.parents('table').find('.deny').attr('checked', that.is(':checked'));
              tableContainer = that.parents('table');
              tableContainer.find('#MultipleAllow').attr('checked', false);
              return tableContainer.find('.allow').attr('checked', false);
            }
          });
        });
        $el.find('#searchBox').on('search', search);
        return $el.find('table tr:not(.hide)').filter(":odd").addClass('tableShade');
      }
    };
  });

}).call(this);
