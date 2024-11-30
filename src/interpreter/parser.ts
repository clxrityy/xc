import {
    Node,
    Expression,
    Call,
    Identifier,
    Numeric,
    StringLiteral,
    // Boolean,
    Binary,
    Assignment,
    Object,
    Property,
    FunctionDeclaration,
    VariableDeclaration,
    // Declaration,
    // Literal,
    Program,
    Member,
    IfStatement,
    List,
    TryCatch,
} from "./ast.js";

import { Token, tokenize, TokenType } from "../compiler/lexer.js";

export default class Parser {
    private tokens: Token[] = [];

    private lineCounter: number = 1;
    private column: number = 0;
    private nonNLLine: number = 0;
    private nonNLColumn: number = 0;
    private lastNonNLLine: number = 0;
    private lastNonNLColumn: number = 0;

    private shift(): Token {
        const token = this.tokens.shift() as Token;

        switch (token.type) {
            case TokenType.NL:
                this.lineCounter++;
                break;
            case TokenType.String: {
                const split = token.raw.split("\n");
                this.lineCounter += split.length - 1;

                if (split.length > 1) {
                    this.column = split[split.length - 1].length + 1; // +1 for the quote
                }
            }

            default:
                this.lastNonNLLine = this.nonNLLine;
                this.nonNLLine = this.lineCounter;
                if(token.type != TokenType.String && (token.type != TokenType.Identifier || token.value != "finishExit")) {
                    this.lastNonNLLine = this.nonNLLine;
                    this.nonNLLine = this.lineCounter;
                    this.column += token.value.length;
                    this.lastNonNLColumn = this.nonNLColumn;
                    this.nonNLColumn = this.column;
                }
                this.lastNonNLColumn = this.nonNLColumn;
                this.nonNLColumn = this.column;
                break;
        }

        return token;
    }

    /**
     * Determines if it's the end of the file.
     */
    private not_eof(): boolean {
        return this.tokens[0].type !== TokenType.EOF;
    }

    /**
     * Returns the current token.
     */
    private current(): Token {
        let token = this.tokens[0] as Token;

        while (token.type == TokenType.NL) {
            this.shift();
            token = this.tokens[0] as Token;
        }

        return token;
    }

    /**
     * Consumes the current token.
     */
    private consume(): Token {
        let prev;
        do {
            prev = this.shift();
        } while (prev.type == TokenType.NL);

        return prev;
    }

    /**
     * Expects a token of a certain type.
     * @param type The type of token to expect.
     * @param error The error message to display if the token is not of the expected type.
     * @returns The token if it's of the expected type.
     */

    private expect(type:TokenType, error:string): Token {
        const prev = this.consume();
        if (!prev || prev.type !== type) {
            console.error(`Parsing error:\n(Line: ${this.lastNonNLLine}, Col: ${this.lastNonNLColumn + 1})\n`, error, prev, "Expected: ", type);
            process.exit(1);
        }

        return prev;
    }

    public produceAST(sourceCode: string): Program {
        this.tokens = tokenize(sourceCode);
        const program: Program = {
            type: "Program",
            body: [],
            
        }

        while (this.not_eof()) {
            program.body.push(this.parseNode());
        }

        return program;
    }

    private parseNode(): Node {
        switch(this.current().type) {
            case TokenType.Function:
                return this.parseFunctionDeclaration();
            case TokenType.Const:
                return this.parseVariableDeclaration();
            case TokenType.Var:
                return this.parseVariableDeclaration();
            case TokenType.NL:
                this.current();
                return this.parseNode();
            case TokenType.If:
                return this.parseIfStatement();
            case TokenType.Comment:
                return this.parseComment();
            default:
                return this.parseExpression();
        }
    }

    parseComment(): Node {
        this.expect(TokenType.Comment, "Expected comment");

        if (this.current().type != TokenType.NL) {
            this.consume();
        }

        return {
            type: "Comment",
            value: this.consume().value,
        } as Node;
    }

    parseFunctionDeclaration(): FunctionDeclaration {
        this.consume(); // Consume the function token

        const name = this.expect(TokenType.Identifier, "Expected function name").value;

        const args = this.parseArguments();
        const params: string[] = [];

        for (const arg of args) {
            if (arg.type !== "Identifier") {
                throw "Function parameters must be identifiers";
            }

            params.push((arg as Identifier).name);
        }

        this.expect(TokenType.OpenBrace, "Expected opening brace");

        const body: Node[] = [];

        while (this.current().type !== TokenType.EOF && this.current().type !== TokenType.CloseBrace) {
            body.push(this.parseNode());
        }

        this.expect(TokenType.CloseBrace, "Expected closing brace");

        return {
            type: "Function",
            identifier: name,
            params,
            body,
        } as FunctionDeclaration;
    }

    
    parseVariableDeclaration(): VariableDeclaration { 
        const isConstant = this.consume().type == TokenType.Const;
        const identifier = this.expect(TokenType.Identifier, "Expected identifier").value;

        if (this.current().type == TokenType.Semicolon) {
            this.consume();

            if (isConstant) {
                throw "Constant variable must be initialized";
            }

            return {
                type: "Variable",
                identifier: identifier,
                constant: false,
                value: undefined,
            } as VariableDeclaration;
        }

        this.expect(TokenType.Equals, "Expected equals sign");

        const declaration = {
            type: "Variable",
            value: this.parseExpression(),
            identifier: identifier,
            constant: isConstant,
        } as VariableDeclaration;

        if (this.current().type == TokenType.String) {
            this.consume();
        }

        this.expect(TokenType.Semicolon, "Expected semicolon");

        return declaration;
    }

    parseBlockStatement(): Node[] {
        this.expect(TokenType.OpenBrace, "Expected opening brace");
        const body: Node[] = [];

        while (this.not_eof() && this.current().type !== TokenType.CloseBrace) {
            const stmt = this.parseNode();
            body.push(stmt);
        }

        this.expect(TokenType.CloseBrace, "Expected closing brace");

        return body;
    }

    parseIfStatement(): IfStatement {
        this.consume();

        this.expect(TokenType.OpenParenthesis, "Expected opening parenthesis");

        const test = this.parseExpression();

        this.expect(TokenType.CloseParenthesis, "Expected closing parenthesis");

        const body = this.parseBlockStatement();

        let altnernate: Node[] = [];

        if (this.current().type == TokenType.Else) {
            this.consume();
            
            if (this.current().type == TokenType.If) {
                altnernate = [this.parseIfStatement()];
            } else {
                altnernate = this.parseBlockStatement();
            }
        }

        return {
            type: "IfStatement",
            test,
            body,
            alternate: altnernate,
        } as IfStatement;
    }


    private parseExpression(): Expression {
        const data = this.parseAssignmentExpression();

        if (this.current().type == TokenType.Ternary) {
            if (data.type != "Binary" && data.type != "Identifier") {
                throw "Expected binary or identifier following ternary operator";
            }

            this.consume();

            const expr = this.parseExpression();

            if (expr.type != "Binary" || (expr as Binary).operator != "|") {
                throw new Error("Bar (\"|\") expected following left-hand side of ternary operator");
            }

            const ifStmt = {type: "IfStatement", test: data, body: [(expr as Binary).left], alternate: [(expr as Binary).right]} as IfStatement;

            return {
                type: "Call",
                args: [],
                callee: {type: "Function", args: [], callee: {type: "Function", params: [], name: "<anon>", body: [ifStmt] }},
            } as Call;
        }

        return data;
    }

    private parseAssignmentExpression(): Expression {
        const left = this.parseObjectExpression();

        if (this.current().type == TokenType.Equals) {
            this.consume();

            const right = this.parseExpression();

            return {
                type: "Assignment",
                assignee: left,
                value: right,
            } as Assignment;
        }

        return left;
    }

    private parseAndStatement(): Expression {
        let left = this.parseAdditiveExpression();

        if (["&&", "||"].includes(this.current().value)) {
            const operator = this.consume().value;
            const right = this.parseAdditiveExpression();

            left = {
                type: "Binary",
                operator,
                left,
                right,
            } as Binary;

            while (this.current().type == TokenType.And || this.current().type == TokenType.Or) {
                left = {
                    type: "Binary",
                    operator: this.consume().value,
                    left,
                    right: this.parseExpression()
                } as Binary
            }
        }

        return left;
    }

    private parseTryCatchExpression(): Expression {
        if (this.current().type != TokenType.Identifier || this.current().value != "try") {
            return this.parseAndStatement();
        }

        this.consume();

        const body = this.parseBlockStatement();

        if (this.current().type != TokenType.Identifier || this.current().value != "catch") {
            throw "Expected catch block";
        }

        this.consume();

        const alternate = this.parseBlockStatement();

        return {
            type: "TryCatch",
            body,
            alternate,
        } as TryCatch;
    }

    private parseObjectExpression(): Expression {
        if (this.current().type !== TokenType.OpenBrace) {
            return this.parseListExpression();
        }

        this.consume();

        const properties = new Array<Property>();

        while (this.not_eof() && this.current().type != TokenType.CloseBrace) {
            const key = this.expect(TokenType.Identifier, "Expected identifier").value;

            if (this.current().type == TokenType.Comma) {
                this.consume();
                properties.push({ key, type: "Property"} as Property);
                continue;
            } else if (this.current().type == TokenType.CloseBrace) {
                properties.push({ key, type: "Property"} as Property);
                continue;
            }

            this.expect(TokenType.Colon, "Expected colon following identifier in object property");

            const value = this.parseExpression();

            properties.push({ type: "Property", value, key} as Property);

            if (this.current().type !== TokenType.CloseBrace) {
                this.expect(TokenType.Comma, "Expected comma");
            }
        }

        this.expect(TokenType.CloseBrace, "Expected closing brace");

        return {
            type: "Object",
            properties,
        } as Object;
    }

    private parseListExpression(): Expression {
        if (this.current().type !== TokenType.OpenBracket) {
            return this.parseTryCatchExpression();
        }

        this.consume();

        const values = new Array<Expression>();

        while (this.not_eof() && this.current().type != TokenType.CloseBracket) {
            values.push(this.parseExpression());

            if (this.current().type !== TokenType.CloseBracket) {
                this.expect(TokenType.Comma, "Expected comma");
            }
        }

        this.expect(TokenType.CloseBracket, "Expected closing bracket");
        return { type: "List", values } as List;
    }

    private parseAdditiveExpression(): Expression {
        let left = this.parseMultiplicativeExpression();

        while (this.current().value == "+" || this.current().value == "-") {
            const operator = this.consume().value;
            const right = this.parseMultiplicativeExpression();

            left = {
                type: "Binary",
                operator: operator,
                left,
                right,
            } as Binary;
        }

        return left;
    }

    private parseMultiplicativeExpression(): Expression {
        let left = this.parseCallMemberExpression();

        while (this.current().value == "*" || this.current().value == "/" || this.current().value == "%") {
            const operator = this.consume().value;
            const right = this.parseCallMemberExpression();

            left = {
                type: "Binary",
                operator: operator,
                left,
                right,
            } as Binary;
        }

        return left;
    }

    private parseCallMemberExpression(): Expression {
        const member = this.parseMemberExpression();

        if (this.current().type == TokenType.OpenParenthesis) {
            return this.parseCallExpression(member);
        }

        return member;
    }

    private parseCallExpression(caller: Expression): Expression {
        let callExpression: Expression = {
            type: "Call",
            callee: caller,
            args: this.parseArguments(),
        } as Call;

        if (this.current().type == TokenType.OpenParenthesis) {
            callExpression = this.parseCallExpression(callExpression);
        }

        return callExpression;
    }

    private parseArguments(): Expression[] {
        this.expect(TokenType.OpenParenthesis, "Expected opening parenthesis");

        const args = this.current().type == TokenType.CloseParenthesis ? [] : this.parseArgumentsList();

        this.expect(TokenType.CloseParenthesis, "Expected closing parenthesis");

        return args;
    }

    private parseArgumentsList(): Expression[] {
        const args = [this.parseAssignmentExpression()];

        while (this.current().type == TokenType.Comma && this.consume()) {
            args.push(this.parseAssignmentExpression());
        }

        return args;
    }

    private parseMemberExpression(): Expression {
        let object = this.parsePrimaryExpression();

        while (this.current().type == TokenType.Dot || this.current().type == TokenType.OpenBracket) {
            const operator = this.consume();
            let property: Expression;
            let computed: boolean;

            if (operator.type == TokenType.Dot) {
                computed = false;
                property = this.parsePrimaryExpression();

                if (property.type !== "Identifier") {
                    throw `Expected identifier, got ${property.type}`;
                }
            } else {
                computed = true;

                property = this.parseExpression();

                this.expect(TokenType.CloseBracket, "Expected closing bracket");
            }

            object = {
                type: "Member",
                object: object,
                property,
                computed,
            } as Member;
        }

        return object;
    }

    private parsePrimaryExpression(): Expression {
        const currentType = this.current().type;

        switch (currentType) {
            case TokenType.Identifier:
                return {
                    type: "Identifier",
                    name: this.consume().value,
                } as Identifier;
            case TokenType.Number:
                return {
                    type: "Numeric",
                    value: parseFloat(this.consume().value),
                } as Numeric;
            case TokenType.String:
                return {
                    type: "String",
                    value: this.consume().value,
                } as StringLiteral;
            case TokenType.OpenParenthesis:
                this.consume();
                const value = this.parseExpression();
                this.expect(TokenType.CloseParenthesis, "Expected closing parenthesis");
                return value;
            default:
                console.error("Parsing error: Unexpected token", this.current());
                process.exit(1);
        }
    }
}