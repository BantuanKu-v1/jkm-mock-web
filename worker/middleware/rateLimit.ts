import {createMiddleware} from "hono/factory";
import {AppEnv} from "../types";

export const publicApiRateLimit = createMiddleware<AppEnv>(
    async (c) => {
      // Use the visitor's Cloudflare-provided IP as the identity for this public, unauthenticated API
      const clientIp = c.req.header("CF-Connecting-IP");

      // Share bucket for requests without an IP
      const key = clientIp
          ? `public-programs:${clientIp}`
          : "public-programs:unknown";

      const {success} = await c.env.PUBLIC_API_RATE_LIMITER.limit({key});

      if (!success) {
        return c.json(
            {
              success: false,
              message: "API rate limit exceeded. Please try again later.",
              error: {
                code: "RATE_LIMIT_EXCEEDED",
              },
            },
            429,
            {
              "Cache-Control": "no-store",
              "Retry-After": "60",
            }
        );
      }
    }
)
