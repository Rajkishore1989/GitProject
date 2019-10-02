/*global define,document,console*/
define(['Config/decisionTable','angular','jquery','notification','url','underscore'],
    function(DecisionTable, angular, $, notification, url, _) {
    'use strict';

    var getNull = function() {
            return null;
        },
        getFalse = function () {
            return false;
        },
        table1 = {
            conditions: [
                'this.FirstName == "Miguel"',
                'this.State == "Open"'
            ],
            actions: [
                '"My Name is " + this.FirstName',
                '"State is " + this.State '
            ],
            rules: [ 
                // null is 'don't care'
                { values: [true, null], actions: [true, false] }, // rule 0
                { values: [true, false], actions: [true, true] }, // rule 1
                { values: [false, true], actions: [false,true] } // rule 2
            ]
        },
        emptyTable = function() {
            return {
                conditions: [],
                actions: [],
                rules: [],
                extensions: null
            };
        };

    return {
        init: function($el) {

            $el.find('thead > tr :contains("Conditions"), tbody > tr :contains("Actions")').click(function () {
                $("body #body div.container").attr("style", "width: 1500px;");
                $el.find('td.expr > textarea').each(function () {
                    var currentDiv = $(this);
                    var text = currentDiv.val();
                    //currentDiv.parent().width('550px');
                    var newlines = text.split('\n').length,
                        heightCalc = 5 + (newlines * 21),
                        maxH = 510;
                    heightCalc = heightCalc < maxH ? heightCalc : maxH;
                    var height = heightCalc + 'px';
                    currentDiv.height(height);
                });
            });

            $(document).delegate('textarea[name=extensions]', 'keydown', function(e) {
                var keyCode = e.keyCode || e.which;

                if (keyCode === 9) {
                    e.preventDefault();
                    var start = $(this).get(0).selectionStart;
                    var end = $(this).get(0).selectionEnd;

                    // set textarea value to: text before caret + tab + text after caret
                    $(this).val($(this).val().substring(0, start) + "\t" + $(this).val().substring(end));

                    // put caret at right position again
                    $(this).get(0).selectionStart = $(this).get(0).selectionEnd = start + 1;
                }
            });

            var decisionTableExplorerCtrl = function ($scope, $http) {
                $scope.table = new DecisionTable(emptyTable());
                $scope.keys = window.keys;
                $scope.selectedKey = null;

                $scope.download = function() {
                    var current = $scope.selectedKey;
                    if (!current) {
                        return;
                    }

                    window.location = url.resolve('/Config/DecisionTable/Download?key=' + current.key);
                };

                $scope.setFiles = function(element) {
                    $scope.$apply(function(scope) {
                        console.log('files:', element.files);
                        scope.file = element.files[0];
                        scope.progressVisible = false;
                    });
                };

                function uploadProgress(evt) {
                    $scope.$apply(function(){
                        if (evt.lengthComputable) {
                            $scope.progress = Math.round(evt.loaded * 100 / evt.total);
                        } else {
                            $scope.progress = 'unable to compute';
                        }
                    });
                }

                function uploadComplete(evt) {
                    /* This event is raised when the server send back a response */
                    var dt = angular.fromJson(evt.target.responseText)[0];
                    $scope.$apply(function () {
                        loadJson(dt);
                    });

                    notification.show("Decision Table '" + $scope.selectedKey.key + "' uploaded successfully.", "Upload");
                }

                function uploadFailed(evt) {
                    notification.show("There was an error attempting to upload the file.", "Upload");
                }

                function uploadCanceled(evt) {
                    $scope.$apply(function(){
                        $scope.progressVisible = false;
                    });
                    notification.show("The upload has been canceled by the user or the browser dropped the connection.", "Upload");
                }

                $scope.upload = function() {
                    var fd = new FormData();
                    fd.append("key", $scope.selectedKey.key);
                    fd.append("file", $scope.file);
                    var xhr = new XMLHttpRequest();
                    xhr.upload.addEventListener("progress", uploadProgress, false);
                    xhr.addEventListener("load", uploadComplete, false);
                    xhr.addEventListener("error", uploadFailed, false);
                    xhr.addEventListener("abort", uploadCanceled, false);
                    xhr.open("POST", url.resolve("/Config/DecisionTable/Upload"));
                    $scope.progressVisible = true;
                    xhr.send(fd);
                };

                function loadJson(dtData) {
                    if (dtData === null) {
                        //alert("There is no Decision Table data for " + current.key, "Load Decision Table");
                        $scope.table = emptyTable();
                        return;
                    }
                    var dataObj = angular.fromJson(dtData.Value);
                    var newTable = {
                        actions: _.map(dataObj.actions, function(action) {
                            return action.expression;
                        }),
                        conditions: _.map(dataObj.conditions, function(condition) {
                            return condition.expression;
                        }),
                        rules: dataObj.rules,
                        extensions: dataObj.extensions
                    };
                    $scope.table = new DecisionTable(newTable);
                    // $scope.doDigest();
                }

                $scope.load = function() {
                    var current = $scope.selectedKey;
                    if (!current) {
                        return;
                    }

                    $.ajax({
                        type: 'POST',
                        contentType: 'application/json',
                        url: url.resolve('/Config/DecisionTable/Load/'),
                        data: JSON.stringify({ 'decisionTableTypes': [ current.key ] }, null, 2),
                        success: function(data) {
                            $scope.$apply(function() {
                                loadJson(data[0]);
                            });

                            $('thead > tr :contains("Conditions"), tbody > tr :contains("Actions")').click();
                        }
                    });
                };

                $scope.addAction = function(event) {
                    $scope.table.actions.push({ expression: "" });
                    _.each($scope.table.rules, function(rule) {
                        rule.actions.push(false);
                    });
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    return false;
                };
                $scope.addCondition = function(event) {
                    $scope.table.conditions.push({ expression: "" });
                    _.each($scope.table.rules, function(rule) {
                        rule.values.push(null);
                    });
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    return false;
                };

                $scope.addRule = function(event) {
                    $scope.table.rules.push({
                        values: _.range(0, $scope.table.conditions.length).map(getNull),
                        actions: _.range(0, $scope.table.actions.length).map(getFalse)
                    });
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    return false;
                };
                $scope.removeRule = function(index, event) {
                    $scope.table.rules.splice(index,1);
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    return false;
                };

                $scope.removeCondition = function(index, event) {
                    $scope.table.conditions.splice(index,1);
                    _.each($scope.table.rules, function(rule) {
                        rule.values.splice(index,1);
                    });
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    return false;
                };
                $scope.removeAction = function(index, event) {
                    $scope.table.actions.splice(index,1);
                    _.each($scope.table.rules, function(rule) {
                        rule.actions.splice(index,1);
                    });
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    return false;
                };
                $scope.btnSaveDecisionTableJson = function() {
                    var current = $scope.selectedKey;
                    if (!current) {
                        notification.show("You must select a decision table.", "Save Decision Table");
                        return;
                    }
                    var dataObj = { 'decisionTableType': current.key,
                                    'decisionTableJson': angular.toJson($scope.table) };
                    $.ajax({
                        type: 'POST',
                        contentType: 'application/json',
                        url: url.resolve('/Config/DecisionTable/Save/'),
                        data: angular.toJson(dataObj),
                        success: function() {
                            notification.show('Saved successfully.', 'Decision Table Save');
                        }
                    });
                };
            };

            angular.module('DecisionTable', [])
                .controller('DecisionTableExplorerCtrl', ['$scope', '$http', decisionTableExplorerCtrl]);

            return angular.bootstrap(document, ['DecisionTable']);
        }
    };
});