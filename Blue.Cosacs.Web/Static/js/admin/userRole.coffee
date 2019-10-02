define ['url','confirm','lib/jquery.containsCaseInsensitive'], (url, confirm) ->
    init: ($el) ->
        
        search = (s) ->
             if  typeof s.length == 'undefined' || s.length == 0 
                $el.find('tbody > tr').show()
             else 
                 $el.find('tbody > tr').hide()
                 $el.find("tbody > tr > td:containsNC('#{s}')").parent('tr').show()
             $el.find('table tr:not(.hide)').filter(":odd").addClass('tableShade');
            

        $el.find('#searchBox').keyup () ->
            search($(@).val())
        
        unAssign = (RoleId, UserId,item) ->

        $el.find('.glyphicons.bin').click () ->
            $tr = $(@).parents('tr:first')
            roleId = $el.find('.userRole').data('roleid')
            userId = $tr.data('id')
            userName = $tr.text()
            
            confirm("Are you sure you want to remove #{userName} from this role?", "Remove Role", (ok) -> 
                $.ajax(
                    type: 'POST'
                    url: url.resolve('/Admin/Roles/UnassignUser')
                    data: { roleId , userId },
                    success: () ->
                        $tr.remove()
                ) if ok
            )
            
        $el.find('#searchBox').on('search',search);
        $el.find('table tr:not(.hide)').filter(":odd").addClass('tableShade');
