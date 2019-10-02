define ['jquery','url'], ($, url) ->

    init: ($el) ->
        $el.find('.action-kill-session').on 'click', (e) ->
            $tr = $(this).parents('tr')
            userid = $tr.data('userid')
            $.post(
                url.resolve('/Admin/Sessions/Kill')
                { userid }
                () -> $tr.remove()
            )
