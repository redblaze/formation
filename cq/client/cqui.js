class UI {
    constructor(primitives, statement, el, onFinish) {
        this._primitives = primitives;
        this._api = new API(new Server(statement));
        this._el = el || $('body');
        this._onFinish = onFinish || null;
    }

    initBack() {
        var me = this;

        this._el.find('#back').on('click', function() {
            me._api.back(function(res) {
                me.handleResult(res);
            });
        });
    }

    resetUI() {
        this._el.find('.instance').remove();
    }

    handleResult(result) {
        console.log(result);
        this.resetUI();
        let me = this;

        let uiRes = result.uiRes;
        for (let i = 0; i < uiRes.length; i++) {
            let primitiveId = uiRes[i].primitiveId;
            let primitive = this._primitives[primitiveId];
            let cachedAnswer = uiRes[i].cachedAnswer;
            if (primitiveId == 'Next') {
                primitive.execute(null, function() {
                    if (!result.finished) {
                        me._api.next(function(res) {
                            me.handleResult(res);
                        });
                    }
                }, this._el);
            } else {
                primitive.execute(cachedAnswer, function(answer) {
                    if (!result.finished) {
                        me._api.answer(primitiveId, answer, function(res) {
                            me.handleResult(res);
                        });
                    }
                }, this._el);
            }
        }
        if (result.canNotGoNext) {
            alert('Please fill the form before going to the next page.');
        }
        if (result.firstPage || result.finished) {
            this._el.find("#back").hide();
        } else {
            this._el.find("#back").show();
        }
        if (result.finished && this._onFinish) {
            me._api.getState(function(res) {
                me._onFinish(res);
            });
        }
    }

    run() {
        let me = this;

        this.initBack();
        this._api.run(function(res) {
            me.handleResult(res);
        });
    }
}

class API {
    constructor(server) {
        this._server = server;
        this._cachedAnswers = {};
        this._conditionalQuestions = [];
        this._currentConditionalQuestions = [];
        this._running = false;
        this._cbs = [];
        this._initConditionalQuestions();
        this._cachedRes = null;
    }

    _initConditionalQuestions() {
        let me = this;

        this._callServer('getConditionalQuestions', [], function(res) {
            me._conditionalQuestions = res;
        });
    }

    _callServer(apiName, parameters, cb) {
        let me = this;

        console.log(apiName);

        if (this._running) {
            this._cbs.push(function() {
                me._callServer(apiName, parameters, cb);
            });
        } else {
            this._running = true;
            let res = this._server[apiName].apply(this._server, parameters);
            cb(res);
            me._running = false;
            if (this._cbs.length > 0) {
                let cb = this._cbs.shift();
                cb();
            }
        }
    }

    getAnswers() {
        let res = {};

        for (let i = 0; i < this._conditionalQuestions.length; i++) {
            let cq = this._conditionalQuestions[i];
            if (this._cachedAnswers[cq] !== undefined) {
                res[cq] = this._cachedAnswers[cq];
            }
        }

        return res;
    }

    _filled() {
        for (let i = 0; i < this._cachedRes.uiRes.length; i++) {
            let primitiveId = this._cachedRes.uiRes[i].primitiveId;
            if (primitiveId != 'Next' && this._cachedAnswers[primitiveId] === undefined) {
                return false;
            }
        }
        return true;
    }

    _enrichUIRes(uiRes) {
        for (let i = 0; i < uiRes.length; i++) {
            if (this._cachedAnswers[uiRes[i].primitiveId] !== undefined) {
                uiRes[i].cachedAnswer = this._cachedAnswers[uiRes[i].primitiveId];
            }
        }
    }

    handleResult(res, cb) {
        this._cachedRes = res;
        if (res.conditionalQuestions) {
            this._currentConditionalQuestions = res.conditionalQuestions;
        }
        this._enrichUIRes(res.uiRes);
        cb(res);
    }

    run(cb) {
        let me = this;

        this._callServer('run', [], function(res) {
            me.handleResult(res, cb);
        });
    }

    next(cb) {
        let me = this;

        if (this._filled()) {
            this._callServer('next', [this.getAnswers()], function(res) {
                me.handleResult(res, cb);
            });
        } else {
            this._cachedRes.canNotGoNext = true;
            this._enrichUIRes(this._cachedRes.uiRes);
            cb(this._cachedRes);
        }
    }

    back(cb) {
        let me = this;

        this._callServer('back', [this.getAnswers()], function(res) {
            me.handleResult(res, cb);
        });
    }

    answer(primitiveId, answer, cb) {
        let me = this;
        this._cachedAnswers[primitiveId] = answer;
        if (inArray(primitiveId, this._currentConditionalQuestions)) {
            this._callServer('answer', [primitiveId, answer], function(res) {
                me.handleResult(res, cb);
            });
        } else {
            this._cachedRes.canNotGoNext = false;
            this._enrichUIRes(this._cachedRes.uiRes);
            cb(this._cachedRes);
        }
    }

    getState(cb) {
        cb(this._cachedAnswers);
    }
}
