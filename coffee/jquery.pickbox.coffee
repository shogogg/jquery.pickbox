###
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
###
((global, $, EMPTY) ->
    # 定数
    KEY_RETURN = 13
    KEY_ESCAPE = 27
    KEY_UP = 38
    KEY_DOWN = 40
    WATCH_INTERVAL = 100
    CLOSE_DELAY = 150
    FILTER_DELAY = 300
    DATA = 'ui-pickbox-index'
    CLASS_BTN_HOVERED = 'ui-pickbox-btn-hovered'
    CLASS_ITEM_HOVERED = 'ui-pickbox-list-item-hovered'
    CLASS_INPUT_FOCUSED = 'ui-pickbox-input-focused'

    # ウィジェット本体
    widget = {
        # プロパティ
        box: null
        btn: null
        list: null
        items: null
        input: null
        wrapper: null
        lastValue: null
        watchTimer: null
        closeDelayTimer: null
        filterDelayTimer: null

        # オプション
        options: null

        # 初期化
        _init: ->
            elem = @element.hide().addClass('ui-pickbox-element')
            options = elem.children()
            items = options.map ->
                text = @innerHTML
                if text.length <= 0 then text = '&nbsp;'
                return '<li class="ui-pickbox-list-item">' + text + '</li>'

            @btn = $('<button type="button" class="ui-pickbox-btn">')
                .click(=> @toggle())
                .mouseover(=> @btn.addClass(CLASS_BTN_HOVERED))
                .mouseout(=> @btn.removeClass(CLASS_BTN_HOVERED))
                .text(options.filter(":selected").text())
                .insertAfter(elem)
            @input = $('<input type="text" class="ui-pickbox-input">')
                .keydown((event) => @_onKeyInput(event))
                .focus(=>
                    @input.addClass(CLASS_INPUT_FOCUSED)
                    @_startWatcher()
                    return
                )
                .blur(=>
                    @input.removeClass(CLASS_INPUT_FOCUSED)
                    @_close()
                    return
                )
            @list = $('<ul class="ui-pickbox-list">')
                .html(items.get().join(''))
            @items = @list
                .children()
                .click((event) => @_select(event.currentTarget))
                .mouseover(-> $(this).addClass(CLASS_ITEM_HOVERED))
                .mouseout(-> $(this).removeClass(CLASS_ITEM_HOVERED))
                .each((index) -> $.data(this, DATA, index))
            @wrapper = $('<div class="ui-pickbox-list-wrapper">')
                .css("position", "relative")
                .append(@list)
            @box = $('<form class="ui-pickbox">')
                .append(@input)
                .append(@wrapper)
                .hide()
                .appendTo("body")
            return

        # 選択UIを開く/閉じる
        toggle: ->
            return if @box.is(':visible') then @close() else @open()

        # 選択UIを開く
        open: ->
            offset = @btn.offset()
            @box.css({
                top: offset.top + @btn.outerHeight() + 1
                left: offset.left
            })
            @box.show 0, => @_hoverByIndex(@element[0].selectedIndex)
            boxWidth = @box.innerWidth()
            inputMargin = @input.outerWidth() - @input.innerWidth()
            @input.focus().width(boxWidth - inputMargin)
            return

        # 選択UIを閉じる
        close: ->
            if @watchTimer then global.clearInterval(@watchTimer)
            if @closeDelayTimer then global.clearTimeout(@closeDelayTimer)
            @box.hide(0, => @btn.focus())
            return

        # 選択UIを閉じる
        _close: ->
            if @closeDelayTimer then global.clearTimeout(@closeDelayTimer)
            callback = =>
                @close()
                return
            @closeDelayTimer = global.setTimeout(callback, CLOSE_DELAY)
            return

        # 要素による選択
        _select: (elem) ->
            elem = $(elem)
            if elem.length != 0
                @element.get(0).selectedIndex = $.data(elem[0], DATA)
                @element.change()
                @btn.text(elem.text())
                @close()
            return

        # INDEXによる選択
        _selectByIndex: (index) ->
            @_select(@items.get(index))
            return

        # キー入力イベント処理
        _onKeyInput: (event) ->
            item = EMPTY
            switch event.keyCode
                when KEY_UP
                    item = @_getSelected().removeClass(CLASS_ITEM_HOVERED).prevAll().filter(":visible:first")
                    if item.length == 0 then item = @items.filter(":visible:last")

                when KEY_DOWN
                    item = @_getSelected().removeClass(CLASS_ITEM_HOVERED).nextAll().filter(":visible:first")
                    if item.length == 0 then item = @items.filter(":visible:first")

                when KEY_RETURN
                    @_select(@_getSelected())

                when KEY_ESCAPE
                    @close()

                else
                    return true

            if item && item.length != 0 then @_hover(item)
            event.preventDefault()
            event.stopPropagation()
            return false

        # 指定された要素を選択
        _hover: (elem) ->
            $(".#{CLASS_ITEM_HOVERED}").removeClass(CLASS_ITEM_HOVERED)
            elem.addClass(CLASS_ITEM_HOVERED)
            top = elem.position().top
            wrapper = @wrapper
            elemHeight = elem.outerHeight()
            wrapperHeight = wrapper.height()
            scrollTop = wrapper.scrollTop()
            if top < 0
                wrapper.scrollTop(scrollTop + top)
            else if top + elemHeight > wrapperHeight
                wrapper.scrollTop(scrollTop + top + elemHeight - wrapperHeight)
            return

        # INDEXで指定された要素を選択
        _hoverByIndex: (index) ->
            @_hover(@items.eq(index))
            return

        # 選択中の要素を取得
        _getSelected: ->
            return @items.filter(".#{CLASS_ITEM_HOVERED}:first")

        # 入力内容の監視を開始
        _startWatcher: ->
            watch = =>
                value = @input.val()
                if value != @lastValue then @_filterItems(value)
                return
            @watchTimer = global.setInterval(watch, WATCH_INTERVAL)
            return

        # リスト一覧を絞り込む
        _filterItems: (value) ->
            items = @items
            @lastValue = value
            if @filterDelayTimer then global.clearTimeout(@filterDelayTimer)
            if value.length <= 0
                items.show()
            else
                @filterDelayTimer = global.setTimeout(=>
                    @_hover(items.hide().filter(':contains(' + value + ')').show().eq(0))
                    return
                , FILTER_DELAY)
            return
    }
    $.widget("ui.pickbox", widget)
    return
)(window, jQuery)
