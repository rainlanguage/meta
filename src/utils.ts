import Ajv from "ajv";
import { Buffer } from "buffer/";
import stringMath from "string-math";
import { deflate, inflate } from "pako";
import { decodeAllSync, encodeCanonical } from "cbor-web";
import { format } from "prettier/standalone";
import babelParser from "prettier/parser-babel";
import { BigNumber, BigNumberish, utils, ethers, BytesLike } from "ethers";
import { keccak256 } from "ethers/lib/utils";

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
    isHexString
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
 * @public
 * Validate a meta or array of metas against a schema
 *
 * @param meta - A meta object or array of meta objects or stringified format of them
 * @param schema - Json schema to validate as object (JSON.parsed) or stringified format
 * @returns boolean
 */
export const validateMeta = (
    meta: object | object[] | string,
    schema: object | string
): boolean => {
    const _expandBits = (bits: [number, number]) => {
        const _len = bits[1] - bits[0] + 1;
        const _result = [];
        for (let i = 0; i < _len; i++) {
            _result.push(bits[0] + i);
        }
        return _result;
    };
    let _meta;
    let _schema;
    if (typeof meta === "string") _meta = JSON.parse(meta);
    else _meta = meta;
    if (typeof schema === "string") _schema = JSON.parse(schema);
    else _schema = schema;
    const ajv = new Ajv();
    const validate = ajv.compile(_schema);
    if (!Array.isArray(_meta)) _meta = [_meta];

    const _allAliases = [];
    for (let i = 0; i < _meta.length; i++) {
        
        // validate by schema
        if (!validate(_meta[i])) throw new Error(
            `invalid meta for ${_meta[i].name}, reason: failed schema validation`
        );
  
        // in-depth validation for op meta
        if ("operand" in _meta[i] && "inputs" in _meta[i] && "outputs" in _meta[i]) {
            let hasOperandArg = false;
            let hasInputOperandArg = false;
            let hasInputOperandArgComp = false;
            let hasOutputOperandArg = false;
            let hasOutputOperandArgComp = false;
  
            // cache all aliases for check across all ops
            _allAliases.push(_meta[i].name);
            if (_meta[i].aliases) _allAliases.push(..._meta[i].aliases);
  
            // check for operand args validity
            if (typeof _meta[i].operand !== "number") {
                hasOperandArg = true;
                let check = true;
                for (let j = 0; j < _meta[i].operand.length; j++) {
                    if (_meta[i].operand[j].name === "inputs") {
                        if (hasInputOperandArg) throw new Error(
                            `invalid meta for ${_meta[i].name}, reason: double "inputs" named operand args`
                        );
                        hasInputOperandArg = true;
                        if ("computation" in _meta[i].operand[j]) hasInputOperandArgComp = true;
                    }
                    if (_meta[i].operand[j].name === "outputs") {
                        if (hasOutputOperandArg) throw new Error(
                            `invalid meta for ${_meta[i].name}, reason: double "outputs" named operand args`
                        );
                        hasOutputOperandArg = true;
                        if ("computation" in _meta[i].operand[j]) hasOutputOperandArgComp = true;
                    }
  
                    // check computation validity
                    if ("computation" in _meta[i].operand[j]) {
                        let _comp = _meta[i].operand[j].computation;
                        _comp = _comp.replace(/arg/g, "30");
                        try { stringMath(_comp); }
                        catch { throw new Error(
                            `invalid meta for ${_meta[i].name}, reason: bad "computation" equation for ${_meta[i].operand[j].name}`
                        );}
                    }
                    // bits range validity
                    if (_meta[i].operand[j].bits[0] > _meta[i].operand[j].bits[1]) throw new Error(
                        `invalid meta for ${_meta[i].name}, reason: start bit greater than end bit for ${_meta[i].operand[j].name}`
                    );
                    // check bits
                    const _range1 = _expandBits(_meta[i].operand[j].bits);
                    for (let k = j + 1; k < _meta[i].operand.length; k++) {
                        // check order of operand args by bits index from low bits to high
                        if (_meta[i].operand[j].bits[0] <= _meta[i].operand[k].bits[1]) {
                            throw new Error(
                                `invalid meta for ${_meta[i].name}, reason: bad operand args order, should be from high to low`
                            );
                        }
                        // check operand args bits overlap
                        const _range2 = _expandBits(_meta[i].operand[k].bits);
                        _range1.forEach(v => {
                            if (_range2.includes(v)) check = false;
                        });
                        if (!check) throw new Error(
                            `invalid meta for ${_meta[i].name}, reason: operand args bits overlap`
                        );
                    }
                }
            }
  
            // check for inputs bits and computation validity and validity against operand
            if (typeof _meta[i].inputs !== "number") {
                // check validity against operand
                if (hasInputOperandArg) {
                    if (!("bits" in _meta[i].inputs)) throw new Error(
                        `invalid meta for ${_meta[i].name}, reason: must have specified "bits" field for inputs`
                    );
                    if (hasInputOperandArgComp) {
                        if (!("computation" in _meta[i].inputs)) throw new Error(
                            `invalid meta for ${_meta[i].name}, reason: must have specified "computation" field for inputs`
                        );
                    }
                    else {
                        if ("computation" in _meta[i].inputs) throw new Error(
                            `invalid meta for ${_meta[i].name}, reason: unexpected "computation" field for inputs`
                        );
                    }
                }
                else {
                    if (
                        "bits" in _meta[i].inputs ||
              "computation" in _meta[i].inputs
                    ) throw new Error(
                        `invalid meta for ${_meta[i].name}, reason: unexpected "bits" or "computation" fields for inputs`
                    );
                }
                // check bits range validity
                if ("bits" in _meta[i].inputs) {
                    if (_meta[i].inputs.bits[0] > _meta[i].inputs.bits[1]) throw new Error(
                        `invalid meta for ${_meta[i].name}, reason: start bit greater than end bit for inputs`
                    );
                }
                // check computation validity
                if ("computation" in _meta[i].inputs) {
                    let _comp = _meta[i].inputs.computation;
                    _comp = _comp.replace(/bits/g, "30");
                    try { stringMath(_comp); }
                    catch { throw new Error(
                        `invalid meta for ${_meta[i].name}, reason: bad "computation" equation for inputs`
                    );}
                }
            }
            else {
                if (hasInputOperandArg) throw new Error(
                    `invalid meta for ${_meta[i].name}, reason: unexpected input type, must be derived from bits`
                );
            }
  
            // check for outputs bits and computation validity and validity against operand
            if (typeof _meta[i].outputs !== "number") {
                // check validity against operand
                if (!hasOperandArg) throw new Error(
                    `invalid meta for ${_meta[i].name}, reason: cannot have computed output`
                );
                if (hasOutputOperandArg) {
                    if (hasOutputOperandArgComp) {
                        if (!("computation" in _meta[i].outputs)) throw new Error(
                            `invalid meta for ${_meta[i].name}, reason: must have specified "computation" field for outputs`
                        );
                    }
                    else {
                        if ("computation" in _meta[i].outputs) throw new Error(
                            `invalid meta for ${_meta[i].name}, reason: unexpected "computation" field for outputs`
                        );
                    }
                }
                // check bits range validity
                if (_meta[i].outputs.bits[0] > _meta[i].outputs.bits[1]) throw new Error(
                    `invalid meta for ${_meta[i].name}, reason: start bit greater than end bit for outputs`
                );
                // check computation validity
                if ("computation" in _meta[i].outputs) {
                    let _comp = _meta[i].outputs.computation;
                    _comp = _comp.replace(/bits/g, "30");
                    try { stringMath(_comp); }
                    catch { throw new Error(
                        `invalid meta for ${_meta[i].name}, reason: bad "computation" equation for outputs`
                    );}
                }
            }
            else {
                if (hasOutputOperandArg) throw new Error(
                    `invalid meta for ${_meta[i].name}, reason: unexpected output type, must be derived from bits`
                );
            }
        }
    }
  
    // check for overlap among all aliases
    if (_allAliases.length) {
        while (_allAliases.length) {
            const _item = _allAliases.splice(0, 1)[0];
            if (_allAliases.includes(_item)) throw new Error(
                `invalid meta, reason: duplicated names or aliases "${_item}"`
            );
        }
    }
    return true;
};

/**
 * @public
 * Convert meta or array of metas or a schema to bytes and compress them for on-chain deployment
 *
 * @param meta - A meta object or array of meta objects or stringified format of them
 * @param schema - Json schema to validate as object (JSON.parsed) or stringified format
 * @returns Bytes as HexString
 */
export const bytesFromMeta = (
    meta: object | object[] | string,
    schema: object | string
): string => {
    let _meta;
    let _schema;
    if (typeof meta === "string") _meta = JSON.parse(meta);
    else _meta = meta;
    if (typeof schema === "string") _schema = JSON.parse(schema);
    else _schema = schema;
    if (!validateMeta(_meta, _schema))
        throw new Error("provided meta object is not valid");
    const formatted = format(
        JSON.stringify(_meta, null, 4), 
        { parser: "json",  plugins: [babelParser] }
    );
    const bytes = deflate(formatted);
    const hex = hexlify(bytes, { allowMissingPrefix: true });
    return hex;
};

/**
 * @public
 * Decompress and convert bytes to meta
 *
 * @param bytes - Bytes to decompress and convert to json
 * @param schema - Json schema to validate as object (JSON.parsed) or stringified format
 * @returns meta content as object
 */
export const metaFromBytes = (
    bytes: BytesLike,
    schema: object | string
) => {
    if (isBytesLike(bytes)) {
        let _schema;
        if (typeof schema === "string") _schema = JSON.parse(schema);
        else _schema = schema;
        const _bytesArr = arrayify(bytes, { allowMissingPrefix: true });
        const _meta = format(
            Buffer.from(inflate(_bytesArr)).toString(), 
            { parser: "json", plugins: [babelParser] }
        );
        if (!validateMeta(JSON.parse(_meta), _schema))
            throw new Error("invalid meta");
        return JSON.parse(_meta);
    }
    else throw new Error("invalid meta");
};

/**
 * @public
 * Magic numbers used to identify Rain documents. This use `BigInt` with their
 * literal numbers.
 *
 * See more abour Magic numbers:
 * https://github.com/rainprotocol/metadata-spec/blob/main/README.md
 */
export const MAGIC_NUMBERS = {
    /**
     * Prefixes every rain meta document
     */
    RAIN_META_DOCUMENT: BigInt("0xff0a89c674ee7874"),
    /**
     * Solidity ABIv2
     */
    SOLIDITY_ABIV2: BigInt("0xffe5ffb4a3ff2cde"),
    /**
     * Ops meta v1
     */
    OPS_META_V1: BigInt("0xffe5282f43e495b4"),
    /**
     * Contract meta v1
     */
    CONTRACT_META_V1: BigInt("0xffc21bbf86cc199b"),
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
    return decodeAllSync(dataEncoded_);
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
    const metaDocumentHex =
  "0x" + MAGIC_NUMBERS.RAIN_META_DOCUMENT.toString(16).toLowerCase();

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
export const cborEncode = (
    payload_: string | number | Uint8Array | ArrayBuffer,
    magicNumber_: bigint,
    contentType_: string,
    options_?: {
      contentEncoding?: string;
      contentLanguage?: string;
    }
): string => {
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
  
    return encodeCanonical(m).toString("hex").toLowerCase();
};

/**
 * @public Calculates the hash for a given meta
 * @param metaBytes - The meta bytes to get the hash from
 * @param type - The meta type
 * @returns The meta hash
 */
export function getMetaHash(metaBytes: BytesLike, type: "contract" | "op") {
    return keccak256(
        "0x" + 
        MAGIC_NUMBERS.RAIN_META_DOCUMENT.toString(16) + 
        (
            cborEncode(
                arrayify(metaBytes).buffer, 
                type === "op" ? MAGIC_NUMBERS.OPS_META_V1 : MAGIC_NUMBERS.CONTRACT_META_V1, 
                "application/json", 
                { contentEncoding: "deflate" }
            )
        )
    );
}

/**
 * @public
 * Checks if the meta hash matches the opmeta by regenrating the meta hash from the given opmeta
 * 
 * @param opmeta - The op meta bytes
 * @param metaHash - The meta hash
 * @returns true if the meta hash matches the opmeta and false if it doesn't
 */
export function checkOpMetaHash(opmeta: string, metaHash: string) {
    return getMetaHash(opmeta, "op") === metaHash;
}