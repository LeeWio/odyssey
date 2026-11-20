import { spawn } from "node:child_process";

const fixtureOrigin = process.env.LIGHTHOUSE_FIXTURE_ORIGIN ?? "http://127.0.0.1:3181";
const port = process.env.PORT ?? "3000";
const children = [];
let shuttingDown = false;

function start(command, args, env) {
  const child = spawn(command, args, { env, stdio: "inherit" });
  children.push(child);
  child.on("error", (error) => {
    console.error(`Unable to start ${command}:`, error);
    void shutdown(1);
  });
  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    console.error(`${command} exited with ${signal ?? code ?? "unknown status"}`);
    void shutdown(code ?? 1);
  });
  return child;
}

async function waitForFixture(url) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Fixture did not become ready at ${url}`);
}

async function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) child.kill("SIGTERM");
  await new Promise((resolve) => setTimeout(resolve, 1_000));
  for (const child of children) {
    if (child.exitCode === null) child.kill("SIGKILL");
  }
  process.exit(code);
}

process.on("SIGINT", () => void shutdown(130));
process.on("SIGTERM", () => void shutdown(143));

const fixture = start("bun", ["tests/e2e/fixtures/api.ts"], {
  ...process.env,
  E2E_FIXTURE_ORIGIN: fixtureOrigin,
});

try {
  await waitForFixture(`${fixtureOrigin}/health`);
} catch (error) {
  console.error(error);
  await shutdown(1);
}

if (fixture.exitCode !== null) process.exit(1);

start("node", [".next/standalone/server.js"], {
  ...process.env,
  API_URL: fixtureOrigin,
  HOSTNAME: "127.0.0.1",
  PORT: port,
});
