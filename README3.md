### 前端架构之eslint（三）之 插件开发

前面两节已经对[eslint的配置](https://blog.csdn.net/sinat_34798463/article/details/107924978)，[eslint源码](https://blog.csdn.net/sinat_34798463/article/details/107925037)进行了详细的解释，那接下来我们就来手写一个plugin。

> 该plugin包含自定义rule、自定义processor、共享配置信息。

完整的项目请看[eslint-project](https://github.com/Candice0718/eslint-project)

#### 一、创建一个插件 - myPlugin	

1. 初始化项目。每个插件是一个命名格式为 `eslint-plugin-<plugin-name>` 的 npm 模块，你也可以用这样的格式 `@<scope>/eslint-plugin-<plugin-name>` 限定在包作用域下。我们的插件就取名为eslint-plugin-myPlugin

   ```bash
   mkdir myPlugin
   cd myPlugin
   npm init
   ```

   

2. 在eslint中，插件可以暴露额外的规则以供使用。为此，插件必须输出一个rules对象，包含规则ID和对应规则的一个键值对。那我们就来自定义一个rule, id取名为replacement。rule解决的问题是将代码块中的XXX替换为Candice。

   > 创建规则需要的属性以及每个属性对应的功能，[eslint官网](https://eslint.org/docs/developer-guide/working-with-rules)已经给出了详细的解释，这里我就不赘述了，不了解的同学可以移步官网。

   > 创建自定义规则还需要掌握抽象语法树AST(Abstract syntax tree)的知识。
   >
   > Eslint默认的语法解析工具为Espree，我们可以在[AST explorer](https://astexplorer.net/)查看代码解析之后对应的节点类型。

   1. 创建myPlugin/rules/replacement.js

      ```javascript
      "use strict";
      
      //------------------------------------------------------------------------------
      // Rule Definition
      //------------------------------------------------------------------------------
      
      module.exports = {
          // 规则的元数据
          meta: {
              /**
               * type (string) 指示规则的类型，值为 "problem"、"suggestion" 或 "layout"
               * "problem": 指的是该规则识别的代码要么会导致错误，要么可能会导致令人困惑的行为。开发人员应该优先考虑解决这个问题。
               * "suggestion": 意味着规则确定了一些可以用更好的方法来完成的事情，但是如果代码没有更改，就不会发生错误。
               * "layout": 意味着规则主要关心空格、分号、逗号和括号，以及程序中决定代码外观而不是执行方式的所有部分。这些规则适用于AST中没有指定的代码部分。
               */
              type: "problem",
              //  对 ESLint 核心规则来说是必需的
              docs: {
                  // 展示在eslint规则首页的描述
                  description: "XXX 不能出现在代码中！",
                  // eslint规则首页的分类： Possible Errors、Best Practices、Strict Mode、Varibles、Stylistic Issues、ECMAScript 6、Deprecated、Removed
                  category: "Possible Errors",
                  // "extends": "eslint:recommended"属性是否启用该规则
                  recommended: false,
                  // 指定可以访问完整文档的URL
                  url: "https://github.com/Candice0718/eslint-project/tree/master/myPlugin/rules"
              },
              // 该规则是否可以修复
              fixable: "code",
              // 参数类型 
              schema: [
                  {
                      type: 'string'
                  }
              ],
              messages: {
                  unexpected: '错误的字符串XXX, 需要用{{argv}}替换'
              }
          },
          // 返回一个对象，Eslint在遍历抽象语法树AST时，用来访问节点的方法。
          /**
           * 
           */
          create: function (context) {
              // 获取规则的参数
              const str = context.options[0];
              function checkLiteral(node) {
                  if (node.raw && typeof node.raw === 'string') {
                      if (node.raw.indexOf('XXX') !== -1) {
                          const result = node.raw.replace('XXX', str);
                          context.report({  // 发布警告或者错误
                              node, // 有问题的AST节点
                              messageId: 'unexpected', // 对应meta.messages.XXX,message可以直接用message替换
                              data: { // 占位数据
                                  argv: str
                              },
                              fix: (fixer) => {
                                  /**
                                   * fixer 对象有一下几个方法：
                                   *
                                   * insertTextAfter(nodeOrToken, text) - 在给定的节点或记号之后插入文本
                                   * insertTextAfterRange(range, text) - 在给定的范围之后插入文本
                                   * insertTextBefore(nodeOrToken, text) - 在给定的节点或记号之前插入文本
                                   * insertTextBeforeRange(range, text) - 在给定的范围之前插入文本
                                   * remove(nodeOrToken) - 删除给定的节点或记号
                                   * removeRange(range) - 删除给定范围内的文本
                                   * replaceText(nodeOrToken, text) - 替换给定的节点或记号内的文本
                                   * replaceTextRange(range, text) - 替换给定范围内的文本
                                   */
                                  return fixer.replaceText(node, str)
                                  
                           }
                          })
                   }
                  }
           }
              return {
                	// 节点类型为字面量
                	/**
                	 * 如果一个 key 是个节点类型或 selector，在 向下 遍历树时，ESLint 调用 visitor 函数
                	 * 如果一个 key 是个节点类型或 selector，并带有 :exit，在 向上 遍历树时，ESLint 调用 visitor 函数
                	 * 如果一个 key 是个事件名字，ESLint 为代码路径分析调用 handler 函数
                	 */
               Literal: checkLiteral
              }
       }
      };
      ```
   
      
   
   2. myPlugin/index.js 引入replacement.js
   
      ```javascript
      module.exports = {
          rules: {
              replacement: require('./rules/replacement.js')
          }
      }
      ```
   
   3. 发布myPlugin这个项目，怎么发布npm我这里就不赘述了。我们是demo，我就本地建个软连接用于测试。怎么使用MyPlugin见**在项目中如何使用myPlugin？**。
   
      ```bash
      yarn link 
      ```

#### 二、在项目中如何使用myPlugin？

1. 新建一个项目用于测试myPlugin。执行下面的语句，准备好一个eslint的执行环境。

   ```bash
   mkdir eslint-project
   cd eslint-project
   npm init
   npm install eslint -D
   ```

2. 安装myPlugin。

   ```
   yarn link "eslint-plugin-myplugin"
   ```

   

3. 在根目录配置.eslintrc文件，引入myPlugin。

   ```bash
   { 
     "plugins": ["myPlugin"],
     "rules": {
         "myPlugin/replacement": ["error", "Candice"]
     }
   }
   ```

   

4. 我们再来建一个待检测文件/src/index.js。

   eslint-project/src/index.js

   ```javascript
   function say() {
     var name = 'XXX'
   }
   ```

5. 然后来执行eslint命令，看看控制台会报什么错。

   ```bash
   npx eslint ./src/*.js
   ```

   ![image-20200811133204563](/Users/candice/Library/Application Support/typora-user-images/image-20200811133204563.png)

6. 执行到这一步，我们myPlugin离成功也就差最后一步了，那我们再来试试修复功能吧。执行完下面的命令，记得去/src/index.js看看XXX是不是神奇的被替换了。

   ```bash
   npx eslint ./src/*.js --fix
   ```

#### 三、在Plugin中怎么自定义Processor - 处理器？

插件可以提供处理器。processor提供两个钩子函数`preprocess`、`postprocess`。`preprocess`是在parser之前执行获取检测代码，可以对代码块进行操作。`postprocess`是执行完rule之后的执行，可以获取到messageList问题信息。处理器还提供supportsAutofix` 属性控制是否修复问题，该属性优先级大于rule的元数据fixable 。

接下来我们就来手写一个processor，该处理器能够从markdown语法中提取出内联代码块，并用我们的replacement规则来检测它，并支持修复。

1. 首先创建myPlugin/processors/index.js。

   ```javascript
   module.exports = {
       // 待校验代码块的起始位置为了在postprocess恢复原始代码块的位置
       forward: 0,
       /**
        * preprocess 在parser之前执行
        * @param {*} text 原代码字符串
        * @param {*} filename 文件名
        */
       preprocess: (text, filename) => {
           const reg = /`{3}(([^`][\s\S])*)`{3}/g;
   
           if (text.match(reg)) {
               this.forward = text.indexOf(RegExp.$1);
               // 提取待校验的代码块
               return [RegExp.$1];
           }
   
       },
       /**
        * postprocess 执行完rules之后
        * @param {*} messages 问题节点信息列表
        * @param {*} filename 文件名
        */
       postprocess: (messages, filename) => {
           return messages[0].map((problem) => {
               return {
                   ...problem,
                   fix: problem.fix ? { 
                       // rule里提供的修复属性
                       ...problem.fix, 
                       // *重要:range必须调整错误的位置，使其与原始的未处理的代码中的位置相对应
                       range: [problem.fix.range[0] + this.forward, problem.fix.range[1] + + this.forward] 
                   }: problem.fix
               };
           });
       },
       supportsAutofix: true // 是否提供自动修复功能
   }
   ```

   

2. myPlugin/index.js 导出processor。plugin导出processor有两种方式。

   1. 在plugin导出文件中直接写校验的后缀名，那在项目中只要引入plugin就可以使用该处理器。

      ```javascript
      module.exports = {
          processors: {
              '.md': require('./processors/index.js')
          },
          rules: {
              replacement: require('./rules/replacement.js')
          }
      }
      ```

      项目中.eslintrc文件，引入myPlugin。

      ```javascript
      { 
        "plugins": ["myPlugin"],
        "rules": {
            "myPlugin/replacement": ["error", "Candice"]
        }
      }
      ```

      

   2. 在plugin导出文件中只约定processor的名称，那么在项目中引入plugin还需要定义`processor`或者`overrides`,二选一即可。

      ```javascript
      module.exports = {
          processors: {
              myProcessor: require('./processors/index.js')
          },
          rules: {
              replacement: require('./rules/replacement.js')
          }
      }
      ```

      项目中.eslintrc文件，引入myPlugin。

      ```javascript
      {
        "plugins": [
          "myPlugin"
        ],
        // "processor": "myPlugin/myProcessor",
        "overrides": [
          {
            "files": [
              "*.md"
            ],
            "processor": "myPlugin/myProcessor"
          }
        ],
        "rules": {
          "myPlugin/replacement": [
            "error",
            "'Candice'"
          ]
        }
      }
      ```

      

3. 我们来建一个待检测文件/src/index.md。

   ~~~markdown
    ```
   function say() {
     var name = 'XXX'
   }
    ```
   ~~~

   

4. 然后来执行eslint命令，来检测.md文件。看看控制台会报什么错。是不是很熟悉？我们replacement rule起作用了。

   ```bash
    npx eslint ./src/*.md
   ```

   ![image-20200812155032304](/Users/candice/Library/Application Support/typora-user-images/image-20200812155032304.png)

5. 再来执行--fix，看看我们.md是不是也完美的修复啦！

   ```bash
   npx eslint ./src/*.md --fix
   ```



#### 四、共享配置信息

配置信息的 `.eslintrc` 文件是你的项目中重要的部分，正因为这样，你可能想要将你的配置信息分享给其他项目或人。

我们有两种方式来共享配置：

1. 创建一个npm包，确保模块名称以eslint-config-开头，例如eslint-config-myconfig。然后在项目eslint配置中用“extends”引入。具体请参考[eslint 官网](https://eslint.org/docs/developer-guide/shareable-configs)。
2. 将共享配置集成到plugin configs中

我们就在我们的plugin中写一个共享配置吧！

1. 首先创建myPlugin/configs/index.js。

   ```javascript
   module.exports = {
       "root": true,
       // 共享配置还可以继承其他配置
       extends: "eslint:recommended",
       "rules": {
           "quotes": ["error", "single"]
       }
   }
   ```

   

2. 在myPlugin/index.js中导出共享配置。

   ```javascript
   module.exports = {
       configs: {
           "recommended": require('./configs/index.js')
       }
   }
   ```

   

3. 项目中.eslintrc文件，引入myPlugin。

   ```javascript
   {
     "plugins": [
       "myPlugin"
     ],
     "extends": "plugin:myPlugin/recommended",
   }
   ```

   

