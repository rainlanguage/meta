// specify the version of the meta in the following line
// version 0.0.0

import { arrayify, defaultAbiCoder, decodeCborMap } from "../utils";


const WordPattern = /^[a-z][0-9a-z-]*$/;

/**
 * @title Native Parser Opcode Authoring Metadata
 * @description Object interface for opcodes metadata.
*/
export type AuthoringMeta = {
    /**
     * @title Opcode Name
     * @description The primary word used to identify the opcode.
     * @pattern ^[a-z][0-9a-z-]*$
     */
    word: string;
    /**
     * @title Opcode Description
     * @description Describes what the opcode does briefly.
     */
    description: string;
    /**
     * @title Operand Offest
     */
    operandParserOffset: number;
}

/**
 * @public The namespace provides functionality to type check
 */
export namespace AuthoringMeta {
    export const Struct = "(bytes32 word, uint8 operandParserOffset, string description)[] AuthoringMeta" as const;

    /**
     * @public Method to type check AuthoringMeta
     * @param value - The value to typecheck
     */
    export function is(value: any): value is AuthoringMeta {
        return typeof value === "object"
            && value !== null
            && typeof value.word === "string"
            && WordPattern.test(value.word)
            && typeof value.description === "string"
            && typeof value.operandParserOffset === "number"
            && Number.isInteger(value.operandParserOffset);
    }

    /**
     * @public Method to type check array if AuthoringMeta
     * @param value - The value to typecheck
     */
    export function isArray(value: any): value is AuthoringMeta[] {
        return Array.isArray(value)
            && value.length > 0
            && value.every(v => AuthoringMeta.is(v));
    }

    /**
     * @public Method to get array of AuthoringMeta object from cbor map
     */
    export function get(map: Map<any, any>): AuthoringMeta[] {
        const abiEncodedBytes = decodeCborMap(map);
        if (typeof abiEncodedBytes === "string") throw new Error("corrupt Authoring meta");
        const authoringMeta = defaultAbiCoder.decode(
            [ Struct ], 
            abiEncodedBytes
        )?.AuthoringMeta?.map((v: any) => {
            return {
                word: String.fromCharCode(
                    ...arrayify(v.word, { allowMissingPrefix: true })
                        .filter(v => v !== 0)
                ),
                description: v.description,
                operandParserOffset: v.operandParserOffset
            };
        });
        if (AuthoringMeta.isArray(authoringMeta)) return authoringMeta;
        else throw new Error("invalid Authoring meta");
    }
}
