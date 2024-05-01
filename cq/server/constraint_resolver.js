class ConstraintResolver {
    constructor(condition) {
        this._condition = condition;
    }

    _conjnorm(condition) {
        if (condition instanceof NotCondition) {
            let res = this._disjnorm(condition._condition);
            return res.map(function(disjterm) {
                disjterm.map(function(literal) {
                    if (literal instanceof SingleSelectionPrimitiveCondition) {
                        return literal.not();
                    } else if (literal instanceof NotCondition){
                        return literal._condition;
                    } else {
                        throw "Literal-Type-Error";
                    }
                });
            });
        } else if (condition instanceof AndCondition) {
            return this._conjnorm(condition._condition1).concat(this._conjnorm(condition._condition2));
        } else if (condition instanceof OrCondition) {
            let conjnorm1 = this._conjnorm(condition._condition1);
            let conjnorm2 = this._conjnorm(condition._condition2);
            return conjnorm1.map(function(disjterm1) {
                conjnorm2.map(function(disjterm2) {
                    return disjterm1.concat(disjterm2);
                })
            }).flat();
        } else if (condition instanceof SingleSelectionPrimitiveCondition) {
            return [[condition]];
        }
    }

    _disjnorm(condition) {

    }

}
