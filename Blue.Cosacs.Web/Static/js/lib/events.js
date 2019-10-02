(function() {

  define(['jquery'], function($) {
    var Events, slice;
    Events = function() {};
    slice = Array.prototype.slice;
    Events.prototype.on = function(id, callback) {
      var topic;
      this.topics = this.topics || {};
      topic = this.topics[id] = this.topics[id] || $.Callbacks();
      topic.add.apply(topic, slice.call(arguments, 1));
      return this;
    };
    Events.prototype.off = function(id, callback) {
      var topic;
      topic = this.topics[id];
      if (this.topics && topic) {
        topic.remove.apply(topic, slice.call(arguments, 1));
      }
      return this;
    };
    Events.prototype.trigger = function(id) {
      var topic;
      topic = this.topics[id];
      if (this.topics && topic) {
        topic.fireWith(this, slice.call(arguments, 1));
      }
      return this;
    };
    return new Events();
  });

}).call(this);
