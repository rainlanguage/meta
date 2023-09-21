// specify the version of the meta in the following line
// version 0.0.0

import { utils } from "ethers";
import { metaFromBytes } from "../utils";


/**
 * @title Solidity Contract ABI Metadata
 */
export type AbiMeta = {
    /**
     * @title ABI item inputs
     */
    inputs: any;
    /**
     * @title ABI item name
     */
    name?: string;
    /**
     * @title ABI item tyep
     */
    type: string;
    /**
     * @title ABI item outputs
     */
    outputs?: any
}[];

/**
 * @public The namespace provides functionality to type check
 */
export namespace AbiMeta {
    /**
     * @public Method to type check AbiMeta
     * @param value - The value to typecheck
     */
    export function is(value: any): value is AbiMeta {
        return Array.isArray(value)
            && value.every(
                v => typeof v === "object"
                    && v !== null
                    && typeof v.type === "string"
                    && v.type
                    && (
                        typeof v.name === "undefined" || 
                        (typeof v.name === "string" && v.name)
                    )
            );
    }

    /**
     * @public Method to get array of ContractMeta object from raw bytes
     */
    export function fromBytes(value: any): AbiMeta {
        const _abi = JSON.parse(metaFromBytes(value));
        if (AbiMeta.is(_abi)) return _abi;
        else throw "invalid abi meta";
    }

    /**
     * @public Method to get ethers interface from raw meta bytes
     * @param value - The raw meta to get interface from
     */
    export function getInterface(value: any): utils.Interface {
        const abi = fromBytes(value);
        return new utils.Interface(abi);
    }
}