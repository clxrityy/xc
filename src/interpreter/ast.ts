// export class Program {
//     private source: string;
//     private body: [];
//     private env: {};

//     constructor(source: string) {
//         this.source = source;
//         this.body = [];
//         this.env = {};
//     }
// }

export type DeclarationType = "Variable" | "Function";
export type LiteralType = "Property" | "Numeric" | "String" | "Boolean" | "Object" | "List";
export type ExpressionType = "Binary" | "Assignment" | "Call" | "Member" | "Identifier" | LiteralType | "IfStatement" | "Function" | "TryCatch";
export type StatementType = "Program" | "Comment";

export type NodeType = | DeclarationType | ExpressionType | StatementType;

/**
 * Node
 * ----------
 * - The base interface for all nodes.
 * - Contains the type of the node.
 * - Contains the return type of the node.
 */
export interface Node {
    type: NodeType;
}

export interface Program extends Node {
    type: "Program";
    body: Node[];
}

export interface Comment extends Node {
    type: "Comment";
    value: string;
}

export interface Declaration extends Node {
    type: DeclarationType;
}

export interface Literal extends Expression {}

export interface Expression extends Node {
    type: ExpressionType;
}

export interface VariableDeclaration extends Declaration {
    type: "Variable";
    constant: boolean;
    identifier: string;
    value?: Expression;
}

export interface FunctionDeclaration extends Declaration {
    type: "Function";
    identifier: string;
    body: Node[];
    params: string[];
    value?: Expression;
    name: string;
}

export interface IfStatement extends Expression {
    type: "IfStatement";
    test: Expression;
    body: Node[];
    alternate?: Node[];
}

export interface TryCatch extends Expression {
    type: "TryCatch";
    body: Node[];
    alternate: Node[];
}

export interface Property extends Literal {
    type: "Property";
    key: string;
    value: Expression;
}

export interface Identifier extends Expression {
    type: "Identifier";
    name: string;
}

export interface Numeric extends Literal {
    type: "Numeric";
    value: number;
}

export interface StringLiteral extends Literal {
    type: "String";
    value: string;
}

export interface Boolean extends Literal {
    type: "Boolean";
    value: boolean;
}

export interface Object extends Literal {
    type: "Object";
    properties: Property[];
}

export interface List extends Literal {
    type: "List";
    values: Array<Expression>;
}

export interface Assignment extends Expression {
    type: "Assignment";
    assignee: Expression;
    value: Expression;
}

export interface Binary extends Expression {
    type: "Binary";
    operator: BinaryOperator;
    left: Expression;
    right: Expression;
}

export type BinaryOperator = "+" | "-" | "*" | "/" | "%" | "==" | "!==" | "!=" | ">" | "<" | ">=" | "<=" | "&&" | "|";

export interface Call extends Expression {
    type: "Call";
    callee: Expression;
    args?: Expression[];
}

export interface Member extends Expression {
    type: "Member";
    object: Expression;
    property: Expression;
    computed: boolean;
    name: string;
}