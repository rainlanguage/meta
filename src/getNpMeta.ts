import { MAGIC_NUMBERS } from "./magicNumbers";
import { isBytesLike } from "./utils";
import { GraphQLClient } from "graphql-request";


/**
 * @public The query search result from subgraph for NP meta, explicitly designed for Dotrain usage
 */
export type DeployerMeta = [
    {
        id: string; 
        rawBytes: string;
        magicNumber: bigint; 
    }, 
    {
        id: string; 
        rawBytes: string;
        magicNumber: bigint; 
    }
]

/**
 * @internal Method to check the returned value from sg for deployer meta
 */
function isValidResult(value: any): value is DeployerMeta {
    if (Array.isArray(value) && value.length > 1) {
        let hasAbi = false;
        let hasAuthroing = false;
        value.forEach(v => {
            if (BigInt(v.magicNumber) === MAGIC_NUMBERS.SOLIDITY_ABIV2) hasAbi = true;
            if (BigInt(v.magicNumber) === MAGIC_NUMBERS.AUTHORING_META_V1) hasAuthroing = true;
        });
        if (hasAbi && hasAuthroing) return value.every(v => {
            typeof v === "object"
                && v !== null
                && typeof v.id === "string"
                && isBytesLike(v.id)
                && v.id.length === 66
                && typeof v.rawBytes === "string"
                && isBytesLike(v.rawBytes)
                && typeof v.magicNumber === "string"
                && MAGIC_NUMBERS.is(BigInt(v.magicNumber));
        });
        else return false;
    }
    else return false;
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
 * Searches through multiple subgraphs to find the first matching expression deployer meta from bytecode hash
 * 
 * @param bytecodeHash - The bytecode hash to search for
 * @param subgraphUrls - Subgraph urls to query from
 * @param timeout - Seconds to wait for query results to settle, if no settlement is found before timeout the promise will be rejected
 * @returns A promise that resolves with array of meta bytes as hex string and rejects if nothing found
 */
export async function searchNPDeployerMeta(
    bytecodeHash: string,
    subgraphUrls: string[],
    timeout = 5000
): Promise<DeployerMeta> {
    if (!bytecodeHash.match(/^0x[a-fA-F0-9]{64}$/)) throw new Error("invalid bytecode hash");
    const _query = `{
    expressionDeployers(
        where: {meta_: {id: "${ bytecodeHash.toLowerCase() }"}}
        first: 1
    ) {
        meta(where: {or: [{magicNumber: "18440520426328744501"}, {magicNumber: "18439425400648969438"}]}) {
            id
            rawBytes
            magicNumber
        }
    }
}`;
    const _request = async(url: string): Promise<DeployerMeta> => {
        try {
            const _res = await new GraphQLClient(
                url, { headers: { "Content-Type":"application/json" }, timeout }
            ).request(_query) as any;
            if (!_res) Promise.reject(new Error("no matching record was found"));
            if (isValidResult(_res?.expressionDeployers[0])) {
                const result: DeployerMeta = [] as any;
                let abi = false;
                let authoring = false;
                _res.expressionDeployers[0].forEach(v => {
                    const mn = BigInt(v.magicNumber);
                    if (!abi && mn === MAGIC_NUMBERS.SOLIDITY_ABIV2) {
                        result.push({
                            id: v.id,
                            rawBytes: v.rawBytes,
                            magicNumber: mn
                        });
                        abi = true;
                    }
                    if (!authoring && mn === MAGIC_NUMBERS.AUTHORING_META_V1) {
                        result.push({
                            id: v.id,
                            rawBytes: v.rawBytes,
                            magicNumber: mn
                        });
                        authoring = true;
                    }
                });
                if (result.length === 2) return Promise.resolve(result);
                else return Promise.reject(new Error("unexpected returned value"));
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