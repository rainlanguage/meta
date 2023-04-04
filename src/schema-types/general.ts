/**
 * The address of the deployed contract for the specified chain.
 */
 export type EVMAddress = {
  chainId: number
  knownAddresses: string[]
}

/**
 * Version of this metadata
 */
 export type Version = {
  major: number
  minor: number
  release: string
}