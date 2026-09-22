/**
 * Shared error handling for the /api/ai/* routes, so an unconfigured key,
 * a rate limit and a bad answer each come back the same way everywhere.
 */
import { NextResponse } from "next/server";
import { AiNotConfiguredError, AiRequestError } from "./gemini";

export function aiErrorResponse(err: unknown): NextResponse {
  if (err instanceof AiNotConfiguredError) {
    return NextResponse.json(
      {
        error:
          "AI features are switched off. Add GEMINI_API_KEY to the environment to enable them.",
        code: "AI_NOT_CONFIGURED",
      },
      { status: 503 },
    );
  }
  if (err instanceof AiRequestError) {
    return NextResponse.json(
      { error: err.message, code: "AI_REQUEST_FAILED" },
      { status: err.status },
    );
  }
  // A zod failure means the model answered with values we can't trust.
  const message = err instanceof Error ? err.message : "Unexpected AI error";
  return NextResponse.json(
    { error: `The AI answer failed validation: ${message}`, code: "AI_INVALID" },
    { status: 502 },
  );
}
