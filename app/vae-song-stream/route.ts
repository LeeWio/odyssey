import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title");

  if (!title) {
    return NextResponse.json({ error: "Missing title parameter" }, { status: 400 });
  }

  try {
    // Query Bodia Music search API over HTTP to bypass production TLS handshake certificate validation errors
    const queryUrl = `http://api.xcvts.cn/api/music/bdyy?msg=${encodeURIComponent("许嵩 " + title)}&n=1&type=json`;
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

    // Protocol Upgrade: Rewrite http:// to https:// for Kuwo CDN to prevent mixed content blocking on secured HTTPS sites
    const securedPlayableUrl = playableUrl.replace(
      /^http:\/\/car-lv\.kuwo\.cn/,
      "https://car-lv.kuwo.cn"
    );

    console.log(
      `[Vae Song Battle API] Successfully resolved stream for ${title}. Redirecting 302 to: ${securedPlayableUrl}`
    );

    // High Performance 302 Redirect directly to the Kuwo Enterprise CDN over secure HTTPS
    return NextResponse.redirect(securedPlayableUrl, {
      status: 302,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`Failed to resolve dynamic audio for ${title}:`, err);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
