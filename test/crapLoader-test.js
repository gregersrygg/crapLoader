/*globals buster,crapLoader*/
var OUTPUT_ID = "test-output";
var assert = buster.assert,
    refute = buster.refute;
    
function testFuncOutput(func, expected, done) {
    crapLoader.handle({
        func: func,
        success: function () {
            assert.equals(this.innerHTML, expected);
            done();
        }
    });
}

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
    
    "runFunc without domId": function () {
        var func = function () {};
        var success = function() {};
        var spy = this.spy(crapLoader, "handle");
            
        crapLoader.runFunc(func, {
            success: success
        });
        
        assert.calledWith(spy, {
            domId: undefined,
            func: func,
            success: success
        });
    },
    
    "loadScript method takes all arguments": function () {
        var output = this.output;
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
    
    "loadScript without domId": function () {
        var success = function() {};
        var src = "data:text/javascript;plain,void(0);";
        var spy = this.spy(crapLoader, "handle");
            
        crapLoader.loadScript(src, {
            success: success
        });
        
        assert.calledWith(spy, {
            domId: undefined,
            src: src,
            success: success
        });
    },
    
    "hijacks document.write automatically on first call": function (done) {
        var output = this.output;
        crapLoader.handle({
            domId: output.id,
            func: function () {
                assert.equals(document.write.toString().indexOf("native code"), -1);
                done();
            }
        });
    },
    
    "success callback is called with container as this": function (done) {
        var output = this.output;
        crapLoader.handle({
            domId: output.id,
            func: function () {},
            success: function () {
                assert.same(this, output);
                done();
            }
        });
    },
    
    "a container is generated and appended to body if no domId": function (done) {
        var text = "auto generated container";
        crapLoader.handle({
            func: function() {
                document.write(text);
            },
            success: function () {
                assert.equals(this.innerHTML, text, "a container should have been generated and have the data written");
                assert.equals(this.parentNode, document.body, "the container parent should be body");
                refute.isNull(this.id, "the container should have an id");
                done();
            }
        });
    },
    
    "script is injected when src specified": function (done) {
        var src = "data:text/javascript;plain,document.write('from src');";
        
        crapLoader.handle({
            src: src,
            success: function () {
                assert.equals(this.innerHTML, "from src");
                done();
            }
        });
    },
    
    "func overrides src": function (done) {
        crapLoader.handle({
            src: "data:text/javascript;plain,document.write(\"src\")",
            func: function () {
                document.write("func");
            },
            success: function () {
                assert.equals(this.innerHTML, "func");
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
        testFuncOutput(function () {
            document.write("<div id=\"get-element-by-id-test\"></div>");
            document.getElementById("get-element-by-id-test").innerHTML = "test";
        }, "<div id=\"get-element-by-id-test\">test</div>", done);
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
    
    "document.getElementById on an element after an element with children (Issue #9)": function (done) {
        testFuncOutput(function () {
            document.write("<div><span></span></div><div id=\"myDIV\"></div>");
            document.getElementById('myDIV').innerHTML = 'Works';
        }, "<div><span></span></div><div id=\"myDIV\">Works</div>", done);
    },
    
    "should be possible to document.write an external script": function (done) {
        testFuncOutput(function () {
            document.write("<script src=\"data:text/javascript;plain,document.write('external script')\"></script>");
        }, "external script", done);
    },
    
    "should be possible to document.write an inline script (Issue #6)": function (done) {
        testFuncOutput(function () {
            document.write('<sc'+'ript type=\"text\/javasc'+'ript\">');
            document.write('document.write(\'<div id=\"myid\"><\/div>\');');
            document.write('var mydiv = document.getElementById(\"myid\");');
            document.write('mydiv.innerHTML = "success";');
            document.write('<\/sc'+'ript>');
        }, "<div id=\"myid\">success<\/div>", done);
    },
    
    "script tag is split into multiple write calls": function (done) {
        testFuncOutput(function () {
            document.write("<scr"); document.write("ipt>document.write('split ut script');</script>");
        }, "split ut script", done);
    },
    
    "newlines before <object> should be stripped from output": function (done) {
        testFuncOutput(function () {
            document.write("\n\t <object></object>");
        }, "<object></object>", done);
    },

    "ignore document.open() and document.close() (Issue #10)": function (done) {
        testFuncOutput(function () {
            document.open();
            document.write('Works');
            document.close();
        }, "Works", done);
    }
});