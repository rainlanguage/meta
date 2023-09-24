import Ajv from "ajv";
import { OpMeta } from "./types/op";
import stringMath from "string-math";
import { AbiMeta } from "./types/abi";
import { deflate, inflate } from "pako";
import { format } from "prettier/standalone";
import { MAGIC_NUMBERS } from "./magicNumbers";
import { ContractMeta } from "./types/contract";
import babelParser from "prettier/parser-babel";
import { AuthoringMeta } from "./types/authoring";
import { decodeAllSync, encodeCanonical } from "cbor-web";
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
 * @public Validates an array of OpMetas
 * @param opmeta - The opmeta as a object, array of objects or string content
 */
export const validateOpMeta = (opmeta: any): opmeta is OpMeta[] => {
    const _expandBits = (bits: [number, number]) => {
        const _len = bits[1] - bits[0] + 1;
        const _result = [];
        for (let i = 0; i < _len; i++) {
            _result.push(bits[0] + i);
        }
        return _result;
    };
    if (
        typeof opmeta === "number"
        || typeof opmeta === "bigint"
        || typeof opmeta === "symbol"
        || typeof opmeta === "function"
        || typeof opmeta === "boolean"
        || typeof opmeta === "undefined"
    ) throw new Error("invalid opmeta type");
    if (typeof opmeta === "string") opmeta = JSON.parse(opmeta);
    if (!OpMeta.isArray(opmeta)) throw new Error("invalid opmeta type");
    else {
        // in-depth validation for op meta
        const _allAliases = [];
        const _opmeta = opmeta as any;
        for (let i = 0; i < _opmeta.length; i++) {
            let hasOperandArg = false;
            let hasInputOperandArg = false;
            let hasInputOperandArgComp = false;
            let hasOutputOperandArg = false;
            let hasOutputOperandArgComp = false;

            // cache all aliases for check across all ops
            _allAliases.push(_opmeta[i].name);
            if (_opmeta[i].aliases) _allAliases.push(..._opmeta[i].aliases);

            // check for operand args validity
            if (typeof _opmeta[i].operand !== "number") {
                hasOperandArg = true;
                let check = true;
                for (let j = 0; j < _opmeta[i].operand.length; j++) {
                    if (_opmeta[i].operand[j].name === "inputs") {
                        if (hasInputOperandArg) throw new Error(
                            `invalid meta for ${_opmeta[i].name}, reason: double "inputs" named operand args`
                        );
                        hasInputOperandArg = true;
                        if ("computation" in _opmeta[i].operand[j]) hasInputOperandArgComp = true;
                    }
                    if (_opmeta[i].operand[j].name === "outputs") {
                        if (hasOutputOperandArg) throw new Error(
                            `invalid meta for ${_opmeta[i].name}, reason: double "outputs" named operand args`
                        );
                        hasOutputOperandArg = true;
                        if ("computation" in _opmeta[i].operand[j]) hasOutputOperandArgComp = true;
                    }

                    // check computation validity
                    if ("computation" in _opmeta[i].operand[j]) {
                        let _comp = _opmeta[i].operand[j].computation;
                        _comp = _comp.replace(/arg/g, "30");
                        try { stringMath(_comp); }
                        catch { throw new Error(
                            `invalid meta for ${_opmeta[i].name}, reason: bad "computation" equation for ${_opmeta[i].operand[j].name}`
                        );}
                    }
                    // bits range validity
                    if (_opmeta[i].operand[j].bits[0] > _opmeta[i].operand[j].bits[1]) {
                        throw new Error(
                            `invalid meta for ${_opmeta[i].name}, reason: start bit greater than end bit for ${_opmeta[i].operand[j].name}`
                        );
                    }
                    // check bits
                    const _range1 = _expandBits(_opmeta[i].operand[j].bits);
                    for (let k = j + 1; k < _opmeta[i].operand.length; k++) {
                    // check order of operand args by bits index from low bits to high
                        if (_opmeta[i].operand[j].bits[0] <= _opmeta[i].operand[k].bits[1]) {
                            throw new Error(
                                `invalid meta for ${_opmeta[i].name}, reason: bad operand args order, should be from high to low`
                            );
                        }
                        // check operand args bits overlap
                        const _range2 = _expandBits(_opmeta[i].operand[k].bits);
                        _range1.forEach(v => {
                            if (_range2.includes(v)) check = false;
                        });
                        if (!check) throw new Error(
                            `invalid meta for ${_opmeta[i].name}, reason: operand args bits overlap`
                        );
                    }
                }
            }

            // check for inputs bits and computation validity and validity against operand
            if (typeof _opmeta[i].inputs !== "number") {
            // check validity against operand
                if (hasInputOperandArg) {
                    if (!("bits" in _opmeta[i].inputs)) throw new Error(
                        `invalid meta for ${_opmeta[i].name}, reason: must have specified "bits" field for inputs`
                    );
                    if (hasInputOperandArgComp) {
                        if (!("computation" in _opmeta[i].inputs)) throw new Error(
                            `invalid meta for ${_opmeta[i].name}, reason: must have specified "computation" field for inputs`
                        );
                    }
                    else {
                        if ("computation" in _opmeta[i].inputs) throw new Error(
                            `invalid meta for ${_opmeta[i].name}, reason: unexpected "computation" field for inputs`
                        );
                    }
                }
                else {
                    if ("bits" in _opmeta[i].inputs || "computation" in _opmeta[i].inputs) throw new Error(
                        `invalid meta for ${_opmeta[i].name}, reason: unexpected "bits" or "computation" fields for inputs`
                    );
                }
                // check bits range validity
                if ("bits" in _opmeta[i].inputs) {
                    if (_opmeta[i].inputs.bits[0] > _opmeta[i].inputs.bits[1]) throw new Error(
                        `invalid meta for ${_opmeta[i].name}, reason: start bit greater than end bit for inputs`
                    );
                }
                // check computation validity
                if ("computation" in _opmeta[i].inputs) {
                    let _comp = _opmeta[i].inputs.computation;
                    _comp = _comp.replace(/bits/g, "30");
                    try { stringMath(_comp); }
                    catch { throw new Error(
                        `invalid meta for ${_opmeta[i].name}, reason: bad "computation" equation for inputs`
                    );}
                }
            }
            else {
                if (hasInputOperandArg) throw new Error(
                    `invalid meta for ${_opmeta[i].name}, reason: unexpected input type, must be derived from bits`
                );
            }

            // check for outputs bits and computation validity and validity against operand
            if (typeof _opmeta[i].outputs !== "number") {
            // check validity against operand
                if (!hasOperandArg) throw new Error(
                    `invalid meta for ${_opmeta[i].name}, reason: cannot have computed output`
                );
                if (hasOutputOperandArg) {
                    if (hasOutputOperandArgComp) {
                        if (!("computation" in _opmeta[i].outputs)) throw new Error(
                            `invalid meta for ${_opmeta[i].name}, reason: must have specified "computation" field for outputs`
                        );
                    }
                    else {
                        if ("computation" in _opmeta[i].outputs) throw new Error(
                            `invalid meta for ${_opmeta[i].name}, reason: unexpected "computation" field for outputs`
                        );
                    }
                }
                // check bits range validity
                if (_opmeta[i].outputs.bits[0] > _opmeta[i].outputs.bits[1]) throw new Error(
                    `invalid meta for ${_opmeta[i].name}, reason: start bit greater than end bit for outputs`
                );
                // check computation validity
                if ("computation" in _opmeta[i].outputs) {
                    let _comp = _opmeta[i].outputs.computation;
                    _comp = _comp.replace(/bits/g, "30");
                    try { stringMath(_comp); }
                    catch { throw new Error(
                        `invalid meta for ${_opmeta[i].name}, reason: bad "computation" equation for outputs`
                    );}
                }
            }
            else {
                if (hasOutputOperandArg) throw new Error(
                    `invalid meta for ${_opmeta[i].name}, reason: unexpected output type, must be derived from bits`
                );
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
    }
};

/**
 * @public
 * Validate a meta or array of metas against a schema
 *
 * @param meta - A meta object or array of meta objects or stringified format of them
 * @param schema - Json schema to validate as object (JSON.parsed) or stringified format
 * @returns boolean
 */
export const validateMetaBySchema = (
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
                    if ("bits" in _meta[i].inputs || "computation" in _meta[i].inputs) throw new Error(
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
 * @deprecated
 * @public
 * Method to compress and generate deployable bytes for op meta
 *
 * @param meta - Array of OpMeta items
 * @returns Bytes as HexString
 */
export function bytesFromMeta(opMeta: OpMeta[]): string

/**
 * @deprecated
 * @public
 * Method to compress and generate deployable bytes for contract meta
 *
 * @param meta - ContractMeta item
 * @returns Bytes as HexString
 */
export function bytesFromMeta(contractMeta: ContractMeta): string

/**
 * @deprecated
 * @public
 * Method to compress and generate deployable bytes for Authoring meta
 *
 * @param meta - Array of AuthoringMeta items
 * @returns Bytes as HexString
 */
export function bytesFromMeta(authoringMeta: AuthoringMeta[]): string

/**
 * @public
 * Method to compress and generate deployable bytes for ABI meta
 *
 * @param meta - ABI meta
 * @returns Bytes as HexString
 */
export function bytesFromMeta(abiMeta: AbiMeta): string

/**
 * @deprecated
 * @public
 * Method to compress and generate deployable bytes for any meta as string
 *
 * @param meta - The raw string content of the meta
 * @returns Bytes as HexString
 */
export function bytesFromMeta(meta: string): string

export function bytesFromMeta(
    meta: OpMeta[] | ContractMeta | string | AuthoringMeta[] | AbiMeta,
): string {
    let _meta;
    let raw = false;
    if (typeof meta === "string") _meta = meta;
    else if (OpMeta.isArray(meta) || ContractMeta.is(meta) || AbiMeta.is(meta)) _meta = format(
        JSON.stringify(meta, null, 4), 
        { parser: "json",  plugins: [ babelParser ] }
    );
    else if (AuthoringMeta.isArray(meta)) {
        _meta = arrayify(defaultAbiCoder.encode(
            [ AuthoringMeta.Struct ],
            [ meta.map(v => {
                return {
                    word: hexlify(
                        Uint8Array.from(v.word.split("").map(v => v.charCodeAt(0)))
                    ).padEnd(66, "0"),
                    operandParserOffset: v.operandParserOffset,
                    description: v.description
                };
            }) ]
        ));
        raw = false;
    }
    else throw new Error("invalid type for meta");
    return hexlify(deflate(_meta, { raw }), { allowMissingPrefix: true });
}

/**
 * @deprecated
 * @public
 * Decompress and convert bytes to meta as string
 *
 * @param bytes - Bytes to decompress and convert to json string
 * @param encoding - The meta encoding type, default is "json"
 * @returns meta content as string
 */
export const metaFromBytes = (bytes: BytesLike, encoding: "json" | "cbor" = "json"): string => {
    const _byteArray = arrayify(bytes, { allowMissingPrefix: true });
    try {
        if (encoding === "cbor") return hexlify(
            inflate(_byteArray, { raw: false }),
            { allowMissingPrefix: true }
        );
        else return inflate(_byteArray, { raw: false, to: "string" });
    }
    catch (err1) {
        try {
            if (encoding === "cbor") return hexlify(
                inflate(_byteArray, { raw: true }),
                { allowMissingPrefix: true }
            );
            else return inflate(_byteArray, { raw: true, to: "string" });
        }
        catch (err2) {
            throw {
                message: "could not get meta",
                inflateTry: err1,
                rawInflateTry: err2
            };
        }
    }
};

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
 * @public Method to get array of OpMetas from a meta string content 
 * @param meta - The meta to convert to OpMeta if it has valid content
 * @returns array of OpMeta objects
 */
export const toOpMeta = (meta: string): OpMeta[] => {
    let parsed = JSON.parse(meta);
    if (!Array.isArray(parsed)) parsed = [parsed];
    if (validateOpMeta(parsed)) return parsed;
    else throw new Error("invalid op meta content");
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
    return decodeAllSync(dataEncoded_.startsWith("0x")
        ? dataEncoded_.slice(2)
        : dataEncoded_
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
export const cborEncode = (
    payload_: string | number | Uint8Array | ArrayBuffer,
    magicNumber_: MAGIC_NUMBERS,
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
 * @public CBOR encode given a map object
 * @param map - The cbor map
 * @returns The data encoded with CBOR as an hex string.
 */
export const cborMapEncode = (map: Map<number, any>): string => {
    return encodeCanonical(map).toString("hex").toLowerCase();
};

/**
 * @deprecated
 * @public Calculates the hash for a given meta
 * @param metaBytes - The meta bytes to get the hash from
 * @param magicNumbers - The magic number associated with the metaBytes
 * @returns The meta hash
 */
export function getMetaHash(metaBytes: BytesLike[], magicNumbers: MAGIC_NUMBERS[]): string {
    let body = "";
    if (metaBytes.length !== magicNumbers.length) throw new Error(
        "metaBytes and magicNumbers length don't match"
    );
    else {
        for (let i = 0; i < metaBytes.length; i++) {
            body = body + cborEncode(
                arrayify(metaBytes[i]).buffer, 
                magicNumbers[i], 
                "application/json", 
                { contentEncoding: "deflate" }
            );
        }
    }
    return keccak256(
        "0x" + 
        MAGIC_NUMBERS.RAIN_META_DOCUMENT.toString(16) +
        body
    );
}

/**
 * @deprecated
 * @public
 * Checks if the meta hash matches the meta bytes by regenrating the hash
 * 
 * @param metaHash - The meta hash
 * @param metaBytes - The meta bytes
 */
export function checkMetaHash(
    metaHash: string,
    metaBytes: BytesLike, 
): boolean

/**
 * @deprecated
 * @public
 * Checks if meta hash matches the array of meta sequence by regenrating the hash
 * 
 * @param metaHash - The meta hash
 * @param metaBytes - Array of meta bytes
 * @param magicNumbers - Array of magic numbers associated with meta bytes
 */
export function checkMetaHash(
    metaHash: string,
    metaBytes: BytesLike[], 
    magicNumbers: MAGIC_NUMBERS[]
): boolean

export function checkMetaHash(
    metaHash: string,
    metaBytes: BytesLike[] | BytesLike,
    magicNumbers?: MAGIC_NUMBERS[]
): boolean {
    if (isBytesLike(metaBytes)) return keccak256(metaBytes) === metaHash;
    else return getMetaHash(metaBytes, magicNumbers!) === metaHash;
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
