"use strict";

module.exports = require("./dist/cjs/index");

const _opMetaSchema = require("./schemas/op.meta.schema.json");
const _contMetaSchema = require("./schemas/contract.meta.schema.json");
const _expMetaSchema = require("./schemas/expression.meta.schema.json");
const _intMetaSchema = require("./schemas/interpreter.meta.schema.json");
const _wpMetaSchema = require("./schemas/wp.meta.schema.json");

/**
 * @public op meta schema
 */
exports.OpMetaSchema = _opMetaSchema;

/**
 * @public contract meta schema
 */
exports.ContractMetaSchema = _contMetaSchema;

/**
 * @public expression meta schema
 */
exports.ExpressionMetaSchema = _expMetaSchema;

/**
 * @public interpreter meta schema
 */
exports.InterpreterMetaSchema = _intMetaSchema;

/**
 * @public wordpack meta schema
 */
exports.WordPackMetaSchema = _wpMetaSchema;