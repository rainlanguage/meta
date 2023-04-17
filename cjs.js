"use strict";

module.exports = require("./dist/cjs/index");

const _opMetaSchema = require("./schema/op.meta.schema.json");
const _contMetaSchema = require("./schema/contract.meta.schema.json");
const _expMetaSchema = require("./schema/expression.meta.schema.json");
const _intMetaSchema = require("./schema/interpreter.meta.schema.json");
const _wpMetaSchema = require("./schema/wp.meta.schema.json");

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