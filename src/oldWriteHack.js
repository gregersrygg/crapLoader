
var documentWrite = document.write;
document.write = function(str) {
    document.write.buffer += str;
};

document.write.queue = [];
document.write.loading = false;
document.write.checkQueue = function(){
    //console.log("Queue: ", document.write.queue);
    if(document.write.loading) {
        return;
    }
    document.write.loading = true;

    var next = document.write.queue.shift();
    if(typeof next == "function") {
        setTimeout(function(){
            next();
        }, 1);
    }

};

document.write.flush = function(id, nr, level) {
    var html = document.write.buffer;
    document.write.buffer = "";
    //if(html.trim() === "") {
    //    throw new Error("Nothing in buffer!");
    //}

    jQuery("<div class='level_"+level+"'>"+html.replace(/</g,"&lt;").replace(/>/g, "&gt;")+"</span>")
            .appendTo("#" + id);

    // TODO: load scripts sync
    var scripts = getScripts(html);
    html = html.replace(/<script.*?<\/script>/g, '');

    jQuery.each(scripts, function(i, script) {
        //console.log(script);
        jQuery.getScript(script, function(){
            //console.log("Loaded " + script);
            document.write.flush(id, nr, level +1);
        });
    });

    if(!id) {
        //console.error();
    } else {
        //console.log("Loaded part of ad #" + nr + " ("+level+")");
        var newHtml = jQuery(html+"<span id='async_ad_tmp' style='display:none'></span>");
        newHtml.insertAfter("#"+id);
        var placeholder = jQuery("#" + id).detach();
        jQuery("#async_ad_tmp").replaceWith(placeholder);
    }
    //console.log(html);

    if(!scripts || scripts.length === 0) {
        //console.log("Finished loading ad #" + nr);

        if(id == "async_ad_Left1") {
            if( jQuery("#leftbanner").find("object, img:not([src$=empty.gif])").size() == 1 ) {
                jQuery("body").addClass("dominant_campaign");
            }
        }

        document.write.loading = false;
        document.write.checkQueue();
    }


    function getScripts(str) {
        var match = str.match(/<script[^>]+src=['"]?([^'"\s]+)/);
        if(!match) return [];
        match.shift();
        return match;
    }

};
document.write.buffer = "";


var adCounter = 0;
function HELIOS_AD(pos) {
    //console.log("HELIOS_AD position " + pos);

    var posElement = "<span id='async_ad_"+pos+"' style='display:none;'></span>";
    documentWrite.call(document, posElement);
    var url = helios_server + 'addyn|' + helios_version + '|' + helios_network + '|' + helios_fallback[pos] + '|0|' + helios_size[pos] + '|ADTECH;cookie=info;loc=100;target=_blank;alias=' + helios_alias[pos] + ';key=' + helios_keywords + ';kvrsi_segs=' + rsi_segs + ';grp=' + helios_group + ';' + helios_keyvalues + ';' + helios_parameters + ';misc=' + new Date().getTime();

    //jQuery(function() {
    document.write.queue.push(function(){
        var localCount = ++adCounter;
        //console.log("Loading ad #" + localCount);
        //console.log(url);
        jQuery.getScript(url, function() {

            document.write.flush("async_ad_"+pos, localCount, 1);
        });
    });
    document.write.checkQueue();


    //});
}