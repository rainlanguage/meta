export * from "./dist/esm/index";

import _opMetaSchema from "./schemas/op.meta.schema.json";
import _contMetaSchema from "./schemas/contract.meta.schema.json";
import _expMetaSchema from "./schemas/expression.meta.schema.json";
import _intMetaSchema from "./schemas/interpreter.meta.schema.json";
import _wpMetaSchema from "./schemas/wordpack.meta.schema.json";

/**
 * @public op meta schema
 */
export const OpMetaSchema = _opMetaSchema;

/**
 * @public contract meta schema
 */
export const ContractMetaSchema = _contMetaSchema;

/**
 * @public expression meta schema
 */
export const ExpressionMetaSchema = _expMetaSchema;

/**
 * @public interpreter meta schema
 */
export const InterpreterMetaSchema = _intMetaSchema;

/**
 * @public wordpack meta schema
 */
export const WordPackMetaSchema = _wpMetaSchema;