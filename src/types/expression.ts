// specify the version of the meta in the following line
// version 0.0.0

import { Version } from "./general";
import { InterpreterMeta } from "./interpreter";

/**
 * @title Rain Exprression Metadata
 * @description Required data of an expression
 */
export type ExpressionMeta = {
    name: string
    commit: string
    description: string
    content: string
    path: string
    version: Version
    author?: string
    bytes?: ExpressionConfig
    interpreter?: InterpreterMeta
}

/**
 * Expression bytes aka StateConfig
 */
export type ExpressionConfig = {
    constants: (string | number)[]
    sources: (string | Uint8Array)[]
}
