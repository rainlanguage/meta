import { sgBook } from "./subgraphBook";
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
 * @param additionalSgUrls - Additional subgraph urls, default ones are on "sgBook"
 * @returns A promise that resolves with meta bytes as hex string and rejects if nothing found
 */
export async function searchMeta(
    metaHash: string,
    additionalSgUrls: string[] = []
): Promise<string> {
    const _query = getQuery(metaHash);
    const _sgs: string[] = [];
    _sgs.push(...additionalSgUrls);
    Object.values(sgBook).forEach(v=>{
        if (!_sgs.includes(v)) _sgs.push(v);
    });
    const _responses = await Promise.allSettled(_sgs.map(
        v => new GraphQLClient(
            v, 
            { headers: { "Content-Type":"application/json" } }
        )
            .request(_query))
    );
    for (const res of _responses) {
        if (res.status === "fulfilled") {
            if ((res.value as any)?.rainMetaV1?.metaBytes) {
                return (res.value as any).rainMetaV1.metaBytes;
            }
        }
    }
    throw new Error("could not find any result for this meta hash!");
}
