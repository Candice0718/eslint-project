module.exports = {
    "root": true,
    "env": {
        "es6": true
    },
    // 共享配置还可以继承其他配置
    extends: "eslint:recommended",
    "rules": {
        "quotes": ["error", "single"]
    }
}