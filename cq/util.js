function extendContext(context1, context2) {
    for (var k in context2) {
        context1[k] = context2[k];
    }
}

function cloneContext(context) {
    let newContext = {};
    extendContext(newContext, context);
    return newContext;
}

function intersectContext(context1, context2) {
    let res = {};
    for (var k in context2) {
        if (context1[k] !== undefined) {
            res[k] = true;
        }
    }
    return res;
}

function unionContext(context1, context2) {
    let res = cloneContext(context1);
    extendContext(res, context2);
    return res;
}

function dedupeArray(arr) {
    let res = [];
    let uniques = {};
    for (let i = 0; i < arr.length; i++) {
        if (uniques[arr[i]] === undefined) {
            uniques[arr[i]] = true;
            res.push(arr[i]);
        }
    }
    return res;
}

function inArray(e, arr) {
    for (let i = 0; i < arr.length; i++) {
        if (e == arr[i]) {
            return true;
        }
    }
    return false;
}

function cloneArray(arr) {
    let res = [];
    for (let i = 0; i < arr.length; i++) {
        res.push(arr[i]);
    }
    return res;
}
