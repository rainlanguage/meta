import { inflate } from "pako";
import { BytesLike } from "ethers";
import { AbiMeta } from "./types/abi";
import { MAGIC_NUMBERS } from "./magicNumbers";
import { GraphQLClient } from "graphql-request";
import { ContractMeta } from "./types/contract";
import { RAIN_SUBGRAPHS } from "./rainSubgraphs";
import { AuthoringMeta } from "./types/authoring";
import { arrayify, cborDecode, cborEncode, cborEncodeMap, hexlify, isBytesLike, keccak256 } from "./utils";


/**
 * @public The query search result from subgraph for NP constructor meta
 */
export type DeployerMeta = {
    id: string;
    rawBytes: string;
}

/**
 * @public The namespace that provides the main functionalities of this library
 */
export namespace META {
    /**
     * @public This namespace provides ABI meta functionalities
     */
    export import Abi = AbiMeta;
    /**
     * @public This namespace provides Contract meta functionalities
     */
    export import Contract = ContractMeta;
    /**
     * @public This namespace provides Authoring meta functionalities
     */
    export import Authoring = AuthoringMeta;
    /**
     * @public This namespace provides every functionality of Magic Numbers
     */
    export import MagicNumbers = MAGIC_NUMBERS;
    /**
     * @public This namespace provides every functionality of Rain subgraphs
     */
    export const KnownSubgraphs = RAIN_SUBGRAPHS;

    /**
     * @public known content types of rain metas
     */
    export const KnownContentTypes = [
        "application/json", 
        "application/cbor", 
        "application/octet-stream", 
        "text/plain"
    ] as const;
    export type KnownContentTypes = typeof KnownContentTypes[number];

    /**
     * @public known content encoding of rain metas
     */
    export const KnownContentEncodings = [
        "deflate"
    ] as const;
    export type KnownContentEncodings = typeof KnownContentEncodings[number];

    /**
     * @public known content language of rain metas
     */
    export const KnownContentLanguages = [
        "en"
    ] as const;
    export type KnownContentLanguages = typeof KnownContentLanguages[number];

    /**
     * @public Checks if a value is valid Rain meta
     * @param value - the value to check
     */
    export function is(value: any): value is AbiMeta | ContractMeta | AuthoringMeta {
        return AbiMeta.is(value) || ContractMeta.is(value) || AuthoringMeta.is(value);
    }

    /**
     * @public Method to decode raw bytes to cbor maps
     * @param value - The value to decode
     */
    export function decode(value: BytesLike): Map<any, any>[] {
        if (typeof value === "string" && !value.startsWith("0x")) {
            value = value.toLowerCase();
            value = "0x" + value;
        }
        if (!isBytesLike(value)) throw new Error("value must be bytes");
        if (typeof value !== "string") value = hexlify(value, { allowMissingPrefix: true }).toLowerCase();
        if (value.startsWith("0x" + MagicNumbers.RAIN_META_DOCUMENT.toString(16).toLowerCase())) {
            value = value.slice(18);
        }

        const maps = cborDecode(value);
        try {
            if (maps.every(v => isValidMap(v))) return maps;
            else throw new Error("corrupt meta");
        }
        catch {
            throw new Error("corrupt meta");
        }
    }

    /**
     * @public Method that decodes a sinlge cbor map to its final value based on the map configs
     * @param map - The cbor map
     * @param validate - If the map should be validated or not
     */
    export function decodeMap(map: Map<any, any>, validate = false): Uint8Array | string {
        const payload = map.get(0);
        const magicNumber = map.get(1);
        const contentType = map.get(2);
        const contentEncoding = map.get(3);
        const contentLanguage = map.get(4);
        if (validate) {
            if (!payload) throw new Error("undefined payload");
            if (!MAGIC_NUMBERS.is(magicNumber)) throw new Error("unknown magic number");
            if (!contentType || !KnownContentTypes.includes(contentType)) throw new Error("unknown content type");
            if (contentEncoding !== undefined && !KnownContentEncodings.includes(contentEncoding)) throw new Error("unknown content encoding");
            if (contentLanguage !== undefined && !KnownContentLanguages.includes(contentLanguage)) throw new Error("unknown content language");
        }

        const config: any = { raw: false };
        if (contentType === "application/json") config.to = "string";

        let result: any = arrayify(payload, { allowMissingPrefix: true });
        if (contentEncoding && contentEncoding === "deflate") {
            try {
                result = inflate(result, config);
            }
            catch (err1) {
                config.raw = true;
                try {
                    result = inflate(result, config);
                }
                catch (err2) {
                    throw {
                        message: "could not inflate the payload",
                        inflateTry: err1,
                        rawInflateTry: err2
                    };
                }
            }
        }
        return result;
    }

    /**
     * @public Method to search for NP meta in provided subgraphs with the given hash
     * @param metaHash - The meta hash to search for
     * @param subgraphUrls - Subgraph urls to query from
     * @param timeout - Seconds to wait for query results to settle, if no settlement is found before timeout the promise will be rejected
     * @returns A promise that resolves with meta bytes as hex string and rejects if nothing found
     */
    export async function search(
        metaHash: string,
        subgraphUrls: string[],
        timeout = 5000
    ): Promise<string> {
        if (!/^0x[a-fA-F0-9]{64}$/.test(metaHash)) throw new Error("invalid meta hash");
        const _query = `{ meta( id: "${ metaHash.toLowerCase() }" ) { rawBytes }}`;
        const _request = async(url: string): Promise<string> => {
            try {
                const _res = await new GraphQLClient(
                    url, { headers: { "Content-Type":"application/json" }, timeout }
                ).request(_query) as any;
                if (!_res) Promise.reject(new Error("no matching record was found"));
                if (isBytesLike(_res?.meta?.rawBytes)) {
                    return Promise.resolve(_res.meta.rawBytes);
                }
                else return Promise.reject(new Error("unexpected returned value"));
            }
            catch (error) {
                return Promise.reject(error);
            }
        };

        if (!subgraphUrls.length) throw new Error("expected subgraph URL(s)");
        return await Promise.any(subgraphUrls.map(v => _request(v)));
    }

    /**
     * @public Method to search for expression deployer meta in provided subgraphs with the given meta hash
     * @param hash - The bytecode or constructor hash to search for
     * @param subgraphUrls - Subgraph urls to query from
     * @param timeout - Seconds to wait for query results to settle, if no settlement is found before timeout the promise will be rejected
     * @returns A promise that resolves with ABI meta bytes as hex string and rejects if nothing found
     */
    export async function searchDeployerMeta(
        hash: string,
        subgraphUrls: string[],
        timeout = 5000
    ): Promise<DeployerMeta> {
        if (!hash.match(/^0x[a-fA-F0-9]{64}$/)) throw new Error("invalid bytecode hash");
        const _query = `{ expressionDeployers(where: {meta_: {id: "${ hash.toLowerCase() }"}} first: 1) { constructorMetaHash constructorMeta }}`;
        const _request = async(url: string): Promise<DeployerMeta> => {
            try {
                const _res = await new GraphQLClient(
                    url, { headers: { "Content-Type":"application/json" }, timeout }
                ).request(_query) as any;
                if (!_res) Promise.reject(new Error("no matching record was found"));
                if (
                    Array.isArray(_res?.expressionDeployers) &&
                    _res.expressionDeployers.length === 1 &&
                    _res.expressionDeployers[0].constructorMeta &&
                    _res.expressionDeployers[0].constructorMetaHash
                ) return {
                    id: _res.expressionDeployers[0].constructorMetaHash,
                    rawBytes: _res.expressionDeployers[0].constructorMeta
                };
                else return Promise.reject(new Error("unexpected returned value"));
            }
            catch (error) {
                return Promise.reject(error);
            }
        };

        if (!subgraphUrls.length) throw new Error("expected subgraph URL(s)");
        return await Promise.any(subgraphUrls.map(v => _request(v)));
    }

    /**
     * @public Calculates the hash for a given meta as array of maps
     * @param cborMaps - array of cbor map items
     * @param asRainDocument - If the final hash should be calculated as RainDocument of not
     * @returns The meta hash
     */
    export async function hash(
        cborMaps: Map<any, any>[], 
        asRainDocument: boolean
    ): Promise<string>


    /**
     * @public Calculates the hash for a given meta as array of objects
     * @param items - array of cbor map items as objects
     * @param asRainDocument - If the final hash should be calculated as RainDocument of not
     * @returns The meta hash
     */
    export async function hash(
        items: {
            payload: BytesLike,
            magicNumber: MAGIC_NUMBERS,
            contentType: KnownContentTypes,
            contentEncoding?: KnownContentEncodings,
            contentLanguage?: KnownContentLanguages
        }[],
        asRainDocument: boolean
    ): Promise<string>

    export async function hash(
        items: {
            payload: BytesLike,
            magicNumber: MAGIC_NUMBERS,
            contentType: KnownContentTypes,
            contentEncoding?: KnownContentEncodings,
            contentLanguage?: KnownContentLanguages
        }[] | Map<any, any>[],
        asRainDocument: boolean
    ): Promise<string> {
        let bytes = await encode(items as any, asRainDocument);
        if (bytes.startsWith("0x")) bytes = bytes.slice(2);
        if (asRainDocument) return keccak256(
            "0x" + 
            MAGIC_NUMBERS.RAIN_META_DOCUMENT.toString(16).toLowerCase() +
            bytes.toLowerCase()
        );
        else {
            if (items.length > 1) throw new Error("sequences must be hashed as RainDocument");
            return keccak256("0x" + bytes.toLowerCase());
        }
    }

    /**
     * @public Method to cbor encode array of cbor maps
     * @param cborMaps - array of cbor map items
     * @param asRainDocument - If the final hash should be calculated as RainDocument of not
     * @returns The meta hash
     */
    export async function encode(
        cborMaps: Map<any, any>[], 
        asRainDocument: boolean
    ): Promise<string>


    /**
     * @public Method to cbor encode array of meta items as objects
     * @param items - array of cbor map items as objects
     * @param asRainDocument - If the final hash should be calculated as RainDocument of not
     * @returns The meta hash
     */
    export async function encode(
        items: {
            payload: BytesLike,
            magicNumber: MAGIC_NUMBERS,
            contentType: KnownContentTypes,
            contentEncoding?: KnownContentEncodings,
            contentLanguage?: KnownContentLanguages
        }[],
        asRainDocument: boolean
    ): Promise<string>

    export async function encode(
        items: {
            payload: BytesLike,
            magicNumber: MAGIC_NUMBERS,
            contentType: KnownContentTypes,
            contentEncoding?: KnownContentEncodings,
            contentLanguage?: KnownContentLanguages
        }[] | Map<any, any>[],
        asRainDocument: boolean
    ): Promise<string> {
        let body = "";
        if (items.length === 0) throw new Error("no items found");
        if (items[0] instanceof Map) {
            const _items = items as Map<any, any>[];
            for (let i = 0; i < _items.length; i++) {
                if (_items[i].get(1) === MAGIC_NUMBERS.RAIN_META_DOCUMENT) throw new Error("cannot nest RainDocument meta");
                if (!isValidMap(_items[i])) throw new Error(`invalid cbor map at index ${i}`);
                body = body + (await cborEncodeMap(_items[i]));
            }
        }
        else {
            const _items = items as any[];
            for (let i = 0; i < _items.length; i++) {
                if (_items[i].magicNumber === MAGIC_NUMBERS.RAIN_META_DOCUMENT) throw new Error("cannot nest RainDocument meta");
                body = body + (await cborEncode(
                    arrayify(_items[i].payload, {  allowMissingPrefix: true }).buffer, 
                    _items[i].magicNumber, 
                    _items[i].contentType, 
                    { 
                        contentEncoding: _items[i].contentEncoding,
                        contentLanguage: _items[i].contentLanguage 
                    }
                ));
            }
        }
        if (asRainDocument) return "0x" + 
            MAGIC_NUMBERS.RAIN_META_DOCUMENT.toString(16).toLowerCase() +
            body.toLowerCase();
        else {
            if (items.length > 1) throw new Error("sequences must be hashed as RainDocument");
            return "0x" + body.toLowerCase();
        }
    }

    /**
     * @public Method to check if a value is a valid Rain cbor map
     * @param value - The value to check
     */
    export function isValidMap(value: any): boolean {
        if (
            typeof value === "object"
            && value !== null
            && value.toString() === "[object Map]"
        ) {
            try {
                const payload = value?.get(0);
                const magicNumber = value?.get(1);
                const contentType = value?.get(2);
                const contentEncoding = value?.get(3);
                const contentLanguage = value?.get(4);
                if (payload === undefined) return false;
                if (magicNumber === undefined || !MAGIC_NUMBERS.is(magicNumber)) return false;
                if (!contentType || !KnownContentTypes.includes(contentType)) return false;
                if (
                    contentEncoding !== undefined && 
                    !KnownContentEncodings.includes(contentEncoding)
                ) return false;
                if (
                    contentLanguage !== undefined && 
                    !KnownContentLanguages.includes(contentLanguage)
                ) return false;
            }
            catch {
                return false;
            }
            return true;
        }
        else return false;
    }
}
