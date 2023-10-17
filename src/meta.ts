import { inflate } from "pako";
import { BytesLike } from "ethers";
import { AbiMeta } from "./types/abi";
import { MAGIC_NUMBERS } from "./magicNumbers";
import { GraphQLClient } from "graphql-request";
import { ContractMeta } from "./types/contract";
import { RAIN_SUBGRAPHS } from "./rainSubgraphs";
import { AuthoringMeta } from "./types/authoring";
import { 
    hexlify, 
    arrayify, 
    keccak256, 
    cborDecode, 
    cborEncode, 
    isBytesLike, 
    cborEncodeMap, 
    stringToUint8Array 
} from "./utils";


/**
 * @public The namespace that packs all that is needed to work with Rain metas
 */
export namespace Meta {
    /**
     * @public Provides ABI meta functionalities
     */
    export import Abi = AbiMeta;

    /**
     * @public Provides Contract meta functionalities
     */
    export import Contract = ContractMeta;

    /**
     * @public Provides Authoring meta functionalities
     */
    export import Authoring = AuthoringMeta;

    /**
     * @public Provides every functionality for Magic Numbers
     */
    export import MagicNumbers = MAGIC_NUMBERS;

    /**
     * @public Provides every functionality for Rain subgraphs
     */
    export const Subgraphs = RAIN_SUBGRAPHS;
    export type Subgraphs = Exclude<
        (typeof Subgraphs)[keyof typeof Subgraphs],
        (...args: any[]) => any
    >[number]

    /**
     * @public known content types of rain metas
     */
    export const ContentTypes = [
        "application/json", 
        "application/cbor", 
        "application/octet-stream", 
        "text/plain"
    ] as const;
    export type ContentTypes = typeof ContentTypes[number];

    /**
     * @public known content encoding of rain metas
     */
    export const ContentEncodings = [
        "deflate"
    ] as const;
    export type ContentEncodings = typeof ContentEncodings[number];

    /**
     * @public known content language of rain metas
     */
    export const ContentLanguages = [
        "en"
    ] as const;
    export type ContentLanguages = typeof ContentLanguages[number];

    /**
     * @public The query search result from subgraph for NP constructor meta
     */
    export type NPConstructor = {
        /**
         * NP constructor meta hash
         */
        hash: string;
        /**
         * NP constructor meta raw bytes
         */
        rawBytes: string;
    }

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
            if (!contentType || !ContentTypes.includes(contentType)) throw new Error("unknown content type");
            if (contentEncoding !== undefined && !ContentEncodings.includes(contentEncoding)) throw new Error("unknown content encoding");
            if (contentLanguage !== undefined && !ContentLanguages.includes(contentLanguage)) throw new Error("unknown content language");
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
     * @param hash - The bytecode meta or constructor meta hash to search for
     * @param subgraphUrls - Subgraph urls to query from
     * @param timeout - Seconds to wait for query results to settle, if no settlement is found before timeout the promise will be rejected
     * @returns A promise that resolves with ABI meta bytes as hex string and rejects if nothing found
     */
    export async function searchDeployer(
        hash: string,
        subgraphUrls: string[],
        timeout = 5000
    ): Promise<NPConstructor> {
        if (!hash.match(/^0x[a-fA-F0-9]{64}$/)) throw new Error("invalid bytecode hash");
        const _query = `{ expressionDeployers(where: {meta_: {id: "${ hash.toLowerCase() }"}} first: 1) { constructorMetaHash constructorMeta }}`;
        const _request = async(url: string): Promise<NPConstructor> => {
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
                    hash: _res.expressionDeployers[0].constructorMetaHash,
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
            contentType: ContentTypes,
            contentEncoding?: ContentEncodings,
            contentLanguage?: ContentLanguages
        }[],
        asRainDocument: boolean
    ): Promise<string>
    export async function hash(
        items: {
            payload: BytesLike,
            magicNumber: MAGIC_NUMBERS,
            contentType: ContentTypes,
            contentEncoding?: ContentEncodings,
            contentLanguage?: ContentLanguages
        }[] | Map<any, any>[],
        asRainDocument: boolean
    ): Promise<string> {
        return keccak256(await encode(items as any, asRainDocument)).toLowerCase();
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
            contentType: ContentTypes,
            contentEncoding?: ContentEncodings,
            contentLanguage?: ContentLanguages
        }[],
        asRainDocument: boolean
    ): Promise<string>
    export async function encode(
        items: {
            payload: BytesLike,
            magicNumber: MAGIC_NUMBERS,
            contentType: ContentTypes,
            contentEncoding?: ContentEncodings,
            contentLanguage?: ContentLanguages
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
                    arrayify(_items[i].payload, {  allowMissingPrefix: true }), 
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
                if (!contentType || !ContentTypes.includes(contentType)) return false;
                if (
                    contentEncoding !== undefined && 
                    !ContentEncodings.includes(contentEncoding)
                ) return false;
                if (
                    contentLanguage !== undefined && 
                    !ContentLanguages.includes(contentLanguage)
                ) return false;
            }
            catch {
                return false;
            }
            return true;
        }
        else return false;
    }

    /**
     * @public 
     * Reads, stores and simply manages k/v pairs of meta hash and meta bytes and provides the functionalities 
     * to easliy utilize them. Hashes must 32 bytes (in hex string format) and will 
     * be stored as lower case.
     * Meta bytes must be valid cbor encoded.
     * 
     * Given a k/v pair of meta hash and meta bytes either at instantiation or when using `updateStore()`,
     * it regenrates the hash from the meta to check the validity of the k/v pair and if the check
     * fails it tries to read the meta from subgraphs and store the result if it finds any.
     * 
     * @example
     * ```typescript
     * // to instantiate with including default subgraphs
     * const store = new Store();   // pass 'false' to not include default rain subgraph endpoints
     * 
     * // or to instantiate with initial arguments
     * const store = await Store.create(options);
     * 
     * // add a new subgraph endpoint url to the subgraph list
     * store.addSubgraphs(["sg-url-1", "sg-url-2", ...])
     * 
     * // update the store with a new Store object (merges the stores)
     * await store.update(newMetaStore)
     * 
     * // updates the meta store with a new meta
     * await store.update(metaHash, metaBytes)
     * 
     * // updates the meta store with a new meta by searching through subgraphs
     * await store.update(metaHash)
     * 
     * // to get a record from store
     * const meta = store.getMeta(metaHash);
     * 
     * // to get a authoringMeta record from store
     * const am = store.getAuthoringMeta(authoringMetaHash);
     * ```
     */
    export class Store {
        /**
         * Subgraph endpoint URLs of this store instance
         */
        public readonly subgraphs: string[] = [];
        /**
         * @internal k/v cache for hashs and their contents
         */
        private cache: { [hash: string]: string | null } = {};
        /**
         * @internal k/v cache for authoring meta hashs and abi encoded bytes
         */
        private amCache: { [hash: string]: string } = {};
        /**
         * @public k/v cache for local dotrain files path and hashs
         */
        public readonly dotrainCache: { [uri: string]: string } = {};

        /**
         * @public Constructor of the class
         * Use `Store.create` to instantiate with initial options.
         */
        constructor(includeDefualtSubgraphs = true) {
            if (includeDefualtSubgraphs) Object.values(RAIN_SUBGRAPHS).forEach(v => {
                if (typeof v !== "function") v.forEach(e => {
                    if (!this.subgraphs.includes(e) && e.includes("interpreter-registry-np")) {
                        this.subgraphs.push(e);
                    }
                });
            });
        }

        /**
         * @public Creates a fresh instance of Store object
         * @param options - (optional) Options for instantiation
         */
        public static async create(
            options?: {
                /**
                 * Option to include default subgraphs
                 */
                includeDefaultSubgraphs?: boolean;
                /**
                 * Additional subgraphs endpoint URLs to include
                 */
                subgraphs?: string[];
                /**
                 * Records to add to the cache
                 */
                records?: { [hash: string]: string }
            }
        ): Promise<Store> {
            const store = new Store(!!options?.includeDefaultSubgraphs);
            if (options?.subgraphs && options.subgraphs.length) {
                store.addSubgraphs(options?.subgraphs, false);
            }
            if (options?.records) {
                for (const hash in options.records) {
                    await store.update(hash, options.records[hash]);
                }
            }
            return store;
        }

        /**
         * @public Get meta for a given meta hash
         * @param metaHash - The meta hash
         * @returns A MetaRecord or undefined if no matching record exists or null if the record has no sttlement
         */
        public getMeta(metaHash: string): string | undefined | null {
            return this.cache[metaHash.toLowerCase()];
        }

        /**
         * @public Get the whole meta cache
         */
        public getCache(): { [hash: string]: string | null } {
            return this.cache;
        }

        /**
         * @public Get the whole authoring meta cache
         */
        public getAuthoringMetaCache(): { [hash: string]: string } {
            return this.amCache;
        }

        /**
         * @public Updates the whole store with the given Store instance
         * @param store - A Store object instance
         */
        public update(store: Store): void

        /**
         * @public Updates the meta store for the given meta hash and meta raw bytes
         * @param metaHash - The meta hash (32 bytes hex string)
         * @param metaBytes - The raw meta bytes
         */
        public async update(metaHash: string, metaBytes: string): Promise<void>

        /**
         * @public Updates the meta store for the given meta hash by reading from subgraphs
         * @param metaHash - The meta hash (32 bytes hex string)
         */
        public async update(metaHash: string): Promise<void>

        public async update(hashOrStore: string | Store, metaBytes?: string) {
            if (hashOrStore instanceof Store) {
                this.merge({
                    subgraphs: hashOrStore.subgraphs,
                    cache: hashOrStore.cache,
                    amCache: hashOrStore.amCache,
                    dotrainCache: hashOrStore.dotrainCache,
                });
            }
            else {
                if (hashOrStore.match(/^0x[a-fA-F0-9]{64}$/)) {
                    const hash = hashOrStore.toLowerCase();
                    if (!this.cache[hash]) {
                        if (metaBytes) {
                            if (!metaBytes.startsWith("0x")) metaBytes = "0x" + metaBytes;
                            try {
                                if (keccak256(metaBytes).toLowerCase() === hash) {
                                    this.cache[hash] = metaBytes.toLowerCase();
                                    await this.storeContent(metaBytes);
                                }
                                else {
                                    if (!this.cache[hash]) this.cache[hash] = null;
                                }
                            }
                            catch {
                                if (!this.cache[hash]) this.cache[hash] = null;
                            }
                        }
                        else {
                            try {
                                const _metaBytes = await search(hashOrStore, this.subgraphs);
                                this.cache[hash] = _metaBytes;
                                await this.storeContent(_metaBytes);
                            }
                            catch {
                                if (!this.cache[hash]) this.cache[hash] = null;
                                // console.log(`cannot find any settlement for hash: ${hashOrStore}`);
                            }
                        }
                    }
                }
            }
        }

        /**
         * @public Adds a new subgraphs endpoint URL to the subgraph list
         * @param subgraphUrls - Array of subgraph endpoint URLs
         * @param sync - Option to search for settlement for unsetteled hashs in the cache with new added subgraphs, default is true
         */
        public async addSubgraphs(subgraphUrls: string[], sync = true) {
            subgraphUrls.forEach(sg => {
                if (typeof sg === "string" && sg) {
                    if (!this.subgraphs.includes(sg)) this.subgraphs.push(sg);
                }
            });
            if (sync) for (const hash in this.cache) {
                if (this.cache[hash] === undefined || this.cache[hash] === null) {
                    try {
                        const _metaBytes = await search(hash, this.subgraphs);
                        this.cache[hash.toLowerCase()] = _metaBytes;
                        await this.storeContent(_metaBytes);
                    }
                    catch {
                        if (!this.cache[hash.toLowerCase()]) this.cache[hash.toLowerCase()] = null;
                    }
                }
            }
        }

        /**
         * @internal Stores the meta content items into the store if a Meta is RainDocument
         * @param rawBytes - The bytes to check and store
         */
        private async storeContent(rawBytes: string) {
            if (!rawBytes.startsWith("0x")) rawBytes = "0x" + rawBytes;
            if (rawBytes.toLowerCase().startsWith(
                "0x" + MAGIC_NUMBERS.RAIN_META_DOCUMENT.toString(16).toLowerCase()
            )) {
                try {
                    const maps = decode(rawBytes);
                    for (let i = 0; i < maps.length; i++) {
                        const bytes = await encode([maps[i]], false);
                        const hash = keccak256(bytes).toLowerCase();
                        if (!this.cache[hash]) this.cache[hash] = bytes;
                        if (maps[i].get(1) === MAGIC_NUMBERS.AUTHORING_META_V1) {
                            const abiEncodedBytes = decodeMap(maps[i]);
                            if (typeof abiEncodedBytes !== "string") {
                                const hex = hexlify(
                                    abiEncodedBytes, 
                                    { allowMissingPrefix: true }
                                ).toLowerCase();
                                const h = keccak256(hex).toLowerCase();
                                if (!this.amCache[h]) this.amCache[h] = hex;
                            }
                        }
                    }
                }
                catch { /**/ }
            }
            else {
                try {
                    const amMap = decode(rawBytes).find(
                        v => v.get(1) === MAGIC_NUMBERS.AUTHORING_META_V1
                    );
                    if (amMap) {
                        const abiEncodedBytes = decodeMap(amMap);
                        if (typeof abiEncodedBytes !== "string") {
                            const hex = hexlify(
                                abiEncodedBytes, 
                                { allowMissingPrefix: true }
                            ).toLowerCase();
                            const hash = keccak256(hex).toLowerCase();
                            if (!this.amCache[hash]) this.amCache[hash] = hex;
                    
                        }
                    }
                }
                catch { /**/ }
            }
        }

        /**
         * @public Get authoring meta for a given hash
         * @param hash - The hash
         * @param type - Determines if the hash is an authoringMeta or deployer bytecode meta hash
         * @returns AuthoringMeta bytes or undefined if no matching record was found
         */
        public async getAuthoringMeta(
            hash: string,
            type: "deployer-bytecode-hash" | "authoring-meta-hash"
        ): Promise<string | undefined> {
            if (type === "authoring-meta-hash") return this.amCache[hash.toLowerCase()];
            else {
                try {
                    const _deployerMeta = await searchDeployer(hash, this.subgraphs);
                    this.update(_deployerMeta.hash, _deployerMeta.rawBytes);
                    const amMap = decode(_deployerMeta.rawBytes).find(
                        v => v.get(1) === MAGIC_NUMBERS.AUTHORING_META_V1
                    );
                    if (amMap) {
                        const abiEncodedBytes = decodeMap(amMap);
                        if (typeof abiEncodedBytes !== "string") return hexlify(
                            abiEncodedBytes, 
                            { allowMissingPrefix: true }
                        ).toLowerCase();
                        else return undefined;
                    }
                    else return undefined;
                }
                catch { return undefined; }
            }
        }

        /**
         * @public Stores (or updates in case the URI already exists) dotrain text as meta into the store cache 
         * and map it to the provided path it should be noted that reading the content of the dotrain is not in 
         * the scope of Store and handling and passing on a correct URI (path) for the text must be handled 
         * externally by the implementer
         * @param text - The dotrain text
         * @param uri - The dotrain file URI (path)
         * @param keepOld - In case of update, if the previous dotrain meta with same URI must be kept in the store or not, default is false
         */
        public async storeDotrain(
            text: string,
            uri: string, 
            keepOld = false
        ): Promise<{ newHash: string; oldHash?: string }> {
            const _dotrainMeta = (await encode([{
                payload: stringToUint8Array(text),
                magicNumber: MagicNumbers.DOTRAIN_V1,
                contentType: "application/octet-stream"
            }], false)).toLowerCase();
            const _dotrainMetaHash = keccak256(_dotrainMeta).toLowerCase();
            if (this.dotrainCache[uri] !== undefined) {
                if (this.dotrainCache[uri]!.toLowerCase() !== _dotrainMetaHash) {
                    const _oldHash = this.dotrainCache[uri]!.toLowerCase();
                    if (this.cache[_oldHash]) {
                        if (!keepOld) delete this.cache[_oldHash];
                    }
                    this.dotrainCache[uri] = _dotrainMetaHash;
                    this.cache[_dotrainMetaHash] = _dotrainMeta;
                    return { newHash: _dotrainMetaHash, oldHash: _oldHash };
                }
                else {
                    if (!this.cache[_dotrainMetaHash]) this.cache[_dotrainMetaHash] = _dotrainMeta;
                    return { newHash: _dotrainMetaHash };
                }
            }
            else {
                this.dotrainCache[uri] = _dotrainMetaHash;
                this.cache[_dotrainMetaHash] = _dotrainMeta;
                return { newHash: _dotrainMetaHash };
            }
        }

        /**
         * @public Method to get dotrain meta from an URI (file path)
         * @param uri - The dotrain file URI
         */
        public getDotrainMeta(uri: string): string | undefined | null {
            if (!this.dotrainCache[uri]) return undefined;
            else return this.getMeta(this.dotrainCache[uri]!);
        }

        /**
         * @public Method to delete dotrain from store
         * @param uri - The dotrain URI
         * @param keepMeta - If the meta should be kept or not
         */
        public deleteDotrain(uri: string, keepMeta = false) {
            if (this.dotrainCache[uri] !== undefined) {
                if (!keepMeta) delete this.cache[this.dotrainCache[uri]];
                delete this.dotrainCache[uri];
            }
        }

        /**
         * @public Blindly merges kv into the instance of meta store, should be used with caution as
         * it does not do any checks on the given values
         * @param properties - The properties to merge
         */
        public merge(
            properties: {
                subgraphs?: string[];
                cache?: { [hash: string]: string | null }; 
                amCache?: { [hash: string]: string };  
                dotrainCache?: { [hash: string]: string };
            }
        ) {
            if (properties.subgraphs) properties.subgraphs.forEach(sg => {
                if (typeof sg === "string" && sg) {
                    if (!this.subgraphs.includes(sg)) this.subgraphs.push(sg);
                }
            });
            if (properties.cache) for (const hash in properties.cache) {
                if (!this.cache[hash.toLowerCase()]) {
                    this.cache[hash.toLowerCase()] = properties.cache[hash] !== null
                        ? properties.cache[hash]!.toLowerCase() 
                        : null;
                }
            }
            if (properties.amCache) for (const hash in properties.amCache) {
                if (!this.amCache[hash.toLowerCase()]) {
                    this.amCache[hash.toLowerCase()] = properties.amCache[hash].toLowerCase();
                }
            }
            if (properties.dotrainCache) for (const hash in properties.dotrainCache) {
                const _h = hash.toLowerCase();
                if (!this.dotrainCache[_h]) {
                    this.dotrainCache[_h] = properties.dotrainCache[hash].toLowerCase();
                }
            }
        }
    }
}
