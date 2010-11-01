
var crapLoader = (function() {
    var queue = []
        ,inputBuffer = []
        ,writeBuffer = {}
        ,chunkBuffer
        ,loading = false
        ,elementCache = {}
        ,splitScriptsRegex = /(<script[^>]+src=['"]?[^'"\s]+[^>]*>\s*<\/script>)/
        ,externalScriptSrcRegex = /<script[^>]+src=['"]?([^'"\s]+)[^>]*>\s*<\/script>/
        ,defaultOptions = {
            async: false,
            charset: "utf-8",
            success: undefined
        },p = {
            
            captureDocWrite: function() {
                
                document.write = p.writeReplacement;
                
            },
            
            checkWriteBuffer: function(domId) {
                var buffer = writeBuffer[domId];
                if(buffer && buffer.length) {
                    p.writeHtml(buffer.shift(), domId);
                }
            },
            
            extend: function(t, s) {
                if(!s) return t;
                for(var k in s) {
                    t[k] = s[k];
                }
                return t;
            },
            
            flush: function(domId) {
                //console.log("INPUTBUFFER: " + inputBuffer)
                var outputFromScript = p.separateScriptsFromHtml( inputBuffer.join("") );
                inputBuffer = [];
                
                if(!writeBuffer[domId]) {
                    writeBuffer[domId] = outputFromScript;
                } else {
                    writeBuffer[domId].unshift.apply(writeBuffer, outputFromScript);
                }
                p.checkWriteBuffer(domId);
            },
            
            getElById: function(domId) {
                return elementCache[domId] || (elementCache[domId] = document.getElementById(domId));
            },
            
            injectToDoc: function(chunk) {
                
                if(chunk.s) {
                    
                } else {
                    
                }
                
            },
            
            loadScript: function(src, domId, options) {
                var defaultOptsCopy = p.extend({}, defaultOptions);
                options = p.extend(defaultOptsCopy, options);
                options.depth = 0;
                options.src = src;
                options.domId = domId;
                
                // async loading code from jQuery
                var head = document.getElementsByTagName("head")[0] || document.documentElement
                   ,script = document.createElement("script");
                script.type = "text/javascript";
                script.charset = options.charset;
                
                var done = false;
                // Attach handlers for all browsers
				script.onload = script.onreadystatechange = function() {
					if ( !done && (!this.readyState ||
							this.readyState === "loaded" || this.readyState === "complete") ) {
						done = true;
						script.onload = script.onreadystatechange = null;
                        if ( head && script.parentNode ) {
                    		head.removeChild( script );
            			}
            			
            			p.flush(domId);
            			if(options.success && typeof options.success == "function") {
            			    options.success.call(script);
            			}
            		}
				};
				
                script.src = src;
				// Use insertBefore instead of appendChild  to circumvent an IE6 bug.
                // This arises when a base node is used (#2709 and #4378).
                head.insertBefore( script, head.firstChild );
                //console.log(head.innerHTML)
            },
            
            onLoadHandlerProxy: function(domId) {
                
            },
            
            orgWrite: document.write,
            
            
            separateScriptsFromHtml: function(htmlStr) {
                
                var chunks = []
                    ,splitHtml = htmlStr.split(splitScriptsRegex)
                    ,i = 0
                    ,l = splitHtml.length
                    ,scriptMatch
                    ,tmp;
                return splitHtml;    
                /*
                while(i < l) {
                    tmp = splitHtml[i++];
                    if(!tmp) continue;
                    scriptMatch = tmp.match(/<script[^>]+src=['"]?([^'"\s]+)[^>]*>/);
                    chunks.push( (scriptMatch && scriptMatch.length==2 ? {s:scriptMatch[1]} : {h:tmp} ) );
                }
                
                return chunks;*/
        
            },
            
            writeHtml: function(html, domId) {
                var scriptMatch = html.match(externalScriptSrcRegex);
                if(scriptMatch && scriptMatch.length == 2) {
                    var scriptSrc = scriptMatch[1];
                    p.loadScript(scriptSrc, domId);
                } else {
                    var container = p.getElById(domId);
                    if(!container) throw new Error("crapLoader: Unable to inject html. Element with id '" + domId + "' does not exist");
                    container.innerHTML += html;
                    p.checkWriteBuffer(domId);
                }
            },
            
            writeReplacement: function(str) {
                //console.log("document.write: " + str);
                inputBuffer.push(str);
            
            }
            
        };
    return p;
})();
