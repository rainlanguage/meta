import { ChainId } from "./utils";


/**
 * @public Known Rain subgraph endpoints paired with EVM chain ids
 */
export const RAIN_SUBGRAPHS = {
    [ChainId.ETHEREUM]: [
        "https://api.thegraph.com/subgraphs/name/rainprotocol/interpreter-registry-ethereum",
        "https://api.thegraph.com/subgraphs/name/rainprotocol/interpreter-registry-np-eth"
    ],
    [ChainId.POLYGON]: [
        "https://api.thegraph.com/subgraphs/name/rainprotocol/interpreter-registry-polygon",
        "https://api.thegraph.com/subgraphs/name/rainprotocol/interpreter-registry-np-matic"
    ],
    [ChainId.POLYGON_TESTNET]: [
        "https://api.thegraph.com/subgraphs/name/rainprotocol/interpreter-registry",
        "https://api.thegraph.com/subgraphs/name/rainprotocol/interpreter-registry-np"
    ],
} as const;

export type RAIN_SUBGRAPHS = (typeof RAIN_SUBGRAPHS)[keyof typeof RAIN_SUBGRAPHS];