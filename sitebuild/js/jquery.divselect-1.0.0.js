/*!
 * divselect jQuery plugin v1.0.0
 * Copyright (c) 2015.08.03. Horváth Norbert
 */
'use strict';

(function($){

    // Alapértelmezett beállítások
    var defaultOptions = {

        // ÁLLANDÓ TULAJDONSÁGOK (futási időben a regenerate() metódussal  módosíthatók)

        /**
         * Az elem felépítését leíró HTML template
         * @type String
         */
        template :
            '<div class="{cssPrefix}">' +
                '<input data-element="input" class="{cssPrefix}__input" type="hidden" ' +
                    'name="{select.name}" value="{select.val}" />' +
                '<div data-element="selector" class="{cssPrefix}__selector {select.readonly} {select.disabled}">' +
                '</div>' +
                '<div data-element="menu" class="{cssPrefix}__menu">' +
                    '{loop}' +
                        '{optgroup_start}' +
                            '<div data-element="group" class="{cssPrefix}__group">' +
                                '<div class="{cssPrefix}__group__title">{optgroup.label}</div>' +
                        '{/optgroup_start}' +
                        '{optgroup_end}' +
                            '</div>' +
                        '{/optgroup_end}' +
                        '{optionTags}' +
                            '<div data-element="item" class="{cssPrefix}__item {option.readonly} {option.disabled}">' +
                                '{option.html}' +
                            '</div>' +
                        '{/optionTags}' +
                    '{/loop}' +
                '</div>' +
                '<div data-element="background" class="{cssPrefix}__background"></div>' +
            '</div>',

        /**
         * Az előállított html kódban használt css osztályok előtagja
         * @type String
         */
        cssPrefix : 'divselect',

        /**
         * Az option tegeken belüli HTML kód (amelyik üres, annál a HTML forrásban szereplő kód lesz felhasználva)
         * @type Object
         */
        optionTags : {},

        /**
         * A külső div által a select elemtől örökölt attribútumok
         * @type Array
         */
        divAttributes : ['id', 'class', 'dir', 'lang', 'style', 'tabindex', 'title'],

        /**
         * További karakterek kereséshez
         * @type Object
         */
        characters : {
            'á' : {'general' : 222, 'opera' : 193},
            'é' : {'general' : 186, 'firefox' : 59, 'opera' : 201},
            'í' : {'general' : 226, 'opera' : 205},
            'ó' : {'general' : 187, 'firefox' : 107, 'opera' : 211},
            'ö' : {'general' : 192, 'opera' : 214},
            'ő' : {'general' : 219, 'opera' : 336},
            'ú' : {'general' : 221, 'opera' : 218},
            'ü' : {'general' : 191, 'opera' : 220},
            'ű' : {'general' : 220, 'opera' : 368}
        },

        /**
         * Önálló elemek az option tegeken belül (nem zárják be a select-et; option-on belüli szelektor)
         * @type String
         */
        notBubbling : 'input,select,textarea',

        // DINAMIKUS TULAJDONSÁGOK (futási időben az option() metódussal módosíthatók)

        /**
         * A divselect readonly tulajdonsága
         * (a kiválasztott értéket nem tudjuk megváltoztatni)
         * @type Boolean
         */
        readonly : false,

        /**
         * A divselect disabled tulajdonsága
         * (a kiválasztott érték nem kerül továbbításra űrlapelküldés esetén, és az elem nem reagál semmilyen
         * felhasználói interakcióra)
         * @type Boolean
         */
        disabled : false,

        /**
         * Több elem is kiválasztható a divselectben
         * @type Boolean
         */
        multiple : false,

        /**
         * Page down és page up billenytyűk lenyomásakor történő ugrás nagysága
         * @type Number
         */
        pageStep : 10,

        /**
         * Várakozás a következő betű leütéséig (ms)
         * @type Number
         */
        keyDownWait : 1000,

        /**
         * Billentyűkezelés kikapcsolása
         * @type Boolean
         */
        disableKeys : false,

        /**
         * Click eseményre lefutó alapfunkciók kikapcsolása
         * @type Boolean
         */
        disableDropdown : false,
        disableClose : false,
        disableSelect : false,

        /**
         * Lista pozicionálása az elemhez képest (jQuery UI position)
         * @type Object
         */
        position : {
            my : 'left top',
            at : 'left bottom',
            collision : 'none flip',
            within : window
        },

        /**
         * Lista lenyitása során lefutó effekt
         * @param {jQuery} $elem lista
         */
        showEffect : function($elem){
            $elem.show();
        },

        /**
         * Lista becsukása során lefutó effekt
         * @param {jQuery} $elem lista
         */
        hideEffect : function($elem){
            $elem.hide();
        },

        /**
         * Divselect létrehozása és option elem kiválasztása (vagy multiselect esetén lehet kiválasztás megszüntetése)
         * után lefutó művelet (elsősorban a selector-ral elvégzett művelet megadására szolgál)
         * @param {jQuery} $divelement divselect elem
         * @param {jQuery} $item legutóbb kiválasztott item elem
         */
        selectAction : function($divelement, $item){
            var $selector = $divelement.find('[data-element="selector"]');
            var itemHtml = $divelement.divselect('getSelected');
            if (!$.isArray(itemHtml)){
                // sima select
                $selector.html(itemHtml);
            }
            else {
                // multiselect
                $selector.html(itemHtml.join(' '));
            }
        },

        // ESEMÉNYKEZELŐK (futási időben a jQuery on() és off() metódusaival módosíthatók)

        /**
         * Elem elkészülése után fut le
         * @param {jQuery.Event} event jquery Event objektum
         * @scope {HTMLElement} this: divselect elem
         */
        create : function(event){},

        /**
         * Érték kiválasztása esetén fut le
         * @param {jQuery.Event} event jquery Event objektum
         * @param {String} value érték
         * @scope {HTMLElement} this: divselect elem
         */
        select : function(event, value){},

        /**
         * Kiválasztott érték módosulása esetén fut le
         * @param {jQuery.Event} event jquery Event objektum
         * @param {String} value kiválasztott érték
         * @param {String} oldvalue előzőleg kiválasztott érték
         * @scope {HTMLElement} this: divselect elem
         */
        change : function(event, value, oldvalue){},

        /**
         * Lista lenyitásakor fut le
         * @param {jQuery.Event} event jquery Event objektum
         * @scope {HTMLElement} this: divselect elem
         */
        open : function(event){},

        /**
         * Lista becsukásakor fut le
         * @param {jQuery.Event} event jquery Event objektum
         * @scope {HTMLElement} this: divselect elem
         */
        close : function(event){}

    };

    /**
     * Belső adattároló
     * @type Object
     */
    var optionData = {
        selected : [],
        disabled : [],
        readonly : [],
        values : [],
        labels : []
    };

    /**
     * Segédváltozók és függvények
     * @type Object
     */
    var Util = {

        /**
         * Speciális billentyűk
         * @type Object
         */
        keys : {
            ALT : 18, BACKSPACE : 8, CAPS_LOCK : 20, COMMA : 188, CTRL : 17, DELETE : 46, DOWN : 40, END : 35,
            ENTER : 13, ESC : 27, HOME : 36, INSERT : 45, LEFT : 37, NUM_LOCK : 144, NUMPAD_ADD : 107,
            NUMPAD_DECIMAL : 110, NUMPAD_DIVIDE : 111, NUMPAD_ENTER : 108, NUMPAD_MULTIPLY : 106,
            NUMPAD_SUBTRACT : 109, PAGE_DOWN : 34, PAGE_UP : 33, PAUSE : 19, PERIOD : 190, RIGHT : 39,
            RIGHT_CLICK : 93, SCROLL_LOCK : 145, SHIFT : 16, SPACE : 32, TAB : 9, UP : 38, WINDOWS : 91
        },

        /**
         * Alfanumerikus karakterek
         * @type Object
         */
        letters : {
            'a' : 65, 'b' : 66, 'c' : 67, 'd' : 68, 'e' : 69, 'f' : 70, 'g' : 71, 'h' : 72, 'i' : 73,
            'j' : 74, 'k' : 75, 'l' : 76, 'm' : 77, 'n' : 78, 'o' : 79, 'p' : 80, 'q' : 81, 'r' : 82,
            's' : 83, 't' : 84, 'u' : 85, 'v' : 86, 'w' : 87, 'x' : 88, 'y' : 89, 'z' : 90,
            '0' : 48, '1' : 49, '2' : 50, '3' : 51, '4' : 52, '5' : 53, '6' : 54, '7' : 55, '8' : 56, '9' : 57
        },

        /**
         * Böngésző lekérdezése
         * @return {String} böngésző típusa ('ie'|'firefox'|'chrome'|'safari'|'opera'|'general')
         */
        getBrowser : function(){
            var ua = navigator.userAgent;
            var browser = ua.match(/(opera|chrome|safari|firefox|ie)\/?\s*(\.?\d+(\.\d+)*)/i);
            browser = browser ? browser[1].toLowerCase() : navigator.appName;
            if (!(browser in {'ie' : 1, 'firefox' : 1, 'chrome' : 1, 'safari' : 1, 'opera' : 1})){
                browser = 'general';
            }
            return browser;
        },

        /**
         * HTML tegek és PHP blokkok kiszedése
         * @param {String} input bemenő karakterlánc
         * @return {String}
         */
        stripTags : function(input){
            var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
            var commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
            return input.replace(commentsAndPhpTags, '').replace(tags, '');
        }

    };

    /**
     * A divselect elkészítését végző függvények
     * @type Object
     */
    var Creation = {

        /**
         * Teljes select elkészítése
         * @param {String} divhtml template
         * @param {jQuery} $select a select elem
         * @param {Object} optionTags option elemek belseje
         * @param {String} cssPrefix css előtag
         * @param {Object} properties select elem disabled tulajdonsága
         * @return {String} HTML template darabja
         * @desc properties = {
         *     disabled : Boolean,
         *     readonly : Boolean,
         *     multiple : Boolean
         * }
         */
        createSelectTag : function(divhtml, $select, optionTags, cssPrefix, properties){
            var $rows = $select.children();
            var attrName = $select.attr('name') ? $select.attr('name') : '';
            var htmlblock = '';
            // var $selected = $select.find(':selected');
            // if ($selected.length === 0 && $rows.length > 0 && !properties.multiple){
            //     $selected = $select.find('option').first();
            // }
            divhtml = divhtml.replace(/\{cssPrefix}/g, cssPrefix);
            divhtml = divhtml.replace(/\{select\.name}/g, attrName);
            divhtml = divhtml.replace(/\{select\.val}/g, ($rows.length > 0) ? $select.val() : '');
            if (properties.disabled){
                divhtml = divhtml.replace(/\{select\.disabled}/g, cssPrefix + '__selector--disabled');
            }
            else {
                divhtml = divhtml.replace(/\{select\.disabled}/g, '');
            }
            if (properties.readonly){
                divhtml = divhtml.replace(/\{select\.readonly}/g, cssPrefix + '__selector--readonly');
            }
            else {
                divhtml = divhtml.replace(/\{select\.readonly}/g, '');
            }
            $rows.each(function(i, element){
                if (element.tagName === 'OPTION'){
                    htmlblock += Creation.createOptionTag(element, divhtml, optionTags, cssPrefix);
                }
                else if (element.tagName === 'OPTGROUP'){
                    htmlblock += Creation.createOptgroupTag(element, divhtml, optionTags, cssPrefix);
                }
            });
            divhtml = divhtml.replace(/\{loop}([\s\S]*)\{\/loop}/g, htmlblock);
            return divhtml;
        },

        /**
         * Egy option teg elkészítése
         * @param {HTMLOptionElement} element option elem
         * @param {String} template HTML-template
         * @param {Object} optionTags option elemek belseje
         * @param {String} cssPrefix css előtag
         * @param {Object} [optionDataStorage] option tulajdonságai (value, html, selected, readonly, disabled)
         *        bekerülnek ebbe az objektumba
         * @return {String} HTML template darabja
         */
        createOptionTag : function(element, template, optionTags, cssPrefix, optionDataStorage){
            var $element = $(element);
            var segment = template.replace(/^[\s\S]*\{optionTags}([\s\S]*)\{\/optionTags}[\s\S]*$/g, '$1');
            var value = $element.val();
            var html = $element.html();
            var innercode;
            optionData.values.push(value);
            if (optionDataStorage) optionDataStorage.value = value;
            optionData.htmls.push(html);
            if (optionDataStorage) optionDataStorage.html = html;
            segment = segment.replace(/\{cssPrefix}/g, cssPrefix);
            segment = segment.replace(/\{option\.val}/g, value);
            if (optionTags !== null && typeof optionTags[value] !== 'undefined' && optionTags[value]){
                innercode = optionTags[value].replace(/([^\\])#/g, '$1' + $element.html()).replace(/\\#/g, '#');
                segment = segment.replace(/\{option\.html}/g, innercode);
            }
            else {
                segment = segment.replace(/\{option\.html}/g, $element.html());
            }
            if ($element.prop('selected')){
                optionData.selected.push(value);
                if (optionDataStorage) optionDataStorage.selected = true;
            }
            if (element.getAttribute('disabled')){
                segment = segment.replace(/\{option\.disabled}/g, cssPrefix + '__item--disabled');
                optionData.disabled.push(value);
                if (optionDataStorage) optionDataStorage.disabled = true;
            }
            else {
                segment = segment.replace(/\{option\.disabled}/g, '');
            }
            if (element.getAttribute('readonly')){
                segment = segment.replace(/\{option\.readonly}/g, cssPrefix + '__item--readonly');
                optionData.readonly.push(value);
                if (optionDataStorage) optionDataStorage.readonly = true;
            }
            else {
                segment = segment.replace(/\{option\.readonly}/g, '');
            }
            return segment;
        },

        /**
         * Egy optgroup teg elkészítése
         * @param {HTMLElement} element optgroup elem
         * @param {String} template HTML-template
         * @param {Object} optionTags option elemek belseje
         * @param {String} cssPrefix css előtag
         * @return {String} HTML template darabja
         */
        createOptgroupTag : function(element, template, optionTags, cssPrefix){
            var segment_optgroup_start = template.replace(/^[\s\S]*\{optgroup_start}([\s\S]*)\{\/optgroup_start}[\s\S]*$/g, '$1');
            var segment_optgroup_end = template.replace(/^[\s\S]*\{optgroup_end}([\s\S]*)\{\/optgroup_end}[\s\S]*$/g, '$1');
            var segment_option = '';
            var label = $(element).attr('label') ? $(element).attr('label') : '';
            segment_optgroup_start = segment_optgroup_start.replace(/\{optgroup\.label}/mg, label);
            optionData.labels.push(label);
            $(element).children('option').each(function(i, subelement){
                segment_option += Creation.createOptionTag(subelement, template, optionTags, cssPrefix);
            });
            return segment_optgroup_start + segment_option + segment_optgroup_end;
        }

    };

    /**
     * Felhasználói események kezelése
     * @type Object
     */
    var Interaction = {

        /**
         * Leütött karakter megállapítása
         * @param {Number} chr keyCode
         * @param {Object} characters definiált extra karakterek
         * @return {String|Boolean} leütött karakter vagy false ha ismeretlen
         */
        getLetter : function(chr, characters){
            var index, browser, code;
            for (index in Util.letters){
                if (chr === Util.letters[index]){
                    return index;
                }
            }
            browser = Util.getBrowser();
            for (index in characters){
                if ($.isPlainObject(characters[index])){
                    code = characters[index].general;
                    if (typeof characters[index][browser] !== 'undefined'){
                        code = characters[index][browser];
                    }
                    if (chr === code){
                        return index;
                    }
                }
                else if (chr === characters[index]){
                    return index;
                }
            }
            return false;
        },

        /**
         * Leütött speciális billentyű megállapítása
         * @param {Number} keyCode keyCode
         * @return {String|Boolean} leütött karakter neve vagy false ha ismeretlen
         */
        getSpecialKey : function(keyCode){
            var name;
            for (name in Util.keys){
                if (Util.keys[name] === keyCode){
                    return name;
                }
            }
            return false;
        },

        /**
         * Elem kiválasztása
         * @param {jQuery} $elements kiválasztandó option elemek
         * @param {jQuery} $divelement divselect elem
         */
        setSelect : function($elements, $divelement){
            $divelement.find('[data-element="item"]').removeData('selected');
            $elements.data('selected', true).focus();
        },

        /**
         * Elem kijelölése
         * @param {jQuery} $elements kijelölendő option elemek
         * @param {jQuery} $divelement divselect elem
         */
        setPreSelect : function($elements, $divelement){
            var cssPrefix = $divelement.data('cssPrefix');
            $divelement.find('[data-element="item"]')
                .removeData('preSelected')
                .removeClass(cssPrefix + '__item--preselected');
            $elements.data('preSelected', true).addClass(cssPrefix + '__item--preselected').focus();
        },

        /**
         * Lista kinyitása
         * @param {jQuery} $divelement divselect elem
         */
        showDropdown : function($divelement){
            var cssPrefix = $divelement.data('cssPrefix');
            var showEffect = $divelement.data('options').showEffect;
            var pos = $.extend({}, $divelement.data('options').position);
            if (typeof pos.of === 'undefined'){
                pos.of = $divelement.find('[data-element="selector"]');
            }
            $divelement.find('[data-element="background"]').show();
            showEffect($divelement.find('[data-element="menu"]'));
            $divelement.find('[data-element="selector"]').addClass(cssPrefix + '__selector--active');
            $divelement.find('[data-element="menu"]').position(pos);
            $divelement.find('[data-element="item"]').each(function(){
                if ($(this).data('selected')){
                    $(this).focus();
                    return false;
                }
            });
        },

        /**
         * Lista becsukása
         * @param {jQuery} $divelement divselect elem
         */
        hideDropdown : function($divelement){
            var cssPrefix = $divelement.data('cssPrefix');
            var hideEffect = $divelement.data('options').hideEffect;
            $divelement.find('[data-element="background"]').hide();
            hideEffect($divelement.find('[data-element="menu"]'));
            $divelement.find('[data-element="selector"]').removeClass(cssPrefix + '__selector--active');
        },

        /**
         * Önálló elemek kezelése
         * @param {jQuery} $element nem buborékoló elem (pl. űrlapelem)
         * @param {String} notBubbling önálló elemek szelektora
         */
        bindNotBubblingEvent : function($element, notBubbling){
            if ($element.length > 0){
                $element.find(notBubbling).on('click.divselect', function(event){
                    if ($(this).parents().filter($element).data('readonly')){
                        event.preventDefault();
                    }
                    event.stopPropagation();
                });
            }
        },

        /**
         * Alapértelmezett eseménykezelők
         * @type Object
         */
        handleSpecialAction : {

            /**
             * Lista lenyitása
             * @param {jQuery} $divelement divselect elem
             * @param {jQuery.Event} event jquery Event objektum
             */
            dropdown : function($divelement, event){
                if ($divelement.data('options').disableDropdown && event) return;
                if ($divelement.data('disabled')) return;
                Interaction.showDropdown($divelement);
                $divelement.trigger('open.divselect');
            },

            /**
             * Lista becsukása
             * @param {jQuery} $divelement divselect elem
             * @param {jQuery.Event} event jquery Event objektum
             */
            close : function($divelement, event){
                var $selecteditem;
                if ($divelement.data('options').disableClose && event) return;
                if ($divelement.data('disabled')) return;
                $selecteditem = $divelement.find('[data-element="item"]').filter(function(){
                    return $(this).data('selected');
                });
                Interaction.setPreSelect($selecteditem, $divelement);
                Interaction.hideDropdown($divelement);
                $divelement.trigger('close.divselect');
            },

            /**
             * Elem kiválasztása
             * @param {jQuery} $item kiválasztandó elem
             * @param {jQuery} $divelement divselect elem
             * @param {jQuery.Event} event jquery Event objektum
             */
            select : function($item, $divelement, event){
                var selectAction, oldvalue, oldvalues, newvalue, newvalues, $items, pos;
                if ($divelement.data('options').disableSelect && event) return;
                if ($divelement.data('disabled')) return;
                if (!$item.data('disabled')){
                    selectAction = $divelement.data('options').selectAction;
                    if (!$divelement.data('multiple')){
                        // Sima select
                        oldvalue = $divelement.find('[data-element="input"]').val();
                        newvalue = $item.data('value');
                        if (!$divelement.data('readonly')){
                            $divelement.find('[data-element="selector"]').data('value', newvalue);
                            $divelement.find('[data-element="input"]').val(newvalue);
                            if (oldvalue !== newvalue){
                                $divelement.trigger('change.divselect', [newvalue, oldvalue]);
                            }
                        }
                        Interaction.setPreSelect($item, $divelement);
                        Interaction.setSelect($item, $divelement);
                        $divelement.trigger('select.divselect', [newvalue]);
                        if ($divelement.find('[data-element="menu"]:visible').length > 0){
                            Interaction.hideDropdown($divelement);
                            $divelement.trigger('close.divselect');
                        }
                    }
                    else {
                        // Multiselect
                        oldvalues = $divelement.find('[data-element="input"]').val().split(',');
                        newvalue = $item.data('value');
                        newvalues = oldvalues;
                        $items = $();
                        if (!$divelement.data('readonly')){
                            pos = $.inArray(newvalue, oldvalues);
                            if (pos === -1){
                                // Új érték felvétele
                                newvalues.push(newvalue);
                            }
                            else {
                                // Meglévő érték törlése
                                newvalues.splice(pos, 1);
                            }
                            $divelement.find('[data-element="selector"]').data('value', newvalues);
                            $divelement.find('[data-element="input"]').val(newvalues.join(','));
                            $divelement.trigger('change.divselect', [newvalues, oldvalues]);
                        }
                        $.each(newvalues, function(i, value){
                            $items = $items.add($divelement.divselect('getElementByValue', value));
                        });
                        Interaction.setPreSelect($items, $divelement);
                        Interaction.setSelect($items, $divelement);
                        $divelement.trigger('select.divselect', [newvalue]);
                    }
                    selectAction($divelement, $item);
                }
            }

        },

        /**
         * Billentyűk kezelése
         * @param {jQuery} $divelement divselect elem
         * @param {jQuery.Event} event jQuery Event objektum
         */
        handleKeyEvent : function($divelement, event){
            var i, letter, str, searchstr, items, firstitem, thiskey, ret;
            var pageStep = $divelement.data('options').pageStep;
            var keyDownWait = $divelement.data('options').keyDownWait;
            var characters = $divelement.data('options').characters;
            var $menuItems = $divelement.find('[data-element="item"]').filter(function(){
                return !$(this).data('disabled');
            });
            var preSelected = null;
            var found = false;
            var offset = 1;
            $menuItems.each(function(index){
                if ($(this).data('preSelected')){
                    preSelected = index;
                    return false;
                }
                offset++;
            });
            if ((letter = this.getLetter(event.which, characters)) !== false){
                // alfanumerikus billentyű
                if ($divelement.data('keytime') && event.timeStamp - $divelement.data('keytime') < keyDownWait){
                    $divelement.data('keytime', event.timeStamp);
                    str = $divelement.data('keytype');
                    if (str !== letter){
                        $divelement.data('keytype', str + letter);
                    }
                }
                else {
                    $divelement.data('keytime', event.timeStamp);
                    $divelement.data('keytype', letter);
                }
                searchstr = $divelement.data('keytype');
                // shiftelés
                items = $menuItems.get();
                for (i = 0; i < offset; i++){
                    firstitem = items.shift();
                    items.push(firstitem);
                }
                $menuItems = $(items);
                $menuItems.each(function(index){
                    var itemstr = $.trim(Util.stripTags($(this).html())).substr(0, searchstr.length);
                    if (itemstr === searchstr || itemstr.toLowerCase() === searchstr){
                        preSelected = index;
                        found = true;
                        return false;
                    }
                });
            }
            else {
                // speciális billentyű
                found = false;
                thiskey = Interaction.getSpecialKey(event.which);
                if (thiskey && Interaction.keyHandlers['_' + thiskey]){
                    event.preventDefault();
                    ret = Interaction.keyHandlers['_' + thiskey].call(
                        $divelement, $menuItems, preSelected, pageStep, event
                    );
                    if (ret !== false){
                        found = true;
                        preSelected = ret;
                    }
                }
            }
            if (found){
                if (event.target === $divelement.get(0)){
                    this.handleSpecialAction.select($menuItems.eq(preSelected), $divelement, event);
                }
                else {
                    this.setPreSelect($menuItems.eq(preSelected), $divelement);
                }
            }
        },

        /**
         * Definiált speciális karakterek eseménykezelői
         * @param {jQuery} $menuItems a lista elemei
         * @param {Number} preSelected a kiemelt elem sorszáma
         * @param {Number} pageStep a divselect pageStep paramétere
         * @param {jQuery.Event} event a jQuery Event objektum
         * @return {Number|Boolean} a preSelected új értéke vagy false ha a régire kell visszaállítani
         */
        keyHandlers : {

            _RIGHT : function($menuItems, preSelected, pageStep, event){
                return (preSelected === null) ? 0 : (preSelected + 1) % $menuItems.length;
            },
            _DOWN : function($menuItems, preSelected, pageStep, event){
                return (preSelected === null) ? 0 : (preSelected + 1) % $menuItems.length;
            },
            _LEFT : function($menuItems, preSelected, pageStep, event){
                var itemnum = $menuItems.length;
                var newPreSelected = (preSelected === null) ? (itemnum - 1) : (preSelected - 1) % itemnum;
                if (newPreSelected < 0){
                    newPreSelected += itemnum;
                }
                return newPreSelected;
            },
            _UP : function($menuItems, preSelected, pageStep, event){
                var itemnum = $menuItems.length;
                var newPreSelected = (preSelected === null) ? (itemnum - 1) : (preSelected - 1) % itemnum;
                if (newPreSelected < 0){
                    newPreSelected += itemnum;
                }
                return newPreSelected;
            },
            _PAGE_DOWN : function($menuItems, preSelected, pageStep, event){
                var itemnum = $menuItems.length;
                var newPreSelected = (preSelected === null) ? pageStep : (preSelected + pageStep);
                if (newPreSelected >= itemnum){
                    newPreSelected = itemnum - 1;
                }
                return newPreSelected;
            },
            _PAGE_UP : function($menuItems, preSelected, pageStep, event){
                var itemnum = $menuItems.length;
                var newPreSelected = (preSelected === null) ? (itemnum - pageStep) : (preSelected - pageStep);
                if (newPreSelected < 0){
                    newPreSelected = 0;
                }
                return newPreSelected;
            },
            _HOME : function($menuItems, preSelected, pageStep, event){
                return 0;
            },
            _END : function($menuItems, preSelected, pageStep, event){
                return $menuItems.length - 1;
            },
            _ENTER : function($menuItems, preSelected, pageStep, event){
                if (preSelected !== null){
                    Interaction.handleSpecialAction.select($menuItems.eq(preSelected), this, event);
                }
                return preSelected;
            },
            _ESC : function($menuItems, preSelected, pageStep, event){
                var $selectedItem = $menuItems.filter(function(){
                    return $(this).data('selected');
                });
                Interaction.setPreSelect($selectedItem, this);
                Interaction.handleSpecialAction.close(this, event);
                return false;
            }

        }

    };

    /**
     * Publikus metódusok
     * @type Object
     */
    var Methods = {

        // FELHASZNÁLÓI FÜGGVÉNYEK

        /**
         * A select lecserélése
         * @param {Object} [settings] alapbeállítások felülírása
         * @return {jQuery} legyártott elem
         */
        create : function(settings){
            var $divselects = $();
            var options = {};
            if (typeof settings === 'object'){
                if (typeof settings.addCharacters !== 'undefined'){
                    options.characters = settings.characters;  // TODO: teszt
                    $.extend(settings.characters, settings.addCharacters);
                }
                options = $.extend({}, defaultOptions, settings);
            }
            else {
                options = defaultOptions;
            }
            this.each(function(){
                var $select, properties, optionTags, cssPrefix, divhtml, $divelement, $selectedItems;
                if (this.tagName !== 'SELECT' || $(this).data('divselect')) return;
                optionData = {
                    selected : [],
                    disabled : [],
                    readonly : [],
                    values : [],
                    labels : [],
                    htmls : []
                };

                // adatgyűjtés
                $select = $(this);
                properties = {
                    disabled : ($select.prop('disabled') || options.disabled),
                    readonly : ($select.prop('readonly') || options.readonly),
                    multiple : ($select.prop('multiple') || options.multiple)
                };

                // html felépítése
                optionTags = options.optionTags;
                cssPrefix = options.cssPrefix;
                divhtml = options.template;
                divhtml = Creation.createSelectTag(divhtml, $select, optionTags, cssPrefix, properties);
                $divelement = $(divhtml);
                $.each(options.divAttributes, function(n, attribute){
                    if (attribute === 'class' && $select.attr('class')){
                        $divelement.attr('class', $divelement.attr('class') + ' ' + $select.attr('class'));
                    }
                    else if ($select.attr(attribute)){
                        $divelement.attr(attribute, $select.attr(attribute));
                    }
                });

                // megjelenítés
                $(this).replaceWith($divelement);
                if (typeof $divelement.attr('tabindex') === 'undefined'){
                    $divelement.attr('tabindex', '0');
                }
                $divelement.find('[data-element="background"]').hide();
                $divelement.find('[data-element="menu"]').hide();

                // adatok hozzárendelése az elemekhez
                $divelement.data('divselect', true);
                $divelement.data('cssPrefix', cssPrefix);
                $divelement.data('options', options);    // objektum (összes paraméter)
                $divelement.data('disabled', properties.disabled);
                $divelement.data('readonly', properties.readonly);
                $divelement.data('multiple', properties.multiple);
                $selectedItems = $();
                $divelement.find('[data-element="item"]').each(function(index){
                    $(this).attr('tabindex', '0');
                    $(this).data('value', optionData.values[index]);
                    $(this).data('html', optionData.htmls[index]);
                    if ($.inArray($(this).data('value'), optionData.selected) > -1){
                        $selectedItems = $selectedItems.add($(this));
                    }
                    if ($.inArray($(this).data('value'), optionData.disabled) > -1){
                        $(this).data('disabled', true);
                    }
                    if ($.inArray($(this).data('value'), optionData.readonly) > -1){
                        $(this).data('readonly', true);
                    }
                });
                $selectedItems.each(function(){
                    $(this).data('selected', true);
                    options.selectAction($divelement, $(this));
                });
                Interaction.setPreSelect($selectedItems, $divelement);
                $divelement.find('[data-element="group"]').each(function(index){
                    $(this).data('label', optionData.labels[index]);
                });

                // eseménykezelők csatolása
                $divelement.find('[data-element="selector"]').on('click.divselect', function(event){
                    if (!$divelement.data('options').disableDropdown){
                        Interaction.handleSpecialAction.dropdown($divelement, event);
                    }
                });
                $divelement.find('[data-element="background"]').on('click.divselect', function(event){
                    if (!$divelement.data('options').disableClose){
                        Interaction.handleSpecialAction.close($divelement, event);
                    }
                });
                $divelement.find('[data-element="item"]').on('click.divselect', function(event){
                    if (!$divelement.data('options').disableSelect){
                        Interaction.handleSpecialAction.select($(this), $divelement, event);
                        Interaction.bindNotBubblingEvent(
                            $divelement.find('[data-element="selector"]'), options.notBubbling
                        );
                    }
                });
                $divelement.on('keydown.divselect', function(event){
                    if (!$divelement.data('options').disableKeys){
                        if ($divelement.data('disabled')) return;
                        Interaction.handleKeyEvent($divelement, event);
                    }
                });
                $divelement.on('create.divselect', $divelement.data('options').create)
                           .on('select.divselect', $divelement.data('options').select)
                           .on('change.divselect', $divelement.data('options').change)
                           .on('open.divselect',   $divelement.data('options').open)
                           .on('close.divselect',  $divelement.data('options').close)
                           .trigger('create.divselect');
                Interaction.bindNotBubblingEvent($divelement.find('[data-element="item"]'), options.notBubbling);
                $divselects = $divselects.add($divelement);
            });
            return $divselects;
        },

        /**
         * A divselect lecserélése egy vele egyenértékű select elemre
         * (az optionTags-ben meadott HTML kód marad benne)
         * @return {jQuery} a select elem
         */
        destroy : function(){
            var $selects = $();
            this.each(function(){
                var $divelement = $(this);
                var $select = $($divelement.divselect('getSelect', 'html', true));
                $divelement.replaceWith($select);
                $selects = $selects.add($select);
            });
            return $selects;
        },

        /**
         * Állandó tulajdonság módosítása futási időben
         * @param {String|Object} name tulajdonság neve
         * @param {String} value tulajdonság értéke
         * @return {jQuery}
         */
        regenerate : function(name, value){
            var $divselects = $();
            this.each(function(){
                var $divelement = $(this);
                var options = $divelement.data('options');
                var $select = $divelement.divselect('destroy');
                if ($.isPlainObject(name)){
                    $.extend(options, name);
                }
                else {
                    options[name] = value;
                }
                $divelement = $select.divselect('create', options);
                $divselects = $divselects.add($divelement);
            });
            return $divselects;
        },

        /**
         * Tulajdonság módosítása/lekérdezése futási időben
         * @param {String|Object} name tulajdonság neve
         * @param {String} value tulajdonság értéke
         * @return {jQuery|*}
         */
        option : function(name, value){
            if ($.isPlainObject(name)){
                $.extend(this.data('options'), name);
                return this;
            }
            else if (typeof value === 'undefined'){
                // getter
                return this.data('options')[name];
            }
            else {
                // setter
                this.data('options')[name] = value;
                return this;
            }
        },

        /**
         * A select name attribútuma
         * @return {String}
         */
        getName : function(){
            return this.find('[data-element="input"]').attr('name');
        },
        /**
         * Kiválasztott érték/értékek
         * @return {String|Array}
         */
        getValue : function(){
            var $divselect = this;
            var val, $item;
            if ($divselect.data('multiple')){
                val = [];
                $divselect.find('[data-element="item"]').each(function(){
                    $item = $(this);
                    if ($item.data('selected')){
                        val.push($item.data('value'));
                    }
                });
            }
            else {
                val = null;
                $divselect.find('[data-element="item"]').each(function(){
                    $item = $(this);
                    if ($item.data('selected')){
                        val = $item.data('value');
                        return false;
                    }
                });
            }
            return val;
        },
        /**
         * Kiválasztott elemen/elemeken belüli HTML kód
         * @return {String|Array}
         */
        getSelected : function(){
            var $divselect = this;
            var value = this.divselect('getValue');
            var html;
            if ($divselect.data('multiple')){
                html = [];
                $.each(value, function(i, val){
                    html.push($divselect.divselect('getElementByValue', val).html());
                });
            }
            else {
                html = $divselect.divselect('getElementByValue', value).html();
            }
            return html;
        },

        /**
         * Lista kinyitása
         * @return {jQuery}
         */
        open : function(){
            Interaction.handleSpecialAction.dropdown(this, null);
            return this;
        },
        /**
         * Lista becsukása
         * @return {jQuery}
         */
        close : function(){
            Interaction.handleSpecialAction.close(this, null);
            return this;
        },

        /**
         * Kiválasztás érték alapján
         * @param {String} value érték
         * @return {jQuery}
         */
        select : function(value){
            Interaction.handleSpecialAction.select(this.divselect('getElementByValue', value), this, null);
            return this;
        },

        /**
         * Az adott érték ki van-e választva
         * @param {String} [value] érték
         * @return {Boolean}
         */
        isSelected : function(value){
            return this.divselect('getElementByValue', value).data('selected');
        },
        /**
         * Az adott érték vagy a select readonly
         * @param {String} [value] érték
         * @return {Boolean}
         */
        isReadonly : function(value){
            if (typeof value === 'undefined'){
                return this.data('readonly');
            }
            else {
                return this.divselect('getElementByValue', value).data('readonly');
            }
        },
        /**
         * Az adott érték vagy a select disabled
         * @param {String} [value] érték
         * @return {Boolean}
         */
        isDisabled : function(value){
            if (typeof value === 'undefined'){
                return this.data('disabled');
            }
            else {
                return this.divselect('getElementByValue', value).data('disabled');
            }
        },
        /**
         * A select multiselect
         * @return {Boolean}
         */
        isMultiple : function(){
            return this.data('multiple');
        },

        /**
         * Az értékhez/értékekhez hozzárendeli a readonly tulajdonságot
         * @param {String|Array} [value] érték
         * @return {jQuery}
         */
        setReadonly : function(value){
            var i;
            var cssPrefix = this.data('cssPrefix');
            if (typeof value === 'undefined'){
                this.data('readonly', true);
                this.find('[data-element="selector"]').addClass(cssPrefix + '__selector--readonly');
            }
            else if ($.isArray(value)){
                for (i = 0; i < value.length; i++){
                    this.divselect('setReadonly', value[i]);
                }
            }
            else if (!this.divselect('isReadonly')){
                this.each(function(){
                    var $option = $(this).divselect('getElementByValue', value);
                    $option.data('readonly', true).addClass(cssPrefix + '__item--readonly');
                });
            }
            return this;
        },
        /**
         * Az értékről/értékekről eltávolítja a readonly tulajdonságot
         * @param {String|Array} [value] érték
         * @return {jQuery}
         */
        unsetReadonly : function(value){
            var i;
            var cssPrefix = this.data('cssPrefix');
            if (typeof value === 'undefined'){
                this.data('readonly', false);
                this.find('[data-element="selector"]').removeClass(cssPrefix + '__selector--readonly');
            }
            else if ($.isArray(value)){
                for (i = 0; i < value.length; i++){
                    this.divselect('unsetReadonly', value[i]);
                }
            }
            else if (this.divselect('isReadonly', value)){
                this.each(function(){
                    var $option = $(this).divselect('getElementByValue', value);
                    $option.removeData('readonly').removeClass(cssPrefix + '__item--readonly');
                });
            }
            return this;
        },
        /**
         * unsetReadonly alias
         * @param {String|Array} [value] érték
         * @return {jQuery}
         */
        setWritable : function(value){
            return this.divselect('unsetReadonly', value);
        },
        /**
         * Az értékhez/értékekhez hozzárendeli a disabled tulajdonságot
         * @param {String|Array} [value] érték
         * @return {jQuery}
         */
        setDisabled : function(value){
            var i;
            var cssPrefix = this.data('cssPrefix');
            if (typeof value === 'undefined'){
                this.data('disabled', true);
                this.find('[data-element="selector"]').addClass(cssPrefix + '__selector--disabled');
            }
            else if ($.isArray(value)){
                for (i = 0; i < value.length; i++){
                    this.divselect('setDisabled', value[i]);
                }
            }
            else if (!this.divselect('isDisabled')){
                this.each(function(){
                    var $option = $(this).divselect('getElementByValue', value);
                    $option.data('disabled', true).addClass(cssPrefix + '__item--disabled');
                });
            }
            return this;
        },
        /**
         * Az értékről/értékekről eltávolítja a disabled tulajdonságot
         * @param {String|Array} [value] érték
         * @return {jQuery}
         */
        unsetDisabled : function(value){
            var i;
            var cssPrefix = this.data('cssPrefix');
            if (typeof value === 'undefined'){
                this.data('disabled', false);
                this.find('[data-element="selector"]').removeClass(cssPrefix + '__selector--disabled');
            }
            else if ($.isArray(value)){
                for (i = 0; i < value.length; i++){
                    this.divselect('unsetDisabled', value[i]);
                }
            }
            else if (this.divselect('isDisabled', value)){
                this.each(function(){
                    var $option = $(this).divselect('getElementByValue', value);
                    $option.removeData('disabled').removeClass(cssPrefix + '__item--disabled');
                });
            }
            return this;
        },
        /**
         * unsetDisabled alias
         * @param {String|Array} [value] érték
         * @return {jQuery}
         */
        setEnabled : function(value){
            return this.divselect('unsetDisabled', value);
        },

        /**
         * Option elemek visszaadása az addOption() metódusnak megfelelő formában
         * @param {String} [format='none'] visszaadandó formátum ('none'|'object'|'html')
         * @return {Array} az option-öket leíró adatszerkezet
         */
        getOptions : function(format){
            var params, param;
            var options = [];
            var $divelement = this;
            if (typeof format === 'undefined') format = 'none';
            $divelement.find('[data-element="item"]').each(function(){
                var $option = $(this);
                if (format === 'none'){
                    options.push($option.data('value'));
                }
                if (format === 'object'){
                    options.push({
                        value : $option.data('value'),
                        html : $option.html(),
                        selected : $option.data('selected'),
                        readonly : $option.data('readonly'),
                        disabled : $option.data('disabled')
                    });
                }
                if (format === 'html'){
                    params = {
                        selected : $option.data('selected') ? ' selected="selected"' : '',
                        readonly : $option.data('readonly') ? ' readonly="readonly"' : '',
                        disabled : $option.data('disabled') ? ' disabled="disabled"' : ''
                    };
                    param = params.selected + params.readonly + params.disabled;
                    options.push(
                        '<option value="' + $option.data('value') + '"' + param + '>' + $option.html() + '</option>'
                    );
                }
            });
            return options;
        },

        /**
         * Optgroup elemek visszaadása az addOptgroup() metódusnak megfelelő formában
         * @param {String} [format='none'] formátum ('none'|'options'|'surround')
         * @return {Array} az optgroup-okat leíró adatszerkezet
         */
        getOptgroups : function(format){
            var options, surround, $opt1, $opt2, num;
            var optgroups = [];
            var $divelement = this;
            if (typeof format === 'undefined') format = 'none';
            $divelement.find('[data-element="group"]').each(function(){
                var $optgroup = $(this);
                if (format === 'none'){
                    optgroups.push($optgroup.data('label'));
                }
                if (format === 'options'){
                    options = [];
                    $optgroup.find('[data-element="item"]').each(function(){
                        var $option = $(this);
                        options.push({
                            value : $option.data('value'),
                            html : $option.html(),
                            selected : $option.data('selected'),
                            readonly : $option.data('readonly'),
                            disabled : $option.data('disabled')
                        });
                    });
                    optgroups.push({
                        label : $optgroup.data('label'),
                        options : options
                    });
                }
                if (format === 'surround'){
                    surround = [null, null];
                    num = $optgroup.find('[data-element="item"]').length;
                    if (num > 0){
                        $opt1 = $optgroup.find('[data-element="item"]').eq(0);
                        $opt2 = $optgroup.find('[data-element="item"]').eq(num - 1);
                        surround = [$opt1.data('value'), $opt2.data('value')];
                    }
                    optgroups.push({
                        label : $optgroup.data('label'),
                        surround : surround
                    });
                }
            });
            return optgroups;
        },

        /**
         * A divselect jelenlegi állapotával egyenértékű select elem visszaadása
         * @param {String} format formátum ('object'|'html')
         * @param {Boolean} [recover=false] option elemek innerHTML-jének visszaállítása
         * @return {Object|String} a select elemet leíró adatszerkezet, vagy a HTML kódja
         */
        getSelect : function(format, recover){
            var n, m, value, structure, attrlist, name;
            var select = null;
            var $divelement = this;
            var attributes = $divelement.data('options').divAttributes;
            var attributevalues = {};
            var readonly = $divelement.data('readonly');
            var disabled = $divelement.data('disabled');
            var multiple = $divelement.data('multiple');
            if (typeof recover === 'undefined') recover = false;
            for (n = 0; n < attributes.length; n++){
                value = $divelement.attr(attributes[n]);
                if (typeof value !== 'undefined'){
                    attributevalues[attributes[n]] = value;
                }
            }
            structure = $divelement.divselect('getSelectStructure');
            if (format === 'object'){
                select = {
                    attributes : attributevalues,
                    readonly : readonly,
                    disabled : disabled,
                    multiple : multiple,
                    structure : structure
                };
            }
            if (format === 'html'){
                attrlist = '';
                for (name in attributevalues){
                    attrlist += ' ' + name + '="' + attributevalues[name] + '"';
                }
                if (readonly) attrlist += ' readonly="readonly"';
                if (disabled) attrlist += ' disabled="disabled"';
                if (multiple) attrlist += ' multiple="multiple"';
                select = '<select' + attrlist + '>\n';
                for (n = 0; n < structure.length; n++){
                    if (structure[n].type === 'option'){
                        // külső option
                        if (recover){
                            select += structure[n].originalTag + '\n';
                        }
                        else {
                            select += structure[n].tag + '\n';
                        }
                    }
                    else {
                        // optgroup
                        select += '<optgroup label="' + structure[n].label + '">\n';
                        for (m = 0; m < structure[n].options.length; m++){
                            // belső option
                            if (recover){
                                select += structure[n].options[m].originalTag + '\n';
                            }
                            else {
                                select += structure[n].options[m].tag + '\n';
                            }
                        }
                        select += '</optgroup>\n';
                    }
                }
                select += '</select>';
            }
            return select;
        },

        /**
         * Hozzáad a listához option elemet/elemeket
         * @param {String|Object|Array} elementDeterminer elemet leíró adatszerkezet
         * @param {String} [relative='before'] ('before'|'after') a helymeghatározó elé vagy utána legyen beszúrva
         * @param {String} [locationValue] elem helymeghatározója (előtte/utána lévő option value attribútuma)
         * @return {jQuery}
         */
        addOption : function(elementDeterminer, relative, locationValue){

            // adatgyűjtés
            var i, $element, $locationElement, elementData, dataStore, $segment;
            var optionTags = [];
            var $divelement = this;
            var cssPrefix = $divelement.data('cssPrefix');
            var template = $divelement.data('options').template;
            var notBubbling = $divelement.data('options').notBubbling;
            if (typeof relative === 'undefined'){
                relative = 'before';
            }
            if (typeof locationValue === 'undefined'){
                $locationElement = null;
            }
            else {
                $locationElement = $divelement.divselect('getElementByValue', locationValue);
            }

            // új option elem szegmenseinek elkészítése
            if ($.isArray(elementDeterminer)){
                // tömb
                if (relative === 'after'){
                    for (i = elementDeterminer.length - 1; i >= 0; i--){
                        $divelement.divselect('addOption', elementDeterminer[i], 'after', locationValue);
                    }
                }
                else {
                    for (i = 0; i < elementDeterminer.length; i++){
                        $divelement.divselect('addOption', elementDeterminer[i], 'before', locationValue);
                    }
                }
                return this;
            }
            else {
                elementData = $divelement.divselect('createOptionFromObject', elementDeterminer);
                $element = elementData.$element;
                optionTags = elementData.optionTags;
            }

            // elem beszúrása
            dataStore = {
                selected : false,
                disabled : false,
                readonly : false,
                value : '',
                html : ''
            };
            $segment = $(Creation.createOptionTag($element.get(0), template, optionTags, cssPrefix, dataStore));
            if ($locationElement !== null){
                if (relative === 'after'){
                    $locationElement.after($segment);
                }
                else {
                    $locationElement.before($segment);
                }
            }
            else {
                if (relative === 'after'){
                    $divelement.find('[data-element="menu"]').prepend($segment);
                }
                else {
                    $divelement.find('[data-element="menu"]').append($segment);
                }
            }

            // adatok hozzárendelése az elemhez
            $segment.attr('tabindex', '0');
            $segment.data('value', dataStore.value);
            if (dataStore.selected){
                $divelement.divselect('select', dataStore.value);
            }
            if (dataStore.disabled){
                $segment.data('disabled', true);
            }
            if (dataStore.readonly){
                $segment.data('readonly', true);
            }

            // eseménykezelők
            $segment.on('click.divselect', function(event){
                if (!$divelement.data('options').disableSelect){
                    Interaction.handleSpecialAction.select($(this), $divelement, event);
                    Interaction.bindNotBubblingEvent($divelement.find('[data-element="selector"]'), notBubbling);
                }
            });
            Interaction.bindNotBubblingEvent($segment, notBubbling);

            return this;

        },

        /**
         * Hozzáad a listához egy optgroup elemet (a benne lévő option-ökkel együtt)
         * @param {Array|Object} elementDeterminer elemet leíró adatszerkezet
         * @param {String} [relative='before'] ('before'|'after') a helymeghatározó elé vagy utána legyen beszúrva
         * @param {String} [locationValue] elem helymeghatározója (előtte/utána lévő option value attribútuma)
         * @return {jQuery}
         */
        addOptgroup : function(elementDeterminer, relative, locationValue){

            // adatgyűjtés
            var i, elementData1, elementData2, $element1, $element2, segment_optgroup_start, segment_optgroup_end;
            var $divelement = this;
            var cssPrefix = $divelement.data('cssPrefix');
            var template = $divelement.data('options').template;
            if (typeof relative === 'undefined'){
                relative = 'before';
            }

            // option-ök létrehozása és optgroup helyének meghatározása
            if ($.isArray(elementDeterminer)){
                // tömb
                if (relative === 'after'){
                    for (i = elementDeterminer.length - 1; i >= 0; i--){
                        $divelement.divselect('addOptgroup', elementDeterminer[i], 'after', locationValue);
                    }
                }
                else {
                    for (i = 0; i < elementDeterminer.length; i++){
                        $divelement.divselect('addOptgroup', elementDeterminer[i], 'before', locationValue);
                    }
                }
                return this;
            }
            if (elementDeterminer.options){
                $divelement.divselect('addOption', elementDeterminer.options, relative, locationValue);
            }
            if (typeof elementDeterminer.surround === 'undefined'){
                elementData1 = $divelement.divselect(
                    'createOptionFromObject', elementDeterminer.options[0]
                );
                elementData2 = $divelement.divselect(
                    'createOptionFromObject', elementDeterminer.options[elementDeterminer.options.length - 1]
                );
                elementDeterminer.surround = [elementData1.$element.val(), elementData2.$element.val()];
            }
            $element1 = $divelement.divselect('getElementByValue', elementDeterminer.surround[0]);
            $element2 = $divelement.divselect('getElementByValue', elementDeterminer.surround[1]);

            // optgroup szegmensek létrehozása
            template = template.replace(/\{cssPrefix}/g, cssPrefix);
            segment_optgroup_start = template.replace(/^[\s\S]*\{optgroup_start}([\s\S]*)\{\/optgroup_start}[\s\S]*$/g, '$1');
            segment_optgroup_end = template.replace(/^[\s\S]*\{optgroup_end}([\s\S]*)\{\/optgroup_end}[\s\S]*$/g, '$1');
            segment_optgroup_start = segment_optgroup_start.replace(/\{optgroup\.label}/mg, elementDeterminer.label);

            // optgroup beszúrása
            if ($element1.is($element2)){
                $element1.wrapAll(segment_optgroup_start + segment_optgroup_end);
            }
            else {
                $element1.nextUntil($element2).add($element1).add($element2)
                    .wrapAll(segment_optgroup_start + segment_optgroup_end);
            }
            $element1.parents('[data-element="group"]').data('label', elementDeterminer.label);

            return this;

        },

        /**
         * Eltávolítja a listából az adott option elemet/elemeket
         * @param {String|Array} value érték
         * @return {jQuery}
         */
        removeOption : function(value){
            var i;
            if ($.isArray(value)){
                for (i = 0; i < value.length; i++){
                    this.divselect('removeOption', value[i]);
                }
            }
            this.each(function(){
                $(this).divselect('getElementByValue', value).remove();
            });
            return this;
        },

        /**
         * Eltávolítja a listából az adott optgroup elemet/elemeket
         * @param {String|Array} label attribútum
         * @param {Boolean} [withOptions=false] benne lévő option-ök eltávolítása
         * @return {jQuery}
         */
        removeOptgroup : function(label, withOptions){
            var i, $items;
            if (typeof withOptions === 'undefined'){
                withOptions = false;
            }
            if ($.isArray(label)){
                for (i = 0; i < label.length; i++){
                    this.divselect('removeOptgroup', label[i], withOptions);
                }
            }
            this.each(function(){
                $(this).find('[data-element="group"]').each(function(){
                    if ($(this).data('label') === label){
                        if (withOptions){
                            $(this).remove();
                        }
                        else {
                            $items = $(this).find('[data-element="item"]').detach();
                            $(this).replaceWith($items);
                        }
                        return false;
                    }
                });
            });
            return this;
        },

        /**
         * Eltávolítja a listából az összes optiont vagy optgroupot
         * @param {String} [remove='all'] ('all'|'options'|'optgroups')
         * @return {jQuery}
         */
        truncate : function(remove){
            var $divelement = this;
            if (typeof remove === 'undefined') remove = 'all';
            if (remove === 'all'){
                $.each($divelement.divselect('getOptgroups'), function(){
                    $divelement.divselect('removegroup', this, true);
                });
                $.each($divelement.divselect('getOptions'), function(){
                    $divelement.divselect('removeOption', this);
                });
            }
            if (remove === 'options'){
                $.each($divelement.divselect('getOptions'), function(){
                    $divelement.divselect('removeOption', this);
                });
            }
            if (remove === 'optgroups'){
                $.each($divelement.divselect('getOptgroups'), function(){
                    $divelement.divselect('removeOptgroup', this, false);
                });
            }
            return this;
        },

        // SEGÉDFÜGGVÉNYEK

        /**
         * Listaelem visszaadása érték alapján (segédfüggvény)
         * @param {String} value érték
         * @return {jQuery} elem
         */
        getElementByValue : function(value){
            var $element = $();
            this.find('[data-element="item"]').each(function(){
                if ($(this).data('value') === value){
                    $element = $(this);
                    return false;
                }
            });
            return $element;
        },

        /**
         * Érték visszaadása listaelem alapján (segédfüggvény)
         * @param {jQuery|HTMLElement|String} element elemet leíró adatszerkezet
         * @return {String} value érték
         */
        getValueByElement : function(element){
            var value = null;
            if (element.jquery){
                // jQuery objektum
                value = element.data('value');
            }
            else if (element.nodeType){
                // DOM elem
                value = $(element).data('value');
            }
            else if (typeof element === 'string'){
                // innerHTML
                this.find('[data-element="item"]').each(function(){
                    if ($(this).html() === element){
                        value = $(this).data('value');
                        return false;
                    }
                });
            }
            return value;
        },

        /**
         * A divselect jelenlegi állapotának megfelelő select struktúráját adja vissza (segédfüggvény)
         * @return {Array} a struktúrát leíró objektumokból álló tömb
         */
        getSelectStructure : function(){
            var $divelement = this;
            var params, param;
            var structure = [];
            var $elem, $option, $optgroup, $lastgroup;
            $divelement.find('[data-element="item"], [data-element="group"]').each(function(){
                $elem = $(this);
                if ($elem.is('[data-element="item"]')){
                    // option
                    params = {
                        selected : $elem.data('selected') ? ' selected="selected"' : '',
                        readonly : $elem.data('readonly') ? ' readonly="readonly"' : '',
                        disabled : $elem.data('disabled') ? ' disabled="disabled"' : ''
                    };
                    param = params.selected + params.readonly + params.disabled;
                    $option = {
                        type : 'option',
                        value : $elem.data('value'),
                        html : $elem.html(),
                        selected : $elem.data('selected'),
                        readonly : $elem.data('readonly'),
                        disabled : $elem.data('disabled'),
                        tag : '<option value="' + $elem.data('value') + '"' + param + '>' + $elem.html() + '</option>',
                        originalTag :
                        '<option value="' + $elem.data('value') + '"' + param + '>' + $elem.data('html') + '</option>'
                    };
                    $optgroup = $divelement.divselect('getContainerOptgroup', $elem.data('value'), 'element');
                    if ($optgroup && $optgroup.data('label') === $lastgroup.label){
                        $lastgroup.options.push($option);
                    }
                    else {
                        structure.push($option);
                    }
                }
                else {
                    // optgroup
                    $lastgroup = {
                        type : 'optgroup',
                        label : $elem.data('label'),
                        options : []
                    };
                    structure.push($lastgroup);
                }
            });
            return structure;
        },

        /**
         * A befoglaló optgroup visszaadása az option value-ja alapján (segédfüggvény)
         * @param {String} value option value-ja
         * @param {String} format formátum ('label'|'element')
         * @return {String|jQuery} az optgroup vagy null
         */
        getContainerOptgroup : function(value, format){
            var ret, $optgroup;
            var $divelement = this;
            var $option = $divelement.divselect('getElementByValue', value);
            if ($option.length === 0){
                return null;
            }
            $optgroup = $option.parents('[data-element="group"]').eq(0);
            if ($optgroup.length > 0){
                ret = (format === 'label') ? $optgroup.data('label') : $optgroup;
            }
            else {
                ret = null;
            }
            return ret;
        },

        /**
         * option-t leíró adatszerkezeteket értelmező segédfüggvény
         * @param {String|Object} elementDeterminer elemet leíró adatszerkezet
         * @return {Object}
         */
        createOptionFromObject : function(elementDeterminer){
            var describer;
            // objektum-értelmező függvény
            var getOptionFromObject = function(o){
                var element = '<option{attr}></option>';
                var attr = '';
                var descr = {
                    element : '<option></option>',
                    html : o.html ? o.html : '',
                    value : o.value ? o.value : ''
                };
                if (o.value)    attr += ' value="' + o.value + '"';
                if (o.selected) attr += ' selected="selected"';
                if (o.disabled) attr += ' disabled="disabled"';
                if (o.readonly) attr += ' readonly="readonly"';
                descr.element = element.replace(/\{attr}/g, attr);
                return descr;
            };
            var elementData = {
                $element : null,
                optionTags : []
            };
            if ($.isPlainObject(elementDeterminer)){
                // objektum
                describer = getOptionFromObject(elementDeterminer);
                elementData.$element = $(describer.element);
                elementData.optionTags[describer.value] = describer.html;
            }
            else if (typeof elementDeterminer === 'string' && /<option[^>]*>(.*)<\/option>/g.test(elementDeterminer)){
                // html
                elementData.$element = $(elementDeterminer.replace(/(<option[^>]*>)(.*)(<\/option>)/g, '$1$3'));
                elementData.optionTags[elementData.$element.val()] =
                    elementDeterminer.replace(/(<option[^>]*>)(.*)(<\/option>)/g, '$2');
            }
            return elementData;
        },

        // BŐVÍTŐ FÜGGVÉNYEK

        /**
         * Referencia lekérése a Divselect objektumra (a belső működés módosításához/bővítéséhez)
         * @return {Object} a Divselect objektum
         */
        getPlugin : function(){
            var plugin = {};
            plugin.defaultOptions = defaultOptions;
            plugin.optionData = optionData;
            plugin.Util = Util;
            plugin.Creation = Creation;
            plugin.Interaction = Interaction;
            plugin.Methods = Methods;
            return plugin;
        }

    };

    /**
     * A plugin integrálása a jQuery könyvtárba
     * @param {String|Object} [method] metódus hívása
     * @returns {*}
     */
    $.fn.divselect = function(method){
        if (Methods[method]){
            return Methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        }
        else if (typeof method === 'object' || !method){
            return Methods.create.apply(this, arguments);
        }
        else {
            $.error('The jquery.divselect plugin does not have ' + method + ' method.');
            return false;
        }
    };

})(jQuery);
