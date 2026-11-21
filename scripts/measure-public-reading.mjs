import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";
import { setTimeout as wait } from "node:timers/promises";

const port = 3188;
const origin = "http://127.0.0.1:3189";
const backend = "http://127.0.0.1:8080";
const [distDir, slug, routeOnly] = process.argv.slice(2);
if (!distDir || !slug) {
  throw new Error(
    "Usage: node scripts/measure-public-reading.mjs <dist-dir> <existing-json-article-slug> [route]"
  );
}
const runs = Number(process.env.PERF_RUNS ?? 3);
const desktop = process.env.PERF_VIEWPORT === "desktop";
let delayCadence = 0;
let delayList = 0;
const calls = [];
const serverCalls = [];
const proxy = createServer(async (req, res) => {
  const url = new URL(req.url, backend);
  calls.push(url.pathname + url.search);
  if (req.headers["x-odyssey-prefetch"]) serverCalls.push(url.pathname + url.search);
  if (url.pathname === "/api/v1/public/moments/cadence") await wait(delayCadence);
  if (url.pathname === "/api/v1/public/moments") await wait(delayList);
  try {
    if (req.method !== "GET") return res.writeHead(405).end();
    const headers = Object.fromEntries(
      Object.entries(req.headers).filter(([name]) =>
        /^(accept|accept-language|x-odyssey-prefetch)$/.test(name)
      )
    );
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });
    res.writeHead(response.status, {
      "content-type": response.headers.get("content-type") ?? "application/json",
    });
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    res.writeHead(502).end();
  }
});
await new Promise((resolve) => proxy.listen(port, "127.0.0.1", resolve));
const web = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", "3189"],
  {
    env: { ...process.env, API_URL: "http://127.0.0.1:" + port, NEXT_DIST_DIR: distDir },
    stdio: ["ignore", "ignore", "inherit"],
  }
);
let browser;
async function timeToMarkup(path, match) {
  const offset = calls.length;
  const start = performance.now();
  const response = await fetch(origin + path, {
    headers: { "accept-language": "en" },
    signal: AbortSignal.timeout(15000),
  });
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let html = "";
  let markerMs = null;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    html += decoder.decode(value, { stream: true });
    if (markerMs === null && match.test(html)) markerMs = Math.round(performance.now() - start);
  }
  if (!response.ok || markerMs === null) throw new Error("Missing route markup: " + path);
  return { markerMs, calls: calls.slice(offset) };
}
try {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      if ((await fetch(origin + "/healthz/odyssey")).ok) break;
    } catch {}
    await wait(125);
  }
  await timeToMarkup("/", /id="home-hero-title"/);
  for (const ms of [0, 700, 0, 700, 0, 700]) {
    delayCadence = ms;
    for (const [path, marker] of [
      ["/", /id="home-hero-title"/],
      ["/moments", /id="moment-\d+"/],
    ]) {
      console.log(
        JSON.stringify({
          kind: "stream",
          path,
          injected: ms,
          ...(await timeToMarkup(path, marker)),
        })
      );
    }
  }
  delayCadence = 0;
  for (const ms of [700, 700, 700]) {
    delayList = ms;
    console.log(
      JSON.stringify({
        kind: "list-delay",
        path: "/",
        injected: ms,
        ...(await timeToMarkup("/", /id="home-hero-title"/)),
      })
    );
  }
  delayList = 0;
  browser = await chromium.launch({ headless: true });
  for (const path of routeOnly
    ? [routeOnly]
    : ["/", "/single", "/moments", "/single/" + encodeURIComponent(slug), "/single?page=2"]) {
    for (let run = 0; run < runs; run++) {
      const context = await browser.newContext({
        viewport: desktop ? { width: 1440, height: 900 } : { width: 390, height: 844 },
        deviceScaleFactor: 1,
        isMobile: !desktop,
        hasTouch: !desktop,
        locale: "en-US",
      });
      try {
        await context.route("**/*", async (route) => {
          const req = route.request();
          const url = new URL(req.url());
          if (
            req.method() === "GET" &&
            url.pathname.startsWith("/api/v1/") &&
            url.origin !== origin
          ) {
            const upstream = await fetch("http://127.0.0.1:" + port + url.pathname + url.search, {
              headers: { "accept-language": "en" },
            });
            return route.fulfill({
              status: upstream.status,
              contentType: "application/json",
              headers: { "access-control-allow-origin": origin },
              body: await upstream.text(),
            });
          }
          return req.method() === "GET" && req.url().startsWith(origin + "/")
            ? route.continue()
            : route.abort();
        });
        await context.addInitScript(() => {
          window.perfSample = { lcp: 0, cls: 0, shifts: [] };
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries())
              window.perfSample.lcp = Math.round(entry.startTime);
          }).observe({ type: "largest-contentful-paint", buffered: true });
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries())
              if (!entry.hadRecentInput) {
                window.perfSample.cls += entry.value;
                window.perfSample.shifts.push({
                  at: entry.startTime,
                  value: entry.value,
                  sources: entry.sources.map(({ node, previousRect, currentRect }) => ({
                    tag: node?.tagName,
                    from: previousRect.y,
                    to: currentRect.y,
                  })),
                });
              }
          }).observe({ type: "layout-shift", buffered: true });
        });
        const page = await context.newPage();
        const session = await context.newCDPSession(page);
        await session.send("Emulation.setCPUThrottlingRate", { rate: 2 });
        const errors = [];
        const serverOffset = serverCalls.length;
        const api = new Set();
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("request", (req) => {
          const url = new URL(req.url());
          if (req.method() === "GET" && url.pathname.startsWith("/api/v1/"))
            api.add(url.pathname + url.search);
        });
        const response = await page.goto(origin + path, { waitUntil: "load", timeout: 15000 });
        const html = await response.text();
        await page.waitForTimeout(1750);
        const metrics = await page.evaluate(() => ({
          ...window.perfSample,

          article: !!document.querySelector("article [data-article-body], article .tiptap"),
          editorMounted: !!document.querySelector("article .ProseMirror"),
          articleText:
            document
              .querySelector("article [data-article-body], article .tiptap")
              ?.textContent.trim().length ?? 0,
          heroOpacity:
            document.querySelector("#home-hero-title") &&
            getComputedStyle(document.querySelector("#home-hero-title")).opacity,
          canvas: document.querySelectorAll("main canvas").length,
        }));
        if (
          !response.ok() ||
          errors.length ||
          (path === "/single/" + encodeURIComponent(slug) && !metrics.articleText)
        ) {
          throw new Error(
            `Invalid browser sample for ${path}: ${response.status()} ${errors.join("; ")}`
          );
        }
        const files = await page.evaluate(() =>
          performance
            .getEntriesByType("resource")
            .filter(
              (entry) =>
                entry.name.includes("/_next/static/") &&
                entry.name.endsWith(".js") &&
                entry.decodedBodySize
            )
            .map((entry) => ({ name: entry.name.split("/").pop(), bytes: entry.decodedBodySize }))
        );
        const names = files.map((entry) => entry.name);
        const js = files.reduce((sum, entry) => sum + entry.bytes, 0);
        console.log(
          JSON.stringify({
            kind: "browser",
            path,
            run,
            status: response.status(),
            html: Buffer.byteLength(html),
            adminMessages:
              html.includes("webhookDeliveries") || html.includes("NotificationDelivery"),
            serverApi: serverCalls.slice(serverOffset),
            ...metrics,
            js,
            requests: names.length,
            names,
            api: [...api],
            errors,
          })
        );
      } finally {
        await context.close();
      }
    }
  }
} finally {
  if (browser) await browser.close();
  web.kill("SIGTERM");
  proxy.closeAllConnections();
  await new Promise((resolve) => proxy.close(resolve));
}
