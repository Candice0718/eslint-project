### 前端架构之eslint（二）之源码解析



[上节对eslint的配置进行了详细的解释](https://blog.csdn.net/sinat_34798463/article/details/107924978)，这节再来对源码进行分析一波。

执行eslint的流程图如下：



#### eslint的入口：eslint/bin/eslint.js#main

eslint.js是命令的执行文件，用来启动eslint，并向cli传递命令行参数。

```javascript
...
await require("../lib/cli").execute(
  process.argv, // 命令行eslint后面的参数
  process.argv.includes("--stdin") ? await readStdin() : null // eslint命令行是否有--stdin，执行process.stdin读取需lint的内容
);
```

#### eslint/lib/cli.js#execute

cli.js#execute是eslint的核心，它解析eslint执行命令，调用有效的操作。它还扮演着读取文件、遍历目录，输入和输出的角色。

```javascript
function execute(args, text) {
  let options;
  try {
    options = CLIOptions.parse(args);  // 解析eslint options
  } catch (error) {
    ...
  }
  ...
  /**
  *	translateOptions(options) // 将cli options转换为cli-engine options
  * 
  *	engine是Eslint的实例，可以用eslint的API。
  * 
  **/
	const engine = new ESLint(translateOptions(options));  
    
  let results;
	
  /**
  * eslint --stdin的优先级高
  **/
  if (useStdin) {
    results = await engine.lintText(text, {
      filePath: options.stdinFilename,
      warnIgnored: true
    });
  } else {
    results = await engine.lintFiles(files);
  }

  if (options.fix) {
    ...
    await ESLint.outputFixes(results); // 执行fix
  }

  if (options.quiet) {
   	... 
    results = ESLint.getErrorResults(results); // 执行quite
  }
	/**
  * printResults 打印错误信息
  **/
  if (await printResults(engine, results, options.format, options.outputFile)) { 
    ...
  }
	...
}
```

#### eslint/lib/eslint/eslint.js

eslint构造函数实例化cli-engine，并将cli-engine存储为私有属性。通过cli-engine封装一系列的API。

```javascript
class ESLint {

    /**
     * Creates a new instance of the main ESLint API.
     * @param {ESLintOptions} options The options for this instance.
     */
    constructor(options = {}) {
        const processedOptions = processOptions(options); // 校验cli-engine options，返回标准的options
        const cliEngine = new CLIEngine(processedOptions); // 获取cli-engine
        ...

        // 初始化私有属性
        privateMembersMap.set(this, {
            cliEngine,
            options: processedOptions
        });
    }
  	...
    /**
     * 修复有问题的文件
     */
    static async outputFixes(results) {
        await Promise.all(
            results
                .filter(result => {
                    if (typeof result !== "object" || result === null) {
                        throw new Error("'results' must include only objects");
                    }
                    return (
                        typeof result.output === "string" &&
                        path.isAbsolute(result.filePath)
                    );
                })
                .map(r => writeFile(r.filePath, r.output))
        );
    }
		...
  

    /**
  	 * 根据配置执行需要检测的文件
  	 * 返回检测结果
     */
    async lintFiles(patterns) {
       	...
        const { cliEngine } = privateMembersMap.get(this);

        return processCLIEngineLintReport(
            cliEngine,
            cliEngine.executeOnFiles(patterns)
        );
    }

    /**
		 *	根据配置执行需要检测的文本
		 *  返回检测结果
     */
    async lintText(code, options = {}) {
        ...
        const { cliEngine } = privateMembersMap.get(this);
        return processCLIEngineLintReport(
            cliEngine,
            cliEngine.executeOnText(code, filePath, warnIgnored)
        );
    }

    /**
     *	加载formatter
     */
    async loadFormatter(name = "stylish") {
      	...
        const { cliEngine } = privateMembersMap.get(this);
        const formatter = cliEngine.getFormatter(name);
				...
        return {
            // 格式化方法
            format(results) {
                let rulesMeta = null;
                results.sort(compareResultsByFilePath);
                return formatter(results, {
                    get rulesMeta() {
                        if (!rulesMeta) {
                            rulesMeta = createRulesMeta(cliEngine.getRules());
                        }
                        return rulesMeta;
                    }
                });
            }
        };
    }

    /**
     *	返回配置信息
     */
    async calculateConfigForFile(filePath) {
  			...
        const { cliEngine } = privateMembersMap.get(this);
      	...
        return cliEngine.getConfigForFile(filePath);
    }

    /**
     * 检查文件是否为忽略检测文件
     */
    async isPathIgnored(filePath) {
        ...
        const { cliEngine } = privateMembersMap.get(this);
      	...
        return cliEngine.isPathIgnored(filePath);
    }
}
```

#### eslint/lib/cli-engine/cli-engine.js。

cli-engine负责从文件系统中读取文件，加载规则定义，从配置文件中读取配置信息。执行linter进行代码验证。

cli-engine的核心方法为executeOnFiles

```javascript
class CLIEngine {
  constructor(providedOptions) {
    ...
    	// 加载eslint配置信息，createContext可以查看配置的优先级
    	/**
    	*	new CliEngine() -> new CascadingConfigArrayFactory() -> createBaseConfigArray() ->create() 
    	* -> createContext()
    	**/
    	//  
    	const configArrayFactory = new CascadingConfigArrayFactory({...});  
    
    	// 存储私有方法、数据
        internalSlotsMap.set(this, {
            additionalPluginPool,
            cacheFilePath,
            configArrayFactory,
            defaultIgnores: IgnorePattern.createDefaultIgnore(options.cwd),
            fileEnumerator,
            lastConfigArrays,
            lintResultCache,
            linter,
            options
        });
    ...
  }
}
executeOnFiles(patterns) {
       ...
      const results = [];
  		
  		/**
  		*	根据通配路径读取配置信息
  		* executeOnFiles() -> iterateFiles() -> _iterateFiles() -> _iterateFilesWithDirectory() -> _iterateFilesRecursive() -> getConfigArrayForFile() ->_loadConfigInAncestors()-> loadInDirectory()->loadLegacyConfigFile()->readFile(eslintrc.*)
  		*/
			for (const { config, filePath, ignored } of fileEnumerator.iterateFiles(patterns)) {
        ...
        // 存储通配路径的eslint的配置信息
        if (!lastConfigArrays.includes(config)) {
          lastConfigArrays.push(config);
        }
      }
      // Do lint.
      const result = verifyText({
        text: fs.readFileSync(filePath, "utf8"),
        filePath,
        config,
        cwd,
        fix,
        allowInlineConfig,
        reportUnusedDisableDirectives,
        fileEnumerator,
        linter
      });

      results.push(result);
  		...
        return {
            results,
            ...calculateStatsPerRun(results),
           	...
        };
    }
```

#### eslint/lib/linter/linter.js

核心Linter类，它根据配置选项进行代码验证。最核心的代码为verify()

##### #verifyAndFix()  对文本进行检测，还运行自动修复逻辑。返回的结果对象将包含自动修复后的代码，和其他没有自动修复过的代码检测消息。

```javascript
verifyAndFix(text, config, options) {
	let messages = [],
            fixedResult,
            fixed = false,
            passNumber = 0,
            currentText = text;
        const debugTextDescription = options && options.filename || `${text.slice(0, 10)}...`;
        const shouldFix = options && typeof options.fix !== "undefined" ? options.fix : true;

        /**
         * This loop continues until one of the following is true:
         *
         * 1. No more fixes have been applied.
         * 2. Ten passes have been made.
         *
         * That means anytime a fix is successfully applied, there will be another pass.
         * Essentially, guaranteeing a minimum of two passes.
         */
        do {
            passNumber++;

            debug(`Linting code for ${debugTextDescription} (pass ${passNumber})`);
            messages = this.verify(currentText, config, options);

            debug(`Generating fixed text for ${debugTextDescription} (pass ${passNumber})`);
            fixedResult = SourceCodeFixer.applyFixes(currentText, messages, shouldFix);

            /*
             * stop if there are any syntax errors.
             * 'fixedResult.output' is a empty string.
             */
            if (messages.length === 1 && messages[0].fatal) {
                break;
            }

            // keep track if any fixes were ever applied - important for return value
            fixed = fixed || fixedResult.fixed;

            // update to use the fixed output instead of the original text
            currentText = fixedResult.output;

        } while (
            fixedResult.fixed &&
            passNumber < MAX_AUTOFIX_PASSES
        );

        /*
         * If the last result had fixes, we need to lint again to be sure we have
         * the most up-to-date information.
         */
        if (fixedResult.fixed) {
            fixedResult.messages = this.verify(currentText, config, options);
        }

        // ensure the last result properly reflects if fixes were done
        fixedResult.fixed = fixed;
        fixedResult.output = currentText;

        return fixedResult;
}
```

#### #verify()对文本进行检测。

```javascript
verify(textOrSourceCode, config, filenameOrOptions) {
  const options = typeof filenameOrOptions === "string"
  ? { filename: filenameOrOptions }
  : filenameOrOptions || {};

  // 有配置文件的处理逻辑
  if (config && typeof config.extractConfig === "function") {
    return this._verifyWithConfigArray(textOrSourceCode, config, options);
  }

  /*
 	 *	有处理器的处理逻辑
   */
  if (options.preprocess || options.postprocess) {
    return this._verifyWithProcessor(textOrSourceCode, config, options);
  }
  /**
   *  无处理器的处理逻辑
   **/
  return this._verifyWithoutProcessors(textOrSourceCode, config, options);
}
```

##### #_verifyWithConfigArray()根据配置文件对文本进行检测。

```javascript
_verifyWithConfigArray(textOrSourceCode, configArray, options) {
				...
        // Extract the final config for this file.
        const config = configArray.extractConfig(options.filename);
        const processor =
            config.processor &&
            configArray.pluginProcessors.get(config.processor);

        // 有处理器
        if (processor) {
            debug("Apply the processor: %o", config.processor);
            const { preprocess, postprocess, supportsAutofix } = processor;
            const disableFixes = options.disableFixes || !supportsAutofix;

            return this._verifyWithProcessor(
                textOrSourceCode,
                config,
                { ...options, disableFixes, postprocess, preprocess },
                configArray
            );
        }
  			// 无处理器
        return this._verifyWithoutProcessors(textOrSourceCode, config, options);
    }
```

##### #_verifyWithProcessor()通过处理器对文本进行检测。

```javascript
_verifyWithProcessor(textOrSourceCode, config, options, configForRecursive) {
  const filename = options.filename || "<input>";
  const filenameToExpose = normalizeFilename(filename);
  const text = ensureText(textOrSourceCode);
  const preprocess = options.preprocess || (rawText => [rawText]);
  const postprocess = options.postprocess || lodash.flatten;
  ...
  const messageLists = preprocess(text, filenameToExpose).map((block, i) => {

    // Keep the legacy behavior.
    if (typeof block === "string") {
      return this._verifyWithoutProcessors(block, config, options);
    }

    const blockText = block.text;
    const blockName = path.join(filename, `${i}_${block.filename}`);
    ...

    // _verifyWithProcessor方法还是通过_verifyWithoutProcessors来检测文本
    return this._verifyWithoutProcessors(
      blockText,
      config,
      { ...options, filename: blockName }
    );
  });

  return postprocess(messageLists, filenameToExpose);
}
```

##### #_verifyWithoutProcessors()没有处理器对文本进行检测。

```javascript
_verifyWithoutProcessors(textOrSourceCode, providedConfig, providedOptions) {
  ...
  // Resolve parser.
  let parserName = DEFAULT_PARSER_NAME;
  let parser = espree;


  // search and apply "eslint-env *".
  const envInFile = options.allowInlineConfig && !options.warnInlineConfig
  ? findEslintEnv(text)
  : {};
  const resolvedEnvConfig = Object.assign({ builtin: true }, config.env, envInFile);
  const enabledEnvs = Object.keys(resolvedEnvConfig)
  .filter(envName => resolvedEnvConfig[envName])
  .map(envName => getEnv(slots, envName))
  .filter(env => env);

  const parserOptions = resolveParserOptions(parserName, config.parserOptions || {}, enabledEnvs);
  const configuredGlobals = resolveGlobals(config.globals || {}, enabledEnvs);
  const settings = config.settings || {};

  if (!slots.lastSourceCode) {
    // 将文本处理为ast
    const parseResult = parse(
      text,
      parser,
      parserOptions,
      options.filename
    );

    if (!parseResult.success) {
      return [parseResult.error];
    }

    slots.lastSourceCode = parseResult.sourceCode;
  } else {

    /*
     * If the given source code object as the first argument does not have scopeManager, analyze the scope.
     * This is for backward compatibility (SourceCode is frozen so it cannot rebind).
     */
    if (!slots.lastSourceCode.scopeManager) {
      slots.lastSourceCode = new SourceCode({
        text: slots.lastSourceCode.text,
        ast: slots.lastSourceCode.ast,
        parserServices: slots.lastSourceCode.parserServices,
        visitorKeys: slots.lastSourceCode.visitorKeys,
        scopeManager: analyzeScope(slots.lastSourceCode.ast, parserOptions)
      });
    }
  }

  const sourceCode = slots.lastSourceCode;
  const commentDirectives = options.allowInlineConfig
  ? getDirectiveComments(options.filename, sourceCode.ast, ruleId => getRule(slots, ruleId), options.warnInlineConfig)
  : { configuredRules: {}, enabledGlobals: {}, exportedVariables: {}, problems: [], disableDirectives: [] };

  // augment global scope with declared global variables
  addDeclaredGlobals(
    sourceCode.scopeManager.scopes[0],
    configuredGlobals,
    { exportedVariables: commentDirectives.exportedVariables, enabledGlobals: commentDirectives.enabledGlobals }
  );

  const configuredRules = Object.assign({}, config.rules, commentDirectives.configuredRules);

  let lintingProblems;

  try {
    lintingProblems = runRules(
      sourceCode,
      configuredRules,
      ruleId => getRule(slots, ruleId),
      parserOptions,
      parserName,
      settings,
      options.filename,
      options.disableFixes,
      slots.cwd
    );
  } catch (err) {
    err.message += `\nOccurred while linting ${options.filename}`;
    debug("An error occurred while traversing");
    debug("Filename:", options.filename);
    if (err.currentNode) {
      const { line } = err.currentNode.loc.start;

      debug("Line:", line);
      err.message += `:${line}`;
    }
    debug("Parser Options:", parserOptions);
    debug("Parser Path:", parserName);
    debug("Settings:", settings);
    throw err;
  }

  return applyDisableDirectives({
    directives: commentDirectives.disableDirectives,
    problems: lintingProblems
    .concat(commentDirectives.problems)
    .sort((problemA, problemB) => problemA.line - problemB.line || problemA.column - problemB.column),
    reportUnusedDisableDirectives: options.reportUnusedDisableDirectives
  });
}
```

##### #runRules 通过规则列表检测文本，并收集错误。

```javascript
function runRules(sourceCode, configuredRules, ruleMapper, parserOptions, parserName, settings, filename, disableFixes, cwd) {
	const emitter = createEmitter();
  const nodeQueue = [];
  let currentNode = sourceCode.ast;
	// 将ast转换为nodeQueue
  Traverser.traverse(sourceCode.ast, {
    enter(node, parent) {
      node.parent = parent;
      nodeQueue.push({ isEntering: true, node });
    },
    leave(node) {
      nodeQueue.push({ isEntering: false, node });
    },
    visitorKeys: sourceCode.visitorKeys
  });
  ...
  const lintingProblems = [];
  Object.keys(configuredRules).forEach(ruleId => {
        // 根据规则id,找到规则。
        const rule = ruleMapper(ruleId);
				
        const messageIds = rule.meta && rule.meta.messages;
        let reportTranslator = null;
    		// 
        const ruleContext = Object.freeze(
            Object.assign(
                Object.create(sharedTraversalContext),
                {
                    id: ruleId,
                    options: getRuleOptions(configuredRules[ruleId]),
                    report(...args) {

                        /*
                         * Create a report translator lazily.
                         * In a vast majority of cases, any given rule reports zero errors on a given
                         * piece of code. Creating a translator lazily avoids the performance cost of
                         * creating a new translator function for each rule that usually doesn't get
                         * called.
                         *
                         * Using lazy report translators improves end-to-end performance by about 3%
                         * with Node 8.4.0.
                         */
                        if (reportTranslator === null) {
                            reportTranslator = createReportTranslator({
                                ruleId,
                                severity,
                                sourceCode,
                                messageIds,
                                disableFixes
                            });
                        }
                      	// 
                        const problem = reportTranslator(...args);

                        if (problem.fix && rule.meta && !rule.meta.fixable) {
                            throw new Error("Fixable rules should export a `meta.fixable` property.");
                        }
                        lintingProblems.push(problem);
                    }
                }
            )
        );
    		// 执行rule,并收集problem
    		const ruleListeners = createRuleListeners(rule, ruleContext);
        ... 
    });
  return lintingProblems;
}


```

##### #createRuleListeners 执行单个rule，并返回问题。

```javascript
function createRuleListeners(rule, ruleContext) {
    try {
      	// 执行单个文件。
        return rule.create(ruleContext);
    } catch (ex) {
        ex.message = `Error while loading rule '${ruleContext.id}': ${ex.message}`;
        throw ex;
    }
}
```

