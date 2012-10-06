var OUTPUT_ID = "test-output";
var assert = buster.assert

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
            }.bind(this)
        });
    },
    
    "runFunc method takes all 3 arguments": function() {
        var output = this.output;
        var func = function () {
                document.write("simple test");
            },
            success = function() {},
            spy = this.spy(crapLoader, "handle");
        crapLoader.runFunc(func, output.id, {
            success: success
        });
        
        assert.calledWith(spy, {
            domId: output.id,
            func: func,
            success: success
        });
    }
});