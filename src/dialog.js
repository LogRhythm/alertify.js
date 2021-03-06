define(["alertify", "element", "validate", "keys"], function (Alertify, element, validate, keys) {
    "use strict";

    var dialog = {};

    var Dialog = function () {
        var controls     = {},
            dialog       = {},
            isOpen       = false,
            queue        = [],
            tpl          = {},
            prefixEl     = Alertify._prefix + "-dialog",
            prefixCover  = Alertify._prefix + "-cover",
            clsElHide    = prefixEl + " is-" + prefixEl + "-hidden",
            clsCoverHide = prefixCover + " is-" + prefixCover + "-hidden",
            elCallee,
            appendBtns,
            addListeners,
            build,
            hide,
            init,
            onBtnCancel,
            onBtnOK,
            onBtnResetFocus,
            onFormSubmit,
            onKeyUp,
            open,
            removeListeners,
            setFocus,
            setup;

        tpl = {
            buttons : {
                holder : "<nav class=\"alertify-buttons\">{{buttons}}</nav>",
                submit : "<button role=\"button\" type=\"submit\" class=\"alertify-button alertify-button-ok\" id=\"alertify-ok\">{{ok}}</button>",
                ok     : "<button role=\"button\" type=\"button\" class=\"alertify-button alertify-button-ok\" id=\"alertify-ok\">{{ok}}</button>",
                cancel : "<button role=\"button\" type=\"button\" class=\"alertify-button alertify-button-cancel\" id=\"alertify-cancel\">{{cancel}}</button>"
            },
            input   : "<div class=\"alertify-text-wrapper\"><input type=\"text\" class=\"alertify-text\" id=\"alertify-text\"></div>",
            message : "<p class=\"alertify-message\">{{message}}</p>",
            log     : "<article class=\"alertify-log{{class}}\">{{message}}</article>"
        };

        addListeners = function (item) {
            // ok event handler
            onBtnOK = function (event) {
                var val = "";
                if (typeof event.preventDefault !== "undefined") {
                    event.preventDefault();
                }
                removeListeners();
                hide();

                if (controls.input) {
                    val = controls.input.value;
                }
                if (typeof item.accept === "function") {
                    if (controls.input) {
                        item.accept(val);
                    } else {
                        item.accept();
                    }
                }
                return false;
            };

            // cancel event handler
            onBtnCancel = function (event) {
                if (typeof event.preventDefault !== "undefined") {
                    event.preventDefault();
                }
                removeListeners();
                hide();
                if (typeof item.deny === "function") {
                    item.deny();
                }
                return false;
            };

            // keyup handler
            onKeyUp = function (event) {
                var keyCode = event.keyCode;
                if (keyCode === keys.SPACE && !controls.input) {
                    onBtnOK(event);
                }
                if (keyCode === keys.ESC && controls.cancel) {
                    onBtnCancel(event);
                }
            };

            // reset focus to first item in the dialog
            onBtnResetFocus = function () {
                if (controls.input) {
                    controls.input.focus();
                } else if (controls.cancel) {
                    controls.cancel.focus();
                } else {
                    controls.ok.focus();
                }
            };

            // handle reset focus link
            // this ensures that the keyboard focus does not
            // ever leave the dialog box until an action has
            // been taken
            Alertify.on(controls.reset, "focus", onBtnResetFocus);
            // handle OK click
            if (controls.ok) {
                Alertify.on(controls.ok, "click", onBtnOK);
            }
            // handle Cancel click
            if (controls.cancel) {
                Alertify.on(controls.cancel, "click", onBtnCancel);
            }
            // listen for keys, Cancel => ESC
            Alertify.on(document.body, "keyup", onKeyUp);
            // bind form submit
            if (controls.form) {
                Alertify.on(controls.form, "submit", onBtnOK);
            }
        };

        /**
         * Append Buttons
         * Insert the buttons in the proper order
         *
         * @param  {String} secondary Cancel button string
         * @param  {String} primary   OK button string
         * @return {String}
         */
        appendBtns = function (secondary, primary) {
            return dialog.buttonReverse ? primary + secondary : secondary + primary;
        };

        build = function (item) {
            var html    = "",
                type    = item.type,
                message = item.message;

            html += "<div class=\"alertify-dialog-inner\">";

            if (dialog.buttonFocus === "none") {
                html += "<a href=\"#\" id=\"alertify-noneFocus\" class=\"alertify-hidden\"></a>";
            }

            if (type === "prompt") {
                html += "<form id=\"alertify-form\">";
            }

            html += "<article class=\"alertify-inner\">";
            html += tpl.message.replace("{{message}}", message);

            if (type === "prompt") {
                html += tpl.input;
            }

            html += tpl.buttons.holder;
            html += "</article>";

            if (type === "prompt") {
                html += "</form>";
            }

            html += "<a id=\"alertify-resetFocus\" class=\"alertify-resetFocus\" href=\"#\">Reset Focus</a>";
            html += "</div>";

            switch (type) {
            case "confirm":
                html = html.replace("{{buttons}}", appendBtns(tpl.buttons.cancel, tpl.buttons.ok));
                html = html.replace("{{ok}}", dialog.labels.ok).replace("{{cancel}}", dialog.labels.cancel);
                break;
            case "prompt":
                html = html.replace("{{buttons}}", appendBtns(tpl.buttons.cancel, tpl.buttons.submit));
                html = html.replace("{{ok}}", dialog.labels.ok).replace("{{cancel}}", dialog.labels.cancel);
                break;
            case "alert":
                html = html.replace("{{buttons}}", tpl.buttons.ok);
                html = html.replace("{{ok}}", dialog.labels.ok);
                break;
            }

            return html;
        };

        hide = function () {
            queue.splice(0,1);
            if (queue.length > 0) {
                open(true);
            } else {
                isOpen = false;
                dialog.el.className = clsElHide;
                dialog.cover.className  = clsCoverHide;
                Alertify.dialogHide(dialog);
                elCallee.focus();
            }
        };

        /**
         * Initialize Dialog
         * Create the dialog and cover elements
         *
         * @return {Object}
         */
        init = function () {
            var cover = element.create("div", { classes: clsCoverHide }),
                el    = element.create("section", { classes: clsElHide });

            document.body.appendChild(cover);
            document.body.appendChild(el);
            element.ready(cover);
            element.ready(el);
            dialog.cover = cover;
            return el;
        };

        open = function (fromQueue) {
            var item = queue[0];

            isOpen = true;

            dialog.el.innerHTML    = build(item);

            Alertify.dialogShow(dialog,function(){
                if(!fromQueue){
                    setFocus();
                }
            });

            controls.reset  = Alertify.get("alertify-resetFocus");
            controls.ok     = Alertify.get("alertify-ok")     || undefined;
            controls.cancel = Alertify.get("alertify-cancel") || undefined;
            controls.focus  = (dialog.buttonFocus === "cancel" && controls.cancel) ? controls.cancel : ((dialog.buttonFocus === "none") ? Alertify.get("alertify-noneFocus") : controls.ok);
            controls.input  = Alertify.get("alertify-text")   || undefined;
            controls.form   = Alertify.get("alertify-form")   || undefined;

            if (typeof item.placeholder === "string" && item.placeholder !== "") {
                controls.input.value = item.placeholder;
            }

            if (fromQueue) {
                setFocus();
            }
            addListeners(item);
        };

        /**
         * Remove Event Listeners
         *
         * @return {undefined}
         */
        removeListeners = function () {
            Alertify.off(document.body, "keyup", onKeyUp);
            Alertify.off(controls.reset, "focus", onBtnResetFocus);
            if (controls.input) {
                Alertify.off(controls.form, "submit", onFormSubmit);
            }
            if (controls.ok) {
                Alertify.off(controls.ok, "click", onBtnOK);
            }
            if (controls.cancel) {
                Alertify.off(controls.cancel, "click", onBtnCancel);
            }
        };

        /**
         * Set Focus
         * Set focus to proper element
         *
         * @return {undefined}
         */
        setFocus = function () {
            if (controls.input) {
                controls.input.focus();
                controls.input.select();
            } else {
                controls.focus.focus();
            }
        };

        /**
         * Setup Dialog
         *
         * @param  {String} type        Dialog type
         * @param  {String} msg         Dialog message
         * @param  {Function} accept    [Optional] Accept callback
         * @param  {Function} deny      [Optional] Deny callback
         * @param  {String} placeholder [Optional] Input placeholder text
         * @return {undefined}
         */
        setup = function (type, msg, accept, deny, placeholder) {
            if (!validate.isString(type)          ||
                !validate.isString(msg)           ||
                !validate.isFunction(accept,true) ||
                !validate.isFunction(deny,true)   ||
                !validate.isString(placeholder, true)) {
                throw new Error(validate.messages.invalidArguments);
            }
            dialog.el = dialog.el || init();
            elCallee = document.activeElement;

            queue.push({
                type        : type,
                message     : msg,
                accept      : accept,
                deny        : deny,
                placeholder : placeholder
            });

            if (!isOpen) {
                open();
            }
        };

        return {
            buttonFocus   : "ok",
            buttonReverse : false,
            cover         : undefined,
            el            : undefined,
            labels: {
                ok: "OK",
                cancel: "Cancel"
            },
            alert: function (msg, accept) {
                dialog = this;
                setup("alert", msg, accept);
                return this;
            },
            confirm: function (msg, accept, deny) {
                dialog = this;
                setup("confirm", msg, accept, deny);
                return this;
            },
            prompt: function (msg, accept, deny, placeholder) {
                dialog = this;
                setup("prompt", msg, accept, deny, placeholder);
                return this;
            }
        };
    };

    return new Dialog();
});
