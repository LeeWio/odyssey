/**
 * Odyssey Link Health Checker
 * This script pings all friend links to verify their status.
 * Can be integrated into GitHub Actions for automated monitoring.
 */

async function checkLink(url) {
  const start = Date.now();
  let timeout;
  try {
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "Odyssey-Bot/1.0 (+https://easylove.top)",
      },
    });

    const duration = Date.now() - start;

    if (res.ok) {
      return { status: "Active", latency: `${duration}ms`, code: res.status };
    } else {
      return { status: "Unstable", latency: `${duration}ms`, code: res.status };
    }
  } catch (err) {
    return { status: "Dead", error: err.message };
  } finally {
    clearTimeout(timeout);
  }
}

async function run() {
  console.log("🚀 Starting Odyssey Link Health Check...");

  const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000").replace(/\/$/, "");

  try {
    const response = await fetch(`${API_BASE}/api/v1/public/friend-links`);
    if (!response.ok) {
      throw new Error(`API returned HTTP ${response.status}`);
    }

    const payload = await response.json();
    const links = payload?.data;

    if (!Array.isArray(links)) {
      throw new Error("API response did not contain a data array");
    }

    const results = [];
    for (const link of links) {
      const result = await checkLink(link.url);
      results.push({ name: link.name, url: link.url, ...result });
      console.log(
        `[${result.status}] ${link.name}: ${link.url} (${result.latency || result.error})`
      );
    }

    const failed = results.filter((result) => result.status !== "Active");
    if (failed.length > 0) {
      console.error(`\nHealth check found ${failed.length} unhealthy link(s).`);
      process.exitCode = 1;
      return;
    }

    console.log("\nHealth check complete: all links are active.");
  } catch (error) {
    console.error(`Failed to run health check against ${API_BASE}:`, error.message);
    process.exitCode = 1;
  }
}

run();
