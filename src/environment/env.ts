import { Identifier, Member } from "../interpreter/ast.js";
import { ComputedValue, createNativeFunction, createNumber, ObjectValue } from "../interpreter/values.js";

export default class Environment {
    private parent?: Environment;
    private variables: Map<string, ComputedValue>;
    private constants: Set<string>;
    // public runtime: Runtime;

    public computedValues: Map<number, ComputedValue>

    constructor(parentEnv?: Environment) {
        this.parent = parentEnv;
        this.variables = new Map();
        this.constants = new Set();
        this.computedValues = new Map();
    }

    public declareVariable(name: string, value: ComputedValue, constant: boolean): ComputedValue {
        if (this.variables.has(name) && constant) {
            throw new Error(`Variable ${name} already declared`);
        }

        this.variables.set(name, value);

        if (constant) {
            this.constants.add(name);
        }

        return value;
    }

    public assignVariable(name: string, value: ComputedValue): ComputedValue {
        const env = this.resolve(name);

        if (env.constants.has(name)) {
            throw new Error(`Cannot reassign constant variable ${name}`);
        }

        env.variables.set(name, value);

        return value;
    }

    public lookupOrMutateObject(expr: Member, value?: ComputedValue, property?: Identifier) {
        let pastVal: any;

        if (expr.object.type === "Member") {
            pastVal = this.lookupOrMutateObject(expr.object as Member, value, (expr.object as Member).property as Identifier);
        } else {
            const name = (expr.object as Identifier).name;

            const env = this.resolve(name);

            pastVal = env.variables.get(name);
        }

        switch (pastVal.type) {
            case "object":
                const currentProp = (expr.property as Identifier).name;
                const prop = property ? property.name : currentProp;

                if (value) (pastVal as ObjectValue).properties.set(prop, value);

                if (currentProp) pastVal = ((pastVal as ObjectValue).properties.get(currentProp) as ComputedValue).value;

                return pastVal;

            case "list": {

            }
        }
    }

    public lookupVariable(name: string): ComputedValue {
        const env = this.resolve(name);

        const value = env.variables.get(name);

        if (value === undefined) {
            throw new Error(`Variable ${name} not declared`);
        }

        return value;
    }

    // private getComputedValue(type: ReturnType): ComputedValue {
    //     const value = this.runtime.getReturnValue(type);
        
    //     return {
    //         runtimeValue: value.runtimeValue,
    //         value: value.runtimeValue,
    //         type: value.type,
    //     }
    // }

    public resolve(name: string): Environment {
        if (this.variables.has(name)) {
            return this;
        }

        if (this.parent === undefined) {
            throw new Error(`Variable ${name} not declared`);
        }

        return this.parent.resolve(name);
    }
}