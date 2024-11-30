# Changelog

- [v0](#v0)
    - [0.0](#00x)
    - **Development**
        - [0.0.1](#001)
        - [0.0.2](#002)
        - [0.0.3](#003)
        - [0.0.4](#004)
        - [0.0.5](#005)
        - [0.0.6](#006)
    - [0.4] (#04x)
        - **It works**
    - [0.6](#06x)
        - [0.6.4](#064)
        - [0.6.6](#066)

  

# v0

## 0.0.x 

- The development period
- Building the language logic and parsing/interpretation features in TypeScript

##### Usage:
```zsh
xc <file.xc>
```

### 0.0.1

> The _project structure troubles_ arch

- Initialized project with simple TypeScript development dependencies:
```json
"devDependencies": {
    "@types/node": "^22.9.2",
    "ts-node": "^10.9.2",
    "typescript": "^5.7.2"
}
```

- And scripts:

```json
"scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "test": "jest",
    "lint": "eslint src/**/*.ts",
    "clean": "rm -rf dist",
    "deploy": "pnpm clean && pnpm test && pnpm build && npm publish"
},
```

- Came across a known issue with [ts-node](https://www.npmjs.com/package/ts-node)

```sh
TypeError: Unknown file extension ".ts"
    at Object.getFileProtocolModuleFormat [as file:] (node:internal/modules/esm/get_format:218:9)
    at defaultGetFormat (node:internal/modules/esm/get_format:244:36)
    at defaultLoad (node:internal/modules/esm/load:122:22)
    at async ModuleLoader.loadAndTranslate (node:internal/modules/esm/loader:479:32)
    at async ModuleJob._link (node:internal/modules/esm/module_job:112:19) 
    {
        code: 'ERR_UNKNOWN_FILE_EXTENSION'
    }
```

- Found a solution [here](https://github.com/TypeStrong/ts-node/issues/2100#issuecomment-2275983496)
- Changed the script:
```json
"scripts": {
    "dev": "node --no-warnings=ExperimentalWarning --loader ts-node/esm src/index.ts",
}
```
> Hopefully there will be a better solution for running this development environment in the future


### 0.0.2

- Defined a lot of the boilerplate AST with lots of comments
    - Utilized a lot of information from [this example](https://github.com/tlaceby/guide-to-interpreters-series/blob/main/ep10-native-functions/frontend/ast.ts)
    - The interfaces/types are defining the types of every interaction/computed value within `.xc` programs

### 0.0.3

- Began the `runtime/` functionality
    - Set up the **environment**
    - Set up interfaces for values
- New files: `runtime/environment.ts` & `runtime/environment.ts`

### 0.0.4

- Finished the interpreter evaluator
    - Set up evaluations for expressions and statements
    - Created the `evaluate()` function within the interpreter
- New files: `eval/expressions.ts`, `eval/statements.ts`, & `interpreter/evaluate.ts`

### 0.0.5

- Finished the **lexer**
    - Defined token types
    - Set `KEYWORDS`:
        - Currently only `var` & `const`
    - Utility functions for parsing through the source code
    - Implemented `tokenize()` function as the main lexer func.
- New files: `interpreter/lexer.ts`

### 0.0.6

- Started the **parser**
    - Classes with numerous functions that parse specific expressions/statements
        - Variable declaration
        - Assignment
        - Object expressions
        - Additive & multiplicitve expressions
        - A couple pre-defined functions
            - `time()`
            - `print()`
- New files: `interpreter/parser.ts`

---

## 0.4.x

- Replaced scripts to be utilizing `bun`.
    - Removed `ts-node` as a development dependency.
- Completely refactored the code
    - I understand it better now

##### Future release:
- `if` statements
- Better parsing for function bodies
    - Consider the *scope* of the function as it's own environment
- `for` loops
- `try/catch` blocks
- Array (list) expressions
- More built in functions
    - And better functionality for implementing them

## 0.6.x

- Implemented `if` & `else`
    - **Returns null atm**
- Changed functionality for parsing function body
- Removed `Runtime` as an involved class/file
    - wtf was i doing

### 0.6.4

- Implemented `try`/`catch` blocks

**Notable issues:**
- `const` doesn't work
- functions are a bit confusing

### 0.6.6

- Implemented `import`
- Added examples
- Implemented comments `//`
- **Coming in next versions:**
    - Output response to json, yaml, etc.
        - Leading to the implementation of reading the response by other languages
    - Better *func*tionality for functions. 
        - More useful built in functions too, at that.