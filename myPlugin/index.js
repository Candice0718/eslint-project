module.exports = {
   
    configs: {
        "recommended": require('./configs/index.js')
    },
    processors: {
        // '.md': require('./processors/index.js')
        myProcessor: require('./processors/index.js')
    },
    rules: {
        replacement: require('./rules/replacement.js')
    }
}