// Run against a local production build with ENABLE_RICH_TEXT_TEST_ROUTE=1.
// node scripts/profile-rich-text-table.mjs http://127.0.0.1:3199 /tmp/table-profile.json
import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
import { cpus, platform, arch } from "node:os";
const baseURL = process.argv[2] ?? "http://127.0.0.1:3199";
const output = process.argv[3] ?? "/tmp/rich-text-table-profile.json";
if (!["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname))
  throw new Error("Use a local production fixture, not a live article.");
const browser = await chromium.launch();
const results = [];
try {
  for (const rows of [50, 200]) {
    for (let run = 0; run < 3; run++) {
      const page = await browser.newPage({
        viewport: { width: 1280, height: 900 },
        reducedMotion: "reduce",
      });
      await page.goto(`${baseURL}/test/rich-text?table=1`);
      await page.getByTestId("draft-status").filter({ hasText: "Editor ready" }).waitFor();
      const editor = page.locator('.ProseMirror[contenteditable="true"]');
      await editor.evaluate((element, rows) => {
        const editor = element.editor;
        editor.commands.setContent({
          type: "doc",
          content: [
            {
              type: "table",
              content: Array.from({ length: rows }, (_, row) => ({
                type: "tableRow",
                content: Array.from({ length: 20 }, (_, col) => ({
                  type: row ? "tableCell" : "tableHeader",
                  attrs: { colwidth: [100] },
                  content: [
                    { type: "paragraph", content: [{ type: "text", text: `${row}:${col}` }] },
                  ],
                })),
              })),
            },
            { type: "paragraph" },
          ],
        });
        editor.commands.focus();
        const tick = () => {
          window.tableProfile.frames++;
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        const original = Element.prototype.getBoundingClientRect;
        window.tableProfile = { reads: 0, readMs: 0, frames: 0 };
        Element.prototype.getBoundingClientRect = function () {
          const start = performance.now();
          const rect = original.call(this);
          window.tableProfile.reads++;
          window.tableProfile.readMs += performance.now() - start;
          return rect;
        };
      }, rows);
      const ranges = await editor.evaluate(async (element) => {
        const editor = element.editor;
        const frame = () =>
          new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        await frame();
        const positions = [];
        editor.state.doc.descendants((node, pos) => {
          if (["cell", "header_cell"].includes(node.type.spec.tableRole)) positions.push(pos);
        });
        const results = [];
        for (let index = 0; index < 12; index++) {
          window.tableProfile = { reads: 0, readMs: 0, frames: 0 };
          const start = performance.now();
          editor.commands.setCellSelection({
            anchorCell: positions[index],
            headCell: positions[index + 20],
          });
          const dispatchMs = performance.now() - start;
          await frame();
          results.push({ dispatchMs, ...window.tableProfile });
        }
        return results;
      });
      const cell = editor.locator("th").first();
      await cell.click();
      await editor.press("End");
      const typingStart = performance.now();
      await page.keyboard.type("profile");
      const typingMs = performance.now() - typingStart;
      const reset = () =>
        page.evaluate(() => {
          window.tableProfile = { reads: 0, readMs: 0, frames: 0 };
        });
      const metric = () => page.evaluate(() => window.tableProfile);
      const box = await cell.boundingBox();
      await page.mouse.move(box.x + box.width - 2, box.y + box.height - 6);
      await reset();
      await page.mouse.down();
      await page.mouse.move(box.x + box.width + 28, box.y + box.height - 6, { steps: 12 });
      await page.mouse.up();
      const resize = await metric();
      const host = page.locator('[data-slot="rich-text-editor-content"]');
      const wrapper = editor.locator(".tableWrapper");
      await wrapper.evaluate((el) => (el.scrollLeft = 0));
      await cell.click();
      const grip = page.getByRole("button", { name: "Cell actions", exact: true });
      await grip.waitFor();
      const handle = await grip.boundingBox();
      const visible = await wrapper.boundingBox();
      const hostBox = await host.boundingBox();
      await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
      await reset();
      await page.mouse.down();
      await page.mouse.move(
        visible.x + visible.width - 4,
        Math.min(900, hostBox.y + hostBox.height) - 4,
        { steps: 12 }
      );
      // Fixed sample duration, not a correctness readiness wait.
      await page.waitForTimeout(300);
      await page.mouse.up();
      const autoscroll = {
        ...(await metric()),
        horizontal: await wrapper.evaluate((el) => el.scrollLeft),
        vertical: await host.evaluate((el) => el.scrollTop),
        window: await page.evaluate(() => scrollY),
      };
      await cell.click();
      await wrapper.evaluate((el) => (el.scrollLeft = 0));
      const rowGrip = page.getByRole("button", { name: "Row actions", exact: true });
      await rowGrip.waitFor();
      const rowHandle = await rowGrip.boundingBox();
      const rowViewport = await host.boundingBox();
      await page.mouse.move(rowHandle.x + rowHandle.width / 2, rowHandle.y + rowHandle.height / 2);
      await reset();
      await page.mouse.down();
      await page.mouse.move(
        rowHandle.x + rowHandle.width / 2,
        Math.min(900, rowViewport.y + rowViewport.height) - 4,
        { steps: 12 }
      );
      await page.waitForTimeout(300);
      await page.mouse.up();
      const reorder = await metric();
      results.push({ rows, columns: 20, run, ranges, typingMs, resize, autoscroll, reorder });
      await page.close();
    }
  }
  const evidence = {
    machine: { cpu: cpus()[0]?.model, platform: platform(), arch: arch() },
    browser: browser.version(),
    baseURL,
    results,
  };
  await writeFile(output, JSON.stringify(evidence, null, 2));
  console.log(
    JSON.stringify(
      results.map(({ rows, run, ranges, typingMs, resize, autoscroll, reorder }) => ({
        rows,
        run,
        maxDispatchMs: Math.max(...ranges.map((m) => m.dispatchMs)),
        rangeReads: ranges.map((m) => m.reads),
        typingMs,
        resize,
        autoscroll,
        reorder,
      })),
      null,
      2
    )
  );
} finally {
  await browser.close();
}
