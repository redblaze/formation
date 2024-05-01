class Server {
    constructor(statement) {
        this._runtime = new RunTime2(statement);
        this._runtime.compile();
        this._backStack = [];
        this._baseRuntimeStack = [];
        this._baseLine = this._baseLine = {macro: "main", line: 0};
        this._cachedAnswers = new CachedAnswers();
    }

    _loadThreadContext() {
        return {
            baseRuntimeStack: cloneArray(this._baseRuntimeStack),
            baseLine: {
                macro: this._baseLine.macro,
                line: this._baseLine.line
            }
        };
    }

    _saveThreadContext(driver) {
        this._baseRuntimeStack = driver._runtimeStack;
        this._baseLine = driver._currentLine;
    }

    run() {
        let driver = new Driver2(this._runtime, this._cachedAnswers);
        let res = driver.run(this._loadThreadContext());
        res.firstPage = this._backStack.length == 0;
        return res;
    }

    next(answers) {
        this._cachedAnswers.batchSet(answers);
        let driver = new Driver2(this._runtime, this._cachedAnswers);
        let res = driver.run(this._loadThreadContext());
        if (res.hitNext) {
            this._backStack.push(this._loadThreadContext());
            this._saveThreadContext(driver);
            res = driver.run(this._loadThreadContext());
        }
        res.firstPage = this._backStack.length == 0;
        return res;
    }

    back(answers) {
        this._cachedAnswers.batchSet(answers);
        if (this._backStack.length > 0) {
            let continuation = this._backStack.pop();
            this._baseRuntimeStack = continuation.baseRuntimeStack;
            this._baseLine = continuation.baseLine;
        }
        return this.run();
    }

    answer(primitiveId, answer) {
        this._cachedAnswers.set(primitiveId, answer);
        return this.run();
    }

    getConditionalQuestions() {
        return this._runtime._conditionalQuestions;
    }
}

class CachedAnswers {
    constructor() {
        this._cachedAnswers = {};
    }

    set(primitiveId, answer) {
        this._cachedAnswers[primitiveId] = answer;
    }

    get(primitiveId) {
        return this._cachedAnswers[primitiveId];
    }

    batchSet(answers) {
        for (var k in answers) {
            this._cachedAnswers[k] = answers[k];
        }
    }
}
