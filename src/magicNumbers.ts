/**
 * @public Magic numbers used to identify Rain documents
 *
 * See more abour Magic numbers:
 * https://github.com/rainprotocol/metadata-spec/blob/main/README.md
 */
export namespace MAGIC_NUMBERS {
    /**
     * Prefixes every rain meta document "0xff0a89c674ee7874"
     */
    export const RAIN_META_DOCUMENT = 18377652714897045620n as const;
    /**
     * Solidity ABIv2 "0xffe5ffb4a3ff2cde"
     */
    export const SOLIDITY_ABIV2 = 18439425400648969438n as const;
    /**
     * Ops meta v1 "0xffe5282f43e495b4"
     */
    export const OPS_META_V1 = 18439188432805991860n as const;
    /**
     * Contract meta v1 "0xffc21bbf86cc199b"
     */
    export const CONTRACT_META_V1 = 18429323134567717275n as const;
    /**
     * Dotrain meta "0xffdac2f2f37be894"
     */
    export const DOTRAIN = 18436262373317404820n as const;
    /**
     * Authroing meta "0xffe9e3a02ca8e235"
     */
    export const AUTHORING_META_V1 = 18440520426328744501n as const;

    /**
     * @public Method to check if a value is of valid Rain Magic numbers
     * @param value - The value to check
     */
    export function is(value: any): value is MAGIC_NUMBERS {
        return typeof value === "bigint"
        && (
            MAGIC_NUMBERS.CONTRACT_META_V1      === value ||
            MAGIC_NUMBERS.DOTRAIN               === value ||
            MAGIC_NUMBERS.OPS_META_V1           === value ||
            MAGIC_NUMBERS.RAIN_META_DOCUMENT    === value ||
            MAGIC_NUMBERS.SOLIDITY_ABIV2        === value ||
            MAGIC_NUMBERS.AUTHORING_META_V1     === value
        );
    }
}

/**
 * @public The type of Rain magic numbers
 */
export type MAGIC_NUMBERS = Exclude<
    (typeof MAGIC_NUMBERS)[keyof typeof MAGIC_NUMBERS],
    (...args: any[]) => any
>;