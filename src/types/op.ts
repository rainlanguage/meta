// specify the version of the meta in the following line
// version 0.0.0

import Ajv, { ValidateFunction } from "ajv";
import { decodeCborMap, toOpMeta } from "../utils";


const NamePattern = /^[a-z][0-9a-z-]*$/;

/**
 * @title Opcode Metadata
 * @description Schema for opcodes metadata used by RainLang.
*/
export type OpMeta = {
    /**
     * @title Opcode Name
     * @description The primary word used to identify the opcode.
     * @pattern ^[a-z][0-9a-z-]*$
     */
    name: string;
    /**
     * @title Opcode Description
     * @description Describes what the opcode does briefly.
     */
    desc: string;
    /**
     * @title Opcode Operand
     * @description Data required in order to calculate and format the operand.
     */
    operand: OperandMeta;
    /**
     * @title Opcode Inputs
     * @description Data required to specify the inputs of the opcode. 0 for opcodes with no input, for opcodes with constant number of inputs, the length of "parameters" array defines the number of inputs and for opcodes with dynamic number of inputs, "bits" field must be specified which determines this opcode has dynamic inputs and number of inputs will be derived from the operand bits with "computation" field applied if specified.
     */
    inputs: InputMeta;
    /**
     * @title Opcode Outputs
     * @description Data required to specify the outputs of the opcode. An integer specifies the number of outputs for opcodes with constants number of outputs and for opcodes with dynamic outputs the "bits" field will determine the number of outputs with "computation" field applied if specified.
     */
    outputs: OutputMeta;
    /**
     * @title Opcode Aliases
     * @description Extra word used to identify the opcode.
     */
    aliases?: StringArray[];
}

/**
 * @public The namespace provides functionality to type check
 */
export namespace OpMeta {
    /**
     * @public Method to type check OpMeta
     * @param value - The value to typecheck
     */
    export function is(value: any): value is OpMeta {
        return typeof value === "object"
            && value !== null
            && typeof value.name === "string"
            && NamePattern.test(value.name)
            && typeof value.desc === "string"
            && OperandMeta.is(value.operand)
            && InputMeta.is(value.inputs)
            && OutputMeta.is(value.outputs)
            && (
                typeof value.aliases === "undefined" || (
                    Array.isArray(value.aliases)
                    && value.aliases.length > 0
                    && value.aliases.every((v: any) => 
                        typeof v === "string"
                        && NamePattern.test(v)
                    )
                )
            );
    }

    /**
     * @public Method to type check array of OpMeta
     * @param value - The value to typecheck
     */
    export function isArray(value: any): value is OpMeta[] {
        return Array.isArray(value) && value.every(v => OpMeta.is(v));
    }

    /**
     * @public Method to validate against OpMeta schema
     * @param value - The value to check
     * @param validator - The validator, either the schema as object or ValidatorFunction
     */
    export function schemaCheck(value: any, validator: object | ValidateFunction): value is OpMeta {
        if (typeof validator === "function") return validator(value);
        else return new Ajv().compile(validator)(value);
    }

    /**
     * @public Method to validate against OpMeta schema for an array
     * @param value - The value to check
     * @param schema - The opmeta schema
     */
    export function schemaCheckArray(value: any, schema: object): value is OpMeta[] {
        const validator = new Ajv().compile(schema);
        return Array.isArray(value) && value.every((v: any) => OpMeta.schemaCheck(v, validator));
    }

    /**
     * @public Method to get array of OpMeta object from cbor map
     * @param map - The cbor map
     */
    export function get(map: Map<any, any>): OpMeta[] {
        const opmetaStr = decodeCborMap(map);
        if (typeof opmetaStr !== "string") throw new Error("corrupt op meta");
        return toOpMeta(opmetaStr);
    }
}

/** 
 * @public Data type of opcode's inputs that determines the number of inputs an opcode has and provide information about them
 */
export type InputMeta = Zero | InputArgs

/**
 * @public The namespace provides functionality to type check
 */
export namespace InputMeta {
    /**
     * @public Method to type check InputMeta
     * @param value - The value to typecheck
     */
    export function is(value: any): value is InputMeta {
        return value === 0 || InputArgs.is(value);
    }
}

/**
 * @public Data type for input argguments
 */
export type InputArgs = {
    /**
     * @title Parameters
     * @description 
     * Data type for opcode's inputs parameters, the length determines the number of inputs for constant (non-computed) inputs.
     */
    parameters: {
        /**
         * @title Input Parameter Name
         * @description Name of the input parameter.
         * @pattern ^[a-z][0-9a-z-]*$
         */
        name: string;
        /**
         * @title Input Parameter Description
         * @description Description of the input parameter.
         */
        desc?: string;
        /**
         * @title Parameter Spread
         * @description 
         * Specifies if an argument is dynamic in length, default is false, so only needs to be defined if an argument is spread.
         */
        spread?: boolean;

    }[]
    /**
     * @title Inputs-Allocated Operand Bits
     * @description 
     * Specifies bits of the operand allocated for number of inputs. Determines the number of inputs for a computed opcode inputs. Required only for computed (non-constant) inputs.
     */
    bits?: [BitInteger, BitInteger];
    /**
     * @title Inputs-Allocated Operand Bits Computation
     * @description 
     * Specifies any arithmetical operation that will be applied to the value of the extracted operand bits. The "bits" keyword is reserved for accessing the exctraced value, example: "(bits + 1) * 2". Required only for computed (non-constant) inputs.
     */
    computation?: string;
}

/**
 * @public The namespace provides functionality to type check
 */
export namespace InputArgs {
    /**
     * @public Method to type check InputArgs
     * @param value - The value to typecheck
     */
    export function is(value: any): value is InputArgs {
        return typeof value === "object"
            && value !== null
            && Array.isArray(value.parameters)
            && value.parameters.every((v: any) => 
                typeof v === "object"
                && v !== null
                && typeof v.name === "string"
                && NamePattern.test(v.name)
                && (typeof v.desc === "string" || typeof v.desc === "undefined")
                && (typeof v.spread === "boolean" || typeof v.spread === "undefined")
            )
            && (
                typeof value.bits === "undefined" || (
                    Array.isArray(value.bits)
                    && value.bits.length === 2
                    && value.bits.every((v: any) => 
                        typeof v === "number"
                        && !isNaN(v)
                        && Number.isInteger(v)
                        && v >= 0
                        && v <= 15
                    )
                )
            )
            && (
                typeof value.computation === "undefined"
                || typeof value.computation === "string"
            );
    }
}

/** 
 * @public Data type of opcode's outputs that determines the number of outputs an opcode has and provide information about them
 */
export type OutputMeta = Integer | ComputedOutput

/**
 * @public The namespace provides functionality to type check
 */
export namespace OutputMeta {
    /**
     * @public Method to type check OutputMeta
     * @param value - The value to typecheck
     */
    export function is(value: any): value is OutputMeta {
        return (typeof value === "number" && Number.isInteger(value) && value >= 0)
            || ComputedOutput.is(value);
    }
}

/**
 * @public Data type for computed output
 */
export type ComputedOutput = {
    /**
     * @title Outputs-Allocated Operand Bits
     * @description 
     * Specifies bits of the operand allocated for number of outputs. Determines the number of outputs for a computed opcode outputs. Required only for computed (non-constant) outputs.
     */
    bits: [BitInteger, BitInteger];
    /**
     * @title Outputs-Allocated Operand Bits Computation
     * @description 
     * Specifies any arithmetical operation that will be applied to the value of the extracted operand bits. The "bits" keyword is reserved for accessing the exctraced value, example: "(bits + 1) * 2". Required only for computed (non-constant) outputs.
     */
    computation?: string;
}

/**
 * @public The namespace provides functionality to type check
 */
export namespace ComputedOutput {
    /**
     * @public Method to type check ComputedOutput
     * @param value - The value to typecheck
     */
    export function is(value: any): value is ComputedOutput {
        return typeof value === "object"
            && value !== null
            && (
                Array.isArray(value.bits)
                && value.bits.length === 2
                && value.bits.every((v: any) => 
                    typeof v === "number"
                    && !isNaN(v)
                    && Number.isInteger(v)
                    && v >= 0
                    && v <= 15
                )
            )
            && (
                typeof value.computation === "undefined"
                || typeof value.computation === "string"
            );
    }
}

/** 
 * @public Data type of operand arguments, used only for non-constant operands
 */
export type OperandMeta = Zero | OperandArgs 

/**
 * @public The namespace provides functionality to type check
 */
export namespace OperandMeta {
    /**
     * @public Method to type check OperandMeta
     * @param value - The value to typecheck
     */
    export function is(value: any): value is OperandMeta {
        return value === 0 || OperandArgs.is(value);
    }
}

/**
 * @public Data type for computed operand that consists of some arguments
 * @minItems 1
 */
export type OperandArgs = {
    /**
     * @title Allocated Operand Bits
     * @description Specifies the bits to allocate to this operand argument.
     */
    bits: [BitInteger, BitInteger];
    /**
     * @title Operand Argument Name
     * @description 
     * Name of the operand argument. Argument with the name of "inputs" is reserved so that it wont be be typed inside <> and its value needed to construct the operand will be the number of items inside the opcode's parens (computation will apply to this value if provided).
     * @pattern ^[a-z][0-9a-z-]*$
     */
    name: "inputs" | string;
    /**
     * @title Operand Argument Description
     * @description Description of the operand argument.
     */
    desc?: string;
    /**
     * @title Allocated Operand Bits Computation
     * @description 
     * Specifies any arithmetical operation that needs to be applied to the value of this operand argument. It will apply to the value before it be validated by the provided range. The "arg" keyword is reserved for accessing the value of this operand argument, example: "(arg + 1) * 2".
     */
    computation?: string;
    /**
     * @title Operand Argument Range
     * @description 
     * Determines the valid range of the operand argument after computation applied. For example an operand argument can be any value between range of 1 - 10: [[1, 10]] or an operand argument can only be certain exact values: [[2], [3], [9]], meaning it can only be 2 or 3 or 9.
     */
    validRange?: ([LengthInteger] | [LengthInteger, LengthInteger])[];
}[]

/**
 * @public The namespace provides functionality to type check
 */
export namespace OperandArgs {
    /**
     * @public Method to type check OperandArgs
     * @param value - The value to typecheck
     */
    export function is(value: any): value is OperandArgs {
        return Array.isArray(value)
            && value.length > 0
            && value.every((e: any) => 
                typeof e === "object"
                && e !== null
                && typeof e.name === "string"
                && NamePattern.test(e.name)
                && ( typeof e.desc === "string" || typeof e.desc === "undefined")
                && ( typeof e.computation === "string" || typeof e.computation === "undefined")
                && (
                    typeof e.bits === "undefined" || (
                        Array.isArray(e.bits)
                        && e.bits.length === 2
                        && e.bits.every((v: any) => 
                            typeof v === "number"
                            && !isNaN(v)
                            && Number.isInteger(v)
                            && v >= 0
                            && v <= 15
                        )
                    )
                )
                && (
                    typeof e.validRange === "undefined" || (
                        Array.isArray(e.validRange)
                        && e.validRange.length > 0
                        && e.validRange.every((v: any) => 
                            Array.isArray(v)
                            && (v.length === 1 || v.length === 2)
                            && v.every((i: any) => 
                                typeof i === "number"
                                && !isNaN(i)
                                && Number.isInteger(i)
                                && i >= 0
                                && i <= 65535
                            )
                        )
                    )
                )
            );
    }
}

/**
 * @asType integer
 */
type Zero = 0

/**
 * @asType integer
 * @minimum 0
 */
type Integer = number

/**
 * @asType integer
 * @minimum 0
 * @maximum 15
 */
type BitInteger = number

/**
 * @asType integer
 * @minimum 0
 * @maximum 65535
 */
type LengthInteger = number

/**
 * @pattern ^[a-z][0-9a-z-]*$
 */
type StringArray = string
