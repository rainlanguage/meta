"use strict";

module.exports = require("./dist/cjs/index");

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpMetaSchema = void 0;
const schema_json_1 = __importDefault(require("./schemas/op.meta.schema.json"));
/**
 * @public op meta schema
 */
exports.OpMetaSchema = schema_json_1.default;

exports.ContractMetaSchema = void 0;
const schema_json_2 = __importDefault(require("./schemas/contract.meta.schema.json"));
/**
 * @public contract meta schema
 */
exports.ContractMetaSchema = schema_json_2.default;
