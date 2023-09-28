// specify the version of the meta in the following line
// version 0.0.0

// import Ajv, { ValidateFunction } from "ajv";
import { decodeCborMap, toContractMeta } from "../utils";


const NamePattern = /^[a-z][0-9a-z-]*$/;

/**
 * @title Rain Contract Metadata
 * @description Required info about a contract that receives expression in at least one of its methods.
 */
export type ContractMeta = {
    /**
     * @title Contract Name
     */
    name: string;
    /**
     * @title Contract ABI name
     * @description Name of the contract corresponding to `contractName` feild in the abi.
     */
    abiName: string;
    /**
     * @title Contract Description
     * @description A brief description about the contract.
     */
    desc: string;
    /**
     * @title Contract Alias
     * @description Alias of the contract used by RainLang, follows RainLang word pattern.
     * @pattern ^[a-z][a-z0-9-]*$
     */
    alias: string;
    /**
     * @title Contract Source
     * @description Github repository URL where this contract belongs to.
     */
    source: string;
    /**
     * @title Contract Methods
     * @description Methods of the contract that receive at least one expression (EvaluableConfig) from arguments.
     * @minItems 1
     */
    methods: Method[]
}

/**
 * @public The namespace provides functionality to type check
 */
export namespace ContractMeta {
    /**
     * @public Method to type check ContractMeta
     * @param value - The value to typecheck
     */
    export function is(value: any): value is ContractMeta {
        return typeof value === "object"
            && value !== null
            && typeof value.name === "string"
            && value.name
            && typeof value.abiName === "string"
            && typeof value.desc === "string"
            && typeof value.alias === "string"
            && NamePattern.test(value.alias)
            && typeof value.source === "string"
            && Array.isArray(value.methods)
            && value.methods.length > 0
            && value.methods.every((v: any) => 
                typeof v === "object"
                && v !== null
                && typeof v.name === "string"
                && v.name
                && typeof v.abiName === "string"
                && typeof v.desc === "string"
                && (typeof v.inputs === "undefined" || (
                    Array.isArray(v.inputs)
                    && v.inputs.length > 0
                    && v.inputs.every((e: any) => 
                        typeof e === "object"
                        && e !== null
                        && typeof e.name === "string"
                        && e.name
                        && typeof e.abiName === "string"
                        && typeof e.desc === "string"
                        && typeof e.path === "string"
                    )
                ))
                && Array.isArray(v.expressions)
                && v.expressions.length > 0
                && v.expressions.every((e: any) => 
                    typeof e === "object"
                    && e !== null
                    && typeof e.name === "string"
                    && e.name
                    && typeof e.abiName === "string"
                    && typeof e.desc === "string"
                    && typeof e.path === "string" 
                    && (typeof e.signedContext === "undefined" || typeof e.signedContext === "boolean")
                    && (typeof e.callerContext === "undefined" || typeof e.callerContext === "boolean")
                    && (typeof e.contextColumns === "undefined" || (
                        Array.isArray(e.contextColumns)
                        && e.contextColumns.length > 0
                        && e.contextColumns.every((c: any) => 
                            typeof c === "object"
                            && c !== null
                            && typeof c.name === "string"
                            && c.name
                            && (typeof c.desc === "undefined" || typeof c.desc === "string")
                            && typeof c.alias === "string"
                            && NamePattern.test(c.alias)
                            && typeof c.columnIndex === "number"
                            && Number.isInteger(c.columnIndex)
                            && c.columnIndex >= 0
                            && c.columnIndex <= 255
                            && (typeof c.cells === "undefined" || (
                                Array.isArray(c.cells)
                                && c.cells.length > 0
                                && c.cells.every((r: any) => 
                                    typeof r === "object"
                                    && r !== null
                                    && typeof r.name === "string"
                                    && r.name
                                    && (typeof r.desc === "undefined" || typeof r.desc === "string")
                                    && typeof r.alias === "string"
                                    && NamePattern.test(r.alias)
                                    && typeof r.cellIndex === "number"
                                    && Number.isInteger(r.cellIndex)
                                    && r.cellIndex >= 0
                                    && r.cellIndex <= 255
                                )
                            ))
                        )
                    ))
                )
            );
    }

    /**
     * @public Method to get ContractMeta object from cbor map
     * @param map - The cbor map
     */
    export function get(map: Map<any, any>): ContractMeta {
        const contractMetaStr = decodeCborMap(map);
        if (typeof contractMetaStr !== "string") throw new Error("corrupt contract meta");
        return toContractMeta(contractMetaStr);
    }
}

/**
 * @public Methods of the contract that receive at least one expression (EvaluableConfig) from arguments.
 */
export type Method = {
    /**
     * @title Method Name
     */
    name: string;
    /**
     * @title Method ABI name
     * @description Name of the method corresponding to `name` feild in the abi.
     */
    abiName: string;
    /**
     * @title Method Description
     */
    desc: string;
    /**
     * @title Method Inputs
     * @minItems 1
     */
    inputs?: Input[]
    /**
     * @title Method Expressions
     * @minItems 1
     */
    expressions: Expression[];
}

/** 
 * @public Additional information about inputs in this ABI.
 */
export type Input = {
    /**
     * @title Input Name
     */
    name: string;
    /**
     * @title Input ABI name
     * @description Name of the input corresponding to `name` feild in the abi.
     */
    abiName: string;
    /**
     * @title Input Description
     */
    desc: string;
    /**
     * @title Input Path
     * @description Input's path in contract's ABI.
     */
    path: string;
}

/** 
 * @public Additional information about expressions (EvaluableConfig) in this ABI. 
 * argument type for expression (EvaluableConfig)
 */
export type Expression = {
    /**
     * @title Expression Name
     */
    name: string;
    /**
     * @title Expression ABI name
     * @description Name of the expression corresponding to `name` feild in the abi.
     */
    abiName: string;
    /**
     * @title Expression Description
     */
    desc: string;
    /**
     * @title Expression Path
     * @description Expression's path in contract's ABI.
     */
    path: string;
    /**
     * @title Expression Signed Context
     * @description Determines if this expression has signedContext.
     */
    signedContext?: boolean;
    /**
     * @title Expression Signed Context
     * @description Determines if this expression has callerContext.
     */
    callerContext?: boolean;
    /**
     * @title Context Grid Columns
     * @description Specifies the reserved context grid columns of this expression, context is a 256x256 matrix of unit256.
     * @minItems 1
     * @maxItems 256
     */
    contextColumns?: ContextColumn[];
}

/** 
 * @public Each column in the context, cells are optional in the case of 
 * additional context passed in at time of execution (like arbitrary signed context)
 */
export type ContextColumn = {
    /**
     * @title Context Column Name
     */
    name: string;
    /**
     * @title Context Column Description
     */
    desc?: string;
    /**
     * @title Context Column Alias
     * @description Alias for the context column used in RainLang, follows rainlang valid word pattern.
     * @pattern ^[a-z][a-z0-9-]*$
     */
    alias: string;
    /**
     * @title Context Column Index
     * @description Index of this context column grid, this value will be inside <> of associated interpreter's opcode, exxample: columnIndex: 0 -> context-column-opcode<0>.
     */
    columnIndex: Integer;
    /**
     * @title Context Grid Cells
     * @description Specifies the reserved context grid cells of this expression, context is a 256x256 matrix of unit256.
     * @minItems 1
     * @maxItems 256
     */
    cells?: ContextCell[]
}

/**
 * @public One cell in the context.
 */
export type ContextCell = {
    /**
     * @title Context Cell Name
     */
    name: string;
    /**
     * @title Context Cell Description
     */
    desc?: string;
    /**
     * @title Context Cell Alias
     * @description Alias for the context cell used in RainLang, follows rainlang valid word pattern.
     * @pattern ^[a-z][a-z0-9-]*$
     */
    alias: string;
    /**
     * @title Context Cell Index
     * @description Index of this context cell grid, column index value and this value will be inside of <> of associated interpreter's opcode, example: columnIndex: 0, cellIndex: 1 -> context-cell-opcode<0 1>.
     */
    cellIndex: Integer;
}

/**
 * @asType integer
 * @minimum 0
 * @maximum 255
 */
type Integer = number
