// 生成依赖 图 ： 
// 1. 获取文件内容
// 2. 获取文件依赖关系  ===才可以生成图

// 根据图生成对应js文件

import fs from "fs"
import path from "path"
import ejs from "ejs"
import parser from "@babel/parser"
import traverse from "@babel/traverse"
import {transformFromAst} from "babel-core"

let id = 0

function createAsset(filePath){
  // 1. 获取文件内容  == fs.readFile
  const source = fs.readFileSync(filePath, {
    encoding: "utf-8"
  })

  // 2. 获取文件依赖关系 == AST[抽象语法树]babel 借助babel parser
  const ast = parser.parse(source, {
    sourceType: "module"
  })

  const deps = [];
  // 获取ast树中得某个值 babel/traverse; 需要得是source以及里面得value【看ast树import部分的结构去找的】
  traverse.default(ast, {
    ImportDeclaration({node}){
      deps.push(node.source.value);
    }
  })

  // 添加esm转换成cjs模块代码==后续需要再添加封装这个函数的功能的
  const {code} = transformFromAst(ast, null, {
    presets: ["env"]
  })

  return {
    filePath,
    // source,
    code,
    deps,
    mapping: {},
    id: id++
  }
}

// const asset = createAsset("./example/main.js")

function createGraph(){
  // 入口
  const mainAsset = createAsset("./example/main.js")

  const queue = [mainAsset]
  for(const asset of queue){
    asset.deps.forEach((relativePath) => {
      const child = createAsset(path.resolve("./example", relativePath))
      // 这是后加的一句
      asset.mapping[relativePath] = child.id
      queue.push(child)
    })
  }
  // 广度优先遍历--图的结构
  return queue
}

const graph = createGraph()

// 实现方式： 模板生成器 ejs 生成
function build(graph){
  const template = fs.readFileSync("./bundle.ejs", {
    encoding: "utf-8"
  })

  const data = graph.map((asset)=>{
    const {id, code, mapping} = asset
    return {
      id,
      code,
      mapping,
    }
  })
  console.log(data)

  const code = ejs.render(template, {data})

  fs.writeFileSync('./dist/bundle.js', code)
}
build(graph)