import { evaluate } from "../compiler/evaluate.js";
import Environment from "../environment/env.js";
import { Program } from "../interpreter/ast.js";
import { ComputedValue, createNull, FunctionValue } from "../interpreter/values.js";

export function evalProgram(program: Program, env: Environment): ComputedValue {
    let result: ComputedValue = createNull();

    for (const statement of program.body) {
        result = evaluate(statement, env);
    }

    return result;
}

export function evalFunction(func: FunctionValue, args: ComputedValue[]): ComputedValue {
    const scope = new Environment(func.declarationEnv);

    for (let i = 0; i < func.parameters.length; i++ ) {
        const varname = func.parameters[i];

        scope.declareVariable(varname, args[i], false);
    }

    let result: ComputedValue = createNull();

    for (const statement of func.body) {
        result = evaluate(statement, scope);
    }

    return result;
}