define(["underscore", "url"],
    function (_, url) {
        "use strict";
        return function ($http, pageHelper) {
            var that = this;

            function getEndPoint(report, action) {
                return url.resolve("/Merchandising/" + report + "/" + action);
            }

            function makePost(report, action, query, callback) {
                pageHelper.loading(true);
                $http.post(getEndPoint(report, action), { search: query }, { responseType: "arraybuffer" })
                .success(function (data, status, headers) {
                    if (callback) {
                        callback(data, status, headers);
                    }
                    pageHelper.loading(false);
                })
                .error(function() {
                    pageHelper.loading(false);
                });
            }

            function getPrint(report, query, columns) {
                var colIndices = [];
                _.each(columns, function (col, index) {
                    if (col.selected === true) {
                        colIndices.push(index);
                    }
                });
                query.colIndices = colIndices;
                makePost(report, "Print", query, function (data) {
                    var printWindow = window.open('about:blank', 'Print');
                    if (printWindow) {
                        printWindow.document.write(data);
                        printWindow.document.close();
                    } else {
                        pageHelper.notification.showPersistent('Print job failed to open. Please disable any popup blockers and try again.');
                    }
                });
            }

            function getExport(report, query) {
                makePost(report, "Export", query, function(data, status, headers) {
                    url.download(data, headers);
                });
            }

            function addColumn(collection, item, valueProperty) {
                var val;
                if (typeof item === 'string') {
                    val = item;
                } else {
                    val = item[valueProperty || 'name'];
                }
                collection.push({ name: val, selected: true });
            }

            // Accepts the columns model, an array (or multi-dimensional array) of either strings or objects.
            // When passing object arrays, valueProperty can also be specified to define which property to use
            // (otherwise defaults to 'name')
            function initialiseColumns(model, columnNamesArrays, valueProperty) {
                if (model.length === 0) {
                    _.each(columnNamesArrays, function (thisItem) {
                        if (typeof thisItem === 'string') {
                            // String array passed
                            addColumn(model, thisItem, valueProperty);
                        } else {
                            // String array passed
                            _.each(thisItem, function(col) {
                                addColumn(model, col, valueProperty);
                            });
                        }
                    });
                }
                return model;
            }

            function restrict(columns, query) {
                if (query.colIndices && query.colIndices.length > 0) {
                    _.each(columns, function(col, index) {
                        col.selected = _.contains(query.colIndices, index);
                    });
                }
                return columns;
            }

            function pages(records, firstPageSize, pageSize) {
                firstPageSize = firstPageSize || 10;
                pageSize = pageSize || 15;
                var first = [_.first(records, firstPageSize)];
                if (records.length > firstPageSize) {
                    var paged = _.chain(_.rest(records, firstPageSize))
                        .groupBy(function (element, index) {
                            return Math.floor(index / pageSize);
                        })
                        .toArray()
                        .value();
                    return first.concat(paged);
                }
                return first;
            }

            that.getPrint = getPrint;
            that.getExport = getExport;
            that.initialiseColumns = initialiseColumns;
            that.restrict = restrict;
            that.pages = pages;
        };
    });

