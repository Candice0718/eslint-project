### 前端架构之eslint（一）之配置

#### 一、安装eslint

```bash
npm install eslint --save-dev
or
yarn add eslint --save-dev
```



#### 二、[eslint配置](https://eslint.org/docs/user-guide/configuring)



1. **Configuration Comments** - 使用 JavaScript 注释把配置信息直接嵌入到一个代码源文件中。

   1. 在javascript使用注释配置eslint信息。

      ```javascript
      /* eslint-env node, mocha */  							// 使用注释来指定环境
      
      /* global var1:writable, var2:readonly */ 	// 使用注释指定全局变量，并且约定全局变量是否允许重写，																																			 writable允许重写全局变量、readonly不允许重写全局变量、off禁用全局变量
      
      /* eslint eqeqeq: "off", curly: "error" */ 	// 使用注释配置规则。off关闭规则；warn开启警告级别规则；error开启错误级别规则；
      /* eslint eqeqeq: 0, curly: 2 */						// 使用注释配置规则。0关闭规则；1开启警告级别规则；2开启错误级别规则；
      
      /* eslint "plugin1/rule1": "error" */       // 使用注释配置来自plugin的规则。
      
      /* eslint-enable no-alert, no-console */    // 启用指定规则
      ```

      

   2. 在javascript使用注释禁止eslint规则使用。

   ```javascript
   /* eslint-disable */ 																					//  对整个文件禁用eslint
   
   /* eslint-disable no-alert, no-console */ 										// 指定规则的禁用
   
   // eslint-disable-line																				// 当前行禁用
   
   /* eslint-disable-next-line no-alert, quotes, semi */					// 下一行禁用规则
   
   /* eslint-disable-line example/rule-name */										// 禁用eslint-plugin-example的rule-name 规则
   ```

2. **Configuration Files**-可以配置在.eslintrc.*文件里，或者直接在 [`package.json`](https://docs.npmjs.com/files/package.json) 文件里的 `eslintConfig` 字段指定配置。

   1. 如果同一个目录下有多个配置文件，ESLint 只会使用一个。优先级顺序如下：
      1. .eslintrc.js
      2. .eslintrc.yaml
      3. .eslintrc.yml
      4. .eslintrc.json
      5. .eslintrc
      6. package.json
   2. 可以配置的信息如下：

   > **environments** - 指定脚本的运行环境。每种环境都有一组特定的预定义全局变量。
   >
   > 全局变量一部分来自`globals`第三方库，还有一部分来自`eslint/conf/environments.js`里面的定义。

   - **env** - 要在配置文件里指定环境。如果你想在一个特定的**插件中**使用一种环境，确保提前在 `plugins` 数组里指定了插件名，然后在 env 配置中不带前缀的插件名后跟一个 `/` ，紧随着环境名。

     ```json
     {
       "browser": true,
       "node": true,
       "example/custom": true
     }
     ```

   - **globals** - 脚本在执行期间访问的额外的全局变量。`globals` 配置属性设置为一个对象,该对象包含以你希望使用的每个全局变量。对于每个全局变量键，将对应的值设置为 `"writable"` 以允许重写变量，或 `"readonly"` 不允许重写变量,`"off"`禁用全局变量。

     ```json
     {
       "globals": {
         "var1": "writable",
         "var2": "readonly",
         "var3": "off"
         }
     }
     ```

   - **plugins** - 在配置文件里配置插件时，可以使用 `plugins` 关键字来存放插件名字的列表。插件名称可以省略 `eslint-plugin-` 前缀。

     ```json
     {
         "plugins": [
             "plugin1",
             "eslint-plugin-plugin2"
         ]
     }
     ```

     

   - **rules** - 启用的规则及其各自的错误级别。

     - `"off"` 或 `0` - 关闭规则
     - `"warn"` 或 `1` - 开启规则，使用警告级别的错误：`warn` (不会导致程序退出)
     - `"error"` 或 `2` - 开启规则，使用错误级别的错误：`error` (当被触发的时候，程序会退出)

     ```json
     {
        "plugins": [
             "plugin1"
         ],
     	 "rules": {
             "eqeqeq": "off",
             "curly": "error",
             "quotes": ["error", "double"],
          		"plugin1/rule1": "warn" // 启用plugin的规则，当指定来自插件的规则时，确保删除 eslint-plugin- 前缀
         }
     }
     ```

     

   - **parserOptions** - 解析配置

     - ecmaVersion - 默认设置为 3，5，你可以使用 6、7、8、9 或 10 来指定你想要使用的 ECMAScript 版本。你也可以用使用年份命名的版本号指定为 2015（同 6），2016（同 7），或 2017（同 8）或 2018（同 9）或 2019 (same as 10)
     - sourceType - 设置为 `"script"` (默认) 或 `"module"`如果你的代码是 ECMAScript 模块)。
     - ecmaFeatures - 这是个对象，表示你想使用的额外的语言特性:
       - globalReturn - 允许在全局作用域下使用 `return` 语句
       - impliedStrict -  启用全局 [strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode) (如果 `ecmaVersion` 是 5 或更高)
       - jsx - 启用 [JSX](http://facebook.github.io/jsx/)
       - experimentalObjectRestSpread - 启用实验性的 [object rest/spread properties](https://github.com/sebmarkbage/ecmascript-rest-spread) 支持。(**重要：**这是一个实验性的功能,在未来可能会有明显改变。 建议你写的规则 **不要** 依赖该功能，除非当它发生改变时你愿意承担维护成本。)

     ```json
     {
       parserOptions: {
          "ecmaVersion": 6,
          "sourceType": "module",
          "ecmaFeatures": {
            "jsx": true
          }
       }
     }
     ```

     

   - **parser** - 默认解析器为Espree, 可以传其他解析器： esprima、babel-eslint、@typescript-eslint/parser

   - **processor** - 处理器。插件可以提供处理器，处理器可以从另一种文件中提取 JavaScript 代码，然后让 ESLint 检测 JavaScript 代码。或者处理器可以在预处理中转换 JavaScript 代码。若要在配置文件中指定处理器，请使用 `processor` 键，并使用由**插件名**和**处理器名**组成的串接字符串加上斜杠。要为特定类型的文件指定处理器，请使用 `overrides` 键和 `processor` 键的组合。

     ```json
     {
     	{
         "plugins": ["plugin1"],
         "processor": "plugin1/myProcessor"
     }
     }
     ```

     

   - **settings** - 共享设置。它将提供给每一个将被执行的规则。如果你想添加的自定义规则而且使它们可以访问到相同的信息，这将会很有用，并且很容易配置。

     ```json
     {
         "settings": {
             "sharedData": "Hello"
         }
     }
     ```

     在自定义规则create(context)钩子函数，context上下文中可以获取settings。

   - **extends** - 一个配置文件可以被基础配置中的已启用的规则继承。

     `extends` 属性值可以由以下组成：

     - plugin: - plugins可以省略包名的前缀 `eslint-plugin-`
     - 包名
     - `/`
     - 配置名称

     ```json
     {
       "plugins": [
             "plugin1"
         ],
         "extends": [
             "eslint:recommended",
             "plugin:plugin1/myConfigs"
         ],
     }
     ```

     

3. 要对特殊类型的文件指定处理器或者规则，请使用 `overrides` 和 `files`。

   ```json
   {
     "plugins": [
           "plugin1"
      ],
      "overrides": [
        {
          "files": ["*.md"],
          "processor": "plugin1/markdown"
        },
        {
          "files": ["*.md"],
          "rules": {
            "strict": "off"
          }
        }
       ]
   }
   ```

   

4. 默认情况下，ESLint 会在所有父级目录里寻找配置文件，一直到根目录。为了将 ESLint 限制到一个特定的项目，在你项目根目录下的 `package.json` 文件或者 `.eslintrc.*` 文件里的 `eslintConfig` 字段下设置 `"root": true`。ESLint 一旦发现配置文件中有 `"root": true`，它就会停止在父级目录中寻找。

   ```json
   {
       "root": true
   }
   ```




