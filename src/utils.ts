import { inflate } from "pako";
import { MAGIC_NUMBERS } from "./magicNumbers";
import { ContractMeta } from "./types/contract";
import { decodeAllSync, encodeAsync } from "cbor-web";
import { BigNumber, BigNumberish, utils, ethers, BytesLike } from "ethers";


/**
 * @public ethers constants
 */
export const CONSTANTS = ethers.constants;
export { BytesLike, BigNumber, BigNumberish };
export const {
    /**
     * @public ethers concat
     */
    concat,
    /**
     * @public ethers hexlify
     */
    hexlify,
    /**
     * @public ethers zeroPad
     */
    zeroPad,
    /**
     * @public ethers hexZeroPad
     */
    hexZeroPad,
    /**
     * @public ethers arrayify
     */
    arrayify,
    /**
     * @public ethers parseUnits
     */
    parseUnits,
    /**
     * @public ethers isBytes
     */
    isBytes,
    /**
     * @public ethers isBytesLike
     */
    isBytesLike,
    /**
     * @public ethers isHexString
     */
    isHexString,
    /**
     * @public ethers keccak256
     */
    keccak256,
    /**
     * @public ethers isAddress
     */
    isAddress,
    /**
     * @public ethers default encoder
     */
    defaultAbiCoder,
    /**
     * @public ethers interface
     */
    Interface
} = utils;

/**
 * @public
 * function to check if the a value is of type BigNumberish, from EthersJS library
 *
 * @param value - the value to check
 * @returns boolean
 */
export function isBigNumberish(value: any): boolean {
    return (
        value != null &&
        (BigNumber.isBigNumber(value) ||
        (typeof value === "number" && value % 1 === 0) ||
        (typeof value === "string" && !!value.match(/^-?[0-9]+$/)) ||
        isHexString(value) ||
        typeof value === "bigint" ||
        isBytes(value))
    );
}

/**
 * @public
 * Extract some of the properites from a Map as a new Map with same keys.
 *
 * @param map - the map to extract from
 * @param properties - name of the properties in second item of the map elements
 * @returns a new Map with extracted properties
 */
export function extractFromMap(
    map: Map<any, any>,
    properties: string[]
): Map<any, any> {
    if (properties.length > 0) {
        const _arr = Array.from(map.entries());
        for (const item of _arr) {
            let _newArr = {};
            for (const key of Object.keys(item[1])) {
                if (properties.includes(key)) {
                    _newArr = {
                        ..._newArr,
                        [key]: item[1][key],
                    };
                }
            }
            item[1] = _newArr;
        }
        return new Map(_arr);
    } else return map;
}

/**
 * @public
 * Extract some of the properties from a Record as new Record with same keys.
 *
 * @param record - the record to extract from.
 * @param properties - name of the properties in value item of the key/va;ue pair of a Record object
 * @returns a new Record with extracted key/value pairs
 */
export function extractFromRecord<T extends string | number | symbol>(
    record: Record<T, any>,
    properties: string | string[]
): Record<T, any> {
    if (typeof properties === "string") {
        for (const key in record) {
            for (const value in record[key]) {
                if (properties.includes(value)) {
                    record[key] = record[key][value];
                }
            }
        }
        return record as Record<T, any>;
    } else if (properties.length > 0) {
        for (const key in record) {
            for (const value in record[key]) {
                if (!properties.includes(value)) {
                    delete record[key][value];
                }
            }
        }
        return record as Record<T, any>;
    } else return record;
}

/**
 * @public
 * Conver a Map to a equivelant Record (a key/value pair object). Map keys must be of type 
 * acceptable by Record constructor, which are string, number or symbol.
 *
 * @param map - The Map to conver to Record
 * @param properties - (optional) properties to pick from the second item of the Map's elements.
 * @returns a new Record from Map
 */
export function mapToRecord<K extends string | number | symbol>(
    map: Map<K, any>,
    properties?: string[]
): Record<K, any> {
    const _ret: Record<any, any> = {};
    const Properties = properties ? properties : [];

    if (Properties.length === 1) {
        for (const [key, value] of map) {
            _ret[key] = value[Properties[0]];
        }

        return _ret as Record<K, any>;
    } else {
        for (const [key, value] of extractFromMap(map, Properties)) {
            _ret[key] = value;
        }

        return _ret as Record<K, any>;
    }
}

/**
 * @public
 * Conver a Record (a key/value pair object) to a equivelant Map. Map keys will 
 * be of type acceptable by Record constructor, which are string, number or symbol.
 *
 * @param record - The Record to convert to a Map
 * @param properties - (optional) properties to pick from the values of key/value 
 * pair items of the Record object.
 * @returns Map Object from Record
 */
export function recordToMap<K extends string | number | symbol>(
    record: Record<K, any>,
    properties?: string | string[]
): Map<K, any> {
    const Properties = properties ? properties : [];

    return new Map(
        Object.entries(extractFromRecord(record, Properties))
    ) as Map<K, any>;
}

/**
 * @public
 * Deeply freezes an object, all of the properties of propterties gets frozen
 * 
 * @param object - object to freez
 * @returns frozen object
 */
export function deepFreeze(object: any) {
    if (typeof object === "object") {
        // Retrieve the property names defined on object
        const propNames = Object.getOwnPropertyNames(object);
    
        // Freeze properties before freezing self
        for (const name of propNames) {
            const value = object[name];
            if (value && typeof value === "object") {
                deepFreeze(value);
            }
        }
        return Object.freeze(object);
    }
}

/**
 * @public
 * Deep copy an item in a way that all of its properties get new reference
 * 
 * @param variable - The variable to copy
 * @returns a new deep copy of the variable
 */
export function deepCopy<T>(variable: T): T {
    let _result: any;
    if (Array.isArray(variable)) {
        _result = [] as T;
        for (let i = 0; i < variable.length; i++) {
            _result.push(deepCopy(variable[i]));
        }
    }
    else if (typeof variable === "object") {
        _result = {};
        const _keys = Object.keys(variable as object);
        for (let i = 0; i < _keys.length; i++) {
            _result[_keys[i]] = deepCopy((variable as any)[_keys[i]]);
        }
    }
    else _result = variable;
    return _result as T;
}

/**
 * @public Decodes a cbor map payload based on the map
 * @param cbormap - The CBOR map instance
 * @returns The result as string or Uint8Array
 */
export const decodeCborMap = (cbormap: Map<any, any>): Uint8Array | string => {
    const knwonContentTypes = [
        "application/json", 
        "application/cbor", 
        "application/octet-stream", 
        "text/plain"
    ];
    const knownContentEncodings = [ "deflate" ];

    const payload = cbormap.get(0);
    const magicNumber = cbormap.get(1);
    const contentType = cbormap.get(2);
    const contentEncoding = cbormap.get(3);
    // const contentLanguage = cbormap.get(4);
    if (!payload) throw new Error("undefined payload");
    if (!MAGIC_NUMBERS.is(magicNumber)) throw new Error("unknown magic number");
    if (!contentType || !knwonContentTypes.includes(contentType)) throw new Error("unknown content type");
    if (contentEncoding && !knownContentEncodings.includes(contentEncoding)) throw new Error("unknown content encoding");

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

};

/**
 * @public Method to get ContractMeta from a meta string content 
 * @param meta - The meta to convert to ContractMeta if it has valid content
 * @returns ContractMeta object
 */
export const toContractMeta = (meta: string): ContractMeta => {
    const parsed = JSON.parse(meta);
    if (ContractMeta.is(parsed)) return parsed;
    else throw new Error("invalid contract meta content");
};

/**
* @public
* Use CBOR to decode from a given value.
*
* This will try to decode all from the given value, allowing to decoded CBOR
* sequences. Always will return an array with the decoded results.
*
* @param dataEncoded_ - The data to be decoded
* @returns An array with the decoded data.
*/
export const cborDecode = (dataEncoded_: string): Array<any> => {
    return decodeAllSync(
        arrayify(dataEncoded_, { allowMissingPrefix: true }).buffer
    );
};

/**
* @public
* Use a given `dataEncoded_` as hex string and decoded it following the Rain
* enconding design.
*
* @param dataEncoded_ - The data to be decoded
* @returns An array with the values decoded.
*/
export const decodeRainMetaDocument = (dataEncoded_: string): Array<any> => {
    const metaDocumentHex = "0x" + MAGIC_NUMBERS.RAIN_META_DOCUMENT.toString(16).toLowerCase();
    dataEncoded_ = dataEncoded_.toLowerCase().startsWith("0x")
        ? dataEncoded_
        : "0x" + dataEncoded_;

    if (!dataEncoded_.startsWith(metaDocumentHex)) {
        throw new Error(
            "Invalid data. Does not start with meta document magic number."
        );
    }
    return cborDecode(dataEncoded_.replace(metaDocumentHex, ""));
};

/**
 * @public
 * Use the data provided to encode it using CBOR and following the Rain design.
 *
 * The payload could be `any` type, but only some are typed safe. When use this
 * function should pass the values with their "truly" expected type. For binary
 * data (like Deflated JSONs) is recommended use ArrayBuffers.
 *
 * See more: https://github.com/rainprotocol/metadata-spec/blob/main/README.md
 *
 * @param payload_ Data as payload to be added with enconding
 * @param magicNumber_ The known magic number work as filter on the design
 * @param contentType_ The type of the payload content
 * @param options_ The options allow to describe the encoding or language of the
 * content. No encoding means the payload is to be read literally as per `contentType_`
 *
 * @returns The data encoded with CBOR as an hex string.
 */
export const cborEncode = async(
    payload_: string | number | Uint8Array | ArrayBuffer,
    magicNumber_: MAGIC_NUMBERS,
    contentType_: string,
    options_?: {
      contentEncoding?: string;
      contentLanguage?: string;
    }
): Promise<string> => {
    const m = new Map();
    m.set(0, payload_); // Payload
    m.set(1, magicNumber_); // Magic number
    m.set(2, contentType_); // Content-Type
  
    if (options_) {
        if (options_.contentEncoding) {
            m.set(3, options_.contentEncoding); // Content-Encoding
        }
  
        if (options_.contentLanguage) {
            m.set(4, options_.contentLanguage); // Content-Language
        }
    }
    return (await encodeAsync(m, { canonical: true })).toString("hex").toLowerCase();
};

/**
 * @public CBOR encode given a map object
 * @param map - The cbor map
 * @returns The data encoded with CBOR as an hex string.
 */
export const cborMapEncode = async(map: Map<number, any>): Promise<string> => {
    return (await encodeAsync(map, { canonical: true })).toString("hex").toLowerCase();
};

/**
 * @public Calculates the hash for a given meta
 * @param cborMaps - array of cbor map items
 * @param asRainDocument - If the final hash should be calculated as RainDocument of not
 * @returns The meta hash
 */
export async function getMetaHash(
    cborMaps: Map<any, any>[], 
    asRainDocument: boolean
): Promise<string>


/**
 * @public Calculates the hash for a given meta
 * @param items - array of cbor map items as objects
 * @param asRainDocument - If the final hash should be calculated as RainDocument of not
 * @returns The meta hash
 */
export async function getMetaHash(
    items: {
        payload: BytesLike,
        magicNumber: MAGIC_NUMBERS,
        contentType: "application/json" | "application/cbor" | "application/octet-stream" | "text/plain",
        contentEncoding?: "deflate",
        contentLanguage?: "en"
    }[],
    asRainDocument: boolean
): Promise<string>

export async function getMetaHash(
    items: {
        payload: BytesLike,
        magicNumber: MAGIC_NUMBERS,
        contentType: "application/json" | "application/cbor" | "application/octet-stream" | "text/plain",
        contentEncoding?: "deflate",
        contentLanguage?: "en"
    }[] | Map<any, any>[],
    asRainDocument: boolean
): Promise<string> {
    let body = "";
    if (items.length === 0) throw new Error("no items found");
    if (items[0] instanceof Map) {
        const _items = items as Map<any, any>[];
        for (let i = 0; i < _items.length; i++) {
            if (_items[i].get(1) === MAGIC_NUMBERS.RAIN_META_DOCUMENT) throw new Error("cannot nest RainDocument meta");
            if (!isRainCborMap(_items[i])) throw new Error(`invalid cbor map at index ${i}`);
            body = body + (await cborMapEncode(_items[i]));
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
    if (asRainDocument) return keccak256(
        "0x" + 
        MAGIC_NUMBERS.RAIN_META_DOCUMENT.toString(16).toLowerCase() +
        body.toLowerCase()
    );
    else {
        if (items.length > 1) throw new Error("sequences must be hashed as RainDocument");
        return keccak256("0x" + body.toLowerCase());
    }
}

/**
 * @public Check if a value is of MAGIC_NUMBERS
 * @param value - The value to check
 */
export function isMagicNumber(value: any): value is MAGIC_NUMBERS {
    return typeof value === "bigint"
        && (
            MAGIC_NUMBERS.CONTRACT_META_V1                   === value ||
            MAGIC_NUMBERS.DOTRAIN_V1                         === value ||
            MAGIC_NUMBERS.OPS_META_V1                        === value ||
            MAGIC_NUMBERS.RAIN_META_DOCUMENT                 === value ||
            MAGIC_NUMBERS.SOLIDITY_ABIV2                     === value ||
            MAGIC_NUMBERS.AUTHORING_META_V1                  === value ||
            MAGIC_NUMBERS.RAINLANG_v1                        === value ||
            MAGIC_NUMBERS.EXPRESSION_DEPLOYER_V2_BYTECODE_V1 === value
        );
}

export function isRainCborMap(value: any): boolean {
    if (
        typeof value === "object"
        && value !== null
        && value.toString() === "[object Map]"
    ) {
        const knwonContentTypes = [
            "application/json", 
            "application/cbor", 
            "application/octet-stream", 
            "text/plain"
        ];
        const knownContentEncodings = [ "deflate" ];
        try {
            const payload = value?.get(0);
            const magicNumber = value?.get(1);
            const contentType = value?.get(2);
            const contentEncoding = value?.get(3);
            if (payload === undefined) return false;
            if (magicNumber === undefined || !MAGIC_NUMBERS.is(magicNumber)) return false;
            if (!contentType || !knwonContentTypes.includes(contentType)) return false;
            if (
                contentEncoding !== undefined && 
                !knownContentEncodings.includes(contentEncoding)
            ) return false;
        }
        catch {
            return false;
        }
        return true;
    }
    else return false;
}
