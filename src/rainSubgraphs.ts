import { ChainId } from "./utils";


/**
 * @public Known Rain subgraph endpoints paired with EVM chain ids
 */
export const RAIN_SUBGRAPHS = {
    [ChainId.POLYGON]         : ["https://api.thegraph.com/subgraphs/name/rainprotocol/interpreter-registry-polygon"],
    [ChainId.POLYGON_TESTNET] : ["https://api.thegraph.com/subgraphs/name/rainprotocol/interpreter-registry"],
} as const;

export type RAIN_SUBGRAPHS = (typeof RAIN_SUBGRAPHS)[keyof typeof RAIN_SUBGRAPHS];