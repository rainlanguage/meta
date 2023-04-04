/**
 * @title Rain Contract Metadata
 * @description Required info about a contract that receives expression in at least one of its methods.
 */
export type ContractMetadata = {
    /**
     * @title Contract Name
     */
    name: string;
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

export type Method = {
    /**
     * @title Method Name
     */
    name: string;
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

// Additional information about inputs in this ABI.
export type Input = {
    /**
     * @title Input Name
     */
    name: string;
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

// Additional information about expressions (EvaluableConfig) in this ABI.
// argument type for expression (EvaluableConfig)
export type Expression = {
    /**
     * @title Expression Name
     */
    name: string;
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

// Each column in the context, cells are optional in the case of additional
// context passed in at time of execution (like arbitrary signed context)
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

// One cell in the context.
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
 * @minimum 0
 * @maximum 255
 */
type Integer = number
