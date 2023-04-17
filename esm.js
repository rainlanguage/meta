export * from "./dist/esm/index";

import _opMetaSchema from "./schemas/op.meta.schema.json";
import _contMetaSchema from "./schemas/contract.meta.schema.json";

/**
 * @public op meta schema
 */
export const OpMetaSchema = _opMetaSchema;

/**
 * @public contract meta schema
 */
export const ContractMetaSchema = _contMetaSchema;
