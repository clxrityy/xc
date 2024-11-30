#! /usr/bin/env node

import Converter from "./compiler/converter.js";
import Parser from "./interpreter/parser.js";

export default function run() {

    const argsv = process.argv;

    if (argsv.length < 3) {
        console.error("Usage: xc <file.xc>");
        process.exit(1);
    }
    
    const converter = new Converter(new Parser(), ...argsv);

    console.log(converter.convert());
}

run();