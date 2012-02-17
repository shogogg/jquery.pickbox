/*
 * jquery.pickbox.js
 *
 * Copyright 2012 shogo@studiofly.net
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/
(function(global, $, EMPTY) {
  var CLASS_BTN_HOVERED, CLASS_ITEM_HOVERED, CLOSE_DELAY, DATA, FILTER_DELAY, KEY_DOWN, KEY_ESCAPE, KEY_RETURN, KEY_UP, WATCH_INTERVAL, widget;
  KEY_RETURN = 13;
  KEY_ESCAPE = 27;
  KEY_UP = 38;
  KEY_DOWN = 40;
  WATCH_INTERVAL = 100;
  CLOSE_DELAY = 150;
  FILTER_DELAY = 300;
  DATA = 'ui-pickbox-index';
  CLASS_BTN_HOVERED = 'ui-pickbox-btn-hovered';
  CLASS_ITEM_HOVERED = 'ui-pickbox-list-item-hovered';
  widget = {
    box: null,
    btn: null,
    list: null,
    items: null,
    input: null,
    wrapper: null,
    lastValue: null,
    watchTimer: null,
    closeDelayTimer: null,
    filterDelayTimer: null,
    options: null,
    _init: function() {
      var elem, items, options,
        _this = this;
      elem = this.element.hide();
      options = elem.children();
      items = options.map(function() {
        var text;
        text = this.innerHTML;
        if (text.length <= 0) text = '&nbsp;';
        return '<li class="ui-pickbox-list-item">' + text + '</li>';
      });
      this.btn = $('<button type="button" class="ui-pickbox-btn">').click(function() {
        return _this.toggle();
      }).mouseover(function() {
        return _this.btn.addClass(CLASS_BTN_HOVERED);
      }).mouseout(function() {
        return _this.btn.removeClass(CLASS_BTN_HOVERED);
      }).text(options.filter(":selected").text()).insertAfter(elem);
      this.input = $('<input type="text" class="xui-pickbox-input">').keydown(function(event) {
        return _this._onKeyInput(event);
      }).focus(function() {
        return _this._startWatcher();
      }).blur(function() {
        return _this._close();
      });
      this.list = $('<ul class="ui-pickbox-list">').html(items.get().join(''));
      this.items = this.list.children().click(function(event) {
        return _this._select(event.currentTarget);
      }).mouseover(function() {
        return $(this).addClass(CLASS_ITEM_HOVERED);
      }).mouseout(function() {
        return $(this).removeClass(CLASS_ITEM_HOVERED);
      }).each(function(index) {
        return $.data(this, DATA, index);
      });
      this.wrapper = $('<div class="ui-pickbox-list-wrapper">').css("position", "relative").append(this.list);
      this.box = $('<form class="ui-pickbox">').append(this.input).append(this.wrapper).hide().appendTo("body");
    },
    toggle: function() {
      if (this.box.is(':visible')) {
        return this.close();
      } else {
        return this.open();
      }
    },
    open: function() {
      var offset,
        _this = this;
      offset = this.btn.offset();
      this.box.css({
        top: offset.top + this.btn.outerHeight() + 1,
        left: offset.left
      });
      this.box.show(0, function() {
        return _this._hoverByIndex(_this.element[0].selectedIndex);
      });
      this.input.focus();
    },
    close: function() {
      var _this = this;
      if (this.watchTimer) global.clearInterval(this.watchTimer);
      if (this.closeDelayTimer) global.clearTimeout(this.closeDelayTimer);
      this.box.hide(0, function() {
        return _this.btn.focus();
      });
    },
    _close: function() {
      var callback,
        _this = this;
      if (this.closeDelayTimer) global.clearTimeout(this.closeDelayTimer);
      callback = function() {
        _this.close();
      };
      this.closeDelayTimer = global.setTimeout(callback, CLOSE_DELAY);
    },
    _select: function(elem) {
      elem = $(elem);
      if (elem.length !== 0) {
        this.element.get(0).selectedIndex = $.data(elem[0], DATA);
        this.btn.text(elem.text());
        this.close();
      }
    },
    _selectByIndex: function(index) {
      this._select(this.items.get(index));
    },
    _onKeyInput: function(event) {
      var item;
      item = EMPTY;
      switch (event.keyCode) {
        case KEY_UP:
          item = this._getSelected().removeClass(CLASS_ITEM_HOVERED).prevAll().filter(":visible:first");
          if (item.length === 0) item = this.items.filter(":visible:last");
          break;
        case KEY_DOWN:
          item = this._getSelected().removeClass(CLASS_ITEM_HOVERED).nextAll().filter(":visible:first");
          if (item.length === 0) item = this.items.filter(":visible:first");
          break;
        case KEY_RETURN:
          this._select(this._getSelected());
          break;
        case KEY_ESCAPE:
          this.close();
          break;
        default:
          return true;
      }
      if (item && item.length !== 0) this._hover(item);
      event.preventDefault();
      event.stopPropagation();
      return false;
    },
    _hover: function(elem) {
      var elemHeight, scrollTop, top, wrapper, wrapperHeight;
      $("." + CLASS_ITEM_HOVERED).removeClass(CLASS_ITEM_HOVERED);
      elem.addClass(CLASS_ITEM_HOVERED);
      top = elem.position().top;
      wrapper = this.wrapper;
      elemHeight = elem.outerHeight();
      wrapperHeight = wrapper.height();
      scrollTop = wrapper.scrollTop();
      if (top < 0) {
        wrapper.scrollTop(scrollTop + top);
      } else if (top + elemHeight > wrapperHeight) {
        wrapper.scrollTop(scrollTop + top + elemHeight - wrapperHeight);
      }
    },
    _hoverByIndex: function(index) {
      this._hover(this.items.eq(index));
    },
    _getSelected: function() {
      return this.items.filter("." + CLASS_ITEM_HOVERED + ":first");
    },
    _startWatcher: function() {
      var watch,
        _this = this;
      watch = function() {
        var value;
        value = _this.input.val();
        if (value !== _this.lastValue) _this._filterItems(value);
      };
      this.watchTimer = global.setInterval(watch, WATCH_INTERVAL);
    },
    _filterItems: function(value) {
      var items,
        _this = this;
      items = this.items;
      this.lastValue = value;
      if (this.filterDelayTimer) global.clearTimeout(this.filterDelayTimer);
      if (value.length <= 0) {
        items.show();
      } else {
        this.filterDelayTimer = global.setTimeout(function() {
          _this._hover(items.hide().filter(':contains(' + value + ')').show().eq(0));
        }, FILTER_DELAY);
      }
    }
  };
  $.widget("ui.pickbox", widget);
})(window, jQuery);
