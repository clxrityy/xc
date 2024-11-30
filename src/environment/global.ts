import fs from 'fs';

import { ComputedValue, createNativeFunction, StringValue } from "../interpreter/values.js";
import Environment from "./env.js";
import { timeFunction } from "./functions/util.js";
import Parser from '../interpreter/parser.js';
import { evaluate } from '../compiler/evaluate.js';

export function createGlobalEnvironment(filePath: string = __dirname, args: ComputedValue[]): Environment {
    const env = new Environment();

    // utils
    function localPath(path: string) {
        if (path.startsWith(".")  || path.includes(":")) {
            path = filePath + path;
        }

        return path;
    }

    // Create default global environment

    /**
     * The global environment is the top-level environment in the interpreter.
     * It contains all the built-in functions and variables that are available to the user.
     */

    /**
     * VARIABLES
     * ------------
     */
    env.declareVariable("true", {type: "boolean", value: true}, true);
    env.declareVariable("false", {type: "boolean", value: false}, true);
    env.declareVariable("null", {type: "null", value: null}, true);

    /**
     * FUNCTIONS
     * ------------
     */
    // time()
    env.declareVariable("time", createNativeFunction((args) => timeFunction(args, env)), true);

    // import()
    env.declareVariable("import", createNativeFunction((args) => {
        const path = localPath((args.shift() as StringValue).value);

        let input;

        if (path.endsWith(".xc")) {
            input = fs.readFileSync(path, "utf-8");
        } else throw new Error("Cannot import non-XC files");

        const parser = new Parser();
        const program = parser.produceAST(input);

        return evaluate(program, env);
    }), true);


    return env;
}
