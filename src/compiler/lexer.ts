export enum TokenType {
    // Literals
    Number,
    String,
    Identifier,

    // Keywords
    Var,
    Const,
    Function,
    If,
    Else,

    // Operators
    BinaryOperator,
    Equals,
    Colon,
    Comma,
    Dot,
    Semicolon,
    OpenParenthesis,
    CloseParenthesis,
    OpenBrace,
    CloseBrace,
    OpenBracket,
    CloseBracket,
    LessThan,
    GreaterThan,
    LessThanOrEqual,
    GreaterThanOrEqual,
    NotEqual,
    NotStrictEqual,
    Quote,
    SingleQuote,
    StrictEquals,
    And,
    Or,
    Ampersand,
    Exclamation,
    Ternary,

    // New line
    NL,

    // Comment
    Comment,

    // End of file
    EOF
}

/**
 * KEYWORDS
 * --------
 * A map of reserved keywords in the language.
 */
export const KEYWORDS: Record<string, TokenType> = {
    var: TokenType.Var,
    const: TokenType.Const,
    func: TokenType.Function,
    nl: TokenType.NL,
    if: TokenType.If,
    else: TokenType.Else,
}

/**
 * Token characters
 */

export const TOKEN_CHARS: Record<string, TokenType> = {
    "+": TokenType.BinaryOperator,
    "-": TokenType.BinaryOperator,
    "*": TokenType.BinaryOperator,
    "/": TokenType.BinaryOperator,
    "%": TokenType.BinaryOperator,
    "=": TokenType.Equals,
    "!=": TokenType.NotStrictEqual,
    "<": TokenType.LessThan,
    ">": TokenType.GreaterThan,
    "<=": TokenType.LessThanOrEqual,
    ">=": TokenType.GreaterThanOrEqual,
    ":": TokenType.Colon,
    ",": TokenType.Comma,
    ".": TokenType.Dot,
    ";": TokenType.Semicolon,
    "(": TokenType.OpenParenthesis,
    ")": TokenType.CloseParenthesis,
    "{": TokenType.OpenBrace,
    "}": TokenType.CloseBrace,
    "[": TokenType.OpenBracket,
    "]": TokenType.CloseBracket,
    '"': TokenType.Quote,
    "'": TokenType.SingleQuote,
    "&&": TokenType.And,
    "//": TokenType.Comment,
}

/**
 * Escape characters
 */
export const ESCAPED: Record<string, string> = {
    n: "\n",
    t: "\t",
    r: "\r",
}

/**
 * Reverse Token Type
 * ------------------
 * A map of token types to their string representation.
 * This is used for debugging purposes.
 */
const reverseTokenType: Record<number, string> = Object.keys(TokenType)
    .filter(key => typeof TokenType[key as keyof typeof TokenType] === "number")
    .reduce((obj, key) => {
        obj[TokenType[key as keyof typeof TokenType]] = key;
        return obj;
    }, {} as Record<number, string>);

/**
 * Token
 * -----
 * Represents a token in the source code.
 */

export interface Token {
    value: string; // The raw value as seen in the source code.
    type: TokenType; // The type of the token.
    raw: string; // The raw value as seen in the source code.
    toString: () => object;
}

/**
 * 
 * @param value 
 * @param type 
 * @param raw
 * @returns a token of a given type with a given value.
 */

// Returns a token of a given type and value
function token(value: string = "", type: TokenType, raw: string = value): Token {
    return { value, type, raw, toString: () => { return { value, type: reverseTokenType[type] } } };
}

// -----------------------------------------------------------------------------
function isAlpha(src: string, isFirstChar: boolean = false) {
    if (isFirstChar) {
        return /^[A-Za-z_]+$/.test(src);
    }
    return /^[A-Za-z0-9_]+$/.test(src);
}

function isSkippable(str: string) {
    return str === " " || str === "\n" || str === "\t" || str === "\r";
}

function isInt(str: string) {
    const c = str.charCodeAt(0);
    const bounds = ["0".charCodeAt(0), "9".charCodeAt(0)];
    return c >= bounds[0] && c <= bounds[1];
}

function getPreviousIndents(tokens: Array<Token>): Token[] {
    const reversed = [...tokens].reverse();
    const newTokens: Token[] = [];

    for (const token of reversed) {
        if (token.type == TokenType.Identifier
            || token.type == TokenType.Dot
            || token.type == TokenType.OpenBracket
            || token.type == TokenType.CloseBracket
            || (tokens[tokens.length - newTokens.length - 2] && tokens[tokens.length - newTokens.length - 2].type == TokenType.OpenBracket && token.type == TokenType.Number)
        ) {
            newTokens.push(token);
        } else {
            break;
        }
    }

    return newTokens.length > 0 ? newTokens.reverse() : [];
}

// -----------------------------------------------------------------------------

/**
 * Lexer
 * -----
 * The lexer is responsible for tokenizing the source code.
 */

export function tokenize(sourceCode: string): Token[] {
    const tokens = new Array<Token>();
    const src = sourceCode.split("");

    // produce tokens until the EOF is reached
    while (src.length > 0) {

        const char = src[0];

        const tokenType = TOKEN_CHARS[char];

        if (isInt(char) || (char == "-" && isInt(src[1]))) {
            let num = src.shift();
            let period = false;

            while (src.length > 0) {
                if (src[0] == "." && !period) {
                    period = true;
                    num += src.shift()!;
                } else if (isInt(src[0])) {
                    num += src.shift()!;
                } else break;
            }

            // append new numeric token
            tokens.push(token(num, TokenType.Number));
        } else {

            switch (char) {
                case "=":
                    src.shift();
                    if (src[0] == "=") {
                        src.shift();
                        tokens.push(token("==", TokenType.StrictEquals));
                    } else {
                        tokens.push(token("=", TokenType.Equals));
                    }
                    break;
                case "&":
                    src.shift();
                    if (src[0] == "&") {
                        src.shift();
                        tokens.push(token("&&", TokenType.And));
                    } else {
                        tokens.push(token("&", TokenType.Ampersand));
                    }
                    break;
                case "!":
                    src.shift();
                    if (String(src[0]) == "=") {
                        src.shift();
                        tokens.push(token("!=", TokenType.NotStrictEqual));
                    } else {
                        tokens.push(token("!", TokenType.Exclamation));
                    }
                    break;
                case '"': {
                    let str = "";
                    let raw = "";
                    src.shift();

                    let escaped = false;
                    while (src.length > 0) {
                        const key = src.shift();
                        raw += key;
                        if (key == "\\") {
                            escaped = !escaped;
                            if (escaped) continue;
                        } else if (key == '"') {
                            if (!escaped) break;
                            escaped = false;
                        } else if (escaped) {
                            escaped = false;
                            if (ESCAPED[key!]) {
                                str += ESCAPED[key!];
                                continue;
                            } else {
                                str += "\\";
                            }
                        }
                        str += key;
                    }

                    // append new string token
                    tokens.push(token(str, TokenType.String, raw.substring(0, raw.length - 1)));
                    break;
                }
                case "-":
                    if (src[1] == ">") {
                        src.shift();
                        src.shift();
                        tokens.push(token("->", TokenType.Ternary));
                        break;
                    } else if (src[1] != src[0]) {
                        const prevIdents = getPreviousIndents(tokens);
                        if (prevIdents == null && tokens[token.length - 1].type != TokenType.CloseParenthesis) {
                            tokens.push(token("0", TokenType.Number));
                            tokens.push(token(src.shift(), TokenType.BinaryOperator));
                            break;
                        }
                    }
                case "+":
                    if (src[1] == src[0]) {
                        const prevTokens =getPreviousIndents(tokens);
                        if (prevTokens != null) {
                            tokens.push(token("=", TokenType.Equals));
                            prevTokens.forEach(token => tokens.push(token));
                            tokens.push(token(src.shift(), TokenType.BinaryOperator));
                            tokens.push(token("1", TokenType.Number));
                            src.shift();
                            break;
                        }
                    }
                case "*":
                case "/":
                    if (src[1] == "/") {
                        tokens.push(token("//", TokenType.Comment));
                        while (src.length > 0 && src[0] != "\n") {
                            src.shift();
                        }
                        src.shift();
                        break;
                    }
                    if (src[1] == "=") {
                        const prevTokens = getPreviousIndents(tokens);
                        if (prevTokens == null) break;

                        tokens.push(token("=", TokenType.Equals));
                        prevTokens.forEach(token => tokens.push(token));
                        tokens.push(token(src.shift(), TokenType.BinaryOperator));
                        src.shift();
                        break;
                    } else if (src[0] == "/") {
                        if (src[1] == "*") {
                            let lastVal = "";

                            while (src.length > 0) {
                                const nextVal = src.shift();

                                if (lastVal == "*" && nextVal == "/") {
                                    break;
                                }

                                lastVal = nextVal!;
                            }
                            break;
                        } else if (src[1] == "/") {
                            do {
                                src.shift();
                            } while (src.length > 0 && (src[0] as string) != "\n");
                            src.shift();
                            break;
                        }
                    }
                default:

                    if (tokenType) {
                        tokens.push(token(src.shift(), tokenType));
                    } else if (isAlpha(char, true)) {
                        let indent = "";

                        indent += src.shift();

                        while (src.length > 0 && isAlpha(src[0])) {
                            indent += src.shift();
                        }

                        const reserved = KEYWORDS[indent];

                        if (typeof reserved == "number") {
                            tokens.push(token(indent, reserved));
                        } else {
                            tokens.push(token(indent, TokenType.Identifier));
                        }
                    } else if (isSkippable(src[0])) {
                        src.shift();
                    } else {
                        console.error(
                            "Unrecognized character in source code: ",
                            src[0].charCodeAt(0),
                            src[0]
                        );
                        process.exit(1);
                    }
                    break;
            }


        }

        // if (char == "(") {
        //     tokens.push(token(src.shift(), TokenType.OpenParenthesis));
        // } else if (char == ")") {
        //     tokens.push(token(src.shift(), TokenType.CloseParenthesis));
        // } else if (char == "{") {
        //     tokens.push(token(src.shift(), TokenType.OpenBrace));
        // } else if (char == "}") {
        //     tokens.push(token(src.shift(), TokenType.CloseBrace));
        // } else if (char == "[") {
        //     tokens.push(token(src.shift(), TokenType.OpenBracket));
        // } else if (char == "]") {
        //     tokens.push(token(src.shift(), TokenType.CloseBracket));
        // }

        // // BINARY OPERATORS
        // else if (
        //     char == "+" || char == "-" || char == "*" || char == "/" || char == "%" || char == "=="  || char == "!=" || char == "<" || char == ">" || char == "<=" || char == ">="
        // ) {
        //     tokens.push(token(src.shift(), TokenType.BinaryOperator));
        // }
        // // Conditional & Assignment tokens
        // else if (char == "=") {
        //     tokens.push(token(src.shift(), TokenType.Equals));
        // } else if (char == ":") {
        //     tokens.push(token(src.shift(), TokenType.Colon));
        // } else if (char == ",") {
        //     tokens.push(token(src.shift(), TokenType.Comma));
        // } else if (char == ".") {
        //     tokens.push(token(src.shift(), TokenType.Dot));
        // } else if (char == ";") {
        //     tokens.push(token(src.shift(), TokenType.Semicolon));
        // } else if (char == "<") { 
        //     tokens.push(token(src.shift(), TokenType.LessThan));
        // } else if (char == ">") {
        //     tokens.push(token(src.shift(), TokenType.GreaterThan));
        // } else if (char == "<=") {
        //     tokens.push(token(src.shift(), TokenType.LessThanOrEqual));
        // } else if (char == ">=") {
        //     tokens.push(token(src.shift(), TokenType.GreaterThanOrEqual));
        // }
        // else if (char == "!=") {
        //     tokens.push(token(src.shift(), TokenType.NotEqual));
        // } else if (char == "!==") {
        //     tokens.push(token(src.shift(), TokenType.NotStrictEqual));
        // } else if (char == '"') {
        //     tokens.push(token(src.shift(), TokenType.Quote));
        // } else if (char == "'") {
        //     tokens.push(token(src.shift(), TokenType.SingleQuote));
        // }

        // // Multichracter tokens, identifiers, keywords, etc.
        // else {
        //     if (isInt(char)) {
        //         let num = "";
        //         while (src.length > 0 && isInt(char)) {
        //             num += src.shift();
        //         }

        //         // append new numeric token
        //         tokens.push(token(num, TokenType.Number));
        //     }
        //     // Handle identifiers & keyword tokens
        //     else if (isAlpha(char)) {
        //         let indent = "";
        //         while (src.length > 0 && isAlpha(char)) {
        //             indent += src.shift();
        //         }

        //         // Check for reserved keywords
        //         const reserved = KEYWORDS[indent];
        //         // If value is not undefined then the identifier is recognized as a keyword
        //         if (typeof reserved == "number") {
        //             tokens.push(token(indent, reserved));
        //         } else {
        //             // Otherwise, it is a user-defined identifier
        //             tokens.push(token(indent, TokenType.Identifier));
        //         }
        //     } else if (isSkippable(char)) {
        //         // skip whitespace
        //         src.shift();
        //     }
        //     // TODO: Implement better errors and error recovery
        //     // handle unknown characters
        //     else {
        //         console.error(
        //             "Unrecognized character in source code: ",
        //             char.charCodeAt(0),
        //             char
        //         );
        //         process.exit(1);
        //     }
        // }
    }

    tokens.push(token("EndOfFile", TokenType.EOF));
    return tokens;
}