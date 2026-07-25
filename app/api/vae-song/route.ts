import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title");

  if (!title) {
    return NextResponse.json({ error: "Missing title parameter" }, { status: 400 });
  }

  try {
    // 1. Query the unblocked Baidu Bodia Music API server-side
    const queryUrl = `https://api.xcvts.cn/api/music/bdyy?msg=${encodeURIComponent("许嵩 " + title)}&n=1&type=json`;
    const res = await fetch(queryUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Bodia API responded with status ${res.status}` },
        { status: res.status }
      );
    }

    const payload = await res.json();
    const playableUrl = payload?.data?.play_url;

    if (!playableUrl) {
      console.warn(`No playable Bodia CDN stream found for: ${title}`);
      return NextResponse.json(
        { error: "Resource not available on Bodia catalog." },
        { status: 404 }
      );
    }

    // 2. Read the client's Range header for browser seeking support (HTTP 206 Partial Content)
    const clientRange = request.headers.get("range");
    const fetchHeaders: HeadersInit = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };

    if (clientRange) {
      fetchHeaders["Range"] = clientRange;
    }

    // 3. Fetch from Bodia CDN with forwarded Range header
    const audioResponse = await fetch(playableUrl, {
      headers: fetchHeaders,
    });

    if (!audioResponse.ok && audioResponse.status !== 206) {
      return NextResponse.json({ error: "Failed to pipe stream from Bodia CDN" }, { status: 500 });
    }

    // 4. Construct appropriate headers, supporting 200 OK or 206 Partial Content
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", "audio/mpeg");
    responseHeaders.set("Accept-Ranges", "bytes");
    responseHeaders.set("Cache-Control", "public, max-age=86400"); // Cache for 1 day

    if (audioResponse.headers.has("Content-Range")) {
      responseHeaders.set("Content-Range", audioResponse.headers.get("Content-Range")!);
    }
    if (audioResponse.headers.has("Content-Length")) {
      responseHeaders.set("Content-Length", audioResponse.headers.get("Content-Length")!);
    }

    // Return status 206 or 200 depending on client request
    const status = clientRange ? 206 : 200;

    return new NextResponse(audioResponse.body, {
      status,
      headers: responseHeaders,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`Failed to resolve dynamic audio for ${title}:`, err);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
