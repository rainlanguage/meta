"use strict";

module.exports = require("./dist/cjs/index");

const _opMetaSchema = require("./schemas/op.meta.schema.json");
const _contMetaSchema = require("./schemas/contract.meta.schema.json");

/**
 * @public op meta schema
 */
exports.OpMetaSchema = _opMetaSchema;

/**
 * @public contract meta schema
 */
exports.ContractMetaSchema = _contMetaSchema;
