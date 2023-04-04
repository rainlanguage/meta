import { Version } from "./general";
import { InterpreterMetadata } from "./interpreter";

/**
 * @title Rain Exprression Metadata
 * @description Schema for an expression
 * @version 0.01
 */
 export type ExpressionMetadata = {
    name: string
    commit: string
    description: string
    content: string
    path: string
    version: Version
    author?: string
    bytes?: StateConfig
    interpreter?: InterpreterMetadata
}

/**
 * Expression bytes aka StateConfig
 */
export type StateConfig = {
    constants: (string | number)[]
    sources: (string | Uint8Array)[]
}
