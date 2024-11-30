import { ComputedValue, createString } from "../interpreter/values.js";
import { Program } from "../interpreter/ast.js";
import Environment from "../environment/env.js";
import { createGlobalEnvironment } from "../environment/global.js";
import { evaluate } from "./evaluate.js";
import Parser from "../interpreter/parser.js";
import { argv } from "process";
import fs from "fs";
import path from "path";



export default class Converter {
    // private values: Map<ReturnType, ComputedValue>;
    private parser: Parser;
    public program: Program;
    private env: Environment;
    public input: string = "";
    public args: string[];
    
    public convertedValues: Map<string, ComputedValue>;

    constructor(parser: Parser, ...args: typeof argv) {
        this.parser = parser;
        this.convertedValues = new Map();
        this.args = args;
        this.env = this.getEnvironment();
        this.program = this.buildProgram();
        this.mapValues();
    }

    private mapValues(): Map<string, ComputedValue> {
        this.program.body.forEach(node => {
            this.convertedValues.set(node.type, evaluate(node, this.env));
        });

        return this.convertedValues;
    }

    private parseFile(...args: typeof argv): string {
        if (!args[2] || args[2] === undefined) {
            throw new Error("Usage: xc <file.xc>");
        }
        if (!args[2].endsWith(".xc")) {
            throw new Error("Invalid file extension. Please provide a .xc file.");
        }

        const filePath = path.resolve(args[2]);

        if (!filePath) {
            throw new Error("File not found.");
        }
        
        try {
            this.input = fs.readFileSync(filePath, "utf-8");
            return this.input;
        } catch (e: any) {
            throw new Error(e.message || e);
        }
    }

    private getEnvironment(): Environment {
        this.env = createGlobalEnvironment(this.args[2], this.args.map(value => createString(value)));

        return this.env;
    }

    private buildProgram(): Program {
        this.program = this.parser.produceAST(this.parseFile(...this.args));

        return this.program;
    }

    public convert(): ComputedValue {

        return evaluate(this.program, this.env);
    }
}