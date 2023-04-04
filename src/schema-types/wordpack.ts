import { Version } from "./general"

/**
 * @title Rain WordPack Metadata
 * @description Schema for an expression
 * @version 0.01
 */
export type WordPackMetadata = {
    name: string
    commit: string
    description: string
    words: Word[]
    path: string
    version: Version
    author?: string
}

/**
 * Information about a single word
 */
export type Word = {
    word: string
    description: string
    aliases?: string[]
}