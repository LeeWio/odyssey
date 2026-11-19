import { readFile } from "node:fs/promises";
import { buildBackendOperations, ENDPOINT_METHODS } from "./openapi-contract-utils.mjs";

const [openApiFile, nexusRevision] = process.argv.slice(2);
if (!openApiFile || !/^[a-f0-9]{40}$/.test(nexusRevision ?? "")) {
  throw new Error(
    "Usage: node scripts/pin-openapi-operations.mjs <nexus-openapi.json> <nexus-sha>"
  );
}

const document = JSON.parse(await readFile(openApiFile, "utf8"));
const operations = buildBackendOperations(document.paths, ENDPOINT_METHODS);
if (operations.size === 0) throw new Error("OpenAPI document contains no API operations");

const paths = Object.fromEntries(
  Object.keys(document.paths)
    .sort()
    .map((path) => [
      path,
      Object.fromEntries(
        ENDPOINT_METHODS.filter((method) => document.paths[path][method]).map((method) => {
          const { operationId, tags } = document.paths[path][method];
          return [method, { operationId, tags }];
        })
      ),
    ])
);
console.log(JSON.stringify({ nexusRevision, paths }, null, 2));
