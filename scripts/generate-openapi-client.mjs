import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const OPENAPI_URL = process.env.OPENAPI_URL ?? "http://localhost:8080/v3/api-docs";
const OUTPUT_DIRECTORY = "lib/features/openapi";
const API_OUTPUT = path.join(OUTPUT_DIRECTORY, "openapi-api.ts");
const TYPES_OUTPUT = path.join(OUTPUT_DIRECTORY, "openapi.generated.ts");
const METHODS = ["get", "post", "put", "patch", "delete"];

const collectApiFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entryPath.startsWith(OUTPUT_DIRECTORY)) return [];
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

const getExistingOperations = async () => {
  const files = (
    await Promise.all(["lib/features", "features"].map((root) => collectApiFiles(root)))
  ).flat();
  const operations = new Set();

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const endpointPattern = /(\w+):\s*builder\.(query|mutation)/g;
    const endpoints = [...source.matchAll(endpointPattern)];
    endpoints.forEach((endpoint, index) => {
      const block = source.slice(endpoint.index, endpoints[index + 1]?.index ?? source.length);
      const pathMatch = block.match(/\/api\/v1[^"'`\s]*/);
      if (!pathMatch) return;
      const methodMatch = block.match(/method:\s*["'](GET|POST|PUT|PATCH|DELETE)["']/);
      const method = methodMatch?.[1] ?? (endpoint[2] === "query" ? "GET" : "POST");
      operations.add(`${method} ${normalizePath(pathMatch[0])}`);
    });
  }
  return operations;
};

const quote = (value) => JSON.stringify(value);
const propertyName = (value) => (/^[A-Za-z_$][\w$]*$/.test(value) ? value : quote(value));
const refName = (ref) => ref.split("/").at(-1);

const schemaType = (schema) => {
  if (!schema) return "unknown";
  if (schema.$ref) return `OpenApiComponents["schemas"][${quote(refName(schema.$ref))}]`;
  if (schema.oneOf) return schema.oneOf.map(schemaType).join(" | ");
  if (schema.anyOf) return schema.anyOf.map(schemaType).join(" | ");
  if (schema.allOf) return schema.allOf.map(schemaType).join(" & ");
  if (schema.enum) return schema.enum.map((value) => quote(value)).join(" | ");

  let result;
  switch (schema.type) {
    case "integer":
    case "number":
      result = "number";
      break;
    case "boolean":
      result = "boolean";
      break;
    case "string":
      result = "string";
      break;
    case "array":
      result = `Array<${schemaType(schema.items)}>`;
      break;
    case "object": {
      const required = new Set(schema.required ?? []);
      const properties = Object.entries(schema.properties ?? {}).map(
        ([name, property]) =>
          `${propertyName(name)}${required.has(name) ? "" : "?"}: ${schemaType(property)}`
      );
      if (schema.additionalProperties) {
        properties.push(`[key: string]: ${schemaType(schema.additionalProperties)}`);
      }
      result = `{ ${properties.join("; ")} }`;
      break;
    }
    default:
      result = schema.properties ? schemaType({ ...schema, type: "object" }) : "unknown";
  }
  return schema.nullable ? `${result} | null` : result;
};

const operationName = (operation, method, endpointPath) => {
  const fallback = `${method}_${endpointPath}`.replace(/[^A-Za-z0-9]+(.)/g, (_, char) =>
    char.toUpperCase()
  );
  const name = operation.operationId ?? fallback;
  return name.replace(/[^A-Za-z0-9_$]/g, "").replace(/_(\d+)$/, "$1");
};

const getResponseSchema = (operation) => {
  const response = operation.responses?.["200"] ?? operation.responses?.["201"];
  const content = response?.content ? Object.values(response.content)[0] : undefined;
  return content?.schema;
};

const envelopeDataType = (schema) => {
  if (!schema?.$ref) return schemaType(schema);
  const name = refName(schema.$ref);
  return `OpenApiData<OpenApiComponents["schemas"][${quote(name)}]>`;
};

const generateEndpoint = ({ method, endpointPath, operation }) => {
  const name = operationName(operation, method, endpointPath);
  const parameters = operation.parameters ?? [];
  const bodySchema = operation.requestBody?.content?.["application/json"]?.schema;
  const fields = parameters.map((parameter) => ({
    name: parameter.name,
    required: parameter.required === true,
    type: schemaType(parameter.schema),
    location: parameter.in,
  }));
  if (bodySchema)
    fields.push({
      name: "body",
      required: operation.requestBody.required !== false,
      type: schemaType(bodySchema),
      location: "body",
    });

  const argumentType = fields.length
    ? `{ ${fields.map((field) => `${propertyName(field.name)}${field.required ? "" : "?"}: ${field.type}`).join("; ")} }`
    : "void";
  const responseSchema = getResponseSchema(operation);
  const resultType = responseSchema ? envelopeDataType(responseSchema) : "string";
  const isQuery = method === "get";
  const kind = isQuery ? "query" : "mutation";
  const url = endpointPath.replace(/{([^}]+)}/g, "${arg.$1}");
  const queryParameters = fields.filter((field) => field.location === "query");
  const hasEnvelope = Boolean(responseSchema?.$ref?.includes("/ApiResponse"));
  const queryArgument = fields.length ? "arg" : "";
  const requestParts = [`url: \`${url}\``];
  if (!isQuery) requestParts.push(`method: ${quote(method.toUpperCase())}`);
  if (queryParameters.length) {
    requestParts.push(
      `params: { ${queryParameters.map((field) => `${propertyName(field.name)}: arg.${field.name}`).join(", ")} }`
    );
  }
  if (bodySchema) requestParts.push("body: arg.body");
  const responseTransform = hasEnvelope
    ? "transformResponse: (response: { data: unknown }) => response.data as never,"
    : "";
  const cache = isQuery ? 'providesTags: ["OpenApi"],' : 'invalidatesTags: ["OpenApi"],';

  return `    ${name}: builder.${kind}<${resultType}, ${argumentType}>({\n      query: (${queryArgument}) => ({ ${requestParts.join(", ")} }),\n      ${responseTransform}\n      transformErrorResponse: transformApiError,\n      ${cache}\n    }),`;
};

let response;
try {
  response = await fetch(OPENAPI_URL, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
} catch (error) {
  throw new Error(
    `Unable to connect to ${OPENAPI_URL}: ${error instanceof Error ? error.message : String(error)}`
  );
}
if (!response.ok) throw new Error(`Unable to load OpenAPI document: ${response.status}`);

const document = await response.json();
const existing = await getExistingOperations();
const missing = [];

for (const [endpointPath, pathItem] of Object.entries(document.paths ?? {})) {
  for (const method of METHODS) {
    const operation = pathItem[method];
    if (!operation || existing.has(`${method.toUpperCase()} ${endpointPath}`)) continue;
    missing.push({ method, endpointPath, operation });
  }
}

const schemas = Object.entries(document.components?.schemas ?? {})
  .map(([name, schema]) => `    ${quote(name)}: ${schemaType(schema)};`)
  .join("\n");
const typesSource = `// Generated by scripts/generate-openapi-client.mjs. Do not edit manually.\n\nexport interface OpenApiComponents {\n  schemas: {\n${schemas}\n  };\n}\n`;

const endpoints = missing.map(generateEndpoint).join("\n\n");
const hookNames = missing.map(({ method, endpointPath, operation }) => {
  const name = operationName(operation, method, endpointPath);
  return `  use${name[0].toUpperCase()}${name.slice(1)}${method === "get" ? "Query" : "Mutation"},`;
});
const apiSource = `// Generated by scripts/generate-openapi-client.mjs. Do not edit manually.\n\nimport { baseApi, transformApiError } from "@/lib/api";\nimport type { OpenApiComponents } from "./openapi.generated";\n\ntype OpenApiData<T> = T extends { data?: infer D } ? NonNullable<D> : unknown;\n\nexport const openapiApi = baseApi.injectEndpoints({\n  endpoints: (builder) => ({\n${endpoints}\n  }),\n  overrideExisting: false,\n});\n\nexport const {\n${hookNames.join("\n")}\n} = openapiApi;\n`;

await mkdir(OUTPUT_DIRECTORY, { recursive: true });
await writeFile(TYPES_OUTPUT, typesSource);
await writeFile(API_OUTPUT, apiSource);
await writeFile(
  path.join(OUTPUT_DIRECTORY, "index.ts"),
  'export * from "./openapi-api";\nexport type { OpenApiComponents } from "./openapi.generated";\n'
);

console.log(
  JSON.stringify(
    {
      openapiUrl: OPENAPI_URL,
      generatedOperations: missing.length,
      schemas: Object.keys(document.components?.schemas ?? {}).length,
    },
    null,
    2
  )
);
