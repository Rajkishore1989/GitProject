/*global define*/
define(['d3'], function (d3) {
    "use strict";

    return function (data, category) {
        var layoutSize = 1170;
        var margin = { top: 60, right: 40, bottom: 80, left: 60 },
            width = layoutSize - margin.left - margin.right,
            height = 450 - margin.top - margin.bottom;

        var x = d3.scale.ordinal()
            .rangeRoundBands([0, width], 0.1, 0.3);

        var y = d3.scale.linear()
            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .ticks(8, "%");

        d3.select("svg").remove();
        var svg = d3.select("#SrResolutionChart").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        x.domain(data.map(function(d) { return d.name; }));
        y.domain([0, d3.max(data, function(d) { return d.value; })]);

        svg.append("text")
            .attr("class", "title")
            .attr("x", x(data[0].name))
            .attr("y", -26)
            .text("Resolution % vs Category - " + category);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .selectAll(".tick text")
            .call(wrap, x.rangeBand());

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        svg.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d) {
                return x(d.name);
            })
            .attr("width", x.rangeBand())
            .attr("y", function(d) {
                return y(d.value);
            })
            .attr("height", function(d) { return height - y(d.value); });

        var yTextPadding = 5;
        svg.selectAll(".bartext")
            .data(data)
            .enter()
            .append("text")
            .attr("class", "bartext")
            .attr("text-anchor", "middle")
            .attr("fill", "black")
            .attr("x", function(d) { return x(d.name) + x.rangeBand() / 2; })
            .attr("y", function(d) { return y(d.value) - yTextPadding; })
            .text(function(d){
                return d.label;
            })
            .attr("font-family", "OpenSans, sans-serif")
            .attr("font-size", "10px");

        function wrap(text, width) {
            text.each(function() {
                var text = d3.select(this),
                    words = text.text().split(/\s+/).reverse(),
                    word,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1.1, // ems
                    y = text.attr("y"),
                    dy = parseFloat(text.attr("dy")),
                    tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
                while ((word = words.pop())) {
                    line.push(word);
                    tspan.text(line.join(" "));
                    if (tspan.node().getComputedTextLength() > width) {
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                    }
                }
            });
        }
    };

});
