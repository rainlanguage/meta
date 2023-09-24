// specify the version of the meta in the following line
// version 0.0.0

import { utils } from "ethers";
import { decodeCborMap } from "../utils";


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
};

/**
 * @public The namespace provides functionality to type check
 */
export namespace AbiMeta {
    /**
     * @public Method to type check AbiMeta
     * @param value - The value to typecheck
     */
    export function is(value: any): value is AbiMeta {
        return typeof value === "object"
            && value !== null
            && typeof value.type === "string"
            && value.type
            && (
                typeof value.name === "undefined" || 
                (typeof value.name === "string" && value.name)
            );
    }

    /**
     * @public Method to type check for array of AbiMeta
     * @param value - the value to check
     */
    export function isArray(value: any): value is AbiMeta[] {
        return Array.isArray(value)
            && value.length > 0
            && value.every(v => AbiMeta.is(v));
    }

    /**
     * @public Method to get array of ContractMeta object from cbor map
     * @param map - The cbor map
     */
    export function get(map: Map<any, any>): AbiMeta[] {
        const _abiStr = decodeCborMap(map);
        if (typeof _abiStr === "string") {
            const _abi = JSON.parse(_abiStr);
            if (AbiMeta.isArray(_abi)) return _abi;
            else throw new Error("invalid abi meta");
        }
        else throw new Error("corrupt abi meta");
    }

    /**
     * @public Method to get ethers interface from cbor map
     * @param map - The cbor map
     */
    export function getInterface(map: Map<any, any>): utils.Interface

    /**
     * @public Method to get ethers interface from abi object
     * @param abi - The cbor map
     */
    export function getInterface(abi: AbiMeta[]): utils.Interface
    
    /**
     * @public Method to get ethers interface from array of fragment selectors
     * @param selectors - The cbor map
     */
    export function getInterface(selectors: string[]): utils.Interface

    export function getInterface(value: Map<any, any> | AbiMeta[] | string[]): utils.Interface {
        if (Array.isArray(value)) return new utils.Interface(value);
        else {
            const abi = get(value);
            return new utils.Interface(abi);
        }
    }
}