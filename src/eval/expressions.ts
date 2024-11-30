import { evaluate } from "../compiler/evaluate.js";
import Environment from "../environment/env.js";
import { Assignment, Binary, BinaryOperator, Call, Identifier, Object, Member, List } from "../interpreter/ast.js";
import { ComputedValue, createNull, FunctionValue as FnValue, ListValue, NativeFunctionValue, NumberValue, ObjectValue, StringValue } from "../interpreter/values.js";


/**
 * Evaluate Numeric Binary Expression
 * ---------------------------------
 * Evaluates expressions following the binary operator precedence.
 * 
 * @param left 
 * @param right 
 * @param operator 
 */

export function evalNumericBinaryExpression(
    left: NumberValue,
    right: NumberValue,
    operator: BinaryOperator,
): ComputedValue {
    let result: number;

    if (operator == "+") {
        result = left.value + right.value;
    } else if (operator == "-") {
        result = left.value - right.value;
    } else if (operator == "*") {
        result = left.value * right.value;
    } else if (operator == "/") {
        // check for division by zero
        if (right.value == 0) {
            throw new Error("Division by zero");
        }

        result = left.value / right.value;
    } else if (operator == "%") {
        result = left.value % right.value;
    } else if (operator == "==") {
        result = left.value == right.value ? 1 : 0;
    } else if (operator == "!=") {
        result = left.value != right.value ? 1 : 0;
    } else if (operator == ">") {
        result = left.value > right.value ? 1 : 0;
    } else if (operator == "<") {
        result = left.value < right.value ? 1 : 0;
    } else if (operator == ">=") {
        result = left.value >= right.value ? 1 : 0;
    } else if (operator == "<=") {
        result = left.value <= right.value ? 1 : 0;
    } else if (operator == "&&") {
        result = left.value && right.value ? 1 : 0;
    } else if (operator == "|") {
        result = left.value || right.value ? 1 : 0;
    } else {
        throw new Error(`Unknown binary operator: ${operator}`);
    }

    return {
        type: "number",
        value: result,
    };
}

/**
 * Evaluate List Expression
 * -------------------------
 * -   Evaluates an array expression.
 * -   Returns an array value.
 */

export function evalListExpression(obj: List, env: Environment): ComputedValue {
    const list = {
        type: "list",
        value: []
    } as ListValue;

    for (const val of obj.values) {
        const computedVal = evaluate(val, env);

        list.value.push(computedVal);
    }

    return list;
}

/**
 * Evaluate String Binary Expression
 * --------------------------------
 * Evaluates expressions following the binary operator precedence.
 * 
 * @param left
 * @param right
 * @param operator
 */

export function evalStringBinaryExpression(
    left: StringValue,
    right: StringValue,
    operator: BinaryOperator,
): StringValue {
    let result: string = "";
    let leftLength: number = left.value.length;
    let rightLength: number = right.value.length;

    switch (operator) {
        case "+":
            result += `${left.value}${right.value}`;
        case "==":
            result = leftLength == rightLength ? "true" : "false";
        case "!=":
            result = leftLength != rightLength ? "true" : "false";
        case ">":
            result = leftLength > rightLength ? "true" : "false";
        case "<":
            result = leftLength < rightLength ? "true" : "false";
        case ">=":
            result = leftLength >= rightLength ? "true" : "false";
        case "<=":
            result = leftLength <= rightLength ? "true" : "false";
        case "&&":
            result = `${left.value}${right.value}`;
        case "|":
            result = left.value || right.value;

    }

    return {
        type: "string",
        value: result,
    };
}

/**
 * Evaluate Binary Expression
 * --------------------------
 * Evaluates expressions following the binary operator precedence.
 * 
 * @param expr 
 * @param env 
 */

export function evalBinaryExpression(
    expr: Binary,
    env: Environment,
): ComputedValue {
    const left = evaluate(expr.left, env);
    const right = evaluate(expr.right, env);

    // Numeric operations
    if (left.type == "number" && right.type == "number") {
        return evalNumericBinaryExpression(left as NumberValue, right as NumberValue, expr.operator);
    }


    // String operations
    if (left.type == "string" && right.type == "string") {
        return evalStringBinaryExpression(left as StringValue, right as StringValue, expr.operator);
    }

    if (left.type != right.type) {
        throw new Error("Type mismatch");
    }

    return createNull();
}

/**
 * Evaluate identifier
 *  ------------------
 * -   Looks up the value of an identifier in the environment.
 * -   Returns the value of the identifier.
 */

export function evalIdentifier(identifier: Identifier, env: Environment): ComputedValue {
    const value = env.lookupVariable(identifier.name);

    return value;
}

/**
 * Evaluate assignment
 * -------------------
 * -   Assigns a value to a variable.
 */

export function evalAssignment(node: Assignment, env: Environment): ComputedValue {
    if (node.assignee.type != "Identifier") {
        throw new Error("Evaluation error:\n-    Invalid assignment\n-    Left hand side must be an identifier");
    }

    const identifier = (node.assignee as Identifier);
    const name = identifier.name;

    return env.assignVariable(name, {type: "assignment", value: evaluate(node.value, env)});
}

/**
 * Evaluate Object Expression
 * --------------------------
 * -   Evaluates an object expression.
 * -   Returns an object value.
 */

export function evalObjectExpression(obj: Object, env: Environment): ComputedValue {
    const object = {
        type: "object",
        properties: new Map()
    } as ObjectValue;

    for (const { key, value } of obj.properties) {
        const computedValue = value == undefined ? env.lookupVariable(key) : evaluate(value, env);

        object.properties.set(key, {
            type: "property",
            value: computedValue,
        });
    }

    return object;
}

/**
 * Evaluate Call Expression
 * ------------------------
 * -   Evaluates a call expression.
 * -   Returns the computed value of the call expression.
 */

export function evalCallExpression(node: Call, env: Environment): ComputedValue {
    const args = node.args?.map((arg) => evaluate(arg, env)) || [];

    const func = evaluate(node.callee, env);

    if (func.type == "native-function") {
        return (func as NativeFunctionValue).call(args, env);
    }

    if (func.type == "function") {
        const fn = func as FnValue;
        const scope = new Environment(fn.declarationEnv);

        for (let i = 0; i < fn.parameters.length; i++) {
            const funcName = fn.parameters[i];

            scope.declareVariable(funcName, fn, false);
        }

        let result: ComputedValue = createNull();

        for (const stmt of fn.body) {
            result = evaluate(stmt, scope);
        }

        return result;
    }

    throw `Cannot call non-function value:\n${JSON.stringify(func, null, 2)}`;
}

export function evalMemberExpression(env: Environment, node?: Assignment, expr?: Member): ComputedValue {
    if (expr) return env.lookupVariable(expr.name);
    if (node) {
        return env.lookupVariable((node.assignee as Member).name);
    }

    return createNull();
}