/*global define*/
define(['jquery', 'modal', 'url', 'typeahead', 'underscore'], function ($, modal, url, typeahead, _) {
	"use strict";
	var typeaheadDatums = [];
	var searchBox = $('#menu-hud-search');
	var user, menuOptions;

	if (localStorage.User) {
		user = JSON.parse(localStorage.User);
		menuOptions = user.MenuItems;

        var addItem = function (item, parentItem){
            var tokens = item.Title.split(' ');
            tokens.push(parentItem);
            typeaheadDatums.push({
                url: item.Url,
                tokens: tokens,
                value: parentItem + ': ' + item.Title
            });
        };
//almost there. the parent title is not correct
//        var handleItem = function  (valueToCheck, parentItemTitle){
//            if ((Array.isArray(valueToCheck)  && !valueToCheck.Items)|| (valueToCheck.Items && _.size(valueToCheck.Items) > 0)){
//                var t = valueToCheck.Items || valueToCheck;
//                _.each(t, function (current) {
//                    parentItemTitle += ': ' + current.Title;
//                    handleItem(current, parentItemTitle.trim());
//                });
//            }
//            else{
//                addItem(valueToCheck, parentItemTitle);
//            }
//        }
//        handleItem(menuOptions, '')
		_.each(menuOptions, function (item) {
			_.each(item.Items, function (subItem) {
                if ((subItem.Items && _.size(subItem.Items) > 0)){
                    _.each(subItem.Items, function (current) {
                        addItem(current, item.Title + ': ' + subItem.Title);
                    });
                }
                else{
                    addItem(subItem, item.Title);
                }
			});
		});
	}

	var navigateTo = function (requestedUrl) {
		url.go(requestedUrl);
	};

	searchBox.typeahead({
		local: typeaheadDatums
	});

	searchBox.on('typeahead:selected', function (event, item) {
		searchBox.typeahead('setQuery', '');
		$('#menu-hud').modal('hide');
		navigateTo(item.url);
	});

	var show = function () {
		$('#menu-hud').modal();
		searchBox.focus();
	};

	return {
		show: show
	};
});