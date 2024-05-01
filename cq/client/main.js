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
                            "primitiveId": "Q7"
                        },
                        "else": {
                            "type": "primitive",
                            "primitiveId": "Q8"
                        }
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
    /*
    let statement =
        new PrimitiveSatement("Q1").colon(
        new IfStatement(new SingleSelectionPrimitiveCondition("Q1").isEqual("yes")).then(
            new PrimitiveSatement("Q2")
        ).otherwise(
            new PrimitiveSatement("Q3")
        )).colon(
        new PrimitiveSatement("Next")
        ).colon(
        new PrimitiveSatement("TY2")
        );
    */
    /*
    let statement =
        new PrimitiveSatement("Q1").colon(
        new PrimitiveSatement("Q2")).colon(
        new IfStatement(new SingleSelectionPrimitiveCondition("Q1").isEqual("yes")).then(
            new PrimitiveSatement("Q6")
        ).otherwise(
            // new PrimitiveSatement("Q7")
            null
        )).colon(
        new PrimitiveSatement("Next")).colon(
        new IfStatement(new SingleSelectionPrimitiveCondition("Q1").isEqual("yes")).then(
            new PrimitiveSatement("Q4").colon(
            new PrimitiveSatement("Q5"))
        ).otherwise(
            new PrimitiveSatement("Q5").colon(
            new PrimitiveSatement("Q4"))
        )).colon(
        new PrimitiveSatement("Next")).colon(
        new IfStatement(new SingleSelectionPrimitiveCondition("Q2").isEqual("A")).then(
            new PrimitiveSatement("TY1")
        ).otherwise(
            new PrimitiveSatement("TY2")
        )).colon(
        new PrimitiveSatement("Next"));
    */

    let statement = Statement.deserialize(sampleProgram);
/*
    let runtime = new RunTime(statement);
    console.log(runtime.compile());
*/

/*
    let json = statement.serialize();
    console.log(json);

    let statement1 = Statement.deserialize(json);
    console.log(statement1);

    let json1 = statement1.serialize();
    console.log(json1);
*/

    let ui = new UI(primitives, statement, null, function(res) {
        console.log('delivery:', res);
    });
    ui.run();
}

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});
