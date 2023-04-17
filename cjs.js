"use strict";

module.exports = require("./dist/cjs/index");

const _opMetaSchema = require("./schemas/op.meta.schema.json");
const _contMetaSchema = require("./schemas/contract.meta.schema.json");

/**
 * @public op meta schema
 */
const OpMetaSchema = _opMetaSchema;
module.exports.OpMetaSchema = OpMetaSchema;

/**
 * @public contract meta schema
 */
const ContractMetaSchema = _contMetaSchema;
module.exports.ContractMetaSchema = ContractMetaSchema;
