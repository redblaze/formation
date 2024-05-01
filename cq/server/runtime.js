
class Runtime {
    constructor(assembly, cachedAnswers) {
        this._assembly = assembly;
        this._cachedAnswers = cachedAnswers._cachedAnswers;
        this._currentLine = 0;
        this._currentConditionalQuestions = [];
    }

    _setThreadContext(context) {
        this._currentLine = context;
    }

    _programEnded() {
        return this._currentLine == null;
    }

    getNextPrimitive() {
        while (true) {
            if (this._programEnded()) {
                return null;
            }
            let instruction = this._assembly.getByLineNumber(this._currentLine);
            if (instruction instanceof PrimitiveInstruction) {
                this._currentLine = instruction._nextLineNumber;
                return instruction._primitiveId;
            } else if (instruction instanceof IfInstruction) {
                this._currentConditionalQuestions = this._currentConditionalQuestions.concat(instruction._condition.getConditionalQuestions());
                if (instruction._condition.resolve(this._cachedAnswers)) {
                    this._currentLine = instruction._thenLineNumber;
                } else {
                    this._currentLine = instruction._elseLineNumber;
                }
            }
        }
    }

    run(context) {
        let me = this;
        this._setThreadContext(context)
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
