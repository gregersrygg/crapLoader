/**
(c) Gregers Rygg - MIT License
*/
/*globals console*/
var crapLoader = (function() {
    
    var isHijacked = false,
        queue = [],
        inputBuffer = [],
        writeBuffer = {},
        loading = 0,
        elementCache = {},
        returnedElements = [],
        splitScriptsRegex = /(<script[\s\S]*?<\/script>)/gim,
        globalOptions = {
            autoRelease: true,
            parallel: true,
            debug: false
        },
        defaultOptions = {
            charset: undefined,
            success: undefined,
            func: undefined,
            src: undefined,
            timeout: 3000
        },priv,publ,
        head = document.getElementsByTagName("head")[0] || document.documentElement,
        support = {
            scriptOnloadTriggeredAccurately: false,
            splitWithCapturingParentheses: ("abc".split(/(b)/)[1]==="b")
        };



    priv = {
        checkQueue: function() {
            if(queue.length) {
                priv.loadScript( queue.shift() );
            } else if(loading === 0 && globalOptions.autoRelease) {
                this.debug("Queue is empty. Auto-releasing.");
                publ.release();
            }
        },

        checkWriteBuffer: function(obj) {
            var buffer = writeBuffer[obj.domId],
                returnedEl;

            if(buffer && buffer.length) {
                priv.writeHtml( buffer.shift(), obj );

            } else {
                while (returnedElements.length > 0) {
                    returnedEl = returnedElements.pop();
                    var id = returnedEl.id;
                    var elInDoc = priv.getElementById(id);
                    if (!elInDoc) { continue; }
                    var parent = elInDoc.parentNode;
                    elInDoc.id = id + "__tmp";
                    parent.insertBefore(returnedEl, elInDoc);
                    parent.removeChild(elInDoc);
                }
                priv.finished(obj);
            }
        },

        debug: function(message, obj) {
            if(!globalOptions.debug || !window.console) { return; }
            var objExtra = "";
            if(obj) {
                objExtra = "#"+obj.domId+" ";
                var depth = obj.depth;
                while(depth--) { objExtra += "    "; }
            }
        },

        extend: function(t, s) {
            var k;
            if(!s) { return t; }
            for(k in s) {
                t[k] = s[k];
            }
            return t;
        },

        finished: function(obj) {
            if(obj.success && typeof obj.success === "function") {
                obj.success.call( document.getElementById(obj.domId) );
            }

            priv.checkQueue();
        },

        flush: function(obj) {
            var domId = obj.domId,
               outputFromScript,
               htmlPartArray;

            outputFromScript = this.stripNoScript( inputBuffer.join("") );
            inputBuffer = [];

            htmlPartArray = priv.separateScriptsFromHtml( outputFromScript );

            if(!writeBuffer[domId]) {
                writeBuffer[domId] = htmlPartArray;
            } else {
                Array.prototype.unshift.apply(writeBuffer[domId], htmlPartArray);
            }
            priv.checkWriteBuffer(obj);
        },

        getCachedElById: function(domId) {
            return elementCache[domId] || (elementCache[domId] = document.getElementById(domId));
        },

        getElementById: function(domId) {
            return ( publ.orgGetElementById.call ?
                publ.orgGetElementById.call(document, domId) :
                publ.orgGetElementById(domId) );
        },

        getElementByIdReplacement: function(domId) {
            var el = priv.getElementById(domId),
                html, frag, div, found;

            function traverseForElById(domId, el) {
                var children = el.children, i, l, child;
                if(children && children.length) {
                    for(i=0,l=children.length; i<l; i++) {
                        child = children[i];
                        if(child.id && child.id === domId) { return child; }
                        if(child.children && child.children.length) { return traverseForElById(child); }
                    }
                }
            }

            function searchForAlreadyReturnedEl(domId) {
                var i, l, returnedEl;
                for(i=0,l=returnedElements.length; i<l; i++) {
                    returnedEl = returnedElements[i];
                    if(returnedEl.id && returnedEl.id === domId) { return returnedEl; }
                }
            }

            if(el) { return el; }

            if (returnedElements.length) {
                found = searchForAlreadyReturnedEl(domId);
                if (found) {
                    return found;
                }
            }

            if(inputBuffer.length) {
                html = inputBuffer.join("");
                frag = document.createDocumentFragment();
                div = document.createElement("div");
                div.innerHTML = html;
                frag.appendChild(div);
                found = traverseForElById(domId, div);
                if (found) {
                    returnedElements.push(found);
                }
                return found;
            }
        },

        globalEval: (function() {
            return (window.execScript ? function(code, language) {
                window.execScript(code, language || "JavaScript");
            } : function(code, language) {
                if(language && !/^javascript/i.test(language)) { return; }
                window.eval.call(window, code);
            });
        }()),

        isScript: function(html) {
            return html.toLowerCase().indexOf("<script") === 0;
        },

        runFunc: function(obj) {
            obj.func();
            obj.depth++;
            this.flush(obj);
        },

        loadScript: function(obj) {
            loading++;
            // async loading code from jQuery
            var script = document.createElement("script");
            if(obj.type) { script.type = obj.type; }
            if(obj.charset) { script.charset = obj.charset; }
            if(obj.language) { script.language = obj.language; }

            priv.logScript(obj);

            var done = false;
            // Attach handlers for all browsers
            script.onload = script.onreadystatechange = function() {
                loading--;
                script.loaded = true;
                if ( !done && (!this.readyState ||
                        this.readyState === "loaded" || this.readyState === "complete") ) {
                    done = true;
                    script.onload = script.onreadystatechange = null;
                    priv.debug("onload " + obj.src, obj);
                    priv.flush(obj);
                }
            };

            script.loaded = false;
            script.src = obj.src;
            obj.depth++;

            // Use insertBefore instead of appendChild  to circumvent an IE6 bug.
            // This arises when a base node is used (#2709 and #4378).
            head.insertBefore( script, head.firstChild );
            setTimeout(function() {
                if(!script.loaded) { throw new Error("SCRIPT NOT LOADED: " + script.src); }
            }, obj.timeout);
        },

        logScript: function(obj, code, lang) {
            this.debug((code ?
                "Inline " + lang + ": " + code.replace("\n", " ").substr(0, 30) + "..." :
                "Inject " + obj.src), obj);
        },

        separateScriptsFromHtml: function(htmlStr) {
            return priv.split(htmlStr, splitScriptsRegex);
        },

        split: function(str, regexp) {
            var match, prevIndex=0, tmp, result = [], i, l;

            if(support.splitWithCapturingParentheses) {
                tmp = str.split(regexp);
            } else {
                // Cross browser split technique from Steven Levithan
                // http://blog.stevenlevithan.com/archives/cross-browser-split
                tmp = [];
                while(match = regexp.exec(str)) {
                    if(match.index > prevIndex) {
                        result.push(str.slice(prevIndex, match.index));
                    }

                    if(match.length > 1 && match.index < str.length) {
                        Array.prototype.push.apply(tmp, match.slice(1));
                    }

                    prevIndex = regexp.lastIndex;
                }

                if(prevIndex < str.length) {
                    tmp.push(str.slice(prevIndex));
                }

            }

            for(i=0, l=tmp.length; i<l; i=i+1) {
                if(tmp[i]!=="") { result.push(tmp[i]); }
            }

            return result;
        },

        stripNoScript: function(html) {
            return html.replace(/<noscript>[\s\S]*?<\/noscript>/ig, "");
        },

        trim: function(str) {
            if(!str) { return str; }
            return str.replace(/^\s*|\s*$/gi, "");
        },

        writeHtml: function(html, obj) {
            if( this.isScript(html) ) {
                var dummy = document.createElement("div");
                dummy.innerHTML = "dummy<div>" + html + "</div>"; // trick for IE
                var script = dummy.children[0].children[0];
                var lang = script.getAttribute("language") || "javascript";
                if(script.src) {
                    obj.src = script.src;
                    obj.charset = script.charset;
                    obj.language = lang;
                    obj.type = script.type;
                    priv.loadScript(obj);
                } else {
                    var code = this.trim( script.text );
                    if(code) {
                        this.logScript( obj, code, lang);
                        this.globalEval( code, lang);
                    }
                    priv.flush(obj);
                }
            } else {
                var container = priv.getCachedElById(obj.domId);
                if(!container) {
                    throw new Error("crapLoader: Unable to inject html. Element with id '" + obj.domId + "' does not exist");
                }
                
                html = this.trim(html); // newline before <object> cause weird effects in IE
                if(html) {
                    container.innerHTML += html;
                }
                priv.checkWriteBuffer(obj);
            }
        },

        writeReplacement: function(str) {
            inputBuffer.push(str);
            priv.debug("write: " + str);
        }

    };

    publ = {
        hijack: function(options) {
            if(isHijacked) { return; }
            isHijacked = true;
            priv.extend(globalOptions, options);
            if(globalOptions.parallel && !support.scriptOnloadTriggeredAccurately) {
                globalOptions.parallel = false;
                priv.debug("Browsers onload is not reliable. Disabling parallel loading.");
            }

            document.write = document.writeln = priv.writeReplacement;
            document.getElementById = priv.getElementByIdReplacement;
        },

        release: function() {
            if(!isHijacked) { return; }
            isHijacked = false;
            document.write = this.orgWrite;
            document.writeln = this.orgWriteLn;
            document.getElementById = this.orgGetElementById;
            elementCache = {};
        },

        handle: function(options) {
            if(!isHijacked) {
                priv.debug("Not in hijacked mode. Auto-hijacking.");
                this.hijack();
            }
            var defaultOptsCopy = priv.extend({}, defaultOptions);
            var obj = priv.extend(defaultOptsCopy, options);
            obj.depth = 0;

            if (!obj.domId) {
                obj.domId = "craploader_" + new Date().getTime();
                var span = document.createElement("span");
                span.id = obj.domId;
                document.body.appendChild(span);
            }

            if (options.func) {
                priv.runFunc(obj);
                return;
            }

            if(globalOptions.parallel) {
                setTimeout(function() {
                    priv.loadScript(obj);
                }, 1);
            } else {
                queue.push(obj);
                setTimeout(function() {
                    if(loading === 0) {
                        priv.checkQueue();
                    }
                }, 1);
            }
        },

        loadScript: function(src, domId, options) {
            if (typeof domId !== "string") {
                options = domId;
                domId = undefined;
            }
            this.handle(priv.extend({
                src:    src,
                domId:  domId
            }, options));
        },

        runFunc: function(func, domId, options) {
            if (typeof domId !== "string") {
                options = domId;
                domId = undefined;
            }
            this.handle(priv.extend({
                domId:  domId,
                func:     func
            }, options));
        },

        orgGetElementById   : document.getElementById,
        orgWrite            : document.write,
        orgWriteLn          : document.writeln,
        _olt                : 1,
        _oltCallback        : function() {
            support.scriptOnloadTriggeredAccurately = (publ._olt===2);
        }
    };

    return publ;
}());

(function(){
    var src = "data:text/javascript;base64,Y3JhcExvYWRlci5fb2x0PTI=";
    document.write('<script src="'+src+'" onload="crapLoader._oltCallback()"></script><script src="'+src.replace(/I/, "M")+'"></script>');
}());