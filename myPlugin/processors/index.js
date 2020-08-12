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