define ['jquery', 'underscore', 'backbone', 'form-inline','url','lib/select2','jquery.pickList'], ($, _, backbone, formInline,url) -> 

    return init: ($el) ->
        $el.find('.search #s_Branch, #s_DriverId, #s_Size').pickList()
        form = formInline.init($el)
        form.on 'edit', (row) ->
            row.find('#Branch, #DriverId, #Size').pickList()
        
        $el.find("#filterDriverl").select2(
                placeholder: {title: "Search for a driver", id: ""}
                minimumInputLength: 3
                ajax: 
                    url: url.resolve('Trucks/GetDrivers')
                    dataType: 'jsonp'
                    quietMillis: 100
                    data: (term, page) ->
                        return {
                            q: term
                            page_limit: 10
                            page: page
                        }
                    results: (data, page) ->
                        alert 'p'
                        more = (page * 10) < data.total
                        return {results: data.drivers, more: more}
                formatResult: fResult
                formatSelection: fSelection
                formatNoMatches: x
            )
        x = (term) ->
            return alert term

        fResult = (data) ->
            return '<table><tr><td>' + data.Id + '</td><td>' + data.Name + '</td></tr></table>'

        fSelection = (data) ->
            return data.Name
        return