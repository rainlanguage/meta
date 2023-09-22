import { ChainId } from "./chains";


/**
 * @public The graph protcol endpoint for querying about deployed subgraphs
 * Schema of this subgraph can be found here:
 * https://github.com/graphprotocol/graph-node/blob/master/server/index-node/src/schema.graphql
 */
export const STATUS_SUBGRAPH = "https://api.thegraph.com/index-node/graphql" as const;

/**
 * @public Known Rain subgraph endpoints paired with EVM chain ids
 */
export const RAIN_SUBGRAPHS = {
    /**
     * @public Method to check if a given URL is a known Rain subgraph
     * @param value - The value to check
     */
    is: (value: any): boolean => {
        return typeof value === "string"
            && value.length > 0
            && Object.entries(
                RAIN_SUBGRAPHS
            ).filter(
                v => v[0] !== "is"
            ).some(
                v => (v[1] as any).includes(value)
            );
    },

    /**
     * @public Ethereum mainnnet known Rain subgraphs
     */
    [ChainId.ETHEREUM]: [
        "https://api.thegraph.com/subgraphs/name/rainprotocol/interpreter-registry-ethereum",
        "https://api.thegraph.com/subgraphs/name/rainprotocol/interpreter-registry-np-eth"
    ],
    /**
     * @public Polygon known Rain subgraphs
     */
    [ChainId.POLYGON]: [
        "https://api.thegraph.com/subgraphs/name/rainprotocol/interpreter-registry-polygon",
        "https://api.thegraph.com/subgraphs/name/rainprotocol/interpreter-registry-np-matic"
    ],
    /**
     * @public Mumbai (Polygon testnet) known Rain subgraphs
     */
    [ChainId.POLYGON_TESTNET]: [
        "https://api.thegraph.com/subgraphs/name/rainprotocol/interpreter-registry",
        "https://api.thegraph.com/subgraphs/name/rainprotocol/interpreter-registry-np"
    ]
} as const;

export type RAIN_SUBGRAPHS = Exclude<
    (typeof RAIN_SUBGRAPHS)[keyof typeof RAIN_SUBGRAPHS],
    (...args: any[]) => any
>[number];
