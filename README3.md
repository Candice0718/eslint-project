### 前端架构之eslint（三）之 插件开发

前面两节已经对[eslint的配置](https://blog.csdn.net/sinat_34798463/article/details/107924978)，[eslint源码](https://blog.csdn.net/sinat_34798463/article/details/107925037)进行了详细的解释，那接下来我们就来手写一个plugin。

> 该plugin包含自定义environment、自定义config、自定义processor、自定义rule。

完整的项目请看

#### 一、创建一个插件 - myPlugin

1. 初始化项目。每个插件是一个命名格式为 `eslint-plugin-<plugin-name>` 的 npm 模块，你也可以用这样的格式 `@<scope>/eslint-plugin-<plugin-name>` 限定在包作用域下。我们的插件就取名为@custom/eslint-plugin-myPlugin

   ```bash
   mkdir myPlugin
   cd myPlugin
   npm init
   ```

   

2. 在eslint中，插件可以暴露额外的规则以供使用。为此，插件必须输出一个rules对象，包含规则ID和对应规则的一个键值对。那我们就来自定义一个rule, id取名为replacement。rule解决的问题是将代码块中的XXX替换为Candice。

   

3. 

#### 二、在项目中使用myplugin