import { AbiMeta } from "./types/abi";
import { MAGIC_NUMBERS } from "./magicNumbers";
import { ContractMeta } from "./types/contract";
import { RAIN_SUBGRAPHS } from "./rainSubgraphs";
import { AuthoringMeta } from "./types/authoring";
import { NPMetaSearchResult, searchNPMeta } from "./getNpMeta";


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
    ): Promise<NPMetaSearchResult> {
        return searchNPMeta(metaHash, subgraphUrls, timeout);
    }

}
