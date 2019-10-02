define ['url','lib/jquery.containsCaseInsensitive'], (url) ->
    init: ($el) ->

        $el.find('.clickable').click () ->
            $(this).parent('div').next('table').slideToggle("slow")
        
        search = (s) ->
            if  typeof s.length == 'undefined' || s.length == 0 
                $el.find('tbody > tr').show()
            else 
                $el.find('tbody > tr').hide()
                $el.find("tbody > tr > td:containsNC('#{s}')").parent('tr').show()
            $el.find('table tr:not(.hide)').filter(":odd").addClass('tableShade');
            
        $el.find('#searchBox').keyup () ->
            search($(@).val())

        postChange = (role, permission, allow,deny) ->
            $.ajax(
                type: 'POST'
                url: url.resolve('/Admin/Roles/AllowDeny')
                data: {role, permission, allow, deny}
            )

        $el.find('.allow').click () ->
            row = $(this).parents('tr')
            row.find('.deny').attr('checked', false)
            postChange($el.find('.rolePermissions').data('roleid'),row.data('id'), $(this).is(':checked'),false)
            

        $el.find('.deny').click () ->
            row = $(this).parents('tr')
            $(this).parents('tr').find('.allow').attr('checked', false)
            postChange($el.find('.rolePermissions').data('roleid'),row.data('id'), false,$(this).is(':checked'))
        
        $el.find('#MultipleAllow').click () ->
            that = $(this)
            values =
                CategoryId: $(this).attr('data')
                RoleId: $el.find('.rolePermissions').data('roleid')
                Allow: true
                Check: $(this).is(':checked')
            $.ajax
                url: url.resolve('/Admin/Roles/AllowDenyByCategory')
                data: values,
                type: 'POST'
                success: (data) -> 
                    that.parents('table').find('.allow').attr('checked', that.is(':checked'))
                    tableContainer = that.parents('table')
                    tableContainer.find('#MultipleDeny').attr('checked', false)
                    tableContainer.find('.deny').attr('checked', false)
                       
        $el.find('#MultipleDeny').click () ->
            that = $(this)
            values =
                CategoryId: $(this).attr('data')
                RoleId: $el.find('.rolePermissions').data('roleid')
                Allow: false
                Check: $(this).is(':checked')
            $.ajax
                url: url.resolve('/Admin/Roles/AllowDenyByCategory')
                data: values,
                type: 'POST'
                success: (data) -> 
                    that.parents('table').find('.deny').attr('checked', that.is(':checked'))
                    tableContainer = that.parents('table')
                    tableContainer.find('#MultipleAllow').attr('checked', false)
                    tableContainer.find('.allow').attr('checked', false)
                 

        $el.find('#searchBox').on('search',search);
        $el.find('table tr:not(.hide)').filter(":odd").addClass('tableShade');
