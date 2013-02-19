/*
 *  Project: Nest
 *  Description: Allows nesting/grouping of list by drag and drop
 *  Author: Thomas Loh
 *  License:
 */

// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function ( $, window, document, undefined ) {

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
            maxDepth: 1
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

    // css functions
    function highlight(arr) {

      arr.each(function() {

        if (($(this).hasClass('nest-div') || 
            $(this).hasClass('nest-li')) && 
            !overlayed) {

          // overlaytimeout
          var _this = this;
          $('.nest-li > .nest-div', $main).hide();
          if ($(this).hasClass('nest-div') && Number(new Date()) - last_timeout_setup > 1000 && drag_goingon) {
            $('.nest-li > .nest-div', $main).show();
            last_timeout_setup = Number(new Date());
            timeout = setTimeout(function() {
              overlayed = false;
              $(_this).hide('slow', function() {
                $('.nest-li > .nest-div', $main).show();
                _nestedOverlay();
                $(this).remove();
              });
            }, 1500);
          };

          var drag_over_effect = {
            '-webkit-transition'      : 'box-shadow 1s ease',
            '-moz-transition'         : 'box-shadow 1s ease',
            '-o-transition'           : 'box-shadow 1s ease',
            '-ms-transition'          : 'box-shadow 1s ease',
            'transition'              : 'box-shadow 1s ease',
            'background'              : 'rgba(240, 240, 240, 0.8)',
            '-webkit-box-shadow'      : '0 3px 8px rgba(0, 0, 0, .25)',
            'box-shadow'              : '0 3px 8px rgba(0, 0, 0, .25)',
            '-webkit-border-radius'   : '4px',
            'border-radius'           : '4px',
            'border'                  : '3px dashed rgb(230, 230, 230)',
            'box-sizing'              : 'border-box',
            '-moz-box-sizing'         : 'border-box',
            '-webkit-box-sizing'      : 'border-box'
          }
          $(this).css(drag_over_effect);
          overlayed = true;
        };
      });
    };

    function unhighlight(arr) {
      arr.each(function() {

        var undrag_over_effect = {
          '-webkit-transition'      : '',
          '-moz-transition'         : '',
          '-o-transition'           : '',
          '-ms-transition'          : '',
          'transition'              : '',
          'background'              : '',
          '-webkit-box-shadow'      : '',
          'box-shadow'              : '',
          '-webkit-border-radius'   : '',
          'border-radius'           : '',
          '-webkit-background-clip' : '',
          'border'                  : '',
          'box-sizing'              : '',
          '-moz-box-sizing'         : '',
          '-webkit-box-sizing'      : ''
        }
        $(this).css(undrag_over_effect);
        overlayed = false;
      });
    };

    function dragged($el) {
      var dragged_effect = {
        'opacity'                 : '0.4',
        // 'background'              : 'rgba(230, 230, 230, 0.9)',
        '-webkit-box-shadow'      : '0 3px 8px rgba(0, 0, 0, .25)',
        'box-shadow'              : '0 3px 8px rgba(0, 0, 0, .25)',
        '-webkit-border-radius'   : '4px',
        'border-radius'           : '4px',
        'border'                  : '3px dashed rgb(240, 240, 240)',
        'box-sizing'              : 'border-box',
        '-moz-box-sizing'         : 'border-box',
        '-webkit-box-sizing'      : 'border-box'
      };
      $el.css(dragged_effect);
    };

    function undragged($el) {
      var undragged_effect = {
        'opacity'                 : '1',
        // 'background'              : '',
        '-webkit-box-shadow'      : '',
        'box-shadow'              : '',
        '-webkit-border-radius'   : '',
        'border-radius'           : '',
        '-webkit-background-clip' : '',
        'border'                  : '',
        'box-sizing'              : '',
        '-moz-box-sizing'         : '',
        '-webkit-box-sizing'      : ''
      };
      $el.css(undragged_effect);
    };

    function listify($el) {

      var list_item_css = {
        'height'    : 'auto',
        'width'     : 'auto',
        'z-index'   : 100,
        'position'  : 'relative'
      }

      var group_item_css = {
        'height'    : '100%',
        'position'  : 'relative'
      }

      $el.css(list_item_css);
      $el.mouseenter(function() {
        if (!$(this).hasClass('nest-li-group')) {
          $(this).css('color', '#3a93ac');
        };
      });
      $el.mouseleave(function() {
        $(this).css('color', '');
      });

      $('.nest-li-group', $el).css(group_item_css);
      $('.nest-ul', $el).css({
        'padding-bottom'  : '0.5em',
        'padding-left'    : '0.5em'
      });
    };

    // drag events
    var drag_events = ['dragstart', 'dragend', 'dragover', 'dragenter', 'dragleave', 'drop'];

    var tracker = (function(root) {

      var _store  = {},
          _groups = {},
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
          merge.call(this);
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
        obj.overlay  = overlay;
        obj.setEl    = setEl;
        obj.setUl    = setUl;
        obj.fresh    = fresh;
        obj.listen   = listen;
        obj.unlisten = unlisten;

        // Group functions

        function merge() {

          // Check if need to remove previous parent
          if (!src.prev && !src.next) {
            var parent = src.parent;
            // Trigger group:remove event
            var e = $.Event('group:remove', {
              $el   : parent.$el.clone(),
            });
            parent.$el.remove();
            parent.parent.listen();
            parent.parent.$el.trigger(e);
            parent.parent.unlisten();
            parent = null;
            delete parent;
          }

          // reset css
          src.$el.css('color', '');
          dest.$el.css('color', '');

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

          // div css
          var group_item_div_css = {
            'display'       : 'none',
            'height'        : '90%',
            'width'         : '100%',
            'position'      : 'absolute',
            'z-index'       : 2000
          }

          // listeners
          function changeName() {
            obj.prev_name = $(this).html();
            $(this).html('');
            $li.before( prompt() );
          }
          obj.changeName = changeName;

          // Create el
          var $ul, $li, $span;
          var _this = this;
          $li = $(document.createElement('li'))
                .addClass("nest-li")
                .addClass("nest-li-group")
                .attr('nest-level', dest.level);
          $div = $(document.createElement('div'))
                .addClass("nest-div")
                .css(group_item_div_css);
          $span = $(document.createElement('span'))
                .addClass('nest-span')
                .css({
                  'display'    : 'block',
                  'float'      : 'none',
                  'min-height' : 0,
                  'z-index'    : 1500
                })
          $ul = $(document.createElement('ul'))
                .addClass("nest-ul");
          $span.mouseenter(function() {
            bindDrags($li);
            $li.unbind('dragstart');
            $li.attr('draggable', false);
          });
          $span.dblclick(changeName);
          $span.mouseleave(function() {
            $(this).unbind();
          })
          bindDrags( $div );
          $li.append($span).append($div).append($ul)
              .css('list-style-type', 'none');
          listify($li);
          dest.$el.after($li);
          $ul.append(dest.$el).append(src.$el);
          $div.mouseover(function() {
            this.remove();
          });
          this.$el = $li;
          this.$ul = $ul;
          this.$span = $span;
          this.$div  = $div;
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
          obj.$span    = this.$span;
          obj.$div     = this.$div;
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
          // reset css
          $(item).css('color', '');
          // Listen for nest events
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

          // remove any overlay
          $('.nest-div', $main).remove();
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
          this.$el.on('name:change', function(e) {
            console.log('Name changed from ' + e.old_name + ' to ' + e.new_name);
          })
        };

        // Reattach overlay
        function overlay() {
          this.$div.css('display', 'block');
          this.$span.after(this.$div);
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
        listify(this.$el);
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
          _store[group.id]  = group;

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
          prev = null;
          return group;
        },

        get: function(id) {
          return _store[id];
        },

        groups: function(opt) {
          opt || (opt = {})
          var arr = [];
          for (i in _groups) {
            if (opt.exclude) {
              if (_groups[i].$div.attr('nest-id') !== opt.exclude) {
                arr[arr.length] = _groups[i];
              };
            } else{
              arr[arr.length] = _groups[i];
            }
          }
          return arr;
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
            return;
          };

          // Logistics
          if (dest.group) {
            // add to group
            dest.add(src);
          } else {
            // form new group
            group = new NestGroup(dest, src);
            _groups[group.id] = group;
            _store[group.id]  = group;
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
        overlayed,
        timeout,
        drag_goingon,
        last_timeout_setup = Number(new Date()),
        main_overlayed,
        overlayed_timeout = true,
        $main_overlay,
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
            $span,
            $ul;

        // No name entered
        if (!v) {
         // Hint
         return false;
        } else {
         // Detects Enter key
         if (key_code === 13) {
           $span = $(this).next().children(":first");
           var old_name = $span.html();
           $span.html(v);
           $(this).next().css('list-style-type', "");
           $(this).val('').remove();
           // Trigger name:change event
           var id = $span.parent('li.nest-li').attr('nest-id');
           var e = $.Event('name:change', {
             old_name   : tracker.get(id).prev_name,
             new_name   : v
           });
           tracker.get(id).$el.trigger(e);
           $span.dblclick(tracker.get(id).changeName);
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

      var input_css = {
        'position': 'relative',
        'background': 'transparent',
        'border-style': 'none',
        'font-size': '0.9em',
        'border': 'none',
        'margin': 0,
        'padding': 0,
        'line-height': '2em',
        '-webkit-box-shadow' : 'none',
        '-moz-box-shadow': 'none',
        'box-shadow': 'none',
        'z-index' : 1500
      };

      function onFocus() {
        $(this).css({
          'outline': 'none'
        })
      };

      return $(document.createElement('input'))
             .attr('type', 'text')
             .addClass('nest-folder-input-prompt')
             .keyup(keyupHandler)
             .css(input_css)
             .focus(onFocus)
             .blur(inputBlurHandler);
    };

    // Listeners
    // ------------------------
    var src_id,
        dest_id,
        dragged_nest_level;

    function _nestedOverlay() {
      // set up overlays
      if (tracker.get(src_id).parent) {
        if (tracker.get(src_id).parent.$div) {
          var arr = tracker.groups({
            exclude: tracker.get(src_id).parent.$div.attr('nest-id')
          });
        } else {
          var arr = tracker.groups();
        }
      };

      [].forEach.call(arr, function(o) {
        setTimeout(function() {
          o.overlay();
        }, 1);
      });
    };

    function dragStartHandler(e) {

      if (e.originalEvent) {
        e = e.originalEvent;
      };

      drag_goingon = true;

      // Tracks id of dragged item
      src_id = $(this).attr('nest-id');

      // Get nest level
      dragged_nest_level = tracker.get(src_id).level;

      // set up overlay
      clearTimeout(timeout);
      _nestedOverlay();

      $('.nest-li', $main).css('z-index', 0);
      bindDrags( $('.nest-li-group', $main) )
      $('.nest-li-group', $main).unbind('dragstart');
      bindDrags( $('.nest-div', $main) );
      bindDrags( $main_overlay );

      // Makes dragged item look opaque
      dragged( $(this) );

      // drag effect
      e.dataTransfer.effectAllowed = 'copy';
      // make a transparent img
      var drag_img = document.createElement('img');
      drag_img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      e.dataTransfer.setDragImage(drag_img, 0, 0);
    };

    function dragEndHandler(e) {

      drag_goingon = false;

      // Unbind unnecessary drag events
      $('.nest-li-group', $main).unbind(drag_events);

      // make sure all opaque
      $('.nest-li', $main).css('opacity', 1);

      // Makes previously dragged item opaque
      $('.nest-div', $main).unbind(drag_events);
      $('.nest-li').css('z-index', 1000);
      clearTimeout(timeout);
      undragged($(this));
      main_overlayed = false;
      overlayed = false;
      $main_overlay.unbind(drag_events);
      $main_overlay.remove();
      unhighlight($('.nest-div', $main))
      unhighlight($('li', $main))
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

      var this_nest_id    = $(this).attr('nest-id'),
          this_nest_level = +$(this).attr('nest-level'),
          src             = tracker.get(src_id);

      if (e.originalEvent) {
        e = e.originalEvent;
      };

      // If hovering within container
      if (src.parent && src.parent.id === this_nest_id) {
        return false;
      };

      // If hovering on itself
      if (this_nest_id === src_id) {return false};

      // intent to put back in main container

      if (this_nest_level === 0 && src.level > 0 && !main_overlayed) {
        $main_overlay.css('display', 'none')
        $main.prepend( $main_overlay );
        $main_overlay.show();
        bindDrags(     $main_overlay );
        highlight(     $main_overlay );
        main_overlayed = true;
        return false;
      };

      // otherwise just hightlight
      highlight($(this));

      return false;


    };

    function dragEnterHandler(e) {
    };

    function dragLeaveHandler(e) {
      var this_nest_id = $(this).attr('nest-id');
      if (e.originalEvent) {
        e = e.originalEvent;
      };
      if (this_nest_id === src_id) {return false};
      unhighlight($(this))
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
        $parent = $(document.createElement('div'))
                  .attr('id', 'nest-main')
                  .css('position', 'relative');
        $el.addClass('nest-ul main nest-li-group')
            .css('position', 'relative')
            .before($parent);
        $parent.append($el)

        // Add overlay
        var group_item_div_css = {
          'display'                 : 'none',
          'height'                  : '100%',
          'width'                   : '100%',
          'opacity'                 : 1,
          'position'                : 'absolute',
          'z-index'                 : 2000,
          'padding'                 : '1em'
        }
        $div = $(document.createElement('div'))
               .attr('class', 'nest-div')
               .css(group_item_div_css);
        $div.mouseover(function() {
          $(this).remove();
        })
        $main_overlay = $div;
        bindDrags( $div );
        $parent.prepend( $div );

        // Housekeeping
        maxDepth = this.options.maxDepth;
        $main = $parent;
        $main_ul = $el;
        Nest.options = this.options;

        // Initialize our tracker
        main_group = tracker.init( $el.children('li') );
        $div.attr('nest-id', main_group.id);
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