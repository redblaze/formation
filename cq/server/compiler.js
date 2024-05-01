class Compiler {
    constructor(statement) {
        this._statement = statement;
        this._lineNumber = 0;
        this._queue = [];
        this._lineByLine = [];
        this._assembly = null;
        this._conditionalQuestions = [];
    }

    compile() {
        this._addLineNumbersToStatements(this._statement);
        this._addNextLineNumbersToStatement();
        this._conditionalQuestions = dedupeArray(this._conditionalQuestions);
        this._linebyLineToAssembly();
        console.log(this._assembly);
        return this;
    }

    _linebyLineToAssembly() {
        let instructions = this._lineByLine.map(function(statement) {
            if (statement instanceof PrimitiveSatement) {
                return new PrimitiveInstruction(statement._primitiveId, statement._nextLineNumber);
            } else if (statement instanceof IfStatement) {
                return new IfInstruction(statement._condition, statement._thenLineNumber, statement._elseStatement == null? statement._nextLineNumber: statement._elseLineNumber);
            } else {
                throw "Compilation Error";
            }
        });
        this._assembly = new Assembly(instructions);
    }

    _addLineNumbersToStatements(statement) {
        if (statement instanceof PrimitiveSatement) {
            statement._lineNumber = this._lineNumber++;
            this._lineByLine.push(statement);
        } else if (statement instanceof IfStatement) {
            this._conditionalQuestions = this._conditionalQuestions.concat(statement._condition.getConditionalQuestions());
            statement._lineNumber = this._lineNumber++;
            this._lineByLine.push(statement);
            statement._thenLineNumber = this._lineNumber;
            this._addLineNumbersToStatements(statement._thenStatement);
            if (statement._elseStatement == null) {
                statement._elseLineNumber = null;
            } else {
                statement._elseLineNumber = this._lineNumber;
                this._addLineNumbersToStatements(statement._elseStatement);
            }
        } else if (statement instanceof SequenceStatement) {
            this._addLineNumbersToStatements(statement._statement1);
            this._addLineNumbersToStatements(statement._statement2);
        }
    }

    _pushTopLevelStatement(context, statement) {
        if (statement instanceof PrimitiveSatement) {
            this._queue.unshift({context: context, statement: statement});
        } else if (statement instanceof IfStatement) {
            this._queue.unshift({context: context, statement: statement});
        } else if (statement instanceof SequenceStatement) {
            this._pushTopLevelStatement(context, statement._statement1);
            this._pushTopLevelStatement(context, statement._statement2);
        }
    }

    _initQueue() {
        this._pushTopLevelStatement(null, this._statement);
    }

    _addNextLineNumbersToStatement() {
        if (this._queue.length == 0) {
            this._initQueue();
        }
        let currentRow = null;
        while(this._queue.length > 0) {
            let row = this._queue.pop();
            if (currentRow != null) {
                if (currentRow.context == row.context) {
                    currentRow.statement._nextLineNumber = row.statement._lineNumber;
                } else {
                    if (currentRow.context == null) {
                        currentRow.statement._nextLineNumber = null;
                    } else {
                        currentRow.statement._nextLineNumber = currentRow.context.ifStatement._nextLineNumber;
                    }
                }
            }
            currentRow = row;
            if (row.statement instanceof IfStatement) {
                this._pushTopLevelStatement({ifStatement: row.statement, tag: "then"}, row.statement._thenStatement);
                this._pushTopLevelStatement({ifStatement: row.statement, tag: "else"}, row.statement._elseStatement);
            }
        }
        if (currentRow.context != null) {
            currentRow.statement._nextLineNumber = currentRow.context.ifStatement._nextLineNumber;
        }
    }
}
