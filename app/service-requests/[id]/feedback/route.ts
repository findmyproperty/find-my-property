function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildResponseHeaders(request?: Request, initHeaders?: HeadersInit) {
  const headers = new Headers(initHeaders);
  const origin = request?.headers.get("origin");
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
  }
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return headers;
}

function responseJson(data: unknown, init: ResponseInit = {}, request?: Request) {
  const headers = new Headers(init.headers);
  const responseHeaders = buildResponseHeaders(request, headers);
  return Response.json(data, { ...init, headers: responseHeaders });
}

async function parseFeedbackBody(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { error: "Request body must be valid JSON." };
  }

  if (!isRecord(body)) {
    return { error: "Request body must be an object." };
  }

  const rating = Number(body.rating);
  const feedback =
    typeof body.feedback === "string" ? body.feedback.trim() : undefined;

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Rating must be a number from 1 to 5." };
  }

  if (feedback && feedback.length > 1000) {
    return { error: "Feedback must be 1000 characters or less." };
  }

  return {
    rating,
    feedback: feedback || null,
  };
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: buildResponseHeaders(request, { Allow: "POST, OPTIONS" }),
  });
}

export async function GET(request: Request) {
  return responseJson(
    { message: "Use POST to submit service request feedback." },
    { status: 405, headers: { Allow: "POST, OPTIONS" } },
    request,
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const id = Number(rawId);

  if (!Number.isInteger(id) || id <= 0) {
    return responseJson(
      { message: "Service request id must be a positive number." },
      { status: 400 },
      request,
    );
  }

  const parsed = await parseFeedbackBody(request);
  if ("error" in parsed) {
    return responseJson({ message: parsed.error }, { status: 400 }, request);
  }

  const reviewedAt = new Date().toISOString();

  return responseJson(
    {
      id,
      customerRating: parsed.rating,
      customerFeedback: parsed.feedback,
      customerReviewedAt: reviewedAt,
      timeline: [
        {
          id: `feedback-${id}`,
          title: "Feedback submitted",
          note: "Customer shared a service rating.",
          actorLabel: "Customer",
          timestamp: reviewedAt,
        },
      ],
    },
    { status: 200 },
    request,
  );
}
