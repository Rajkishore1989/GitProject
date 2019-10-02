define(['jquery','backbone','chosen.jquery', ], ($, Backbone) ->  

    defaultChosenOptions = 
        allow_single_deselect: true

    ChosenView = Backbone.View.extend
        render: () ->
            selectedValue = @$el.val()
            @$el.html('')
            @collection.forEach (item) => 
                @$el.append(@make('option', {value: item.id}, item.toString()))
            @$el.find("option[value=#{selectedValue}]").attr('selected', 'selected')
            @update()

        selectedId: () ->
            @$el.val()

        update: () -> 
            @$el.trigger("liszt:updated")
            @

        events: 
            'change': () -> @trigger('change', @)

    SearchView = Backbone.View.extend
        events:
            "click button.clear" : "clear"
            "click button.search": "search"

        search: () ->
            url = $(@el).serialize()
            # TODO 
            false

        clear: () ->
            @$el[0].reset()
            @.$('select').trigger("liszt:updated")
            false

    TableView = Backbone.View.extend
        # add or remove the 'empty' template row
        empty: () ->
            if @templateEmpty?
                other = @$el.find('> tr:not(.empty)')
                empty = @$el.find('> tr.empty')
                if other.length == 0
                    @$el.append(@templateEmpty()) if empty.length == 0 # insert if there are no rows
                else
                    empty.remove() # remove if there are other rows

    return {
        setup: (el) ->
            el = if el? then $(el) else $('body')

            # turn all select elements to Chosen boxes (http://harvesthq.github.com/chosen/)
            el.find('select').chosen(defaultChosenOptions)
            # do not use input[type=button] because it renders slightly different
            # el.find('button').addClass('btn clearbtn')

        loader: (el) ->
            $loader = $('<span class="loader-element"></span>').appendTo(document.body);
            $el = $(el)

            $loader.css({ 
                top:  $el.position().top  + $el.height() / 2 - $loader.height() / 2,
                left: $el.position().left + $el.width()  / 2 - $loader.width()  / 2
            }).show()

            {
                close: () ->
                    $loader.fadeOut().remove();
                    #delete($loader);
            }

        views:
            ChosenView: ChosenView
            SearchView: SearchView
            TableView: TableView
    }
)

