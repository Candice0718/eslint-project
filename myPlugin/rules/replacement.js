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
        console.log(context.settings)
        // 获取规则的参数
        const str = context.options[0];
        function checkLiteral(node) {
            if (node.raw && typeof node.raw === 'string') {
                if (node.raw.indexOf('XXX') !== -1) {
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
            Literal: checkLiteral
        }
    }
};