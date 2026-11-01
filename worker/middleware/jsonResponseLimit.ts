import { createMiddleware } from "hono/factory";
import { AppEnv } from "../types";

export const MAX_JSON_RESPONSE_BYTES = 1024 * 1024;

export const jsonResponseLimit = createMiddleware<AppEnv>(
    async (c, next) => {
      await next();

      const response = c.res;
      const contentType =
          response.headers.get("Content-Type") ?? "";

      // Apply only to JSON responses
      if (
          !contentType.toLowerCase().includes("application/json")
      ) {
        return;
      }

      // HEAD and bodyless responses do not need inspection
      if (
          c.req.method === "HEAD" ||
          response.status === 204 ||
          response.status === 205 ||
          response.status === 304
      ) {
        return;
      }

      const contentLength =
          response.headers.get("Content-Length");

      // Reject immediately if a trustworthy declared size already exceeds the limit
      if (
          contentLength !== null &&
          Number.isFinite(Number(contentLength)) &&
          Number(contentLength) > MAX_JSON_RESPONSE_BYTES
      ) {
        c.res = oversizedResponse();
        return;
      }

      // Inspect the actual response body without consuming the original response
      const body = await response.clone().arrayBuffer();

      if (body.byteLength <= MAX_JSON_RESPONSE_BYTES) {
        return;
      }

      console.warn("JSON response exceeded size limit", {
        path: c.req.path,
        actualBytes: body.byteLength,
        maximumBytes: MAX_JSON_RESPONSE_BYTES,
      });

      c.res = oversizedResponse();
    }
);

function oversizedResponse(): Response {
  return Response.json(
      {
        success: false,
        message: "API JSON response exceeds the maximum allowed size",
        error: {
          code: "RESPONSE_TOO_LARGE",
          maxBytes: MAX_JSON_RESPONSE_BYTES,
        },
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
  );
}
