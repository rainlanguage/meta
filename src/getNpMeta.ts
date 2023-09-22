import { MAGIC_NUMBERS } from "./magicNumbers";
import { GraphQLClient } from "graphql-request";
import { isAddress, isBytesLike } from "./utils";


/**
 * @public The query search result from subgraph for NP meta, explicitly designed for Dotrain usage
 */
export type NPMetaSearchResult = {
    __typename: "RainMetaV1"; 
    id: string; 
    sequence: {
        id: string;
        payload: string;
        magicNumber: bigint;
    }[];
    contracts: {  
        id: string;
        timestamp: number;
        deployedBytecode: string;
        abimeta: string;
    }[];
} | {
    __typename: "ContentMetaV1"; 
    id: string; 
    payload: string;
    magicNumber: bigint; 
    contracts: {  
        id: string;
        timestamp: number;
        deployedBytecode: string;
        abimeta: string;
    }[];
}

function isValidResult(value: any): value is NPMetaSearchResult {
    return typeof value === "object"
        && value !== null
        && typeof value.id === "string"
        && isBytesLike(value.id)
        && value.id.length === 66
        && typeof value.__typename === "string"
        && ( value.__typename === "RainMetaV1" || value.__typename === "ContentMetV1" )
        && (
            "sequence" in value
                ? (
                    Array.isArray(value.sequence)
                    && value.sequence.length > 0
                    && value.sequence.every((v: any) => 
                        typeof v.id === "string"
                        && isBytesLike(v.id)
                        && v.id.length === 66
                        && isBytesLike(v.payload)
                        && MAGIC_NUMBERS.is(BigInt(v.magicNumber))
                    )
                )
                : (
                    isBytesLike(value.payload)
                    && MAGIC_NUMBERS.is(BigInt(value.magicNumber))
                )
        )
        && Array.isArray(value.contracts)
        && value.contracts.length > 0
        && value.contracts.every((v: any) => typeof v === "object"
            && v !== null
            && (
                "id" in v 
                    ? (
                        isAddress(v.id) 
                        && isBytesLike(v.deployedBytecode) 
                        && Array.isArray(v.meta)
                        && v.meta.length === 1
                        && isBytesLike(v.meta[0].payload)
                    )
                    : true
            )
        );
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
        id
        ... on RainMetaV1 {
            sequence(
                where: {or: [ 
                    {magicNumber: "18429323134567717275"},
                    {magicNumber: "18440520426328744501"} 
                ]}
            ) {
                id
                payload
                magicNumber
            }
        }
        ... on ContentMetaV1 {
            payload 
            magicNumber 
        }
        contracts { 
            ... on ExpressionDeployer { 
                id
                deployedBytecode
                deployTransaction {
                    timestamp
                }
                meta(where: { magicNumber: "18439425400648969438" }) {
                    payload
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
            if (isValidResult(_res)) {
                _res.contracts = _res.contracts.filter(v => "id" in v);
                _res.contracts.forEach((v: any) => {
                    v.abimeta = v.meta[0].payload;
                    delete v.meta;
                    v.timestamp = Number(v.deployTransaction.timestamp);
                    delete v.deployTransaction;
                });
                // _res.contracts.sort((a, b) => b.timestamp - a.timestamp);
                if (_res.__typename === "RainMetaV1") _res.sequence.forEach(v => {
                    v.magicNumber = BigInt(v.magicNumber);
                });
                else _res.magicNumber === BigInt(_res.magicNumber);
                return Promise.resolve(_res);
            }
            else return Promise.reject(new Error("unexpected returned value"));
        }
        catch (error) {
            return Promise.reject(error);
        }
    };

    if (!subgraphUrls.length) throw new Error("expected subgraph URL(s)");
    const _allResults: NPMetaSearchResult[] = (await Promise.allSettled(
        subgraphUrls.map(v => _request(v))
    )).filter(
        v => v.status === "fulfilled"
    ).map(
        v => (v as PromiseFulfilledResult<NPMetaSearchResult>).value
    );
    if (!_allResults.length) return Promise.reject("no matching record was found");
    else {
        const _mergedResult = _allResults.shift()!;
        _allResults.forEach(v => {
            v.contracts.forEach(e => {
                if (!_mergedResult.contracts.find(i => i.id === e.id)) {
                    _mergedResult.contracts.push(e);
                }
            });
        });
        _mergedResult.contracts.sort((a, b) => b.timestamp - a.timestamp);
        return _mergedResult;
    }
}
