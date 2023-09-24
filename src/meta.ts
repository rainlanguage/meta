import { BytesLike } from "ethers";
import { AbiMeta } from "./types/abi";
import { MAGIC_NUMBERS } from "./magicNumbers";
import { ContractMeta } from "./types/contract";
import { RAIN_SUBGRAPHS } from "./rainSubgraphs";
import { AuthoringMeta } from "./types/authoring";
import { cborDecode, decodeCborMap, hexlify, isBytesLike } from "./utils";
import { DeployerMeta, searchNPDeployerMeta, searchNPMeta } from "./getNPMeta";


/**
 * @public Rain Meta namespace that provides the main functionalities of this library
 */
export namespace RainMeta {

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
        return cborDecode(value);
    }

    /**
     * @public Method that decodes a sinlge cbor map to its final value based on the map configs
     * @param map - The cbor map
     */
    export function decodeMap(map: Map<any, any>): Uint8Array | string {
        return decodeCborMap(map);
    }

    /**
     * @public Method to get NP meta from provided subgraphs
     * @param metaHash - The meta hash to search for
     * @param subgraphUrls - Subgraph urls to query from
     * @param timeout - Seconds to wait for query results to settle, if no settlement is found before timeout the promise will be rejected
     * @returns A promise that resolves with meta bytes as hex string and rejects if nothing found
     */
    export async function get(
        metaHash: string,
        subgraphUrls: string[],
        timeout = 5000
    ): Promise<string> {
        return searchNPMeta(metaHash, subgraphUrls, timeout);
    }

    /**
     * @public Method to get expression deployer meta from provided subgraphs
     * @param hash - The bytecode or constructor hash to search for
     * @param subgraphUrls - Subgraph urls to query from
     * @param timeout - Seconds to wait for query results to settle, if no settlement is found before timeout the promise will be rejected
     * @returns A promise that resolves with ABI meta bytes as hex string and rejects if nothing found
     */
    export async function getDeployerMeta(
        hash: string,
        subgraphUrls: string[],
        timeout = 5000
    ): Promise<DeployerMeta> {
        return searchNPDeployerMeta(hash, subgraphUrls, timeout);
    }
}
