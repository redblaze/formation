let sampleProgram = {
    "type": "seq",
    "seq": [
        {
            "type": "primitive",
            "primitiveId": "Q1"
        },
        {
            "type": "primitive",
            "primitiveId": "Q2"
        },
        {
            "type": "if",
            "condition": {
                "type": "SingleSelectionPrimitiveCondition",
                "primitiveId": "Q1",
                "value": "yes"
            },
            "then": {
                "type": "primitive",
                "primitiveId": "Q6"
            },
            "else": null
        },
        {
            "type": "primitive",
            "primitiveId": "Next"
        },
        {
            "type": "if",
            "condition": {
                "type": "SingleSelectionPrimitiveCondition",
                "primitiveId": "Q1",
                "value": "yes"
            },
            "then": {
                "type": "seq",
                "seq": [
                    {
                        "type": "primitive",
                        "primitiveId": "Q4"
                    },
                    {
                        "type": "primitive",
                        "primitiveId": "Q5"
                    }
                ]
            },
            "else": {
                "type": "seq",
                "seq": [
                    {
                        "type": "primitive",
                        "primitiveId": "Q5"
                    },
                    {
                        "type": "primitive",
                        "primitiveId": "Q4"
                    }
                ]
            }
        },
        {
            "type": "primitive",
            "primitiveId": "Next"
        },
        {
            "type": "if",
            "condition": {
                "type": "SingleSelectionPrimitiveCondition",
                "primitiveId": "Q2",
                "value": "A"
            },
            "then": {
                "type": "primitive",
                "primitiveId": "TY1"
            },
            "else": {
                "type": "primitive",
                "primitiveId": "TY2"
            }
        }
    ]
};


function main() {
    let flow = new Flow();
    let tree = new Tree(function(node, event) {
        flow.run(function(result) {
            console.log(result);
            if (result.Operation.answer == "create") {
                if (result.TypeOfStatement.answer == "if") {
                    tree.insertAfter(node, {
                        "type": "if",
                        "primitiveId": result.PrimitiveId.answer,
                        "value": result.Value.answer
                    });
                } else if (result.TypeOfStatement.answer == "primitive") {
                    tree.insertAfter(node, {
                        "type": "primitive",
                        "primitiveId": result.PrimitiveId.answer
                    });
                } else {
                    throw "UnknownTypeOfStatement";
                }
            } else if (result.Operation.answer == "delete") {
                tree.deleteNode(node);
            } else {
                throw "NoSuchOperation";
            }
        });
    });
    /*
    let node1 = tree._nodes[tree._nodes.length-1];
    tree.insertAfter(node1, {
        type: 'primitive',
        primitiveId: 'Q1'
    });

    let node2 = tree._nodes[tree._nodes.length-1];
    tree.insertAfter(node2, {
        type: 'if',
        primitiveId: 'Q2',
        value: 'A'
    });

    tree.insertAfter(node2, {
        type: 'primitive',
        primitiveId: 'Q2'
    });
    */

    let statement = Statement.deserialize(sampleProgram);
    console.log(statement);
    tree.fromStatement(statement, 0);
    console.log(tree);
    tree.render();

    $('#compile').on('click', function() {
        let statement = tree.getStatement(1, 0);
        let json = statement.serialize();
        console.log(json);
        let primitives = {
            Q1: new SingleSelectionPrimitive("Are you older than 18", ["yes", "no"]),
            Q2: new SingleSelectionPrimitive("Q2", ["A", "B"]),
            Q3: new SingleSelectionPrimitive("Q3", ["A", "B"]),
            Q4: new SingleSelectionPrimitive("Q4", ["A", "B"]),
            Q5: new SingleSelectionPrimitive("Q5", ["A", "B"]),
            Q6: new SingleSelectionPrimitive("Q6", ["A", "B"]),
            Q7: new SingleSelectionPrimitive("Q7", ["A", "B"]),
            Q8: new SingleSelectionPrimitive("Q8", ["A", "B"]),
            Q9: new SingleSelectionPrimitive("Q9", ["A", "B"]),
            Next: new NextPrimitive(),
            TY1: new ThankYouPrimitive('Thank you 1'),
            TY2: new ThankYouPrimitive('Thank you 2')
        };
        let ui = new UI(primitives, statement, $('#runtime'), function(result) {
            console.log(result);
        });
        ui.run();
    });
}

class Flow {
    constructor() {
        this._primitives = {
            Next: new NextPrimitive(),
            Operation: new SingleSelectionPrimitive("What operation are you trying to do?", ["create", "delete"]),
            NewOrExisting: new SingleSelectionPrimitive("Selecting from an existing statement or creating a new one?", ["new", "existing"]),
            TypeOfStatement: new SingleSelectionPrimitive("What type of statement are you creating?", ["primitive", "if"]),
            PrimitiveId: new InputPrimitive("primitive ID:"),
            Value: new InputPrimitive("value:"),
            TY1: new ThankYouPrimitive('Thank you 1'),
            TY2: new ThankYouPrimitive('Thank you 2')
        };

        this._statement =
            new PrimitiveSatement("Operation").colon(
            new PrimitiveSatement("Next")).colon(
            new IfStatement(new SingleSelectionPrimitiveCondition("Operation").isEqual("create")).then(
                new PrimitiveSatement("TypeOfStatement").colon(
                new IfStatement(new SingleSelectionPrimitiveCondition("TypeOfStatement").isEqual("primitive")).then(
                    new PrimitiveSatement("PrimitiveId")
                ).otherwise(
                    new PrimitiveSatement("PrimitiveId").colon(
                    new PrimitiveSatement("Value"))
                )).colon(
                new PrimitiveSatement("Next")).colon(
                new PrimitiveSatement("TY1"))
            ).otherwise(
                new PrimitiveSatement("TY2")
            ));
    }

    run(eventCb) {
        let ui = new UI(this._primitives, this._statement, $('#flow'), function(result) {
            ui.resetUI();
            eventCb(result);
        });
        ui.run();
    }
}

class Tree {
    constructor(eventCb) {
        var me = this;

        this._nodeEventCb = function(node, event) {
            me._currentNode = node;
            me.render();
            eventCb(node, event);
        };
        this._nodes = [new StartNode(this._nodeEventCb)];
    }

    fromStatement(statement, level) {
        console.log(level);
        if (statement instanceof PrimitiveSatement) {
            let pNode = new PNode(level, this._nodeEventCb, statement._primitiveId);
            this._nodes.push(pNode);
        } else if (statement instanceof IfStatement) {
            let ifNode = new IfNode(level, this._nodeEventCb, statement._condition._primitiveId, statement._condition._option);
            this._nodes.push(ifNode);
            let thenNode = new ThenNode(level + 1, this._nodeEventCb);
            this._nodes.push(thenNode);
            this.fromStatement(statement._thenStatement, level + 2);
            let elseNode = new ElseNode(level + 1, this._nodeEventCb);
            this._nodes.push(elseNode);
            this.fromStatement(statement._elseStatement, level + 2);
        } else if (statement instanceof SequenceStatement) {
            this.fromStatement(statement._statement1, level);
            this.fromStatement(statement._statement2, level);
        }
    }

    getStatement(i, level) {
        let node = this._nodes[i];
        if (i >= this._nodes.length || node._level < level) {
            return null;
        }
        if (node instanceof PNode) {
            let statement1 = new PrimitiveSatement(node._primitiveId);
            let statement2 = this.getStatement(i+1, level);
            if (statement2) {
                return new SequenceStatement(statement1, statement2);
            } else {
                return statement1;
            }
        } else if (node instanceof IfNode) {
            let thenIndex = i + 1;
            let elseIndex = i + 2;
            while (elseIndex < this._nodes.length && this._nodes[elseIndex]._level > level + 1) {
                elseIndex++;
            }
            let nextIndex = elseIndex + 1;
            while (nextIndex < this._nodes.length && this._nodes[nextIndex]._level > level + 1) {
                nextIndex++;
            }
            console.log("thenIndex:", thenIndex);
            let thenStatement = this.getStatement(thenIndex + 1, level + 2);
            console.log("elseIndex:", elseIndex);
            let elseStatement = this.getStatement(elseIndex + 1, level + 2);
            let statement1 = new IfStatement(new SingleSelectionPrimitiveCondition(node._primitiveId).isEqual(node._value)).then(
                thenStatement
            ).otherwise(
                elseStatement
            );
            let statement2 = this.getStatement(nextIndex, level);
            if (statement2) {
                return new SequenceStatement(statement1, statement2);
            } else {
                return statement1;
            }
        } else {
            console.log("current i:", i);
            throw "DoNotWorkOnThenOrElseNode";
        }
    }

    findI(node) {
        let i;
        for (i = 0; i < this._nodes.length; i++) {
            if (this._nodes[i] === node) {
                if (node instanceof IfNode) {
                    break;
                } else {
                    return i;
                }
            }
        }
        for (let j = i+1; j < this._nodes.length; j++) {
            if (this._nodes[j]._level == node._level) {
                return j-1;
            }
        }
        return this._nodes.length-1;
    }

    deleteNode(node) {
        if (node instanceof ThenNode || node instanceof ElseNode) {
            alert("cannot delete this node");
            return;
        }

        let i;
        for (i = 0; i < this._nodes.length; i++) {
            if (this._nodes[i] === node) {
                break;
            }
        }
        if (node instanceof PNode) {
            this._nodes.splice(i, 1);
        } else if (node instanceof IfNode) {
            let level = node._level;
            this._nodes.splice(i, 1);
            while (i <= this._nodes.length-1 && this._nodes[i]._level > level) {
                this._nodes.splice(i, 1);
            }
        } else {
            throw "NonExisting Node Type"
        }
        this.render();
    }

    insertAfter(node, statement) {
        let level = node._level;
        if (node instanceof ThenNode || node instanceof ElseNode) {
            level++;
        }
        let i = this.findI(node);
        if (statement.type == "primitive") {
            let pNode = new PNode(level, this._nodeEventCb, statement.primitiveId);
            if (i == this._nodes.length-1) {
                this._nodes.push(pNode);
            } else {
                console.log(i);
                this._nodes.splice(i+1, 0, pNode);
            }

        } else if (statement.type == "if") {
            let ifNode = new IfNode(level, this._nodeEventCb, statement.primitiveId, statement.value);
            let thenNode = new ThenNode(level + 1, this._nodeEventCb);
            let elseNode = new ElseNode(level + 1, this._nodeEventCb);
            if (i == this._nodes.length-1) {
                this._nodes.push(ifNode);
                this._nodes.push(thenNode);
                this._nodes.push(elseNode);
            } else {
                this._nodes.splice(i+1, 0, ifNode);
                this._nodes.splice(i+2, 0, thenNode);
                this._nodes.splice(i+3, 0, elseNode);
            }
        } else {
            throw "NoSuchType"
        }
        this.render();
    }

    render() {
        $('.node').remove();

        for (let i = 0; i < this._nodes.length; i++) {
            let highlight = false;
            if (this._nodes[i] == this._currentNode) {
                highlight = true;
            }
            $('#tree').append(this._nodes[i].render(highlight));
        }
    }
}

class Node {
    constructor(level, cb) {
        this._level = level;
        this._eventCb = cb;
    }

    renderIndent() {
        let s = [];
        for (let i = 0; i < this._level; i++) {
            s.push('&nbsp&nbsp&nbsp&nbsp');
        }
        return s.join('');
    }

    behavior() {
        let me = this;
        this._el.on('click', function() {
            me._eventCb(me, 'event');
        });
    }

    render(highlight) {
        this._render();
        this.behavior();
        if (highlight) {
            this._el.css("background-color", "gray");
        }
        return this._el;
    }
}

class StartNode extends Node {
    constructor(cb) {
        super(0);
        this._eventCb = cb;
    }

    _render() {
        let el = $('<div class="node"><p>start</p></div>');
        this._el = el;
        return el;
    }
}

class PNode extends Node {
    constructor(level, cb, primitiveId) {
        super(level, cb);
        this._primitiveId = primitiveId;
    }

    _render() {
        let s = [
            '<div class="node"><p>',
            this.renderIndent(), this._primitiveId,
            '</p></div>'
        ];
        let el = $(s.join(''));
        this._el = el;
        return el;
    }
}

class IfNode extends Node {
    constructor(level, cb, primitiveId, value) {
        super(level, cb);
        this._primitiveId = primitiveId;
        this._value = value;
    }

    _render() {
        let s = [
            '<div class="node"><p>',
            this.renderIndent(), 'if ( ',
            this._primitiveId, ' = ', this._value, ' )',
            '</p></div>'
        ];
        let el = $(s.join(''));
        this._el = el;
        return el;
    }
}

class ThenNode extends Node {
    constructor(level, cb) {
        super(level, cb);
    }

    _render() {
        let s = [
            '<div class="node"><p>',
            this.renderIndent(), 'then',
            '</p></div>'
        ];
        let el = $(s.join(''));
        this._el = el;
        return el;
    }

}

class ElseNode extends Node {
    constructor(level, cb) {
        super(level, cb);
    }

    _render() {
        let s = [
            '<div class="node"><p>',
            this.renderIndent(), 'else',
            '</p></div>'
        ];
        let el = $(s.join(''));
        this._el = el;
        return el;
    }
}

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});
