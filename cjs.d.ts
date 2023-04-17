export * from "./dist/types/index";

import _opMetaSchema from "./schemas/op.meta.schema.json";
import _contMetaSchema from "./schemas/contract.meta.schema.json";
import _expMetaSchema from "./schemas/expression.meta.schema.json";
import _intMetaSchema from "./schemas/interpreter.meta.schema.json";
import _wpMetaSchema from "./schemas/wordpack.meta.schema.json";

/**
 * @public op meta schema
 */
export declare const OpMetaSchema: typeof _opMetaSchema;

/**
 * @public contract meta schema
 */
export declare const ContractMetaSchema: typeof _contMetaSchema;

/**
 * @public expression meta schema
 */
export declare const ExpressionMetaSchema: typeof _expMetaSchema;

/**
 * @public interpreter meta schema
 */
export declare const InterpreterMetaSchema: typeof _intMetaSchema;

/**
 * @public wordpack meta schema
 */
export declare const WordPackMetaSchema: typeof _wpMetaSchema;