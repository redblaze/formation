class Driver2 {
    constructor(runtime, cachedAnswers) {
        this._runtime2 = runtime;
        this._cachedAnswers = cachedAnswers._cachedAnswers;
        this._currentLine = null;
        this._runtimeStack = [];
        this._currentConditionalQuestions = [];
    }

    _setThreadContext(context) {
        this._runtimeStack = context.baseRuntimeStack;
        this._currentLine = context.baseLine;
    }

    _programEnded() {
        return this._currentLine.macro == 'main' && this._currentLine.line >= this._runtime2._macros['main'].length;
    }

    getNextPrimitive() {
        while (true) {
            if (this._programEnded()) {
                return null;
            }
            console.log(this._currentLine);
            let macro = this._runtime2._macros[this._currentLine.macro];
            if (this._currentLine.line >= macro.length) {
                this._currentLine = this._runtimeStack.pop();
                continue;
            }
            let statement = macro[this._currentLine.line];
            if (statement instanceof PrimitiveSatement) {
                let currentLine = {
                    macro: this._currentLine.macro,
                    line: this._currentLine.line + 1
                };
                this._currentLine = currentLine;
                return statement._primitiveId;
            } else if (statement instanceof IfStatement) {
                this._currentConditionalQuestions = this._currentConditionalQuestions.concat(statement._condition.getConditionalQuestions());
                if (statement._condition.resolve(this._cachedAnswers)) {
                    this._runtimeStack.push({
                        macro: this._currentLine.macro,
                        line: this._currentLine.line + 1
                    });
                    this._currentLine = {
                        macro: statement._thenMacro,
                        line: 0
                    };
                } else {
                    if (statement._elseMacro != null) {
                        this._runtimeStack.push({
                            macro: this._currentLine.macro,
                            line: this._currentLine.line + 1
                        });
                        this._currentLine = {
                            macro: statement._elseMacro,
                            line: 0
                        };
                    } else {
                        let currentLine = {
                            macro: this._currentLine.macro,
                            line: this._currentLine.line + 1
                        };
                        this._currentLine = currentLine;
                    }
                }
            }
        }
    }

    run(context) {
        this._setThreadContext(context)
        let me = this;
        this._currentConditionalQuestions = [];
        let uiRes = [];
        let finished = false;
        let hitNext = false;

        while(true) {
            try {
                let primitiveId = this.getNextPrimitive();
                if (primitiveId == null || primitiveId == 'End') {
                    finished = true;
                    break;
                }
                console.log(primitiveId);
                uiRes.push({
                    primitiveId: primitiveId
                });
                if (primitiveId == 'Next') {
                    hitNext = true;
                    break;
                }
            } catch(e) {
                if (e == 'Exception:NeedAnswer') {
                    break;
                } else {
                    throw e;
                }
            }
        }
        return {
            uiRes: uiRes,
            finished: finished,
            hitNext: hitNext,
            conditionalQuestions: dedupeArray(this._currentConditionalQuestions)
        };
    }
}

class RunTime2 {
    constructor(statement) {
        this._statement = statement;
        this._macros = {main: []};
        this._counter = 1;
        this._conditionalQuestions = [];
    }

    _createContext() {
        let label = "__M__" + this._counter++;
        this._macros[label] = [];
        return label;
    }

    _addStatement(context, statement) {
        if (this._macros[context] === undefined) {
            throw "InvalidContext";
        }

        this._macros[context].push(statement);
    }

    _compile(context, statement) {
        if (statement instanceof PrimitiveSatement) {
            this._addStatement(context, statement);
        }

        if (statement instanceof IfStatement) {
            this._addStatement(context, statement);
            this._conditionalQuestions = this._conditionalQuestions.concat(statement._condition.getConditionalQuestions());
            let thenContext = this._createContext();
            this._compile(thenContext, statement._thenStatement);
            statement._thenMacro = thenContext;
            if (statement._elseStatement != null) {
                let elseContext = this._createContext();
                this._compile(elseContext, statement._elseStatement);
                statement._elseMacro = elseContext;
            }
        }

        if (statement instanceof SequenceStatement) {
            this._compile(context, statement._statement1);
            this._compile(context, statement._statement2);
        }
    }

    compile() {
        this._compile("main", this._statement);
        console.log(this._macros);
        this._conditionalQuestions = dedupeArray(this._conditionalQuestions);
        console.log(this._conditionalQuestions);
    }
}
