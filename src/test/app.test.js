"use strict"

require(["../js/config"], function(){
    requirejs(["mocha"], function(mocha){

        mocha.setup('bdd');
        mocha.timeout(10000);

        //---- 配置要测试的模块 ---
        let testList = [
            "mocha",
            "BookSourceManager",
            "util",
            "Spider",
        ];

        //---- 配置结束 ----

        require(testList.map(e => `../test/${e}.test`), function(){
            mocha.run();
        })
    });
});


