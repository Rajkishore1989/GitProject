/*global define*/
define(['angular', 'angularShared/app', 'jquery', 'underscore', 'url', 'notification', 'moment', 'codeeditor',
    'codeeditor.xml', 'angular.ui', 'angular.bootstrap'],
function (angular, app, $, _, url, notification, moment, CodeMirror) {
    'use strict';

    return {
        init: function ($el) {
            $('.action-reprocess-all').click(function () {
                var refresh = $(this),
                    queueId = refresh.data('queue');

                return $.ajax({
                    url: url.resolve('/Hub/ReprocessQueue/'),
                    data: {
                        'queueId': queueId
                    },
                    type: 'POST',
                    success: function () {
                        refresh.remove();
                        notification.show('All poison messages in queue ' + queueId +
                            ' have been scheduled for reprocessing.', 'Poison Messages Reprocess');
                    }
                });
            });

            var hubController = function ($scope, $attrs, $location, $timeout, $dialog, xhr) {
                var idParam = $location.url().substring($location.url().lastIndexOf('/') + 1);
                var queueId = parseInt(idParam, 10);
                $scope.hubMessages = {};
                $scope.paging = {
                    poison: {
                        currentPage: 1
                    },
                    initial: {
                        currentPage: 1
                    }
                };

                if (!isNaN(queueId)) {
                    xhr({
                        method: 'GET',
                        url: url.resolve('/Hub/MessagesForQueue/' + queueId)
                    }).success(function (data) {
                        $scope.hubMessages = data;
                    });
                }

                $scope.reprocessPoisonMessage = function () {
                    var id = this.message.Id;
                    xhr({
                        method: 'POST',
                        url: url.resolve('/Hub/ReprocessQueueMessage/'),
                        data: {
                            'queueId': queueId,
                            'messageId': id
                        }
                    })
                    .success(function () {
                        $scope.hubMessages.Poison.Results = _.reject($scope.hubMessages.Poison.Results, function (message) {
                            return message.Id === id;
                        });
                        $scope.hubMessages.Poison.TotalResults -= 1;
                        notification.show('Message ' + id + ' has been moved to Pending.', 'Poison Message Reprocess');
                    });
                };

                var getPoisonMessagesByPage = function (pageNumber) {
                    xhr({
                        method: 'GET',
                        url: url.resolve('/Hub/PoisonMessagesForQueue/' + queueId),
                        params: {
                            pageNumber: pageNumber
                        }
                    }).success(function (data) {
                        $scope.hubMessages.Poison = data;
                    });
                };

                var getInitialMessagesByPage = function (pageNumber) {
                    xhr({
                        method: 'GET',
                        url: url.resolve('/Hub/InitialMessagesForQueue/' + queueId),
                        params: {
                            pageNumber: pageNumber
                        }
                    }).success(function (data) {
                        $scope.hubMessages.Initial = data;
                    });
                };

                var formatXml = function(xml) {
                    var formatted = '',
                        reg = /(>)(<)(\/*)/g;

                    while (xml.search('\r') > 0) {
                        xml = xml.replace('\r', ' ');
                    }
                    while (xml.search('\n') > 0) {
                        xml = xml.replace('\n', ' ');
                    }
                    while (xml.search('  ') > 0) {
                        xml = xml.replace('  ', ' ');
                    }
                    xml = xml.replace(reg, '$1\r\n$2$3');
                    var pad = 0;
                    $.each(xml.split('\r\n'), function(index, node) {
                        var indent = 0;
                        if (node.match( /.+<\/\w[^>]*>$/ )) {
                            indent = 0;
                        } else if (node.match( /^<\/\w/ )) {
                            if (pad !== 0) {
                                pad -= 1;
                            }
                        } else if (node.match( /^<\w[^>]*[^\/]>.*$/ )) {
                            indent = 1;
                        } else {
                            indent = 0;
                        }

                        var padding = '';
                        for (var i = 0; i < pad; i++) {
                            padding += '  ';
                        }

                        formatted += padding + node + '\r\n';
                        pad += indent;
                    });

                    return formatted;
                };

                $scope.showMessageViewer = function () {
                    var message = formatXml(this.message.Body);
                    if (!message) {
                        return;
                    }

                    $scope.showMessage = message;
                    $('#contentModal').find(".CodeMirror").remove();
                    $('#contentModal').modal("show");

                    $timeout(function () {
                        $scope.messageViewer = CodeMirror.fromTextArea(document.getElementById('messageBody'), {
                            mode: {
                                name: "xml",
                                alignCDATA: true
                            },
                            lineNumbers: true,
                            readOnly: true,
                            lineWrapping: true,
                            value: message
                        });
                    }, 0);
                };

                $scope.showExceptionViewer = function () {
                    var message = this.message.Exception;
                    if (!message) {
                        return;
                    }
                    $scope.showException = message;
                    $('#exceptionModal').find(".CodeMirror").remove();
                    $('#exceptionModal').modal("show");

                    $timeout(function () {
                        $scope.exceptionViewer = CodeMirror.fromTextArea(document.getElementById('messageExceptionBody'), {
                            lineNumbers: true,
                            readOnly: true,
                            lineWrapping: true,
                            value: message
                        });
                    }, 0);
                };

                $scope.closeMessageViewer = function () {
                    $scope.showMessage = false;
                    $('#contentModal').modal("hide");
                };

                $scope.closeExceptionViewer = function () {
                    $scope.showException = false;
                    $('#exceptionModal').modal("hide");
                };

                $scope.$watch(function (scope) {
                    return scope.paging.poison.currentPage;
                }, function (newValue) {
                    getPoisonMessagesByPage(newValue);
                });

                $scope.$watch(function (scope) {
                    return scope.paging.initial.currentPage;
                }, function (newValue) {
                    getInitialMessagesByPage(newValue);
                });
            };

            app()
                .filter('moment', function () {
                return function (dateString, format) {
                    return moment(dateString).format(format);
                };
            })
                .filter('prettyPrint', function () {
                return function (input) {
                    return input ? input.replace(/\r/g, '<br>') : '&nbsp;';
                };
            })
                .controller('HubController', ['$scope', '$attrs', '$location', '$timeout', '$dialog', 'xhr', hubController]);

            return angular.bootstrap($el, ['myApp']);
        }
    };
});