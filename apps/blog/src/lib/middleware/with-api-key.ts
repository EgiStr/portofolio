import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/api-key";
import { apiError } from "@/lib/api-response";

type RouteHandler = (
  request: NextRequest,
  context: any,
) => Promise<NextResponse> | NextResponse;

/**
 * Higher-order function to protect routes with API key authentication
 * Validates the x-api-key header and updates lastUsedAt timestamp
 */
export function withApiKey(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    const apiKey = request.headers.get("x-api-key");

    if (!apiKey) {
      return apiError("Missing API key. Include x-api-key header.", 401);
    }

    const validKey = await validateApiKey(apiKey);

    if (!validKey) {
      return apiError("Invalid or inactive API key.", 401);
    }

    // Key is valid, proceed to handler
    return handler(request, context);
  };
}
