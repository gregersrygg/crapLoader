Introduction
------------
The goal of crapLoader is to loads ads, widgets or any javascript-code with
document.write in it. The recommended solution is to use iframes for
third-party content, but this is not always possible. Normally document.write
prevents you from loading a script asynchronously, but this lib hijacks
document.write and delegates the content loaded from each script into the
correct position.


Features
--------
* Load (almost) any **third-party script asynchronously**
    * Does **not block rendering** of your page
        * Your visitors see your content earlier
        * DOMContentLoaded (a.k.a. $(doc).ready ) and window.onload triggered earlier
    * Load the **banners in parallel!** Except in IE ;(
        * Banners loads faster (at least in theory)
* Handles **recursive scripts**
    * Inline and external javascript
    * Inline and external vbscript
* Buffer document.write, flush on script load event
    * Handles document.getElementById from the buffer
* Tested (manually) in IE 6-10, latest Firefox, Chrome, Safari, Opera


Disadvantages
-------------
* You never know for sure that all ads will load correctly
* Ads might circumvent by getting a clean doc.write from an iframe
    * Possible to stop, but won't
* Using this script might violate the terms of your ad provider
* You can't use document.write in your own scripts, but *why* would you?!?
* document.getElementById will be a tad slower until all scripts loaded with crapLoader are finished loading


Simple usage
------------
Usually banners are included with `document.write("<script src='...'></script>")`. Instead call crapLoader.loadScript with the same url as you had in the src attribute, and the DOM id of the element where you want the content:

```html
<script type="text/javascript" src="crapLoader.js"></script>

<div id="banner1"></div>
<script type="text/javascript">
    crapLoader.loadScript("http://foo.bar/ad1.js", "banner1");
</script>

<div id="banner2"></div>
<script type="text/javascript">
    crapLoader.loadScript("http://foo.bar/ad2.js", "banner2");
</script>
```

This will load the scripts in parallel and put the document.write-output into the corresponding div.


Run local function
---------------
Sometimes you need to run code that doesn't directly get loaded from an external source, but may need to call functions from a third-party script. Those functions may do document.write. Using *runFunc* will apply the same logic on a function as loadScript does.

```javascript
crapLoader.runFunc(function() {
    evilFunctionThatMayCallDocumentWrite();
}, "my-dom-id");
```


Advanced usage
--------------
First you have to hijack document.write. It should only be called once even if you load multiple scripts. You can do it before or after page load, but it has to be before you load the scripts that use document.write. In simple mode crapLoader will automatically hijack the document.write and writeln method. If you want to hijack earlier or set global uptions, you must call hijack yourself.

```javascript
crapLoader.hijack({        /* Hijacks write, writeln and getElementById */
    debug: true,           /* Logs debug output to the console */
    parallel: false        /* Load in parallel or sequential? default true */
});
```

Then you must use crapLoader to load each script and supply a container id for the output from document.write.


```html
<script type="text/javascript" src="crapLoader.js"></script>

<div id="banner1"></div>
<div id="banner2"></div>
<script type="text/javascript">
    crapLoader.loadScript("http://foo.bar/ad1.js", "banner1", {
        succsess: function() {
            if( !$("#banner1 img").is("[src $= 1px.gif]") ) { // if not an empty gif
                $("body").addClass("dominance");              // it's a dominance ad!
            }
        }
    });
    crapLoader.loadScript("http://foo.bar/ad2.js", "banner2", {
        charset: "iso-8859-1"
    });
</script>
```

crapLoader.handle
-----------------
This is what *loadScript* and *runFunc* use internally. It only have one parameter with an option litteral. Here are all the options and default values.

```
crapLoader.handle({
    func:       undefined,  // Function that results in document.write. Overrides src options.
    src:        undefined,  // URL of the external script to load. Won't load if func is specified.
    charset:    undefined,  // Script charset for injected scripts.
    success:    undefined,  // Callback function when the all scripts (recursively) for this banner is finished loading.
    timeout:    3000        // Load timeout for the injected scripts.
});
```


Stability
---------
crapLoader can handle more than any other open-source document.write hack that
I've found, but I'm sure there are plenty of edge-cases it does not handle
(yet). If you find something crapLoader can't handle please open a new issue
with a *unit test* or a *reproducible standalone example*.

crapLoader has been used in production for one of Norways most used websites
since June 2011.

*Use at your own responsibility!*
[Murpy's laws](http://www.murphys-laws.com/murphy/murphy-laws.html) apply


Alternatives
------------
See my collection of document.write bookmarks on Delicious:
http://www.delicious.com/gregersrygg/document.write