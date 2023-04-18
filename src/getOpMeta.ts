import { GraphQLClient } from "graphql-request";
import { sgBook } from "./subgraphBook";


/**
 * @public Get the query content
 * @param address - Address of the deployer
 * @returns The query content
 */
export const getQuery = (address: string): string => {
    if (address.match(/^0x[a-fA-F0-9]{40}$/)) {
        return `{ expressionDeployer(id: "${address.toLowerCase()}") { opmeta } }`;
    }
    else throw new Error("invalid address");
};

/**
 * @public Get the query content
 * @param metaHash - hash of the meta of the deployer contract
 * @returns The query content
 */
export const getQueryByHash = (metaHash: string): string => {
    if (metaHash.match(/^0x[a-fA-F0-9]{64}$/)) {
        return `{ expressionDeployers(where: { meta_: { id: "${
            metaHash.toLowerCase()
        }" } } first: 1) { opmeta } }`;
    }
    else throw new Error("invalid meta hash");
};

/**
 * @public Get the op meta from sg
 * @param deployerAddress - The address of the deployer to get the op meta from its emitted DISpair event
 * @param network - (optional) The network name, defaults to mumbai if not specified
 * @returns The op meta bytes
 */
export async function getOpMetaFromSg(
    deployerAddress: string, 
    network?: string
): Promise<string>;

/**
 * @public Get the op meta from sg
 * @param deployerAddress - The address of the deployer to get the op meta from its emitted DISpair event
 * @param chainId - (optional) The chain id of the network where the deployer is deployed at. default is Mumbai network
 * @returns The op meta bytes
 */
export async function getOpMetaFromSg(
    deployerAddress: string, 
    chainId?: number
): Promise<string>;

/**
 * @public Get the op meta from sg
 * @param deployerAddress - The address of the deployer to get the op meta from its emitted DISpair event
 * @param sgUrl - The subgraph endpoint URL to query from
 * @returns The op meta bytes
 */
export async function getOpMetaFromSg(
    deployerAddress: string, 
    sgUrl: string
): Promise<string>;

export async function getOpMetaFromSg(
    deployerAddress: string, 
    source: number | string = 0x80001
): Promise<string> {
    const _query = getQuery(deployerAddress);
    const _url = sgBook[source]
        ? sgBook[source]
        : typeof source === "number"
            ? new Error("no subgraph endpoint found for this chain id")
            : source.startsWith("https://api.thegraph.com/subgraphs/name/")
                ? source
                : new Error("no subgraph found");
    if (_url instanceof Error) throw _url;
    const graphQLClient = new GraphQLClient(_url, {headers: {"Content-Type":"application/json"}});
    const _response = (await graphQLClient.request(_query)) as any;
    if (_response?.expressionDeployer?.opmeta) return _response.expressionDeployer.opmeta;
    else throw new Error("could not fetch the data from subgraph");
}

/**
 * @public 
 * Searches through multiple subgraphs to find the first matching opmeta with provided meta hash
 * 
 * @param metaHash - The meta hash to search for
 * @param additionalSgUrls - Additional subgraph urls, default ones are on "sgBook"
 * @returns A promise that resolves with opmeta as hex string and rejects if nothing found
 */
export async function searchOpMeta(
    metaHash: string,
    additionalSgUrls: string[] = []
): Promise<string> {
    const _query = getQueryByHash(metaHash);
    const _sgs: string[] = [];
    _sgs.push(...additionalSgUrls);
    Object.values(sgBook).forEach(v=>{
        if (!_sgs.includes(v)) _sgs.push(v);
    });
    const _responses = await Promise.allSettled(_sgs.map(
        v => new GraphQLClient(v, {headers: {"Content-Type":"application/json"}}).request(_query))
    );
    for (const res of _responses) {
        if (res.status === "fulfilled") {
            if ((res.value as any)?.expressionDeployers[0]?.opmeta) {
                return (res.value as any).expressionDeployers[0].opmeta;
            }
        }
    }
    throw new Error("could not find any result for this meta hash!");
}
