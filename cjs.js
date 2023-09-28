"use strict";

module.exports = require("./dist/cjs/index");

const _contMetaSchema = require("./schemas/contract.meta.schema.json");

/**
 * @public contract meta schema
 */
const ContractMetaSchema = _contMetaSchema;
module.exports.ContractMetaSchema = ContractMetaSchema;
