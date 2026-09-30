export const normalizeApiPath = (value) =>
  value
    .replace(/\$\{([^}]+)\}/g, (_match, expression) => `{${expression.split(".").at(-1)}}`)
    .split("?")[0]
    .replace(/\{[^}]+\}/g, "{param}")
    .replace(/\/$/, "");

export const buildBackendOperations = (paths, methods) => {
  const operations = new Map();

  for (const [endpointPath, pathItem] of Object.entries(paths ?? {})) {
    for (const method of methods) {
      const operation = pathItem[method];
      if (!operation) continue;

      const operationKey = `${method.toUpperCase()} ${normalizeApiPath(endpointPath)}`;
      const existing = operations.get(operationKey);
      if (existing) {
        throw new Error(
          `OpenAPI path collision after normalization for ${operationKey}: ` +
            `${existing.endpointPath} and ${endpointPath}`
        );
      }

      operations.set(operationKey, {
        endpointPath,
        operationId: operation.operationId,
        tags: operation.tags?.length ? operation.tags : ["Untagged"],
      });
    }
  }

  return operations;
};
