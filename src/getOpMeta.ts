import { GraphQLClient } from "graphql-request";
import { sgBook } from "./subgraphBook";


/**
 * @public Get the query content
 * @param filter - Address or meta hash of the deployer
 * @returns The query content
 */
export const getQuery = (filter: string): string => {
    if (filter.match(/^0x[a-fA-F0-9]{40}$/)) {
        return `{ expressionDeployer(id: "${filter.toLowerCase()}") { opmeta } }`;
    }
    else if (filter.match(/^0x[a-fA-F0-9]{64}$/)) {
        return `{ expressionDeployers(where: { meta_: { id: "${
            filter.toLowerCase()
        }" } } first: 1) { opmeta } }`;
    }
    else throw new Error("invalid address or hash");
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
