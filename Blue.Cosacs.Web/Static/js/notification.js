/*global define*/

//Notification
//-------------
//
//Notification module using growl.js
//Allows you to display two types of message 
//	* A message that will disappear after a timeout
//	* A message that will stay until explicitly closed
//
//Usage
//-------
//Include the module in your `require` call.
//
//`require(['notification'], function (notification) {});`
//
//To display a transient message
//
//`notification.show('This message will self-destruct in 3 seconds');`
//
//To display a persistent message
//
//`notification.showPersistent('Press the button to close this message');`
// When you show a persistent message you can pass in an optional id.
// This can be used to make sure the message is only shown once.
// You can also pass in this id to programmatically hide the notification.

define(['jquery', 'growl'], function ($) {
	'use strict';

	var Notification = {

		messages: {},

		// Show the message (with an optional title) and disappear after the timeout
		show: function (content, title) {
			$.Growl.show(content, {
				'title': title,
				'speed': 500,
				'timeout': 3000,
				'webnotification': false
			});
		},

		// Show the message (with an optional title) until closed by the user
		showPersistent: function (content, title, id) {
			if (id === undefined || id === null || !this.messages[id]) {
				var that = this;
				var message = $.Growl.show(content, {
					'title': title,
					'speed': 500,
					'timeout': false,
					'webnotification': false,
					'id': id,
					'callback': function (id) {
						that.messages[id] = undefined;
					}
				});
				if (id !== undefined && id !== null) {
					this.messages[id] = message;
				}
                $(document).on('pjax:start', function () {
                    if (id !== undefined && id !== null) {
                        that.hide(id);
                    } else {
                        if (message !== undefined && message !== null)
                        {
                            message.cancel();
                            message = undefined;
                        }
                    }
                });
			}
		},

		hide: function (id) {
			if (id !== undefined && id !== null) {
				var message = this.messages[id];
				if (message !== undefined && message !== null) {
					message.cancel();
					this.messages[id] = undefined;
				}
			}
		}
	};

	return Notification;
});