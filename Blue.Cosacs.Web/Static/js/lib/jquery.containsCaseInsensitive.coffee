define ['jquery'], ($) ->
    $.extend($.expr[":"], { "containsNC": (elem, i, match, array) ->
            (elem.textContent || elem.innerText || "").toLowerCase().indexOf((match[3] || "").toLowerCase()) >= 0
    })