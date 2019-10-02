/*global define*/
define(['underscore', 'jquery', 'Login', 'pjax', 'menu'], function(_, $, loginSetup, pjax, menu) {
    'use strict';
    var login = function() {
            var $login = loginSetup.loginInit();
            return $login.find('.failed')
                    .css('visibility', 'hidden')
                    .end()
                    .show().find('input[name=username]').focus();
        };
    return {
      login: login,
      go: pjax.go,
      recPass: function () {
          loginSetup.recPassInit();
          $('input[name=newPassword]').focus();
      },
      start: function(options) {
        _.defaults(options, {
            cleanUpBeforeNavigate: function() {}
        });
        menu.init(login);
        $('body').show();
        $('#page-heading').text(document.title);
      }
    };
  });

