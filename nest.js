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
            maxDepth: 2,
            groupNamePlaceholder: 'Group Name'
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
          _byDomId = {},
          _head;

      // A nest group class
      var NestGroup = function(opts) {

        opts || (opts = {})

        var _this = this,
            $folder_prompt,
            _list_head,
            _list_tail,
            _next = null,
            _prev = null,
            group_item_level,
            _id = guid(),
            obj = {},
            src, dest;
        src = opts.src || false;
        dest = opts.dest || false;
        group = opts.group || false;
        level = (typeof opts.level === 'number') ? +opts.level : false;

        if (src && dest) {
          obj.parent = dest.parent;
          // Init from two objects
          merge.call(this);
        } else if (group && level >= 0) {
          // from a group of items
          var els = createGroupEl(level);
          obj.$el = els.$li;
          obj.$ = function(selector) {
            return $(selector, obj.$el);
          };
          obj.$ul = obj.$('ul');
          obj.$('span').html(group.$el.html())
          obj.$el.attr('id', group.$el.attr('id'));
          obj.$el.attr('nest-id', group.$el.attr('nest-id'));
          _id = obj.$el.attr('nest-id');
          els.$div.attr('nest-id', _id);
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
        obj.dispose  = dispose;

        // Group functions

        function createGroupEl(lvl, opts) {

          opts || (opts = {})

          // listeners
          function changeName() {
            obj.prev_name = $(this).html();
            $(this).html('');
            var $input = prompt();
            $li.before( $input );
            $input.focus();
          }

          // div css
          var group_item_div_css = {
            'display'       : 'none',
            'height'        : '90%',
            'width'         : '100%',
            'position'      : 'absolute',
            'z-index'       : 2000
          }

          // Create el
          var $ul, $li, $span, $div;
          var _this = this;
          $li = $(document.createElement('li'))
                .addClass("nest-li")
                .addClass("nest-li-group")
                .attr('nest-level', lvl);
          $div = $(document.createElement('div'))
                .addClass("nest-div")
                .css(group_item_div_css);
          $span = $(document.createElement('span'))
                .addClass('nest-span')
                .css({
                  'display'    : 'block',
                  'float'      : 'none',
                  'min-height' : 0,
                  'z-index'    : 1500,
                  'height'     : 'auto'
                });
          $ul = $(document.createElement('ul'))
                .addClass("nest-ul");
          $span.mouseenter(function() {
            bindDrags($li);
            $li.unbind('dragstart');
            $li.attr('draggable', false);
          });
          $span.dblclick(changeName);
          bindDrags( $div );
          $li.append($span)
             .append($div)
             .append($ul);
          if (opts.listify) {
            $li.css('list-style-type', 'none');
          };
          listify($li);
          return {
            $li: $li,
            $ul: $ul,
            $span: $span,
            $div: $div
          };
        };

        function merge() {

          // Check if need to remove previous parent
          if (!src.prev && !src.next) {
            var parent = src.parent;
            // Trigger group:remove event
            var e = $.Event('group:remove', {
              $el   : parent.$el.clone(),
            });
            parent.$el.remove();
            parent.parent.$el.trigger(e);
            // parent.parent.unlisten();
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
              if (src.next) {
                src.next.prev = obj;
              };
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
              if (src.next) {
                src.next.prev = obj;
              };
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

          // listeners
          function changeName() {
            obj.prev_name = $(this).html();
            $(this).html('');
            var $input = prompt();
            $li.before( $input );
            $input.focus();
          }
          obj.changeName = changeName;

          var els = createGroupEl.call(this, dest.level, {listify: true});
          els.$div.attr('nest-id', els.$li.attr('nest-id'));
          dest.$el.after(els.$li);
          els.$ul.append(dest.$el).append(src.$el);
          els.$div.mouseover(function() {
            this.remove();
          });
          this.$el = els.$li;
          this.$ul = els.$ul;
          this.$span = els.$span;
          this.$div  = els.$div;
          this.$ = function(selector) {
            return $(selector, _this.$el);
          };

          group_item_level = dest.level + 1;

          // Prompt for folder name
          $folder_prompt = prompt();
          els.$li.before( $folder_prompt );
          $folder_prompt.focus();

          // Set ID
          els.$li.attr('nest-id', _id);
          els.$div.attr('nest-id', _id);

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
        function add(item, opts) {
          opts || (opts = {})
          // reset css
          item.$el.css('color', '');
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
          if (!this.head) {
            this.head = item;
          };
          if (this.tail) {
            this.tail.next  = item;
            item.prev       = this.tail;
            this.tail       = item;
            this.tail.next  = null;
          } else {
            this.tail = item;
          }

          item.parent = this;
          if (this.level === undefined) {
            this.setLevel(0);
          };
          this.tail.setLevel(this.level + 1);
          this.$ul.append(this.tail.$el);

          // Trigger item:add event
          if (!opts.silent) {
            var e = $.Event('item:add', {
              $el    : this.tail.$el,
              $group : this.$el
            });
            this.$el.trigger(e);
            // Trigger item:remove event
            if (ex_parent) {
              var e = $.Event('item:remove', {
                $from : ex_parent.$el,
                $el   : this.tail.$el,
              });
              ex_parent.$el.trigger(e);
            };
          };

          if (delete_parent && ex_parent) {
            if (!opts.silent) {
              // Trigger group:remove event
              var e = $.Event('group:remove', {
                $el   : ex_parent.$el.clone(),
              });
              ex_parent.$el.html(ex_parent.$('.nest-span').html()).removeClass('nest-li-group');
              ex_parent.parent.$el.trigger(e);
            };
            ex_parent.group = false;
            ex_parent.$el.remove();
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

        function dispose() {
          var item = this.head, next = item;
          while(next) {
            next = next.next;
          }
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
            _byDomId[item.$el.attr('id')] = item;
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
          // group.listen();
          prev = null;
          return group;
        },

        reset: function(arr) {

          // recursive
          function reset(group, array) {
            var item, g;
            var _this = this;
            // use group.$el.append to add to this list

            [].forEach.call(array, function(o) {
              // detect groups
              if (o.children && o.children.length) {
                // create new group
                g = new NestGroup({group: _byDomId[o.id], level: _byDomId[o.children[0].id].level});
                _store[g.id] = g;
                group.add(g, {silent: true});
                bindDrags(group.$el);
                listify(group.$el);
                reset(g, o.children);
                g.fresh([].map.call(o.children, function(p){return _byDomId[p.id].id}));
              } else {
                // get element
                item = _byDomId[o.id];
                bindDrags(item.$el);
                listify(item.$el);
                group.add(item, {silent: true});
              }
            });


          };

          // Empty everything
          this.clear();

          // Create a new Nest Group
          var item, prev, group;

          group = new NestGroup();
          group.setEl($main_ul);
          group.setUl(group.$el);
          group.$el.attr('nest-id', group.id);
          $main_overlay.attr('nest-id', group.id);
          _store[group.id]  = group;
          main_group = group;

          reset(main_group, arr);
          main_group.$el.attr('draggable', false);
          main_group.fresh([].map.call(arr, function(p){return _byDomId[p.id].id}));
        },

        get: function(id) {
          return _store[id];
        },

        clear: function() {
          $('.nest-ul.main', $main).empty();
          for (i in _store) {
            _store[i].parent = null;
            _store[i].next = null;
            _store[i].prev = null;
            _store[i].setLevel(0);
            if (_store[i].group) {
              delete _store[i];
            };
          }
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
            // throw new Error("Can't nest deeper than " + Nest.options.maxDepth);
            return false;
          };

          // Max depth check
          if (src.group) {
            if (src.deepest() + 1 > Nest.options.maxDepth) {
              return error();
            };
          } else if (dest.group && dest.$el != main_group.$el) {
            if (dest.deepest() > Nest.options.maxDepth + 1) {
              return error();
            };
          } else {
            if (dest.level + 1 > Nest.options.maxDepth) {
              return error();
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
            group = new NestGroup({src: src, dest: dest});
            _groups[group.id] = group;
            _store[group.id]  = group;
            group_forming = group;
            return group;
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
        group_forming,
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

    function confirmGroupName(v) {
      var $input = $('.nest-folder-input-prompt', $main);
      var $span = $input.next().children(":first");
      var old_name = $span.html();
      $span.html(v);
      $input.next().css('list-style-type', "");
      $input.val('').remove();
      // Trigger name:change event
      var id = $span.parent('li.nest-li').attr('nest-id');
      var e = $.Event('name:change', {
        old_name   : tracker.get(id).prev_name,
        new_name   : v
      });
      tracker.get(id).$el.trigger(e);
      $span.dblclick(tracker.get(id).changeName);
      // Trigger group:add event if a group is being formed
      if (group_forming) {
       var e = $.Event('group:add', {
         $group  : group_forming.$el,
         $head   : group_forming.head.$el,
         $tail   : group_forming.tail.$el,
         name    : v
       });
       group_forming.$el.parent('.nest-li-group').trigger(e);
       group_forming = false;
      };
    };

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
          confirmGroupName(v);
         } 
        };
      }

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
        'position'            : 'relative',
        'background'          : 'transparent',
        'border-style'        : 'none',
        'font-size'           : '0.9em',
        'font-weight'         : '300',
        'border'              : 'none',
        'margin'              : '0 0 0.4em 0.3em',
        'padding'             : '0',
        'line-height'         : '2em',
        '-webkit-box-shadow'  : 'none',
        '-moz-box-shadow'     : 'none',
        'box-shadow'          : 'none',
        'z-index'             : '1500'
      };

      function onFocus() {
        $(this).css({
          'outline': 'none'
        })
      };

      return $(document.createElement('input'))
             .attr('type', 'text')
             .attr('placeholder', Nest.options.groupNamePlaceholder)
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
      bindDrags( $('.nest-li-group:not(.main)', $main) )
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

      // if hovering over a nest item that would throw level error
      if (this_nest_level + 1 > Nest.options.maxDepth) {
        return false;
      };

      // intent to put back in main container
      if (this_nest_level === 1 && src.level > 1 && !main_overlayed) {
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

      if (this.last_handled) {
        if (Number(new Date) - this.last_handled < 500) {
          return;
        };
        this.last_handled = null;
      } else {
        this.last_handled = Number(new Date);
      }

      if (e.originalEvent) {
        e = e.originalEvent;
      };

      if (e.stopPropagation) {
        e.stopPropagation(); // stops the browser from redirecting.
      };

      // If there's an active input, don't allow more grouping
      if ($('.nest-folder-input-prompt').length) {
        if (!$('.nest-folder-input-prompt').val()) {
          return false;
        };
      };

      // Evaluate condition
      dest_id = $(this).attr('nest-id');
      if (dest_id === src_id) return false; // same element dropping on itself
      tracker.eval(src_id, dest_id);
    };

    Plugin.prototype = {

      init: function() {

        // If init with options of array
        // check if this $el has been initiated
        // if (this.$el.hasClass('nest-ul')) {
        //   return this.eval();
        // };

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
      },

      eval: function(options) {
        var method = options['method'],
            params = options['arguments'];

        if (this[method]) {
          this[method].apply(this, params);
        } else {
          throw new Error('Nest: no method ' + method);
        }

      },

      add: function($group, $item) {
        if (!$group.length) {
          throw new Error('Group selector not in DOM.');
        };
        if (!$item.length) {
          throw new Error('Selector to be added not in DOM.');
        };
        var nest_group, nest_item;

        nest_group = tracker.get($group.attr('nest-id'));
        nest_item = tracker.get($item.attr('nest-id'));
        nest_group.add(nest_item);
      },

      merge: function(group_id, group_name, $src, $dest) {
        var group = tracker.eval($src.attr('nest-id'), $dest.attr('nest-id'))
        confirmGroupName(group_name);
        group.$el.attr('id', group_id);
      },

      remove: function($el) {
        var nest_item = tracker.get($el.attr('nest-id')),
            parent    = nest_item.parent;
        // head
        if (nest_item.id === parent.head.id) {
          parent.head = nest_item.next;
          nest_item.prev = null;
        } else if (nest_item.id === parent.tail.id) {
          // tail
          nest_item.prev.next = null;
          parent.tail = nest_item.prev;
        } else {
          // anywhere in the middle
          nest_item.prev.next = nest_item.next;
          nest_item.next.prev = nest_item.prev;
        }

        // delete nest item
        if (nest_item.group) {
          nest_item.dispose();
        };
        delete nest_item;

        // remove $el
        $el.remove();

      },

      reset: function(arr) {
        tracker.reset(arr);
      }

    };

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function ( options ) {
      var main_arguments = arguments;
      return this.each(function () {
        if (!$.data(this, "plugin_" + pluginName)) {
          $.data(this, "plugin_" + pluginName, new Plugin( this, options ));
        } else if(typeof options === 'string'){
          var plugin = $.data(this, "plugin_" + pluginName);
          // grab params
          var method_params = {},
              slice         = Array.prototype.slice;

          method_params['method']    = main_arguments[0];
          method_params['arguments'] = slice.call(main_arguments, 1);
          plugin.eval(method_params);
        }
      });
    };

})( jQuery, window, document );