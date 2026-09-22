/**
 * Gemini client.
 *
 * Talks to the Generative Language REST API with `fetch` rather than the
 * `@google/generative-ai` package, so the app carries no extra dependency
 * and this works anywhere fetch does. Everything provider-specific lives
 * in this file: swapping to the official SDK means rewriting `callGemini`
 * and nothing else.
 *
 * Set GEMINI_API_KEY to switch the AI features on. Without it the app is
 * fully usable — every AI route answers 503 and the UI hides its buttons.
 */

const DEFAULT_API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Overridable so the app can be pointed at a regional endpoint, a
 * corporate proxy, or a stub during testing. Defaults to Google's.
 */
function apiRoot(): string {
  return process.env.GEMINI_API_BASE || DEFAULT_API_ROOT;
}

/** Fast and cheap, and good at schema-constrained JSON. Override per deploy. */
const DEFAULT_MODEL = "gemini-2.5-flash";

export class AiNotConfiguredError extends Error {
  constructor() {
    super("AI features are not configured. Set GEMINI_API_KEY.");
    this.name = "AiNotConfiguredError";
  }
}

export class AiRequestError extends Error {
  readonly status: number;
  /** Whether another attempt could plausibly succeed. */
  readonly retryable: boolean;
  constructor(message: string, status = 502, retryable = false) {
    super(message);
    this.name = "AiRequestError";
    this.status = status;
    this.retryable = retryable;
  }
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new AiNotConfiguredError();
  return key;
}

function model(): string {
  return process.env.GEMINI_MODEL || DEFAULT_MODEL;
}

/**
 * A JSON Schema subset, as Gemini's `responseSchema` accepts it. Declared
 * structurally rather than imported so the prompt modules can build
 * schemas without pulling in a JSON Schema library.
 */
export interface ResponseSchema {
  type: "object" | "array" | "string" | "number" | "integer" | "boolean";
  description?: string;
  properties?: Record<string, ResponseSchema>;
  items?: ResponseSchema;
  required?: string[];
  enum?: string[];
  nullable?: boolean;
}

interface GeminiCandidate {
  content?: { parts?: Array<{ text?: string }> };
  finishReason?: string;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string; status?: string };
}

/** Upstream states that are worth another attempt rather than an error. */
const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;
/** Long enough for a full plan (~35s), short enough not to hang a user. */
const TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS ?? 90_000);

function backoffMs(attempt: number): number {
  // 1s, then 3s, with jitter so retries from several users don't align.
  return (attempt === 1 ? 1000 : 3000) + Math.floor(Math.random() * 500);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface CallOptions {
  /** Steers the model's behaviour; kept separate from the user's request. */
  system: string;
  prompt: string;
  schema: ResponseSchema;
  /** Low by default: these are factual fitness answers, not creative ones. */
  temperature?: number;
  signal?: AbortSignal;
}

/**
 * Sends one request and returns the parsed JSON body.
 *
 * `responseSchema` puts the model in constrained-decoding mode, so the
 * reply is JSON matching the shape — but the caller still validates with
 * zod, because a schema constrains structure, not whether the values make
 * sense.
 */
export async function callGemini<T = unknown>(opts: CallOptions): Promise<T> {
  let lastError: AiRequestError | null = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await attemptCall<T>(opts);
    } catch (err) {
      // Only transient upstream states are retried. A bad key, a blocked
      // prompt or a malformed answer will fail the same way every time,
      // so retrying would just bill the user for the same error.
      if (
        err instanceof AiRequestError &&
        err.retryable &&
        attempt < MAX_ATTEMPTS
      ) {
        lastError = err;
        await sleep(backoffMs(attempt));
        continue;
      }
      throw err;
    }
  }
  throw lastError ?? new AiRequestError("Gemini request failed.");
}

async function attemptCall<T>(opts: CallOptions): Promise<T> {
  const { system, prompt, schema, temperature = 0.4, signal } = opts;

  const url = `${apiRoot()}/${encodeURIComponent(model())}:generateContent`;
  // Cap the wait even if the caller passed no signal, so a stalled
  // upstream can't hold a request open indefinitely.
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const combined = signal
    ? AbortSignal.any([signal, timeout])
    : timeout;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Header rather than a query string so the key stays out of logs.
        "x-goog-api-key": apiKey(),
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      }),
      signal: combined,
    });
  } catch (err) {
    if (err instanceof AiNotConfiguredError) throw err;
    if (err instanceof Error && err.name === "TimeoutError") {
      throw new AiRequestError(
        `Gemini did not respond within ${Math.round(TIMEOUT_MS / 1000)}s. Try again.`,
        504,
        true,
      );
    }
    throw new AiRequestError(
      `Could not reach Gemini: ${err instanceof Error ? err.message : "network error"}`,
      503,
      true,
    );
  }

  let body: GeminiResponse;
  try {
    body = (await res.json()) as GeminiResponse;
  } catch {
    throw new AiRequestError(`Gemini returned a non-JSON response (${res.status})`);
  }

  if (!res.ok) {
    const detail = body.error?.message ?? res.statusText;
    // Surface the cases worth acting on with their own status codes.
    if (res.status === 401 || res.status === 403) {
      throw new AiRequestError(`Gemini rejected the API key: ${detail}`, 502);
    }
    if (res.status === 429) {
      throw new AiRequestError(
        "Gemini rate limit reached. Try again shortly.",
        429,
        true,
      );
    }
    if (res.status === 503) {
      throw new AiRequestError(
        "Gemini is busy right now. Give it a minute and try again.",
        503,
        true,
      );
    }
    throw new AiRequestError(
      `Gemini error (${res.status}): ${detail}`,
      502,
      RETRYABLE.has(res.status),
    );
  }

  if (body.promptFeedback?.blockReason) {
    throw new AiRequestError(
      `Gemini blocked the request (${body.promptFeedback.blockReason}).`,
      422,
    );
  }

  const text = body.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const reason = body.candidates?.[0]?.finishReason;
    throw new AiRequestError(
      `Gemini returned no content${reason ? ` (${reason})` : ""}.`,
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new AiRequestError("Gemini returned malformed JSON.");
  }
}
