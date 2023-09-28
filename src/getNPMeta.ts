import { isBytesLike } from "./utils";
import { GraphQLClient } from "graphql-request";


/**
 * @public The query search result from subgraph for NP constructor meta
 */
export type DeployerMeta = {
    id: string;
    rawBytes: string;
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
        rawBytes
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
): Promise<string> {
    const _query = getNPQuery(metaHash);
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
 * @public 
 * Searches through multiple subgraphs to find the first matching expression deployer meta from bytecode/constructor hash
 * 
 * @param hash - The bytecode or constructor hash to search for
 * @param subgraphUrls - Subgraph urls to query from
 * @param timeout - Seconds to wait for query results to settle, if no settlement is found before timeout the promise will be rejected
 * @returns A promise that resolves with meta bytes and hash as hex string and rejects if nothing found
 */
export async function searchNPDeployerMeta(
    hash: string,
    subgraphUrls: string[],
    timeout = 5000
): Promise<DeployerMeta> {
    if (!hash.match(/^0x[a-fA-F0-9]{64}$/)) throw new Error("invalid bytecode hash");
    const _query = `{
    expressionDeployers(
        where: {meta_: {id: "${ hash.toLowerCase() }"}}
        first: 1
    ) {
        constructorMetaHash
        constructorMeta
    }
}`;
    const _request = async(url: string): Promise<DeployerMeta> => {
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
                id: _res.expressionDeployers[0].constructorMetaHash,
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