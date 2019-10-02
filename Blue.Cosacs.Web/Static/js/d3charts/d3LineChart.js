/*global define*/
define(['d3', 'popover', 'underscore'], function (d3, popover, _) {
    /*jshint validthis: true */
    "use strict";
    return function (config) {
        /*
            Draw a line chart using d3 library
            Config Parameter
                xAxisProperty - the property name within the data source that will make the x axis
                yAxisLabel - text to render next to the y axis indicating what the scale measure
                parentSelector - a selector (jquery style) to find the object that will contain the chart
                margin - an object that define the margins with the following properties
                    top - int value (default 10)
                    right - int value (default 70)
                    bottom - int value (default 40)
                    left - int value (default 60)
                chartTitle - a text to be render as char title
                tooltipBuilder - class that provide the title and a function to render the tooltip
                    title - title for the tooltip
                    render - a function that receive the current element (intersection between y and x) and return an html string to be render
                width - chart with (default  1170 - margin.left - margin.right)
                height - chart height (default  500 - margin.top - margin.bottom)
                colors - a range of colors (default d3.scale.ordinal().range(["#101b4d", "#475003", "#9c8305", "#d3c47c", "#bAE1ED", "#B6DBB6", "#DFEFFC", "#001c9c", "#e6e6e6", "#F7D2F2", "#c5cde5", "#DCD2B4"]))
            dependencies
                1: popover
                    1: tooltip
                    2: jquery
                2: underscore
                3: d3
            example
                var sevenDaysChart = lineChart({
                    xAxisProperty: 'Week',
                    yAxisLabel: '7 Day %',
                    parentSelector: "#chartPlaceHolder",
                    chartTitle: "% Service Requests closed within 7 days"
                });

                sevenDaysChart.render([{"Week" : 1, "SevenDays" : 88.32}, {"Week" : 2, "SevenDays" : 73.19}, {"Week" : 3, "SevenDays" : 86.54}, {"Week" : 4, "SevenDays" : 68.81}]);
        */
        var returnValue = {
            render: render,
            clear: clear
        };

        var layoutSize = 1170;
        var localConfig = _.extend({}, {
            xAxisProperty: null,
            yAxisLabel: null,
            parentSelector: null,
            margin: { top: 10, right: 70, bottom: 40, left: 60 },
            chartTitle: null,
            tooltipBuilder: {
                title: null,
                render: function (d) {
                    return localConfig.xAxisProperty + ": " + d.label +
                        "<br/>" + d.name.replace(/(?=[A-Z])/g, ' ').trim() + ": " + d3.format(",")(d.value || d.value === 0 ? d.value : d.y1 - d.y0);
                }
            },
            width: layoutSize - 60 - 70 /*margin.left - margin.right*/,
            height: 500 - 10 - 40/* margin.top - margin.bottom*/,
            colors: d3.scale.ordinal().range(["#101b4d", "#475003", "#9c8305", "#B6DBB6", "#bAE1ED", "#DFEFFC", "#001c9c", "#d3c47c", "#e6e6e6", "#F7D2F2", "#c5cde5", "#DCD2B4"])
        }, config);

        function render(data) {
            clear();
            var x = d3.scale.ordinal().rangeRoundBands([0, localConfig.width], 0.1);

            var y = d3.scale.linear().rangeRound([localConfig.height, 0]);

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left");

            var color = localConfig.colors;

            var svg = d3.select(localConfig.parentSelector).append("svg")
                .attr("id", "thesvg")
                .attr("width", localConfig.width + localConfig.margin.left + localConfig.margin.right)
                .attr("height", localConfig.height + localConfig.margin.top + localConfig.margin.bottom)
                .append("g")
                .attr("transform", "translate(" + localConfig.margin.left + "," + localConfig.margin.top + ")");

            function drawLegend(varNames) {
                var varNamesCase = [];

                _.each(varNames, function(current){
                    varNamesCase.unshift(current.replace(/(?=[A-Z])/g, ' ').trim());
                });


                var legend = svg.selectAll(".legend")
                    .data(varNamesCase.slice())
                    .enter().append("g")
                    .attr("class", "legend")
                    .attr("transform", function (d, i) {
                        return "translate(55," + i * 20 + ")";
                    });

                legend.append("rect")
                    .attr("x", localConfig.width - 10)
                    .attr("width", 10)
                    .attr("height", 10)
                    .style("fill", color)
                    .style("stroke", "grey");

                legend.append("text")
                    .attr("x", localConfig.width - 12)
                    .attr("y", 6)
                    .attr("dy", ".35em")
                    .style("text-anchor", "end")
                    .text(function (d) {
                        return d;
                    });
            }

            function removePopovers() {
                $('.popover').each(function () {
                    $(this).remove();
                });
            }

            function showPopover(d) {
                $(this).popover({
                    title: localConfig.tooltipBuilder.title || d.name,
                    placement: 'auto top',
                    container: 'body',
                    trigger: 'manual',
                    html: true,
                    content: localConfig.tooltipBuilder.render(d)
                });
                $(this).popover('show');
            }

            var line = d3.svg.line()
                .interpolate("cardinal")
                .x(function (d) {
                    return x(d.label) + x.rangeBand() / 2;
                })
                .y(function (d) {
                    return y(d.value);
                });

            var varNames = d3.keys(data[0]).filter(function (key) {
                return key !== localConfig.xAxisProperty;
            });
            color.domain(varNames);

            var seriesData = varNames.map(function (name) {
                return {
                    name: name,
                    values: data.map(function (d) {
                        return {name: name, label: d[localConfig.xAxisProperty], value: +d[name]};
                    })
                };
            });

            x.domain(data.map(function (d) {
                return d[localConfig.xAxisProperty];
            }));

            y.domain([
                d3.min(seriesData, function (c) {
                    return d3.min(c.values, function (d) {
                        return d.value;
                    });
                }),
                d3.max(seriesData, function (c) {
                    return d3.max(c.values, function (d) {
                        return d.value;
                    });
                })
            ]);

            //Add a title to the chart
            svg.append("text")
                .attr("x", localConfig.width / 2)
                .attr("y", localConfig.margin.top / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .style("text-decoration", "underline")
                .text(localConfig.chartTitle);

            var xHeight = localConfig.height + 20;

            //create the x axis
            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + xHeight + ")")
                .call(xAxis);

            //create y axis
            svg.append("g")
                .attr("class", "y axis")
                .attr("transform", "translate(0, 20)")
                .call(yAxis)
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text(localConfig.yAxisLabel);

            //create the object that holds the elements inside the chart
            var series = svg.selectAll(".series")
                .data(seriesData)
                .enter().append("g")
                .attr("class", "series")
                .attr("transform", "translate(0, 20)");

            //draw the main line in the chart
            series.append("path")
                .attr("class", "line")
                .attr("d", function (d) {
                    return line(d.values);
                })
                .style("stroke", function (d) {
                    return color(d.name);
                })
                .style("stroke-width", "3px")
                .style("fill", "none");

            //Put the circles in the lines
            series.selectAll(".linePoint")
                .data(function (d) {
                    return d.values;
                })
                .enter().append("circle")
                .attr("class", "linePoint")
                .attr("cx", function (d) {
                    return x(d.label) + x.rangeBand() / 2;
                })
                .attr("cy", function (d) {
                    return y(d.value);
                })
                .attr("r", "5px")
                .style("fill", function (d) {
                    return color(d.name);
                })
                .style("stroke", "grey")
                .style("stroke-width", "1px")
                .on("mouseover", function (d) {
                    showPopover.call(this, d);
                })
                .on("mouseout", function () {
                    removePopovers();
                });

            //put a horizontal line inside chart
            svg.selectAll('.y.axis g line')
                .attr("x2", localConfig.width)
                .attr("x1", "-6");

            drawLegend(varNames);
        }

        function clear() {
            d3.select(localConfig.parentSelector + " svg").selectAll("*").remove();
            d3.select(localConfig.parentSelector + " svg").remove();
        }

        return returnValue;
    };
});
