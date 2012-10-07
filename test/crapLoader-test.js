var OUTPUT_ID = "test-output";
var assert = buster.assert,
    refute = buster.refute;

buster.testCase("crapLoader", {
    
    setUp: function() {
        var output = document.createElement("div");
        output.id = OUTPUT_ID + new Date().getTime();
        document.body.appendChild(output);
        this.output = output;
    },
    
    tearDown: function() {
        crapLoader.release();
        document.body.removeChild(document.getElementById(this.output.id));
        this.output = null;
    },
    
    "handles a simple document.write": function(done) {
        var output = this.output;
        
        crapLoader.handle({
            domId: output.id,
            func: function () {
                document.write("simple test");
            },
            success: function() {
                assert.equals(output.innerHTML, "simple test");
                done();
            }
        });
    },
    
    "runFunc method takes all arguments": function() {
        var output = this.output;
        var func = function () {
            document.write("simple test");
        };
        var success = function() {};
        var spy = this.spy(crapLoader, "handle");
            
        crapLoader.runFunc(func, output.id, {
            success: success
        });
        
        assert.calledWith(spy, {
            domId: output.id,
            func: func,
            success: success
        });
    },
    
    "loadScript method takes all arguments": function () {
        var output = this.output;
        var func = function () {
            document.write("simple test");
        };
        var success = function() {};
        var src = "foo";
        var spy = this.spy(crapLoader, "handle");
            
        crapLoader.loadScript(src, output.id, {
            success: success
        });
        
        assert.calledWith(spy, {
            domId: output.id,
            src: src,
            success: success
        });
    },
    
    "script is injected when src specified": function (done) {
        var output = this.output;
        var src = "data:text/javascript;plain,document.write('from src');";
        
        crapLoader.handle({
            domId: output.id,
            src: src,
            success: function () {
                assert.equals(output.innerHTML, "from src");
                done();
            }
        });
    },
    
    "document.getElementById on an element just written should return the element": function (done) {
        var output = this.output;
        var func = function () {
            document.write("<div id=\"get-element-by-id-test\"></div>");
            var el = document.getElementById("get-element-by-id-test");
            refute.isNull(el, "document.getElementById should find the element");
            done();
        };
            
        crapLoader.runFunc(func, output.id);
    },
    
    "a modified element returned by document.getElementById should be reflected in the document": function (done) {
        var output = this.output;
        var func = function () {
            document.write("<div id=\"get-element-by-id-test\"></div>");
            document.getElementById("get-element-by-id-test").innerHTML = "test";
        };
        var success = function() {
            assert.equals(output.innerHTML, "<div id=\"get-element-by-id-test\">test</div>");
            done();
        };
            
        crapLoader.runFunc(func, output.id, {
            success: success
        });
    },
    
    "document.getElementById on an element twice should get the same instance of element": function (done) {
        var output = this.output;
        var func = function () {
            document.write("<div id=\"get-element-by-id-test\"></div>");
            var el = document.getElementById("get-element-by-id-test");
            var el2 = document.getElementById("get-element-by-id-test");
            assert.same(el, el2, "Should be the same instance");
            done();
        };
            
        crapLoader.runFunc(func, output.id);
    },
    
    "should be possible to document.write an inline script (Issue #6)": function (done) {
        var output = this.output;
        var func = function () {
            document.write('<sc'+'ript type=\"text\/javasc'+'ript\">');
            document.write('document.write(\'<div id=\"myid\"><\/div>\');');
            document.write('var mydiv = document.getElementById(\"myid\");');
            document.write('mydiv.innerHTML = "success";');
            document.write('<\/sc'+'ript>');
        };
        
        crapLoader.runFunc(func, output.id, {
            success: function () {
                assert.equals(output.innerHTML, "<div id=\"myid\">success<\/div>");
                done();
            }
        });
    }
});