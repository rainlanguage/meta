
const fs = require("fs");
const path  = require("path");
const { argv } = require("process"); 
const { execSync } = require("child_process"); 


(async() => {
    let _p = "";
    let _command = "ts-json-schema-generator --unstable --no-type-check ";
    const meta = argv[2];
    if (meta === "--op") {
        _p = "../src/types/op.ts";
        _command += "-p ./src/types/op.ts -t OpMeta -o ./schemas/op.meta.schema.json -i \"rain-op-meta-@v";
    }
    if (meta === "--contract") {
        _p = "../src/types/contract.ts";
        _command += "-p ./src/types/contract.ts -t ContractMeta -o ./schemas/contract.meta.schema.json -i \"rain-contract-meta-@v";
    }
    if (meta === "--expression") {
        _p = "../src/types/expression.ts";
        _command += "-p ./src/types/expression.ts -t ExpressionMeta -o ./schemas/expression.meta.schema.json -i \"rain-expression-meta-@v";
    }
    if (meta === "--interpreter") {
        _p = "../src/types/interpreter.ts";
        _command += "-p ./src/types/interpreter.ts -t InterpreterMeta -o ./schemas/interpreter.meta.schema.json -i \"rain-interpreter-meta-@v";
    }
    if (meta === "--wordpack") {
        _p = "../src/types/wordpack.ts";
        _command += "-p ./src/types/wordpack.ts -t WordPackMeta -o ./schemas/wordpack.meta.schema.json -i \"rain-wordpack-meta-@v";
    }
    const version = fs.readFileSync(path.resolve(__dirname, _p))
        .toString()
        .match(/\/\/\sversion\s\d+\.\d+\.\d+/)[0]
        .slice(11);
    _command += version + "\"";
    execSync(_command, { stdio: "inherit" });
})();