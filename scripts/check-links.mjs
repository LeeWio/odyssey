import fetch from "node-fetch";

/**
 * Odyssey Link Health Checker
 * This script pings all friend links to verify their status.
 * Can be integrated into GitHub Actions for automated monitoring.
 */

async function checkLink(url) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "Odyssey-Bot/1.0 (+https://odyssey.com)",
      },
    });

    clearTimeout(timeout);
    const duration = Date.now() - start;

    if (res.ok) {
      return { status: "Active", latency: `${duration}ms`, code: res.status };
    } else {
      return { status: "Unstable", latency: `${duration}ms`, code: res.status };
    }
  } catch (err) {
    return { status: "Dead", error: err.message };
  }
}

async function run() {
  console.log("🚀 Starting Odyssey Link Health Check...");

  // In a real environment, you would fetch this from your live API
  // For this script, we'll assume the API base is passed as an env var or default to local
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

  try {
    const response = await fetch(`${API_BASE}/api/v1/public/friend-links`);
    if (!response.ok) {
      console.warn(`⚠️ Could not fetch links from ${API_BASE}. Using mock for demonstration.`);
      // Mock links if API is not available during CI build
      const mockLinks = [
        { name: "Google", url: "https://google.com" },
        { name: "GitHub", url: "https://github.com" },
        { name: "Invalid Site", url: "https://this-site-does-not-exist-12345.com" },
      ];

      for (const link of mockLinks) {
        const result = await checkLink(link.url);
        console.log(
          `[${result.status}] ${link.name}: ${link.url} (${result.latency || result.error})`
        );
      }
      return;
    }

    const { data: links } = await response.json();

    const results = [];
    for (const link of links) {
      const result = await checkLink(link.url);
      results.push({ name: link.name, url: link.url, ...result });
      console.log(
        `[${result.status}] ${link.name}: ${link.url} (${result.latency || result.error})`
      );
    }

    // Here you could send a report to Slack/Discord or update the DB via an internal admin API
    console.log("\n✅ Health check complete.");
  } catch (error) {
    console.error("❌ Failed to run health check:", error.message);
  }
}

run();
