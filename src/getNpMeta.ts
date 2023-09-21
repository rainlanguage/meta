import { MAGIC_NUMBERS } from "./magicNumbers";
import { GraphQLClient } from "graphql-request";
import { isAddress, isBytesLike } from "./utils";


/**
 * @public The query search result from subgraph for NP meta, explicitly designed for Dotrain usage
 */
export type NPMetaSearchResult = {
    __typename: string; 
    rawBytes: string; 
    magicNumber: bigint; 
    contracts: {  
        id: string;
        deployedBytecode: string;
        abimeta: string;
    }[]
}
namespace NPMetaSearchResult {
    export function is(value: any): value is NPMetaSearchResult {
        return typeof value === "object"
            && value !== null
            && typeof value.__typename === "string"
            && ( value.__typename === "RainMetaV1" || value.__typename === "ContentMetV1" )
            && isBytesLike(value.rawBytes)
            && MAGIC_NUMBERS.is(BigInt(value.magicNumber))
            && Array.isArray(value.contracts)
            && value.contracts.every((v: any) => typeof v === "object"
                && v !== null
                && "id" in v 
                ? isAddress(v.id) 
                    && isBytesLike(v.deployedBytecode) 
                    && Array.isArray(v.meta)
                    && v.meta.length === 1
                    && isBytesLike(v.meta[0].rawBytes)
                : true
            );
    }
}

/**
 * @public Get the query for NP meta
 * @param metaHash - The hash of the deployed meta
 * @returns The query string
 */
export const getNPQuery = (metaHash: string): string => {
    if (metaHash.match(/^0x[a-fA-F0-9]{64}$/)) {
        return `{ 
    meta( id: "${ metaHash.toLowerCase() }" ) { 
        __typename 
        rawBytes 
        magicNumber 
        contracts { 
            ... on ExpressionDeployer { 
                id
                deployedBytecode
                meta(where: { magicNumber: "18439425400648969438" }) {
                    rawBytes
                }
            } 
        } 
    } 
}`;
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
export async function searchNPMeta(
    metaHash: string,
    subgraphUrls: string[],
    timeout = 5000
): Promise<NPMetaSearchResult> {
    const _query = getNPQuery(metaHash);
    const _request = async(url: string): Promise<NPMetaSearchResult> => {
        try {
            const _res = (await new GraphQLClient(
                url, { headers: { "Content-Type":"application/json" }, timeout }
            ).request(_query) as any)?.meta;
            if (!_res) Promise.reject(new Error("no matching record was found"));
            if (NPMetaSearchResult.is(_res)) {
                _res.contracts = _res.contracts.filter(v => "id" in v);
                _res.contracts.forEach((v: any) => {
                    v.abimeta = v.meta[0].rawBytes;
                    delete v.meta;
                });
                return Promise.resolve(_res);
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
