import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const OPENAPI_URL = process.env.OPENAPI_URL ?? "http://localhost:8080/v3/api-docs";
const INCLUDE_COVERAGE = process.argv.includes("--coverage");
const ENDPOINT_METHODS = ["get", "post", "put", "patch", "delete"];
const API_ROOTS = ["lib/features", "features"];

const collectApiFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectApiFiles(entryPath);
      return /-api\.ts$/.test(entry.name) ? [entryPath] : [];
    })
  );
  return files.flat();
};

const normalizePath = (value) =>
  value
    .replace(/\$\{([^}]+)\}/g, (_match, expression) => `{${expression.split(".").at(-1)}}`)
    .split("?")[0]
    .replace(/\/$/, "");

const extractFrontendOperations = async () => {
  const files = (await Promise.all(API_ROOTS.map(collectApiFiles))).flat();
  const operations = [];

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const endpointPattern = /(\w+):\s*builder\.(query|mutation)/g;
    const endpoints = [...source.matchAll(endpointPattern)];

    endpoints.forEach((endpoint, index) => {
      const block = source.slice(endpoint.index, endpoints[index + 1]?.index ?? source.length);
      const pathMatch = block.match(/\/api\/v1[^"'`\s]*/);
      if (!pathMatch) return;

      const methodMatch = block.match(/method:\s*["'](GET|POST|PUT|PATCH|DELETE)["']/);
      operations.push({
        endpoint: endpoint[1],
        file,
        method: methodMatch?.[1] ?? (endpoint[2] === "query" ? "GET" : "POST"),
        path: normalizePath(pathMatch[0]),
      });
    });
  }

  return operations;
};

let response;

try {
  response = await fetch(OPENAPI_URL, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
} catch (error) {
  const reason = error instanceof Error ? (error.cause?.code ?? error.message) : String(error);
  throw new Error(`Unable to connect to OpenAPI document at ${OPENAPI_URL}: ${reason}`);
}

if (!response.ok) {
  throw new Error(`Unable to load OpenAPI document: ${response.status} ${response.statusText}`);
}

const document = await response.json();
const backendOperations = new Map();

for (const [endpointPath, pathItem] of Object.entries(document.paths ?? {})) {
  for (const method of ENDPOINT_METHODS) {
    const operation = pathItem[method];
    if (!operation) continue;
    backendOperations.set(`${method.toUpperCase()} ${endpointPath}`, {
      operationId: operation.operationId,
      tags: operation.tags?.length ? operation.tags : ["Untagged"],
    });
  }
}

const frontendOperations = await extractFrontendOperations();
const missing = frontendOperations.filter(
  ({ method, path: endpointPath }) => !backendOperations.has(`${method} ${endpointPath}`)
);

const frontendOperationKeys = new Set(
  frontendOperations.map(({ method, path: endpointPath }) => `${method} ${endpointPath}`)
);

const coverageByTag = new Map();
for (const [operationKey, operation] of backendOperations) {
  for (const tag of operation.tags) {
    const coverage = coverageByTag.get(tag) ?? { total: 0, covered: 0, uncovered: [] };
    coverage.total += 1;
    if (frontendOperationKeys.has(operationKey)) coverage.covered += 1;
    else coverage.uncovered.push({ operation: operationKey, operationId: operation.operationId });
    coverageByTag.set(tag, coverage);
  }
}

const tagCoverage = Object.fromEntries(
  [...coverageByTag.entries()]
    .sort(([, a], [, b]) => b.total - a.total)
    .map(([tag, coverage]) => [
      tag,
      {
        total: coverage.total,
        covered: coverage.covered,
        coveragePercent: Math.round((coverage.covered / coverage.total) * 100),
        ...(INCLUDE_COVERAGE ? { uncovered: coverage.uncovered } : {}),
      },
    ])
);

console.log(
  JSON.stringify(
    {
      openapiUrl: OPENAPI_URL,
      frontendOperations: frontendOperations.length,
      backendOperations: backendOperations.size,
      matchedOperations: frontendOperations.length - missing.length,
      missingOperations: missing,
      ...(INCLUDE_COVERAGE ? { tagCoverage } : {}),
    },
    null,
    2
  )
);

if (missing.length > 0) process.exitCode = 1;
