// 直接把文件的内容整过来 需要考虑如下事情
// 1. 作用域污染问题，a中有变量1 而且b文件中也有变量1  === 放到函数中
// 2. 解决import 解析 == esm模块规范翻译成cjs模块规范 
// 3. 执行入口,  和require实现
// 我们需要根据图生成如下的代码, 即可完成生成的js文件：

function require(filePath){
  const map = {
    "./foo.js": foojs,
    "./main.js": mainjs,
  }
  const fn = map[filePath];
  const module = {
    exports: {},
  }
  fn(require, module, module.exports)

  return module.exports;
}

require("./main.js")

function mainjs(require, module, exports){
  // main.js
  const { foo } = require("./foo.js")

  foo()
  console.log("main.js")
}


function foojs(require, module, exports){
  // foo.js
  function  foo()  {
    console.log("foo.js")
  }
  module.exports = {
    foo,
  }
}

// 优化版本立即执行+动态传参数
(function(modules){
  function require(filePath){
    const fn = modules[filePath];
    const module = {
      exports: {},
    }
    fn(require, module, module.exports)
  
    return module.exports;
  }
  
  require("./main.js")
})(
  {
    "./foo.js": function (require, module, exports){
      // foo.js
      function  foo()  {
        console.log("foo.js")
      }
      module.exports = {
        foo,
      }
    },
    "./main.js": function (require, module, exports){
      // main.js
      const { foo } = require("./foo.js")
    
      foo()
      console.log("main.js")
    },
  }
)

// 总结 动态的 是 立即执行函数中的传参

// 实现方式： 模板生成器 ejs 生成

// 由于引入的依赖的文件路径问题，需要设置一个id的结构 解决命名冲突的问题
(function(modules){
  function require(id){
    const [fn, mapping] = modules[id];
    const module = {
      exports: {},
    }
    // 文件路径转化id的意思吧？
    function localRequire(filePath){
      const id = mapping[filePath];
      return require(id)
    }

    fn(localRequire, module, module.exports)
  
    return module.exports;
  }
  
  require(1)
})(
  {
    2: [
      function (require, module, exports){
        // foo.js
        function  foo()  {
          console.log("foo.js")
        }
        module.exports = {
          foo,
        }
      },
      {}
    ],
    1: [
      function (require, module, exports){
        // main.js
        const { foo } = require("./foo.js")
      
        foo()
        console.log("main.js")
      },
      {"./foo.js": 2}
    ]
  }
)