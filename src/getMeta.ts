import { GraphQLClient } from "graphql-request";


/**
 * @public The query search result from subgraph for ameta hash
 */
export type MetaSearchResult = {
    /**
     * Sequence of meta bytes content
     */
    rainMetaV1: {
        metaBytes: string;
    };
    /**
     * Individual meta bytes content
     */
    metaContentV1: null;
} | {
    /**
     * Sequence of meta bytes content
     */
    rainMetaV1: null;
    /**
     * Individual meta bytes content
     */
    metaContentV1: {
        encodedData: string;
    };
};

/**
 * @public Get the query for RainMetaV1 and MetaContentV1
 * @param metaHash - hash of the deployed meta
 * @returns The query content
 */
export const getQuery = (metaHash: string): string => {
    if (metaHash.match(/^0x[a-fA-F0-9]{64}$/)) {
        return `{ rainMetaV1( id: "${
            metaHash.toLowerCase()
        }" ) { metaBytes } metaContentV1( id: "${
            metaHash.toLowerCase()
        }" ) { encodedData } }`;
    }
    else throw new Error("invalid meta hash");
};

/**
 * @public 
 * Searches through multiple subgraphs to find the first matching meta with the given hash
 * 
 * @param metaHash - The meta hash to search for
 * @param subgraphUrls - Subgraph urls to query from
 * @param timeout - Seconds to wait for query results to settle, if no settlement is found before timeout the promise will be rejected
 * @returns A promise that resolves with meta bytes as hex string and rejects if nothing found
 */
export async function searchMeta(
    metaHash: string,
    subgraphUrls: string[],
    timeout = 5000
): Promise<MetaSearchResult> {
    const _request = async(
        url: string,
        query: string,
        timeout: number
    ): Promise<MetaSearchResult> => {
        try {
            const _res = await new GraphQLClient(
                url, { headers: { "Content-Type":"application/json" }, timeout }
            ).request(query) as any;
            if (Object.values(_res).some(v => v !== null)) return Promise.resolve(
                _res as MetaSearchResult
            );
            else return Promise.reject("no matching record was found");
        }
        catch (error) {
            return Promise.reject(error);
        }
    };

    const _query = getQuery(metaHash);
    if (!subgraphUrls.length) throw new Error("expected subgraph URL(s)");
    return await Promise.any(subgraphUrls.map(v => _request(v, _query, timeout)));
}
