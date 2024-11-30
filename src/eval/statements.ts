import { evaluate } from "../compiler/evaluate.js";
import Environment from "../environment/env.js";
import { FunctionDeclaration, IfStatement, Node, TryCatch, VariableDeclaration } from "../interpreter/ast.js";
import { BooleanValue, ComputedValue, createNull, FunctionValue } from "../interpreter/values.js";

export function evalVariableDeclaration(declaration: VariableDeclaration, env: Environment): ComputedValue {
    const value = declaration.value ? evaluate(declaration.value, env) : createNull();

    return env.declareVariable(declaration.identifier, value, declaration.constant);
}

export function evalFunctionDeclaration(declaration: FunctionDeclaration, env: Environment): ComputedValue {
    const func: FunctionValue = {
        type: "function",
        name: declaration.name,
        body: declaration.body,
        declarationEnv: env,
        parameters: declaration.params,
        value: declaration.value?.type ? evaluate(declaration.value, env) : null
    }

    return declaration.name == "<anon>" ? func : env.declareVariable(declaration.name, {type: "function", value: func}, true);
}

export function evalIfStatement(declaration: IfStatement, env: Environment):  ComputedValue {
    const test = evaluate(declaration.test, env);

    if ((test as BooleanValue).value === true) {
        return evalBody(declaration.body, env);
    } else if (declaration.alternate) {
        return evalBody(declaration.alternate, env);
    } else {
        return createNull();
    }
}

export function evalBody(body: Node[], env: Environment, newEnv: boolean = true): ComputedValue {
    let scope: Environment;

    if (newEnv) {
        scope = new Environment(env);
    } else {
        scope = env;
    }
    let result: ComputedValue = createNull();

    for (const stmt of body) {
        result = evaluate(stmt, scope);
    }

    return result;
}

export function evalTryCatchStatement(env: Environment, declaration?: TryCatch): ComputedValue {
    const try_env = new Environment(env);
    const catch_env = new Environment(env);

    try {
        return evalBody(declaration?.body!, try_env, false);
    } catch (e: any) {
        env.assignVariable("error", e);
        return evalBody(declaration?.alternate!, catch_env, false);
    }
}

export function evalComment(value: string): ComputedValue {
    return {
        type: "comment",
        value: value
    }
}