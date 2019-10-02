define ['url','confirm', 'jquery', 'alert', 'lib/events'], (url, confirm, $, alert, events) ->
    init: ($el) ->
        
        submitRequest = () ->
            message = ''
            title = ''
            if $el.find('#buttonLockUser').attr('isLocked').toLowerCase() == 'true'
                message = 'Are you sure you want to unlock this user?'
                title = 'Unlock User'
            else
                message = 'Are you sure you want to lock this user?'
                title = 'Lock User'

            confirm(message, title, (ok) -> 
                if ok
                    req =
                        user: $el.find('#buttonLockUser').val()
                    $.post(
                            url.resolve('/Admin/Users/LockUser'), 
                            req
                            (data, textStatus, jqXHR) =>
                                if (data.Successful)
                                    element =  $el.find('#buttonLockUser')
                                    if(data.HaveBeenLocked)
                                        events.trigger('Admin.User.Lock', true)
                                        element.html('Unlock User')
                                    else
                                        events.trigger('Admin.User.Lock', false)
                                        element.html('Lock User')
                                    element.attr('isLocked', data.HaveBeenLocked)
                                else
                                        alert(data.Message, title) 
                        ) 
            )

        $el.find('#buttonLockUser').on('click', submitRequest)