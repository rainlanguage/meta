// specify the version of the meta in the following line
// version 0.0.0

import { Version } from "./general";

/**
 * @title Rain WordPack Metadata
 * @description Schema for an expression
 * @version 0.01
 */
export type WordPackMeta = {
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