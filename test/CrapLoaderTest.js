var CrapLoaderTest = TestCase("CrapLoaderTest", {
    
    "test script should load and execute": function () {
        /*:DOC += <div id="crap"></div>*/
        //alert(location.href);
        crapLoader.loadScript("http://localhost:8081/document.write('test1')", "crap");
    }
});
