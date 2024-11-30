import Environment from "../environment/env.js";
import { evalAssignment, evalBinaryExpression, evalCallExpression, evalIdentifier, evalListExpression, evalMemberExpression, evalObjectExpression } from "../eval/expressions.js";
import { evalProgram } from "../eval/literals.js";
import { evalComment, evalIfStatement, evalTryCatchStatement, evalVariableDeclaration } from "../eval/statements.js";
import {
    Node,
    VariableDeclaration,
    FunctionDeclaration,
    Identifier,
    Numeric,
    StringLiteral,
    Boolean,
    Object,
    Call,
    Assignment,
    Binary,
    Program,
    Member,
    IfStatement,
    List,
    TryCatch,
} from "../interpreter/ast.js";
import { ComputedValue, NumberValue } from "../interpreter/values.js";

export function evaluate(node: Node, env: Environment): ComputedValue {
    switch (node.type) {
        case "Numeric":
            return {
                type: "number",
                value: (node as Numeric).value,
            } as NumberValue;
        case "Identifier":
            return evalIdentifier(node as Identifier, env);
        case "String":
            return {
                type: "string",
                value: (node as StringLiteral).value,
            };
        case "Boolean":
            return {
                type: "boolean",
                value: (node as Boolean).value,
            };
        case "Object":
            return evalObjectExpression(node as Object, env);
        case "Call":
            return evalCallExpression(node as Call, env);
        case "Assignment":
            return evalAssignment(node as Assignment, env);
        case "Binary":
            return evalBinaryExpression(node as Binary, env);
        case "Variable":
            return evalVariableDeclaration(node as VariableDeclaration, env);
        case "Function":
            return {
                type: "function",
                value: (node as FunctionDeclaration).body,
            };
        case "Program":
            return evalProgram(node as Program, env);
        case "Member":
            return evalMemberExpression(env, undefined, node as Member);
        case "IfStatement":
            return evalIfStatement(node as IfStatement, env);
        case "List":
            return evalListExpression(node as List, env);
        case "TryCatch":
            return evalTryCatchStatement(env, node as TryCatch);
        case "Comment":
            return evalComment(node.type);
        default:
            throw new Error(`Unknown AST Node: ${(node as any).type}`);
    }
}