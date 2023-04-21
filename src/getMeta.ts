import { GraphQLClient } from "graphql-request";
import { sgBook } from "./subgraphBook";


/**
 * @public Get the query content
 * @param metaHash - hash of the deployed meta
 * @returns The query content
 */
export const getQuery = (metaHash: string): string => {
    if (metaHash.match(/^0x[a-fA-F0-9]{64}$/)) {
        return `{ rainMetaV1( id: "${
            metaHash.toLowerCase()
        }" ) { content { payload magicNumber } } }`;
    }
    else throw new Error("invalid meta hash");
};

/**
 * @public 
 * Searches through multiple subgraphs to find the first matching meta with the given hash
 * 
 * @param metaHash - The meta hash to search for
 * @param additionalSgUrls - Additional subgraph urls, default ones are on "sgBook"
 * @returns A promise that resolves with meta bytes as hex string and magic number and rejects if nothing found
 */
export async function searchMeta(
    metaHash: string,
    additionalSgUrls: string[] = []
): Promise<{ metaBytes: string, magicNumber: string }[]> {
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
            if ((res.value as any)?.rainMetaV1?.content?.length) {
                return (res.value as any).rainMetaV1?.content.map(
                    (v: any) => { 
                        return {
                            metaBytes: v.payload,
                            magicNumber: v.magicNumber
                        };
                    }
                );
            }
        }
    }
    throw new Error("could not find any result for this meta hash!");
}
