import { GraphQLClient } from "graphql-request";


/**
 * @public Get the query content
 * @param metaHash - hash of the deployed meta
 * @returns The query content
 */
export const getQuery = (metaHash: string): string => {
    if (metaHash.match(/^0x[a-fA-F0-9]{64}$/)) {
        return `{ rainMetaV1( id: "${
            metaHash.toLowerCase()
        }" ) { metaBytes } }`;
    }
    else throw new Error("invalid meta hash");
};

/**
 * @public 
 * Searches through multiple subgraphs to find the first matching meta with the given hash
 * 
 * @param metaHash - The meta hash to search for
 * @param subgraphUrls - Subgraph urls to query from
 * @returns A promise that resolves with meta bytes as hex string and rejects if nothing found
 */
export async function searchMeta(
    metaHash: string,
    subgraphUrls: string[]
): Promise<string> {
    const _query = getQuery(metaHash);
    if (!subgraphUrls.length) throw new Error("no subgraph URL provided");
    try {
        const _res = Promise.any(subgraphUrls.map(v => 
            new GraphQLClient(
                v, { headers: { "Content-Type":"application/json" } }
            ).request(_query))
        );
        if ((_res as any)?.rainMetaV1?.metaBytes) {
            return Promise.resolve((_res as any).rainMetaV1.metaBytes);
        }
        else return Promise.reject("could not find any result for this meta hash!");
    }
    catch (error) {
        return Promise.reject("could not find any result for this meta hash!");
    }
}
