// specify the version of the meta in the following line
// version 0.0.0

import { Version } from "./general";
import { OpMeta } from "./op";
import { WordPackMeta } from "./wordpack";

/**
 * @title Rain Interpreter Metadata
 * @description Schema for an interpreter
 * @version 0.01
 */
export type InterpreterMeta = {
    addresses: InterpreterEVMAddresses[]
    name: string
    commit: string
    description: string
    wordpack: WordPackMeta
    opmeta: OpMeta[]
    storageLength: number
    path: string
    version: Version
    author?: string
}

export type InterpreterEVMAddresses = {
    chainId: number
    knownAddresses: InterpreterChainEVMAddresses[]
}

export type InterpreterChainEVMAddresses = {
    interpreter: string
    integrity: string
    deployer: string
}
