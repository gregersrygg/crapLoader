Introduction
------------
The goal of crapLoader is to loads ads, widgets or any javascript-code with
document.write in it. The recommended solution is to use iframes for
third-party content, but this is not always possible. Normally document.write
prevents you from loading a script asynchronously, but this lib hijacks
document.write and delegates the content loaded from each script into the
correct position.

Stability
---------
crapLoader can handle more than any other open-source document.write hack that
I've found, but I'm sure there are plenty of edge-cases it does not handle
(yet). If you find something crapLoader can't handle please open a new issue
with a *reproducible standalone example*.

*Use at your own responsibility!*
[Murpy's laws](http://www.murphys-laws.com/murphy/murphy-laws.html) apply

Usage
-----
First you have to hijack document.write. You can do it before or after page
load, but it has to be before you load the scripts that use document.write.

    crapLoader.hijack({  /* hijacks write, writeln and getElementById */
        loadSequentially: true /* Load in parallel or sequential? default false */
    });

Then you must use crapLoader to load each script and supply a container id for
the output from document.write.

    crapLoader.loadScript(url, "banner", {
        charset: "utf-8", /* Charset when injecting scripts. default utf-8 */
        success: function() {
            /* Callback when the script and dependencies are completely loaded */
            crapLoader.release(); // release hijacked methods
        }
    });