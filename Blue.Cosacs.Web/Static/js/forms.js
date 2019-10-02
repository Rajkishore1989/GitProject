(function() {

  define(['jquery', 'backbone', 'chosen.jquery'], function($, Backbone) {
    var ChosenView, SearchView, TableView, defaultChosenOptions;
    defaultChosenOptions = {
      allow_single_deselect: true
    };
    ChosenView = Backbone.View.extend({
      render: function() {
        var selectedValue,
          _this = this;
        selectedValue = this.$el.val();
        this.$el.html('');
        this.collection.forEach(function(item) {
          return _this.$el.append(_this.make('option', {
            value: item.id
          }, item.toString()));
        });
        this.$el.find("option[value=" + selectedValue + "]").attr('selected', 'selected');
        return this.update();
      },
      selectedId: function() {
        return this.$el.val();
      },
      update: function() {
        this.$el.trigger("liszt:updated");
        return this;
      },
      events: {
        'change': function() {
          return this.trigger('change', this);
        }
      }
    });
    SearchView = Backbone.View.extend({
      events: {
        "click button.clear": "clear",
        "click button.search": "search"
      },
      search: function() {
        var url;
        url = $(this.el).serialize();
        return false;
      },
      clear: function() {
        this.$el[0].reset();
        this.$('select').trigger("liszt:updated");
        return false;
      }
    });
    TableView = Backbone.View.extend({
      empty: function() {
        var empty, other;
        if (this.templateEmpty !== null) {
          other = this.$el.find('> tr:not(.empty)');
          empty = this.$el.find('> tr.empty');
          if (other.length === 0) {
            if (empty.length === 0) {
              return this.$el.append(this.templateEmpty());
            }
          } else {
            return empty.remove();
          }
        }
      }
    });
    return {
      setup: function(el) {
        el = el !== null ? $(el) : $('body');
        return el.find('select').chosen(defaultChosenOptions);
      },
      loader: function(el) {
        var $el, $loader;
        $loader = $('<span class="loader-element"></span>').appendTo(document.body);
        $el = $(el);
        $loader.css({
          top: $el.position().top + $el.height() / 2 - $loader.height() / 2,
          left: $el.position().left + $el.width() / 2 - $loader.width() / 2
        }).show();
        return {
          close: function() {
            return $loader.fadeOut().remove();
          }
        };
      },
      views: {
        ChosenView: ChosenView,
        SearchView: SearchView,
        TableView: TableView
      }
    };
  });

}).call(this);
