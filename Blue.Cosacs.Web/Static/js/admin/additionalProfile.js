/*global define*/
define(['jquery', 'url', 'alert', 'lib/events', 'module-activator', 'confirm', 'text!admin/Templates/profileTemplate.htm', 'underscore', 'lib/select2'], function($, url, alert, events, moduleActivator, confirm, profileTemplate, _) {
    'use strict';
    return {
        init: function($el) {
            var UserId, deleteProfile, displayProfileSelector, format, profilesActive, profilesList, profilesNotActive;
            profilesList = $($el.find('#profileAdd').data('profiles'));
            deleteProfile = $el.find('#profileAdd').data('delete');
            UserId = $el.find('#profileAdd').data('id');
            profilesNotActive = function(list) {
                return _.filter(list, function(p) {
                    return !p.Active;
                });
            };
            profilesActive = function(list) {
                return _.filter(list, function(p) {
                    return p.Active;
                });
            };
            format = function(item) {
                return item.ProfileName;
            };
            displayProfileSelector = function() {
                if (profilesNotActive(profilesList).length > 0) {
                    $el.find('#profileSelector').show();
                    return $el.find('#profileAdd').select2({
                        placeholder: "Select a Profile",
                        data: {
                            results: profilesNotActive(profilesList),
                            text: 'ProfileName'
                        },
                        formatSelection: format,
                        formatResult: format
                    });
                } else {
                    return $el.find('#profileSelector').hide();
                }
            };
            _.each(profilesActive(profilesList), function(row) {
                row.UserId = UserId;
                row.deleteProfile = deleteProfile;
                $el.find('#profiles').append(_.template(profileTemplate, row));
                return moduleActivator.execute($el.find('#profiles'), $el.find('#' + row.ProfileName));
            });
            displayProfileSelector();
            $el.find("#profiles").on("click", ".click.profile", function () {
                var profileId, selector;
                profileId = $(this).data('id');
                selector = $(this).data('selector');
                return confirm('Are you sure you want to remove this profile?', 'Remove Profile', function(ok) {
                    if (ok) {
                        return events.trigger('Admin.User.Profile.Remove', profileId, UserId, function(removed) {
                            if (removed) {
                                _.find(profilesList, function(p) {
                                    return p.id === profileId;
                                }).Active = false;
                                $el.find('.' + selector).remove();
                                return displayProfileSelector();
                            }
                        });
                    }
                });
            });
            return $el.find("#profileSelector").on("change", "#profileAdd", function(e) {
                var newProfile;
                newProfile = _.find(profilesNotActive(profilesList), function(p) {
                    return String(p.id) === e.val;
                });
                newProfile.UserId = UserId;
                newProfile.deleteProfile = deleteProfile;
                return $.ajax({
                    type: 'POST',
                    url: url.resolve('/Admin/Users/AddProfile'),
                    data: {
                        ProfileId: newProfile.id,
                        UserId: newProfile.UserId
                    },
                    success: function() {
                        $el.find('#profiles').append(_.template(profileTemplate, newProfile));
                        moduleActivator.execute($el.find('#profiles'), $el.find('#' + newProfile.ProfileName));
                        newProfile.Active = true;
                        return displayProfileSelector();
                    }
                });
            });
        }
    };
});