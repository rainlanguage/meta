# Rain Protocol Meta
Utility library for Rain Protocol's metadata.
Also provides the schemas generated from typescript types for Rain Protocol's metadata such as op meta and contract meta. (uses [ts-json-schema-generator](https://www.npmjs.com/package/ts-json-schema-generator))

## Usage
Install the package with following: 
```bash
npm install @rainprotocol/meta
```
or 
```bash
yarn add @rainprotocol/meta
```

Schemas can used in vscode to automatically validate a json file when you specify it in vscode workspace setting:
- Create a folder `.vscode` in your workspace and make a new file `settings.json`. (skip this if these are already present)
- Add the following to the `settings.json`:
```json
{
  "json.schemas": [
    {
      "fileMatch": ["*.op.meta.json"],
      "url": "./node_modules/@rainprotocol/meta/schemas/op.meta.schema.json"
    },
    {
      "fileMatch": ["*.contract.meta.json"],
      "url": "./node_modules/@rainprotocol/meta/schemas/contract.meta.schema.json"
    }
  ]
}
```
you can specify what files will be validated automatically by providing a glob pattern for `fileMatch`.
See the `./example` folder content for some examples.
<br>

Schemas can also be imported and used programmatically:
```typescript
import { OpMetaSchema, ContractMetaSchema } from "@rainprotocol/meta";
```

For getting an op meta from subgraph:
```typescript
// importing
import { getOpMetaFromSg } from "@rainprotocol/meta";

// get opmeta
const opmeta = await getOpMetaFromSg(deployerAddress, networkOrChainIdOrSgUrl)
```
<br>

To validate a meta against generated schemas:
```typescript
// importing
import { validateMeta, metaFromBytes, OpMetaSchema } from "@rainprotocol/meta";

// convert "opmeta" from previous guide which is is bytes from (hex string) to op meta as object
const opmetaObj = metaFromBytes(opmeta);

// to validate the opmeta object against the OpMetaSchema
validateMeta(opmetaObj, OpMetaSchema);

// alternatively "metaFromBytes()" can perform the validation internally if the schema is provided as second arg
const opmetaObj = metaFromBytes(opmeta, OpMetaSchema);
```
<br>

## Developers Guide
Clone the repo and then install all the dependencies:
```bash
npm install
```
There is `prepare` hook that will compile and generate the schemas after installing the deps.
Versions of the generated schemas (schema `$id` field) are specified at the beginning of their types file with the following form:
```typescript
// specify the version of the meta in the following line
// version 0.0.0
```
Modify the digits for specifying the version for the generated schema.

To generate the schemas:
```bash
npm run gen-schema
```

To run the tests:
```bash
npm test
```