/*
 *  Project: Nest
 *  Description: Allows nesting/grouping of list by drag and drop
 *  Author: Thomas Loh
 *  License:
 */

// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function ( $, window, document, undefined ) {

  // Import stylesheet
  var stylesheetExists = false;
  $('link').each(function() { 
    if($(this).attr('href') === './css/nest.css') {
       stylesheetExists = true;
    }
  });

  if(stylesheetExists === false) {
    $('head').append('<link rel="stylesheet" href="./css/nest.css" type="text/css" />');
  }


    // undefined is used here as the undefined global variable in ECMAScript 3 is
    // mutable (ie. it can be changed by someone else). undefined isn't really being
    // passed in so we can ensure the value of it is truly undefined. In ES5, undefined
    // can no longer be modified.

    // window and document are passed through as local variable rather than global
    // as this (slightly) quickens the resolution process and can be more efficiently
    // minified (especially when both are regularly referenced in your plugin).

    // Create the defaults once
    var pluginName = "nest",
        defaults = {
            maxDepth: 2,
            title: 'List'
        };

    // The actual plugin constructor
    function Plugin( element, options ) {
      this.$w  = $(window);
      this.$el = $(element);
      this.options = $.extend( {}, defaults, options );
      this._defaults = defaults;
      this._name = pluginName;

      this.init();
    }

    // Internals
    // ------------------------
    // namespace
    var Nest = {
      options: null
    }

    var tracker = (function(root) {

      var _store = {},
          _head;

      // A nest group class
      var NestGroup = function(dest, src) {

        var _this = this,
            $folder_prompt,
            _list_head,
            _list_tail,
            _next = null,
            _prev = null,
            group_item_level,
            _id = guid(),
            obj = {};

        // Logistics

        // if they are neighbors
        if (dest.next == src) {
          if(src.next) {
            _next = src.next;
            src.next.prev = obj;
          }
          if(dest.prev) {
            _prev = dest.prev;
            dest.prev.next = obj;
          } else {
            _head = obj;
            src.next.prev = obj;
          }
        } else if (dest.prev == src) {
          if (dest.next) {
            _next = dest.next;
            dest.next.prev = obj;
          };
          if (src.prev) {
            _prev = src.prev;
            src.prev.next = obj;
          } else {
            _head = obj;
            src.next.prev = obj;
          }
        } else {
          // not neighbors
          if (dest.next) {
            _next = dest.next;
            dest.next.prev = obj;
          };

          if (dest.prev) {
            _prev = dest.prev;
            dest.prev.next = obj;
          };
          if (src.prev) src.prev.next = src.next;
          if (src.next) src.next.prev = src.prev;
        }

        // internal list
        _list_head = dest;
        _list_tail = src;
        dest.prev = null;
        dest.next = src;
        src.prev = dest;
        src.next = null;

        // Create el
        var $ul, $li, $span;
        $li = $(document.createElement('li'))
              .addClass("nest-li")
              .addClass("nest-li-group")
              .attr('nest-level', dest.level);
        $div = $(document.createElement('div'))
              .addClass("nest-div");
        $span = $(document.createElement('span'))
              .addClass('nest-span');
        $ul = $(document.createElement('ul'))
              .addClass("nest-ul");
        $span.mouseenter(function() {
          bindDrags($li);
          $li.unbind('dragstart');
          $li.attr('draggable', false);
        });
        $span.mouseleave(function() {
          $(this).unbind();
        })
        bindDrags($div);
        $li.append($span).append($div).append($ul);
        dest.$el.after($li);
        $ul.append(dest.$el).append(src.$el);
        this.$el = $li;
        this.$ = function(selector) {
          return $(selector, _this.$el);
        };

        group_item_level = dest.level + 1;

        // Prompt for folder name
        $folder_prompt = prompt();
        $li.before( $folder_prompt );
        $folder_prompt.focus();

        // Set ID
        this.$el.attr('nest-id', _id);
        $div.attr('nest-id', _id);

        // define props and api
        obj.$        = this.$;
        obj.$el      = this.$el;
        obj.group    = true;
        obj.prev     = _prev;
        obj.next     = _next;
        obj.level    = +this.$el.attr('nest-level');
        obj.id       = _id;
        obj.add      = add;
        obj.dump     = dump;
        obj.reset    = reset;
        obj.deepest  = deepest;
        obj.levelUp  = levelUp;
        obj.setLevel = setLevel;
        obj.head     = _list_head;
        obj.tail     = _list_tail;

        // Nest level handling
        dest.levelUp();
        src.setLevel(dest.level);

        // Group functions

        // Add a sub nest item
        function add(item) {
          // if they are neighbors
          if (this.next == item) {
            if(item.next) {
              item.next.prev = this;
            }
          } else if (this.prev == item) {
            if (item.prev) {
              item.prev.next = this;
            } else {
              _head = this;
              item.next.prev = this;
            }
          } else {
            // not neighbors
            if (item.prev) item.prev.next = item.next;
            if (item.next) item.next.prev = item.prev;
          }

          this.tail.next  = item;
          item.prev       = this.tail;
          this.tail       = item;
          this.tail.next  = null;
          this.tail.setLevel(group_item_level);

          this.$('ul:first').append(this.tail.$el);
        };

        // Get deepest
        function deepest() {
          var item = this.head,
              n, m, a = [];

          while(item) {
            m = (item.group) ? item.level + item.deepest() : item.level;
            a.push(m);
            item = item.next;
          }
          return Math.max.apply(Math, a);
        };

        // Reset/render the list again
        function reset() {
          var $li, $ul, item;
          // Clear
          $ul = this.$('ul');
          $ul.html('');
          // Reattach
          item = this.head;
          while(item) {
            if (item.group) item.reset();
            $ul.append(item.$el);
            item = item.next;
          }
        };

        function dump() {
          var item = this.head;
          while(item) {
            console.log(item.$el);
            item = item.next;
          }
        };

        function setLevel(v) {
          this.level = v;
          this.$el.attr('nest-level', this.level);
        };

        function levelUp() {
          this.level += 1;
          this.$el.attr('nest-level', this.level);
          var item = this.head;
          while(item) {
            item.levelUp();
            item = item.next;
          }
        };

        return obj;
      };

      // A nest item class 
      var NestItem = function($el) {

        var _this = this,
            _level;

        // bootstrap this nest item

        this.$el = $el
        this.$el.attr("draggable", "true")
           .attr("nest-level", 0)
           .attr('nest-id', guid())
           .addClass("nest-li");
        bindDrags(this.$el);
        this.$ = function(selector) {
          return $(selector, _this.$el);
        };

        _level = +this.$el.attr('nest-level');


        return {

          // Return a cached selector
          $: this.$,

          // Returns ID of this element
          id: this.$el.attr('nest-id'),

          level: _level,

          $el: this.$el,

          prev: null,

          next: null,

          levelUp: function() {
            this.$el.attr('nest-level', this.level + 1);
            this.level += 1;
          },

          levelDown: function() {
            this.$el.attr('nest-level', this.level - 1);
            this.level -= 1;
          },

          setLevel: function(v) {
            this.level = v;
            this.$el.attr('nest-level', v);
          }

        }
      };

      return {

        init: function(elements) {
          // Set appropriate classes for styling, events listeners
          var item, prev;
          elements.each(function() {
            item = new NestItem($(this));
            _store[item.id] = item;

            // Head
            if (!prev) {
              _head = item;
              _head.prev = null;
              prev  = item;
            } else {
              prev.next = item;
              item.prev = prev;
              prev = item;
            }
          });
          prev = null;
        },

        get: function(id) {
          return _store[id];
        },

        eval: function(src_id, dest_id) {

          var dest, src, group;

          dest = _store[dest_id];
          src  = _store[src_id];

          // Make sure destination level doesn't go beyond max depth
          function error() {
            // Hint
            throw new Error("Can't nest deeper than " + Nest.options.maxDepth);
            return;
          };
          if (src.group) {
            if (src.deepest() + 1 > Nest.options.maxDepth) {
              error();
            };
          } else if (dest.group) {
            if (dest.deepest() > Nest.options.maxDepth) {
              error();
            };
          } else {
            if (dest.level + 1 > Nest.options.maxDepth) {
              error();
            };
          }

          if (dest.group) {
            // add to group
            dest.add(src);
          } else {
            // form new group
            group = new NestGroup(dest, src);
            _store[group.id] = group;
          }

        }
      }

    })(Nest);

    // Helper vars
    // ------------------------
    var maxDepth,
        $main;

    // Helper functions
    // ------------------------

    // Checks if is a NaN
    function isNan(o) {
      return o !== o;
    };

    // Generates guid
    function guid() {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
                   .toString(16)
                   .substring(1);
      };
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
             s4() + '-' + s4() + s4() + s4();
    }

    // Checks if is array
    function isArray(o) {
      return o.constructor === Array;
    };

    // Makes an element draggable
    function draggable(o) {
      var arr;
      if (!isArray(o)) {
        arr = [o];
      } else {
        arr = o;
      }

      [].forEach.call(arr, function($el) {
        $el.attr('draggable', 'true');
      });

    };

    // Bind drag handler listeners
    function bindDrags($el, arr) {

      // Make it draggable
      draggable($el);

      function getKeys(o) {
        var keys = [];
        for (i in o) {
          keys.push(i);
        }
        return keys;
      };

      var map = {
        'dragstart'   : dragStartHandler,
        'dragend'     : dragEndHandler,
        'dragover'    : dragOverHandler,
        'dragenter'   : dragEnterHandler,
        'dragleave'   : dragLeaveHandler,
        'drop'        : dragDropHandler
      }

      var list = arr ? arr : getKeys(map);

      [].forEach.call(list, function(v, i, arr) {
        $el.bind(v, map[v]);
      });

    }

    // Input tag to prompt for folder name
    function prompt() {

      function keyupHandler(e) {
        var key_code = e.which,
            _this    = this,
            v        = this.value,
            $span;

        // No name entered
        if (!v) {
         // Hint
         return false;
        } else {
         // Detects Enter key
         if (key_code === 13) {
           $span = $(this).next().children(":first");
           $span.html(v);
           $(this).val('').remove();
         };
        }
      };

      function inputBlurHandler() {
        var v     = this.value,
            _this = this;
        if (!v) {
          setTimeout(function() {
            // Hint
            $(_this).focus();
          }, 1);
        };

        return true;
      };

      return $(document.createElement('input'))
             .attr('type', 'text')
             .addClass('nest-folder-input-prompt')
             .keyup(keyupHandler)
             .blur(inputBlurHandler);
    };

    // Listeners
    // ------------------------
    var src_id,
        dest_id,
        drag_start_time = Number(new Date());

    function dragStartHandler(e) {

      console.log(this)

      // Show overlay on groups
      $('.nest-div', $main).addClass('active');

      bindDrags( $('.nest-li-group', $main) )
      $('.nest-li-group', $main).unbind('dragstart');

      if (e.originalEvent) {
        e = e.originalEvent;
      };
      // Makes dragged item look opaque
      this.style.opacity = 0.4;

      // Tracks id of dragged item
      src_id = $(this).attr('nest-id');

    };

    function dragEndHandler(e) {
      // Show overlay on groups
      $('.nest-div').removeClass('active');

      // Unbind unnecessary drag events
      $('.nest-li-group', $main).unbind();

      // Makes previously dragged item opaque
      this.style.opacity = 1;
      $('ul', $main).removeClass('over');
      $('li', $main).removeClass('over');
    };

    function dragOverHandler(e) {
      if (e.preventDefault) {
        e.preventDefault();
      };
      return false;
    };

    function dragEnterHandler(e) {
      this.classList.add('over');
    };

    function dragLeaveHandler(e) {
      this.classList.remove('over');
    };

    function dragDropHandler(e) {

      if (e.originalEvent) {
        e = e.originalEvent;
      };

      if (e.stopPropagation) {
        e.stopPropagation(); // stops the browser from redirecting.
      };

      // Evaluate condition
      dest_id = $(this).attr('nest-id');
      if (dest_id === src_id) return false; // same element dropping on itself
      tracker.eval(src_id, dest_id);
    };

    Plugin.prototype = {

      init: function() {

        var $el = this.$el;
        $el.addClass('nest-ul main');

        // Add Title
        $el.before('<h2 id="nest-title">' + this.options.title + '</h2>');

        // Initialize our tracker
        tracker.init( $el.children('li') );

        // Housekeeping
        maxDepth = this.options.maxDepth;
        $main = $('ul.nest-ul.main');
        Nest.options = this.options;

      }

    };

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function ( options ) {
      return this.each(function () {
        if (!$.data(this, "plugin_" + pluginName)) {
            $.data(this, "plugin_" + pluginName, new Plugin( this, options ));
        }
      });
    };

})( jQuery, window, document );