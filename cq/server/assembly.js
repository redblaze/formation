class Instruction {
    constructor() {
    }

    static deserialize(json) {
        switch(json['type']) {
            case 'primitive':
                return PrimitiveInstruction.deserialize(json);
            case 'if':
                return IfInstruction.deserialize(json);
            default:
                throw 'ParseError';
        }
    }
}

class PrimitiveInstruction extends Instruction {
    constructor(primitiveId, lineNumber) {
        super();
        this._primitiveId = primitiveId;
        this._nextLineNumber = lineNumber;
    }

    serialize() {
        return {
            type: 'primitive',
            primitiveId: this._primitiveId,
            nextLineNumber: this._nextLineNumber
        };
    }

    static deserialize(json) {
        return new PrimitiveInstruction(json['primitiveId'], json['lineNumber']);
    }
}

class IfInstruction extends Instruction {
    constructor(condition, thenLineNumber, elseLineNumber) {
        super();
        this._condition = condition;
        this._thenLineNumber = thenLineNumber;
        this._elseLineNumber = elseLineNumber;
    }

    serialize() {
        return {
            type: 'if',
            condition: this._condition.serialize(),
            thenLineNumber: this._nextLineNumber,
            elseLineNumber: this._elseLineNumber
        };
    }

    static deserialize(json) {
        return new IfInstruction(
            Condition.deserialize(json['condition']),
            json['thenLineNumber'],
            json['elseLineNumber']
        );
    }
}

class Assembly {
    constructor(instructions) {
        this._instructions = instructions;
    }

    getByLineNumber(lineNumber) {
        return this._instructions[lineNumber];
    }

    serialize() {
        let json = [];
        for (let i = 0; i < this._instructions.length; i++) {
            json.push(this._instructions[i].serialize());
        }
        return json;
    }

    static deserialize(json) {
        let instructions = [];

        for (let i = 0; i < json.length; i++) {
            instructions.push(Instruction.deserialize(json[i]));
        }

        return new Assembly(instructions);
    }
}
