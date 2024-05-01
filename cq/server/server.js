class Server {
    constructor(statement) {
        let compiler = new Compiler(statement);
        compiler.compile();
        this._assembly = compiler._assembly;
        this._conditionalQuestions = compiler._conditionalQuestions;
        this._backStack = [];
        this._baseLine = 0;
        this._cachedAnswers = new CachedAnswers();
    }

    _loadThreadContext() {
        return this._baseLine;
    }

    _saveThreadContext(driver) {
        this._baseLine = driver._currentLine;
    }

    run() {
        console.log('server run');
        let driver = new Runtime(this._assembly, this._cachedAnswers);
        let res = driver.run(this._loadThreadContext());
        res.firstPage = this._backStack.length == 0;
        return res;
    }

    next(answers) {
        this._cachedAnswers.batchSet(answers);
        let driver = new Runtime(this._assembly, this._cachedAnswers);
        let res = driver.run(this._loadThreadContext());
        if (res.hitNext) {
            this._backStack.push(this._loadThreadContext());
            this._saveThreadContext(driver);
            res = driver.run(this._loadThreadContext());
        } // Todo: else need to tell the API layer that next was not executed because a next statement is not hit.
        res.firstPage = this._backStack.length == 0;
        return res;
    }

    back(answers) {
        this._cachedAnswers.batchSet(answers);
        if (this._backStack.length > 0) {
            this._baseLine = this._backStack.pop();
        }
        return this.run();
    }

    answer(primitiveId, answer) {
        this._cachedAnswers.set(primitiveId, answer);
        return this.run();
    }

    getConditionalQuestions() {
        return this._conditionalQuestions;
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
