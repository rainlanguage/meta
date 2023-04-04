import { Version } from "./general"
import { Word, WordPackMetadata } from "./wordpack"

/**
 * @title Rain Interpreter Metadata
 * @description Schema for an interpreter
 * @version 0.01
 */
export type InterpreterMetadata = {
    addresses: InterpreterEVMAddresses[]
    name: string
    commit: string
    description: string
    wordpack: WordPackMetadata
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

/**
 * Information about opcodes
 */
export type OpMeta = {
    enum: number
    name: string
    description: string
    word: Word
    inputs: number
    outputs: number
    isZeroOperand: boolean
    category: string
    data?: any
}