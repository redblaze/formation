class Condition { // interface
    resolve(state) {

    }

    getConditionalQuestions() {

    }

    and(condition) {
        return new AndCondition(this, condition);
    }

    or(condition) {
        return new OrCondition(this, condition);
    }

    not(condition) {
        return new NotCondition(this);
    }

    static deserialize(json) {
        if (json.type == "SingleSelectionPrimitiveCondition") {
            return SingleSelectionPrimitiveCondition.deserialize(json);
        }
        throw "ParseError";
    }
}


class AndCondition extends Condition {
    constructor(condition1, condition2) {
        this._condition1 = condition1;
        this._condition2 = condition2;
    }

    getConditionalQuestions() {
        return this._condition1.getConditionalQuestions().concat(this._condition2.getConditionalQuestions());
    }

    resolve(state) {
        return this._condition1.resolve(state) && this._condition2.resolve(state);
    }
}

class OrCondition extends Condition {
    constructor(condition1, condition2) {
        this._condition1 = condition1;
        this._condition2 = condition2;
    }

    getConditionalQuestions() {
        return this._condition1.getConditionalQuestions().concat(this._condition2.getConditionalQuestions());
    }

    resolve(state) {
        return this._condition1.resolve(state) || this._condition2.resolve(state);
    }
}

class NotCondition extends Condition {
    constructor(condition) {
        this._condition = condition;
    }

    getConditionalQuestions() {
        return this._condition.getConditionalQuestions();
    }

    resolve(state) {
        return !this._condition.resolve(state);
    }
}

class SingleSelectionPrimitiveCondition extends Condition {
    constructor(primitiveId) {
        super();
        this._primitiveId = primitiveId;
    }

    isEqual(option) {
        this._option = option;
        return this;
    }

    resolve(state) {
        if (state[this._primitiveId] === undefined) {
            // throw "RuntimeError:Dependency";
            throw "Exception:NeedAnswer";
        } else if (state[this._primitiveId] === null) {
            throw "Exception:NeedAnswer";
        } else {
            return state[this._primitiveId].answer == this._option;
        }
    }

    getConditionalQuestions() {
        return [this._primitiveId];
    }

    serialize() {
        return {
            type: "SingleSelectionPrimitiveCondition",
            primitiveId: this._primitiveId,
            value: this._option
        };
    }

    static deserialize(json) {
        if (json.type != "SingleSelectionPrimitiveCondition") {
            throw "ParseError";
        }

        return new SingleSelectionPrimitiveCondition(json.primitiveId).isEqual(json.value);
    }
}
