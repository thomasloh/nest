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
            maxDepth: 2
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

        if (src && dest) {
          obj.parent = dest.parent;
          // Init from two objects
          initMerge.call(this);
        } else {
          // Quick/empty init

        }

        obj.group    = true;
        obj.id       = _id;
        obj.add      = add;
        obj.dump     = dump;
        obj.reset    = reset;
        obj.deepest  = deepest;
        obj.levelUp  = levelUp;
        obj.setLevel = setLevel;
        obj.setEl    = setEl;
        obj.setUl    = setUl;
        obj.fresh    = fresh;
        obj.listen   = listen;
        obj.unlisten = unlisten;

        // Group functions

        function initMerge() {
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
          bindDrags( $div );
          $li.append($span).append($div).append($ul);
          dest.$el.after($li);
          $ul.append(dest.$el).append(src.$el);
          this.$el = $li;
          this.$ul = $ul;
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
          obj.$ul      = this.$ul;
          obj.prev     = _prev;
          obj.next     = _next;
          obj.level    = +this.$el.attr('nest-level');
          obj.head     = _list_head;
          obj.tail     = _list_tail;
          obj.head.parent = obj;
          obj.tail.parent = obj;

          // Nest level handling
          dest.levelUp();
          src.setLevel(dest.level);
        };

        // Add a sub nest item
        function add(item) {
          this.listen();
          // Same level
          var delete_parent, ex_parent;
          if (item.level === this.level) {
            // if they are neighbors
            if (this.next == item) {
              if(item.next) {
                item.next.prev = this;
              }
            } else if (this.prev == item) {
              if (item.prev) {
                item.prev.next = this;
              } else {
                this.head = this;
                item.next.prev = this;
              }
            } else {
              // not neighbors
              if (item.prev) item.prev.next = item.next;
              if (item.next) item.next.prev = item.prev;
            }
          } else { // cross level
            if (item.prev) {
              item.prev.next = item.next;
              if (!item.prev.next) item.parent.head = item.prev;
            }
            if (item.next) {
              item.next.prev = item.prev;
              if (!item.next.prev) item.parent.tail = item.next;
            }
          }
          ex_parent = item.parent;
          if (!item.prev && !item.next) {
            delete_parent = true;
          }
          this.tail.next  = item;
          item.prev       = this.tail;
          this.tail       = item;
          this.tail.next  = null;
          item.parent = this;
          this.tail.setLevel(group_item_level);

          this.$ul.append(this.tail.$el);

          // Trigger item:add event
          var e = $.Event('item:add', {
            $el   : this.tail.$el,
          });
          this.$el.trigger(e);
          this.unlisten();
          // Trigger item:remove event
          var e = $.Event('item:remove', {
            $el   : this.tail.$el,
          });
          ex_parent.listen();
          ex_parent.$el.trigger(e);
          ex_parent.unlisten();

          if (delete_parent) {
            // Trigger group:remove event
            var e = $.Event('group:remove', {
              $el   : ex_parent.$el.clone(),
            });
            ex_parent.$el.remove();
            ex_parent.parent.listen();
            ex_parent.parent.$el.trigger(e);
            ex_parent.parent.unlisten();
            ex_parent = null;
            delete ex_parent;
          };
        };

        function unlisten() {
          this.$el.unbind('group:add');
          this.$el.unbind('group:remove');
          this.$el.unbind('item:add');
          this.$el.unbind('item:remove');
        };

        function listen() {
          this.$el.on('group:add', function(e) {
            console.log("New group created in:");
            console.log(this)
          })
          this.$el.on('group:remove', function(e) {
            console.log("Group removed from:")
            console.log(this)
          })
          this.$el.on('item:add', function(e) {
            console.log("New item added to:")
            console.log(this)
          })
          this.$el.on('item:remove', function(e) {
            console.log("Item removed from:")
            console.log(this)
          })
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

        function setEl($el) {
          this.$el = $el;
          this.$   = function(selector) {
            return $(selector, $el);
          };
        };

        function setUl($el) {
          this.$ul = $el;
        };

        function fresh(arr) {
          // arr is array of id
          var item,
              _this = this;

          [].forEach.call(arr, function(id, i) {
            item = _store[id];
            item.parent = _this;
            if (i === 0) {
              _this.head = item;
            }
            if (i === arr.length - 1) {
              _this.tail = item;
            };
          });

        };

        // Reset/render the list again
        function reset() {
          var $li, $ul, item;
          // Clear
          $ul = this.$ul;
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
            if (item.group) {
              console.log(item.dump())
            } else {
              console.log(item.$el);
            }
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
          var item, prev, group, arr = [];

          group = new NestGroup();
          group.setEl($main_ul);
          group.setUl(group.$el);

          elements.each(function(i) {
            item = new NestItem($(this));
            _store[item.id] = item;
            arr[arr.length] = item.id;

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
          group.fresh(arr);
          group.listen();
          main_group = group;
          prev = null;
        },

        get: function(id) {
          return _store[id];
        },

        getByClass: function(klass) {
          var item, arr = [];
          for(id in _store) {
            item = _store[id];
            if (item.$el.hasClass(klass)) arr[arr.length] = item;
          }
          return arr;
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

          // Max depth check
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

          // Check if dest is already containing src
          if (src.parent === dest) {
            return
          };

          // Check if intent is to put back into main container
          if (dest.level === 0 && src.level > 0) {
            main_group.add(src);
            return;
          };

          // Logistics
          if (dest.group) {
            // add to group
            dest.add(src);
          } else {
            // form new group
            group = new NestGroup(dest, src);
            _store[group.id] = group;
            // Trigger group:add event
            var e = $.Event('group:add', {
              $group  : group.$el,
              $head   : group.head.$el,
              $tail   : group.tail.$el
            });
            group.$el.parent('.nest-li-group').trigger(e);
          }
        }
      }

    })(Nest);

    // Helper vars
    // ------------------------
    var maxDepth,
        main_group,
        $main,
        $main_ul;

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

      [].forEach.call(list, function(v) {
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
        dragged_nest_level,
        drag_start_time = Number(new Date());

    function dragStartHandler(e) {

      if (e.originalEvent) {
        e = e.originalEvent;
      };

      bindDrags( $('.nest-li-group', $main) )
      $('.nest-li-group', $main).unbind('dragstart');

      // Makes dragged item look opaque
      this.style.opacity = 0.4;

      // Tracks id of dragged item
      src_id = $(this).attr('nest-id');

      // Get nest level
      dragged_nest_level = tracker.get(src_id).level;

      // drag effect
      e.dataTransfer.effectAllowed = 'move';
      // e.dataTransfer.setDragImage(document.createElement('img'), 0, 0);

    };

    function dragEndHandler(e) {

      // Unbind unnecessary drag events
      $('.nest-li-group', $main).unbind();

      // Makes previously dragged item opaque
      // $(this).css('top', '0');
      $('.nest-div:first', $main).removeClass('active');
      this.style.opacity = 1;
      $('ul', $main).removeClass('over');
      $('li', $main).removeClass('over');
    };

    function dragOverHandler(e) {
      if (e.originalEvent) {
        e = e.originalEvent;
      };
      if (e.preventDefault) {
        e.preventDefault();
      };

      // if (e.offsetY < 25) {
      //   $(this).css('top', '2em');
      // } else {
      //   $(this).css('top', '-2em');
      // }

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

        var $el = this.$el,
            $h2,
            $parent,
            $div;

        // Add parent
        $parent = $(document.createElement('div')).attr('id', 'nest-main');
        $el.addClass('nest-ul main nest-li-group');
        $el.before($parent);
        $parent.append($el)

        // Add overlay
        $div = $(document.createElement('div')).attr('class', 'nest-div');
        bindDrags( $div );
        $parent.prepend( $div );

        // Housekeeping
        maxDepth = this.options.maxDepth;
        $main = $parent;
        $main_ul = $el;
        Nest.options = this.options;

        // Initialize our tracker
        tracker.init( $el.children('li') );
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