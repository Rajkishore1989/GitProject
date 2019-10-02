(function() {

  define(['jquery', 'url', 'module-activator'], function($, url, moduleActivator) {
    return {
      init: function(options) {
        var Active, NotActive, defaultFormat, displayProfileSelector;
        this.list = options.list;
        this.listDisplayMember = options.listDisplayMember;
        this.template = options.template;
        this.selector = options.selector;
        this.selectorParent = options.selectorParent;
        this.outputParent = options.outputParent;
        this.userId = options.userId;
        this.format = options.format || defaultFormat;
        this.placeholder = options.placeholder;
        this.onModuleActivate = options.onModuleActivate;
        NotActive = function(list) {
          return _.filter(list, function(p) {
            return !p.Active;
          });
        };
        Active = function(list) {
          return _.filter(list, function(p) {
            return p.Active;
          });
        };
        defaultFormat = function(item) {
          return item.ProfileName;
        };
        displayProfileSelector = function() {
          if (NotActive(list).length > 0) {
            this.selectorParent.show();
            this.selector.select2({
              placeholder: this.placeholder,
              data: {
                results: NotActive(list),
                text: this.listDisplayMember
              },
              formatSelection: format,
              formatResult: format
            });
            return this.selector.select2("val", "");
          } else {
            return this.selectorParent.hide();
          }
        };
        _.each(Active(List), function(row) {
          row.UserId = UserId;
          outputParent.append(_.template(this.template, row));
          return onModuleActivate();
        });
        displayProfileSelector();
        this.outputParent.on("click", ".click.profile", function(e) {
          var profileId, selector;
          profileId = $(this).data('id');
          selector = $(this).data('selector');
          return $.ajax({
            type: 'POST',
            url: url.resolve('/Admin/Users/RemoveProfile'),
            data: {
              ProfileId: profileId,
              UserId: UserId
            },
            success: function(data) {
              _.find(profilesList, function(p) {
                return p.id === profileId;
              }).Active = false;
              $el.find('.' + selector).remove();
              return displayProfileSelector();
            }
          });
        });
        return this.selectorParent.on("change", this.selector, function(e) {
          var current;
          current = _.find(NotActive(List), function(p) {
            return String(p.id) === e.val;
          });
          current.UserId = this.userId;
          return $.ajax({
            type: 'POST',
            url: url.resolve('/Admin/Users/AddProfile'),
            data: {
              ProfileId: current.id,
              UserId: current.UserId
            },
            success: function(data) {
              this.outputParent.append(_.template(this.template, current));
              onModuleActivate();
              current.Active = true;
              return displayProfileSelector();
            }
          });
        });
      }
    };
  });

}).call(this);
