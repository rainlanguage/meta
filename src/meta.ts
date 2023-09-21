import { AbiMeta } from "./types/abi";
import { ContractMeta } from "./types/contract";
import { AuthoringMeta } from "./types/authoring";
import { NPMetaSearchResult, searchNPMeta } from "./getNpMeta";


/**
 * @public Rain Meta namespace that provides the main functionalities of this library
 */
export namespace RainMeta {

    export import Abi = AbiMeta;
    export import Contract = ContractMeta;
    export import Authoring = AuthoringMeta;

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
