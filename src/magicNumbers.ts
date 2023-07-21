/**
 * @public Magic numbers used to identify Rain documents
 *
 * See more abour Magic numbers:
 * https://github.com/rainprotocol/metadata-spec/blob/main/README.md
 */
export const MAGIC_NUMBERS = {
    /**
   * Prefixes every rain meta document "0xff0a89c674ee7874"
   */
    RAIN_META_DOCUMENT: 18377652714897045620n,
    /**
   * Solidity ABIv2 "0xffe5ffb4a3ff2cde"
   */
    SOLIDITY_ABIV2: 18439425400648969438n,
    /**
   * Ops meta v1 "0xffe5282f43e495b4"
   */
    OPS_META_V1: 18439188432805991860n,
    /**
   * Contract meta v1 "0xffc21bbf86cc199b"
   */
    CONTRACT_META_V1: 18429323134567717275n,
    /**
   * Dotrain meta "0xffdac2f2f37be894"
   */
    DOTRAIN: 18436262373317404820n
} as const;

export type MAGIC_NUMBERS = (typeof MAGIC_NUMBERS)[keyof typeof MAGIC_NUMBERS];