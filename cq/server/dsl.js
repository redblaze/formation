class Statement {
    constructor() {}

    colon(statement) {
        return new SequenceStatement(this, statement);
    }

    static deserialize(json) {
        if (json == null) {
            return null;
        }
        if (json.type == "primitive") {
            return PrimitiveSatement.deserialize(json);
        }
        if (json.type == "if") {
            return IfStatement.deserialize(json);
        }
        if (json.type == "seq") {
            return SequenceStatement.deserialize(json);
        }
        throw "ParseError";
    }
}

class PrimitiveSatement extends Statement {
    constructor(primitiveId) {
        super();
        this._lineNumber = 0;
        this._nextLineNumber = 0;
        this._primitiveId = primitiveId;
    }

    getPrimitiveId() {
        return this._primitiveId;
    }

    getNextPrimitive(state) {
        return {
            primitiveId: this._primitiveId,
            statement: null
        };
    }

    serialize() {
        return {
            type: "primitive",
            primitiveId: this._primitiveId
        };
    }

    static deserialize(json) {
        if (json.type != "primitive") {
            throw "ParseError";
        }
        return new PrimitiveSatement(json.primitiveId);
    }

    conjunctionCheck(context) {
        if (context[this._primitiveId] === undefined) {
            context[this._primitiveId] = true;
        }
    }

    disjunctionCheck(context) {
        if (context[this._primitiveId] === undefined) {
            context[this._primitiveId] = true;
        } else {
            throw "QuestionRepeated";
        }
    }
}

class IfStatement extends Statement {
    constructor(condition) {
        super();
        this._lineNumber = 0;
        this._thenLineNumber = 0;
        this._elseLineNumber = 0;
        this._nextLineNumber = 0;
        this._condition = condition;
        this._thenStatement = null;
        this._elseStatement = null;
        this._thenMacro = null;
        this._elseMacro = null;
    }

    then(statement) {
        this._thenStatement = statement;
        return this;
    }

    otherwise(statement) {
        this._elseStatement = statement;
        return this;
    }

    resolve(state) {
        if (this._condition.resolve(state)) {
            return this._thenStatement;
        } else {
            return this._elseStatement;
        }
    }

    getNextPrimitive(state) {
        let statement = this.resolve(state);
        if (statement) {
            return statement.getNextPrimitive(state);
        } else {
            return {
                primitiveId: null,
                statement: null
            }
        }
    }

    serialize() {
        return {
            type: "if",
            condition: this._condition.serialize(),
            "then": this._thenStatement.serialize(),
            "else": this._elseStatement != null? this._elseStatement.serialize(): null
        };
    }

    static deserialize(json) {
        if (json.type != "if") {
            throw "ParseError";
        }

        return new IfStatement(Condition.deserialize(json.condition)).then(
            Statement.deserialize(json["then"])
        ).otherwise(
            Statement.deserialize(json["else"])
        );
    }

    conjunctionCheck(context) {
        if (context[this._primitiveId] === undefined) {
            throw "QuestionNotAsked";
        }
        if (this._elseStatement == null) {
            return;
        }
        thenContext = cloneContext(context);
        this._thenStatement.conjunctionCheck(thenContext);
        elseContext = cloneContext(context);
        this._elseStatement.conjunctionCheck(elseContext);
        extendContext(context, intersectContext(thenContext, elseContext));
    }

    disjunctionCheck(context) {
        thenContext = cloneContext(context);
        this._thenStatement.disjunctionCheck(thenContext);
        if (this._elseStatement == null) {
            extendContext(context, thenContext);
        } else {
            elseContext = cloneContext(context);
            this._elseStatement.disjunctionCheck(elseContext);
            extendContext(context, unionContext(thenContext, elseContext));
        }
    }
}

class SequenceStatement extends Statement {
    constructor(statement1, statement2) {
        super();
        this._statement1 = statement1;
        this._statement2 = statement2;
    }

    getStatement1() {
        return this._statement1;
    }

    getStatement2() {
        return this._statement1;
    }

    getNextPrimitive(state) {
        let result = this._statement1.getNextPrimitive(state);
        if (result.primitiveId == null) {
            return this._statement2.getNextPrimitive(state);
        }
        let newStatement = this._statement2;
        if (result.statement !== null) {
            newStatement = new SequenceStatement(result.statement, this._statement2);
        }
        return {
            primitiveId: result.primitiveId,
            statement: newStatement
        };
    }

    serialize() {
        let json1 = this._statement1.serialize();
        let json2 = this._statement2.serialize();
        let part1;
        let part2;
        if (json1.type == "seq") {
            part1 = json1.seq;
        } else {
            part1 = [json1];
        }
        if (json2.type == "seq") {
            part2 = json2.seq;
        } else {
            part2 = [json2];
        }
        return {
            type: "seq",
            seq: part1.concat(part2)
        };
    }

    static deserialize(json) {
        if (json.type != "seq") {
            throw "ParseError";
        }
        let statement = Statement.deserialize(json.seq[0]);
        for (let i = 1; i < json.seq.length; i++) {
            statement = statement.colon(Statement.deserialize(json.seq[i]));
        }
        return statement;
    }

    conjunctionCheck(context) {
        this._statement1.conjunctionCheck(context);
        this._statement2.conjunctionCheck(context);
    }

    disjunctionCheck(context) {
        this._statement1.disjunctionCheck(context);
        this._statement2.disjunctionCheck(context);
    }
}
