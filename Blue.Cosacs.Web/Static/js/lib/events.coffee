define ['jquery'], ($) ->
    # Miguel Vitorino July 2012
    # Backbone.js like Events module from http://darylkoop.com/jqcon-sf-2012/#slide-50
    # shorter implementation than Backbone's because is uses $.Callbacks()
    Events = () ->
    slice = Array.prototype.slice

    Events::on = (id, callback) ->
        @topics = @topics || {}
        topic = @topics[id] = @topics[id] || $.Callbacks()
        topic.add.apply(topic, slice.call(arguments, 1))
        @

    Events::off = (id, callback) ->
        topic = @topics[id]
        if @topics and topic
            topic.remove.apply(topic, slice.call(arguments, 1))
        @

    Events::trigger = (id) ->
        topic = @topics[id]
        if @topics and topic
            topic.fireWith(@, slice.call(arguments, 1))
        @

    new Events() # module exports

    # TODO Observable? http://darylkoop.com/jqcon-sf-2012/#slide-55
    # var view = $('#my-view').observable();
    # $('#my-input').observable().push( view );