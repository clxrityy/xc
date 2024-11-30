

import Environment from "../environment/env.js";
import { Assignment, Identifier, Node } from "./ast.js";


export type ValueType = "null" | "number" | "boolean" | "object" | "native-function" | "string" | "function" | "list" | "assignment" | "identifier" | "property" | "comment";
export type ComputedValueType = null | number | boolean | object | Function | string | Map<string, Value> | Value[] | Assignment | Identifier;


export interface Value {
    type: ValueType;
};

export interface ComputedValue extends Value {
    value: ComputedValueType;
}

/**
 * Computed Values
 * =================
 *     -  Values that are computed at runtime.
 *    -  These values are not stored in the AST.
 *   -  They are created during the interpretation of the AST.
 */

// ----------------
/**
 * Null
 * ----------
 * Represents a null value.
 */

export interface NullValue extends ComputedValue {
    type: "null";
    value: null;
}

export function createNull(): NullValue {
    return {
        type: "null",
        value: null,
    }
}

// ----------------
/**
 * Boolean
 * ----------
 * Represents a boolean value.
 */

export interface BooleanValue extends ComputedValue {
    type: "boolean";
    value: boolean;
}

// By default, a boolean value is true.

export function createBoolean(b = true): BooleanValue {
    return {
        type: "boolean",
        value: b,
    }
}

// ----------------

/**
 * Number
 * ----------
 * Represents a numeric value.
 * -   Runtime value that has access to the raw native javascript number.
 */

export interface NumberValue extends ComputedValue {
    type: "number";
    value: number;
}

// By default, a number value is 0.
export function createNumber(n = 0): NumberValue {
    return {
        type: "number",
        value: n,
    }
}

// ----------------

/**
 * String
 * ----------
 * Represents a string value.
 */

export interface StringValue extends ComputedValue {
    type: "string";
    value: string;
}

// By default, a string value is an empty string.
export function createString(s = ""): StringValue {
    return {
        type: "string",
        value: s,
    }
}

// ----------------

/**
 * Object
 * ----------
 * Represents an object value.
 * -   Contains a map of properties.
 */

export interface ObjectValue extends ComputedValue {
    type: "object";
    properties: Map<string, ComputedValue>;
    name: string;
}

// ----------------

/**
 * Function call
 * ----------
 * Represents a function call.
 */

export type FunctionCall = (args: ComputedValue[], env: Environment) => ComputedValue;

/**
 * Native Function
 * ----------
 * Represents a native function value.
 * -   Contains a function that is native to the runtime.
 * -   Contains a reference to environment in which it was created.
 */

export interface NativeFunctionValue extends ComputedValue {
    type: "native-function";
    call: FunctionCall;
}

export function createNativeFunction(call: FunctionCall): NativeFunctionValue {
    return {
        type: "native-function",
        call: call,
    } as NativeFunctionValue;
}

// ----------------

/**
 * Function
 * ----------
 * Represents a function value.
 * -   Contains the function body.
 * -   Contains the function parameters.
 * -   Contains the function environment.
 */

export interface FunctionValue extends ComputedValue {
    type: "function";
    name: string;
    body: Node[];
    declarationEnv: Environment;
    parameters: string[];
}

// ----------------

/**
 * List
 * ----------
 * Represents a list value.
 * -   Contains a list of values.
 */

export interface ListValue extends ComputedValue {
    type: "list";
    value: ComputedValue[];
}

export function createList(): ListValue {
    return {
        type: "list",
        value: [],
    }
}