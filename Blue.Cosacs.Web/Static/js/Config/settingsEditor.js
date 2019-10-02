/* global define */
define(['jquery', 'underscore', 'angular', 'url', 'moment', 'alert', 'spa', 'jquery.pickList', 'angularShared/app',
        'notification', 'angular.ui', 'angular-resource', 'lib/select2'],

    function ($, _, angular, url, moment, alert, spa, pickList, app, notification) {
        'use strict';
        return {
            init: function ($el) {
                var settingsEditorCtrl = function ($scope, xhr) {
                    // Initial Setup
                    $scope.MenuItems = null;
                    $scope.SelectedModuleData = null;
                    $scope.activeItem = null;
                    $scope.editingCtn = 0;

                    $scope.regexpHours = /^((0\d)|(1\d)|(2[0-3]))$/;
                    $scope.regexpMinutes = /^([0-5]\d)$/;
                    $scope.regexpInteger = /^([\-+]{0,1}(1?\d{1,9}|20\d{1,8}|21[0-3]\d{1,7}|214[0-6]\d{1,6}|2147[1-3]\d{1,5}|21474[0-7]\d{1,4}|214748[0-2]\d{1,3}|2147483[0-5]\d\d|21474836[0-3]\d|214748364[0-7])|[+]{0,1}2147483648)$/;

                    var getDecimalRegExp = function (precision, scale) {
                        var p = precision;
                        var s = scale;
                        var regexp = "";
                        if (s <= 0) {
                            regexp = "^(\\d{1," + (p - s) + "}|\\d{1," + (p - s) + "})$";
                        } else {
                            regexp = "^(\\d{1," + (p - s) + "}|\\d{1," + (p - s) + "}\\.\\d{1," + s + "})$";
                        }
                        return new RegExp(regexp);
                    };

                    var parseDateTime = function (dt) {
                        var dtParts = dt.match(/(\d+)/g);
                        var retVal = null;
                        if (dtParts.length >= 5) { // month is 0-based
                            retVal = new Date(dtParts[0], dtParts[1] - 1, dtParts[2], dtParts[3], dtParts[4]);
                        } else if (dtParts.length >= 3) {
                            retVal = new Date(dtParts[0], dtParts[1] - 1, dtParts[2]);
                        } else {
                            retVal = new Date(0, 0, 0, 0, 0, 0, 0);
                        }
                        return retVal;
                    };

                    var getDateTimeHoursString = function (dt) {
                        var result = dt.getHours(),
                            retVal = null;

                        if (result === 0) {
                            retVal = "00";
                        } else if (result < 10) {
                            retVal = "0" + result;
                        } else {
                            retVal = String(result);
                        }

                        return retVal;
                    };

                    var getDateTimeMinutesString = function (dt) {
                        var result = dt.getMinutes(),
                            retVal = null;
                        if (result === 0) {
                            retVal = "00";
                        } else if (result < 10) {
                            retVal = "0" + result;
                        } else {
                            retVal = String(result);
                        }

                        return retVal;
                    };

                    $scope.settingItemEdit = function (item, event) {
                        item.editMode = true;

                        if (item.Type === 7) {
                            item.options = {};
                            xhr.get(url.resolve('/PickLists/ListDetails/') + item.CodeList)
                                .success(function (data) {
                                    _.each(data.list, function (listitem) {
                                        item.options[listitem.k] = listitem.v;
                                    });
                                });
                        }
                        $scope.editingCtn = $scope.editingCtn + 1;
                        event.preventDefault();
                    };

                    $scope.checkIfSaveButtonDisabled = function (item) {
                        return !this.formObj.$valid;
                    };

                    $scope.settingsEditSaveClick = function (item, event) {
                        var itemValue = item.editValue; // the edit value will be saved

                        if ((item.Type !== 10) &&
                            ((item.Type !== 4 && itemValue !== null && itemValue !== "") ||
                                (item.Type === 4 && item.editValueHours !== "" && item.editValueMinutes !== ""))) // don't save empty values
                        {
                            if (item.Type === 3) {
                                itemValue = new Date(itemValue.getFullYear(), itemValue.getMonth(),
                                    itemValue.getUTCDate()); // in JS UTCDate is the day of month!!!
                            } else if (item.Type === 4) {
                                itemValue = new Date(itemValue.getFullYear(), itemValue.getMonth(),
                                    itemValue.getUTCDate(),
                                    item.editValueHours, item.editValueMinutes);
                            } else if (item.Type === 9) {
                                item.List = itemValue.split("\n");
                            }

                            item.value = itemValue;

                            var request = {
                                id: item.Id,
                                namespace: item.namespace,
                                value: itemValue
                            };

                            httpSettingsSave(request);

                        } else if (item.Type === 10) {
                            if ($scope.uploadDone) {
                                notification.show('There is already a file upload in progress. Please wait for that upload to finish');
                                return;
                            }

                            uploadFile(item);

                            $.when($scope.uploadDone).then(function (uploadResponse) {
                                if (uploadResponse) {
                                    var request = {
                                        id: item.Id,
                                        namespace: item.namespace,
                                        value: uploadResponse.Id
                                    };

                                    httpSettingsSave(request);
                                    item.value = uploadResponse.Id;
                                    item.imageUrl = url.resolveImageFile(uploadResponse.Id);
                                }

                                $scope.uploadDone = null;
                                $scope.progress = 0;
                                $scope.uploadInProgress = false;
                                $scope.editingCtn = $scope.editingCtn - 1;
                                item.editMode = false;
                            });
                            event.preventDefault();
                            return;

                        } else {
                            item.editValue = item.value;
                            if (item.Type === 4) {
                                item.editValueHours = item.valueHours;
                                item.editValueMinutes = item.valueMinutes;
                            }
                        }
                        $scope.editingCtn = $scope.editingCtn - 1;
                        item.editMode = false;
                        event.preventDefault();
                    };

                    var httpSettingsSave = function (request) {
                        xhr.post(url.resolve('/Config/Settings/Save'), request)
                            .success(function (data) {
                            }).error(function (data, status, headers, config) {
                                var d = data;
                                var s = status;
                                var h = headers;
                                var c = config;
                            });
                    };

                    $scope.saveInt = function (item) {
                        var inspef = item.editMode;
                    };

                    $scope.settingItemEditCancelled = function (item, event) {
                        item.editValue = item.value; // write over the edited value
                        item.editMode = false;
                        $scope.editingCtn = $scope.editingCtn - 1;
                        event.preventDefault();
                    };

                    $scope.ListAllValues = function (listId) {
                        xhr.get(url.resolve('/PickLists/ListDetails/') + listId)
                            .success(function (data) {
                                return data;
                            }).error(function () {
                                return null;
                            });
                    };

                    $scope.onFileSelect = function (setting, element) {
                        if (element !== undefined && element !== null && setting.Id !== undefined && setting.Id !== null) {
                            if (fileIsImageType(element.files[0])) {
                                $scope.$apply(function (scope) {
                                    scope.imageFiles[setting.Id] = element.files[0];
                                    scope.imageFiles[setting.Id].settingId = setting.Id;
                                    scope.uploadInProgress = false;
                                    scope.fileSelected = true;
                                });

                                try {
                                    var reader = new FileReader();
                                    reader.onload = function (e) {
                                        $('#' + setting.Id).attr('src', e.target.result);
                                    };
                                    reader.readAsDataURL(element.files[0]);
                                } catch (e) {

                                }
                            } else {
                                notification.show("This is not an image file.", "Upload");
                            }
                        }
                    };

                    var uploadFile = function (setting) {
                        $scope.uploadDone = new $.Deferred();
                        if ($scope.imageFiles !== undefined && $scope.imageFiles !== null && $scope.imageFiles[setting.Id] !== undefined) {
                            upload($scope.imageFiles[setting.Id]);
                        }
                    };

                    var fileIsImageType = function (file) {
                        var result = false;
                        if (file.type === 'image/gif' || file.type === 'image/jpg' || file.type === 'image/jpeg' || file.type === 'image/png') {
                            result = true;
                        }
                        return result;
                    };

                    var upload = function (imageFile) {
                        var fd = new FormData();
                        fd.append("key", imageFile.settingId);
                        fd.append("file", imageFile);
                        var xhr = new XMLHttpRequest();
                        xhr.addEventListener("load", uploadComplete, false);
                        xhr.addEventListener("error", uploadFailed, false);
                        xhr.addEventListener("abort", uploadCanceled, false);
                        var fileUploadUrl = url.resolve($el.data('settingsUploadUrl'));
                        xhr.open("POST", fileUploadUrl);
                        $scope.uploadInProgress = true;
                        // xhr.upload.onprogress = uploadProgress;
                        xhr.send(fd);
                    };

                    var uploadComplete = function (successResponse) {
                        if (successResponse !== undefined && successResponse !== null && successResponse.target !== undefined && successResponse.target !== null && successResponse.target.response !== undefined && successResponse.target.response !== null) {
                            var uploadedFileDetails = JSON.parse(successResponse.target.response);

                            $scope.uploadDone.resolve(uploadedFileDetails);
                        }

                        notification.show("File uploaded and saved successfully.", "Upload");
                    };

                    var uploadFailed = function () {
                        $scope.uploadDone.resolve();
                        notification.show("There was an error attempting to upload the file.", "Upload");
                    };

                    var uploadCanceled = function () {
                        $scope.uploadDone.resolve();
                        notification.show("The upload has been canceled by the user or the browser dropped the connection.", "Upload");
                    };

                    var uploadProgress = function (evt) {
                        $scope.$apply(function () {
                            if (evt.lengthComputable) {
                                $scope.progress = Math.round(evt.loaded * 100 / evt.total);
                            } else {
                                $scope.progress = 'Unknown';
                            }
                        });
                    };

                    $scope.menuItemsClick = function (item) {
                        if ($scope.editingCtn === 0) {
                            $scope.activeItem = item.module.Label;
                            xhr.get(url.resolve('/Config/Settings/Metadata') + '?moduleNamespace=' + item.module.Namespace + '&')
                                .success(function (moduleData) {
                                    if (moduleData) {
                                        var rawSettings = [];
                                        var rawSettingsTmp = moduleData.settings;

                                        var i;
                                        for (i = 0; rawSettingsTmp.length > i; i++) {
                                            var tmpCategory = rawSettingsTmp[i][0].category;
                                            tmpCategory = tmpCategory.replace(/^\s+|\s+$/g, ''); // like a trim
                                            if (tmpCategory === null || tmpCategory === "") {
                                                tmpCategory = "[no category]";
                                            }
                                            rawSettings = rawSettings.concat([
                                                {
                                                    settingsHeaderDesc: tmpCategory
                                                }
                                            ]);
                                            rawSettings = rawSettings.concat(rawSettingsTmp[i]);
                                        }
                                        var settings = [];
                                        for (i = 0; rawSettings.length > i; i++) {
                                            if (rawSettings.hasOwnProperty(i) && rawSettings[i].meta !== undefined) {
                                                rawSettings[i].meta.namespace = moduleData.module.Namespace;
                                                rawSettings[i].meta.textAreaRows = 4;
                                                if (rawSettings[i].meta.Type === 0) { // bit

                                                    if (rawSettings[i].value === "true" || rawSettings[i].value === "True") {
                                                        rawSettings[i].meta.value = true;
                                                        rawSettings[i].meta.editValue = true;
                                                    } else {
                                                        rawSettings[i].meta.value = false;
                                                        rawSettings[i].meta.editValue = false;
                                                    }
                                                } else if (rawSettings[i].meta.Type === 1) { // int

                                                    rawSettings[i].meta.value = Number(rawSettings[i].value);
                                                    rawSettings[i].meta.editValue = Number(rawSettings[i].value);
                                                } else if (rawSettings[i].meta.Type === 2) { // decimal

                                                    var precision = rawSettings[i].meta.Precision;
                                                    var scale = rawSettings[i].meta.Scale;
                                                    var decimalRegexp = getDecimalRegExp(precision, scale);
                                                    rawSettings[i].meta.decimal_regexp = decimalRegexp;
                                                    rawSettings[i].meta.decimal_title =
                                                        "Decimal(" + precision + "," + scale + ")";

                                                    rawSettings[i].meta.value = rawSettings[i].value;
                                                    rawSettings[i].meta.editValue = rawSettings[i].value;
                                                } else if (rawSettings[i].meta.Type === 3) { // date

                                                    rawSettings[i].meta.value = parseDateTime(rawSettings[i].value);
                                                    rawSettings[i].meta.editValue = parseDateTime(rawSettings[i].value);
                                                } else if (rawSettings[i].meta.Type === 4) { // datetime

                                                    rawSettings[i].meta.value = parseDateTime(rawSettings[i].value);
                                                    rawSettings[i].meta.editValue = parseDateTime(rawSettings[i].value);

                                                    rawSettings[i].meta.valueHours = getDateTimeHoursString(rawSettings[i].meta.value);
                                                    rawSettings[i].meta.editValueHours = getDateTimeHoursString(rawSettings[i].meta.value);

                                                    rawSettings[i].meta.valueMinutes = getDateTimeMinutesString(rawSettings[i].meta.value);
                                                    rawSettings[i].meta.editValueMinutes = getDateTimeMinutesString(rawSettings[i].meta.value);
                                                } else if (rawSettings[i].meta.Type === 5 || // string
                                                    rawSettings[i].meta.Type === 6 || // text
                                                    rawSettings[i].meta.Type === 7 || // codelist
                                                    rawSettings[i].meta.Type === 8) { // enum

                                                    rawSettings[i].meta.value = rawSettings[i].value;
                                                    rawSettings[i].meta.editValue = rawSettings[i].value;
                                                } else if (rawSettings[i].meta.Type === 9) { // list

                                                    rawSettings[i].meta.value = rawSettings[i].value;
                                                    rawSettings[i].meta.editValue = rawSettings[i].value;
                                                    rawSettings[i].meta.List = rawSettings[i].meta.value.split("\n");
                                                    rawSettings[i].meta.textAreaRows = rawSettings[i].meta.List.length + 1;
                                                } else if (rawSettings[i].meta.Type === 10) { // image

                                                    if ($scope.imageFiles === undefined || $scope.imageFiles === null) {
                                                        $scope.imageFiles = {};
                                                    }
                                                    rawSettings[i].meta.value = rawSettings[i].value;
                                                    rawSettings[i].meta.editValue = rawSettings[i].value;
                                                    rawSettings[i].meta.imageUrl = url.resolveImageFile(rawSettings[i].value);

                                                }
                                                settings.push(rawSettings[i].meta);
                                            } else {
                                                settings.push(rawSettings[i]);
                                            }
                                        }
                                        if (settings.length > 0) {
                                            $scope.SelectedModuleData = settings;
                                        } else {
                                            $scope.SelectedModuleData = null;
                                        }
                                    }
                                }).error(function () {
                                    alert('Could not load settings metadata.', 'Load Failed');
                                });
                        } else {
                            // the user is currently editing at least one setting
                            // so a different module cannot be selected

                            // don't know yet what to do in this case... :)
                            var i = "aiai"; // yep
                        }
                    };

                    $scope.getModulesMetadata = function () {
                        xhr.get(url.resolve('/Config/Settings/ModulesMetadata'))
                            .success(function (data, status, headers, config) {
                                $scope.MenuItems = data;
                            }).error(function () {
                                alert('Could not load settings metadata.', 'Load Failed');
                            });
                    };

                    $scope.getModulesMetadata();
                };

                settingsEditorCtrl.$inject = ['$scope', 'xhr'];

                app().controller('SettingsEditorCtrl', settingsEditorCtrl);

                return angular.bootstrap($el, ['myApp']);
            }
        };
    });