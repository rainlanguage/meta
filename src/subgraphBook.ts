import { ChainId } from "./utils";


/**
 * @public Known Rain Interpreter subgraph endpoints paired with EVM chain ids
 */
export const sgBook = {
    [ChainId.POLYGON]         : "https://api.thegraph.com/subgraphs/name/rainprotocol/interpreter-registry-polygon",
    [ChainId.POLYGON_TESTNET] : "https://api.thegraph.com/subgraphs/name/rainprotocol/interpreter-registry",
} as const;

export type sgBook = (typeof sgBook)[keyof typeof sgBook];