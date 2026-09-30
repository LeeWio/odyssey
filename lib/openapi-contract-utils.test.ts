import { describe, expect, it } from "vitest";

import { buildBackendOperations, normalizeApiPath } from "../scripts/openapi-contract-utils.mjs";

describe("OpenAPI contract path normalization", () => {
  it("matches frontend template expressions with OpenAPI path parameters", () => {
    expect(normalizeApiPath("/api/v1/posts/${arg.postId}?preview=true")).toBe(
      "/api/v1/posts/{param}"
    );
    expect(normalizeApiPath("/api/v1/posts/{id}/")).toBe("/api/v1/posts/{param}");
  });

  it("keeps static path segments distinct", () => {
    expect(normalizeApiPath("/api/v1/posts/featured")).toBe("/api/v1/posts/featured");
  });

  it("rejects ambiguous backend paths after parameter-name normalization", () => {
    expect(() =>
      buildBackendOperations(
        {
          "/api/v1/posts/{id}": { get: { operationId: "getPost" } },
          "/api/v1/posts/{slug}": { get: { operationId: "getPostBySlug" } },
        },
        ["get"]
      )
    ).toThrow(
      "OpenAPI path collision after normalization for GET /api/v1/posts/{param}: " +
        "/api/v1/posts/{id} and /api/v1/posts/{slug}"
    );
  });
});
