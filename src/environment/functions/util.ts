import { ComputedValue, createNumber } from "../../interpreter/values.js";
import Environment from "../env.js";

export function timeFunction(_args: ComputedValue[], _env: Environment) {
    const date = new Date();

    return createNumber(date.getTime());
}