import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";

const VARIANTS = [
  "ghost",
  "primary",
  "secondary",
  "tertiary",
  "outline",
  "danger",
  "danger-soft",
] as const;
type Variant = (typeof VARIANTS)[number];
const PALETTES: Record<Variant, { background: string; foreground: string; hover: string }> = {
  ghost: {
    background: "transparent",
    foreground: "var(--default-foreground)",
    hover: "var(--default)",
  },
  primary: {
    background: "var(--accent)",
    foreground: "var(--accent-foreground)",
    hover: "var(--accent-hover)",
  },
  secondary: {
    background: "var(--default)",
    foreground: "var(--accent-soft-foreground)",
    hover: "var(--default-hover)",
  },
  tertiary: {
    background: "var(--default)",
    foreground: "var(--foreground)",
    hover: "var(--default-hover)",
  },
  outline: {
    background: "transparent",
    foreground: "var(--default-foreground)",
    hover: "color-mix(in srgb, var(--default) 60%, transparent)",
  },
  danger: {
    background: "var(--danger)",
    foreground: "var(--danger-foreground)",
    hover: "var(--danger-hover)",
  },
  "danger-soft": {
    background: "var(--danger-soft)",
    foreground: "var(--danger-soft-foreground)",
    hover: "var(--danger-soft-hover)",
  },
};

async function selectVariant(page: Page, label: string, variant: Variant) {
  await page.getByRole("button", { name: new RegExp(label) }).click();
  const list = page.getByRole("listbox", { name: label, exact: true });
  await list.getByRole("option", { name: variant, exact: true }).click();
  await expect(list).not.toBeVisible();
}

async function expectPalette(button: Locator, variant: Variant, liked: boolean) {
  const palette = PALETTES[variant];
  await expect(button).toHaveClass(new RegExp(`\\bbutton--${variant}\\b(?!-)`));
  await expect(button).toHaveCSS(
    "background-color",
    await resolveColor(button, palette.background)
  );
  await expect(button).toHaveCSS("color", await resolveColor(button, palette.foreground));
  const icon = button.locator("span[aria-hidden=true]").first();
  const iconColor =
    variant === "primary" || variant === "danger"
      ? palette.foreground
      : liked
        ? "var(--danger-soft-foreground)"
        : "var(--muted)";
  await expect(icon).toHaveCSS("color", await resolveColor(button, iconColor));
  await expect(button.locator("span[aria-hidden=true]").nth(1)).toHaveCSS(
    "color",
    await resolveColor(button, palette.foreground)
  );
}

async function resolveColor(element: Locator, value: string) {
  return element.evaluate((root, color) => {
    const probe = document.createElement("span");
    probe.style.color = color;
    root.append(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    return resolved;
  }, value);
}

test.beforeEach(async ({ page }) => {
  // Serve the installed Gravity SVGs so icon rendering does not depend on its CDN.
  await page.route(
    /https:\/\/api\.(iconify\.design|simplesvg\.com|unisvg\.com)\//,
    async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname !== "/gravity-ui.json") return route.abort();
      const icons: Record<string, { body: string }> = {};
      for (const name of (url.searchParams.get("icons") ?? "").split(",")) {
        if (!/^[a-z-]+$/.test(name)) continue;
        const source = await readFile(
          join(process.cwd(), "node_modules/@gravity-ui/icons/svgs", `${name}.svg`),
          "utf8"
        );
        icons[name] = {
          body: await page.evaluate(
            (svg) =>
              new DOMParser().parseFromString(svg, "image/svg+xml").documentElement.innerHTML,
            source
          ),
        };
      }
      await route.fulfill({ json: { prefix: "gravity-ui", width: 16, height: 16, icons } });
    }
  );
  await page.goto("/test/pulse-heart");
  await expect(page.getByRole("heading", { name: "Pulse Heart", exact: true })).toBeVisible();
  await expect(page.getByTestId("pulse-preview").locator("svg")).toBeVisible();
});

test("plays the pulse and switches controlled reaction state", async ({ page }) => {
  const button = page.getByTestId("pulse-preview").getByRole("button");
  const before = await button.locator("svg").innerHTML();
  await page.getByRole("slider", { name: "动画时长 (ms)" }).press("End");
  await expect(button).toHaveClass(/button--ghost/);
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(button).toHaveAttribute("data-running", "");
  await expect(button).toHaveAttribute("data-selected", "false");
  await expect(button).toHaveClass(/button--ghost/);
  await expect(button.locator("[aria-hidden=true]").first()).not.toHaveCSS("transform", "none");
  await expect(button).toHaveAttribute("data-selected", "true");
  await expect(button).toHaveClass(/button--danger-soft/);
  await expect.poll(() => button.locator("svg").innerHTML()).not.toBe(before);
  await expect(button).not.toHaveAttribute("data-running");
  await expect(button).toHaveAccessibleName("预览点赞, 129");
  await button.click();
  await expect(button).toHaveClass(/button--danger-soft/);
  await expect(button).not.toHaveAttribute("data-running");
  await expect(button).toHaveClass(/button--ghost/);
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await expect(button).toHaveAccessibleName("预览点赞, 128");
});

test("changes settings and resets the preview and examples", async ({ page }) => {
  const preview = page.getByTestId("pulse-preview");
  const button = preview.getByRole("button");
  await page
    .getByRole("complementary", { name: "预览设置" })
    .getByText("星星", { exact: true })
    .click();
  await expect(preview.locator("svg")).toHaveClass(/iconify--gravity-ui/);
  await expect(page.locator("section").first().getByText("star", { exact: true })).toBeVisible();
  await page
    .getByRole("group", { name: "选中颜色", exact: true })
    .getByRole("button", { name: "Success", exact: true })
    .click();
  expect(await resolveColor(button, "var(--reaction-selected)")).toBe(
    await resolveColor(button, "var(--success-soft-foreground)")
  );
  await selectVariant(page, "未点赞外观", "outline");
  await selectVariant(page, "已点赞外观", "primary");
  await expect(button).toHaveClass(/button--outline/);
  await page
    .getByRole("radiogroup", { name: "按钮尺寸", exact: true })
    .getByRole("radio", { name: "lg", exact: true })
    .click();
  await expect(button).toHaveClass(/button--lg/);
  await page.getByRole("slider", { name: "动画时长 (ms)" }).press("End");
  await expect(page.getByText("lg / 1000ms", { exact: true })).toBeVisible();
  await page.getByText("显示计数", { exact: true }).click();
  await expect(button).toHaveAccessibleName("预览点赞");
  await expect(button).toHaveClass(/button--icon-only/);
  const iconOnlyBounds = await button.boundingBox();
  expect(iconOnlyBounds!.width).toBe(iconOnlyBounds!.height);
  await page.getByText("未选中时空心", { exact: true }).click();
  await expect(button).toHaveAttribute("data-solid", "");
  await page.getByText("禁用交互", { exact: true }).click();
  await expect(button).toBeDisabled();
  const example = page.getByTestId("example-star").getByRole("button");
  await example.click();
  await expect(example).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "重置全部", exact: true }).click();
  await expect(button).toBeEnabled();
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await expect(button).toHaveAccessibleName("预览点赞, 128");
  await expect(button).toHaveClass(/button--md/);
  await expect(button).not.toHaveClass(/button--icon-only/);
  await expect(button).toHaveClass(/button--ghost/);
  await expect(page.getByRole("button", { name: /未点赞外观/ })).toContainText("ghost");
  await expect(page.getByRole("button", { name: /已点赞外观/ })).toContainText("danger-soft");
  expect(await resolveColor(button, "var(--reaction-selected)")).toBe(
    await resolveColor(button, "var(--danger-soft-foreground)")
  );
  await expect(example).toHaveAccessibleName("星星示例, 99");
});

test("keeps idle and liked icon palettes independent from the pill", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await selectVariant(page, "已点赞外观", "tertiary");
  const button = page.getByTestId("pulse-preview").getByRole("button");
  const icon = button.locator("[aria-hidden=true]").first();
  for (const [label, token] of [
    ["Accent", "var(--accent-soft-foreground)"],
    ["Success", "var(--success-soft-foreground)"],
    ["Warning", "var(--warning-soft-foreground)"],
    ["Danger", "var(--danger-soft-foreground)"],
    ["Foreground", "var(--foreground)"],
    ["Muted", "var(--muted)"],
    ["Inherit", "currentColor"],
  ]) {
    await page
      .getByRole("group", { name: "未选中颜色", exact: true })
      .getByRole("button", { name: label, exact: true })
      .click();
    await expect(icon).toHaveCSS("color", await resolveColor(button, token));
    await page
      .getByRole("group", { name: "选中颜色", exact: true })
      .getByRole("button", { name: label, exact: true })
      .click();
    await button.press("Enter");
    await expect(icon).toHaveCSS("color", await resolveColor(button, token));
    await expect(button).toHaveAccessibleName("预览点赞, 129");
    await button.press("Enter");
  }
});

for (const theme of ["mouve", "glass", "brutalism"]) {
  for (const mode of ["light", "dark"]) {
    test(`resolves both native variant palettes in ${theme}-${mode}`, async ({
      page,
    }, testInfo) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const button = page.getByTestId("pulse-preview").getByRole("button");
      await button.press("Enter");
      await page.evaluate(
        ({ theme, mode }) => {
          const root = document.documentElement;
          root.classList.remove(
            "light",
            "dark",
            ...["mouve", "glass", "brutalism"].flatMap((name) => [`${name}-light`, `${name}-dark`])
          );
          root.classList.add(mode, `${theme}-${mode}`);
          root.dataset.theme = `${theme}-${mode}`;
        },
        { theme, mode }
      );
      for (const [index, variant] of VARIANTS.entries()) {
        const idleVariant = VARIANTS[(index + 1) % VARIANTS.length];
        await selectVariant(page, "未点赞外观", idleVariant);
        await selectVariant(page, "已点赞外观", variant);
        await expectPalette(button, variant, true);
        await button.hover();
        const hover = await resolveColor(button, PALETTES[variant].hover);
        await expect(button).toHaveCSS("background-color", hover);
        await page.mouse.down();
        await expect(button).toHaveAttribute("data-pressed", "true");
        await expect(button).toHaveCSS("background-color", hover);
        await page.mouse.move(0, 0);
        await page.mouse.up();
        await expect(button).toHaveAccessibleName("预览点赞, 129");
        await button.press("Enter");
        await expectPalette(button, idleVariant, false);
        await button.press("Enter");
        await expect(button).toHaveAccessibleName("预览点赞, 129");
      }
      await page.getByText("禁用交互", { exact: true }).click();
      await expect(button).toBeDisabled();
      expect(Number(await button.evaluate((el) => getComputedStyle(el).opacity))).toBeLessThan(1);
      for (const width of [360, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
          width
        );
        await page.screenshot({
          path: testInfo.outputPath(`${theme}-${mode}-${width}.png`),
          fullPage: true,
        });
      }
    });
  }
}

test("switches ghost to every native liked variant and back with native border sizing", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const button = page.getByTestId("pulse-preview").getByRole("button");
  for (const variant of VARIANTS) {
    await selectVariant(page, "已点赞外观", variant);
    await expectPalette(button, "ghost", false);
    const before = await button.boundingBox();
    await button.press("Enter");
    await expectPalette(button, variant, true);
    const after = await button.boundingBox();
    expect(after!.width).toBe(before!.width + (variant === "outline" ? 2 : 0));
    expect(after!.height).toBe(before!.height);
    await button.press("Enter");
    await expect(button).toHaveClass(/button--ghost/);
  }
});

test("renders initially liked examples in their selected native variants", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const variant of VARIANTS) {
    const button = page.getByTestId(`variant-${variant}`).getByRole("button");
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(button).toHaveClass(new RegExp(`\\bbutton--${variant}\\b(?!-)`));
    await button.press("Space");
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await expect(button).toHaveClass(/button--ghost/);
  }
});

test("keeps variant selectors keyboard accessible", async ({ page }) => {
  const control = page.getByRole("button", { name: /已点赞外观/ });
  await control.focus();
  await control.press("Enter");
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.getByRole("option", { name: "danger-soft", exact: true }).press("Home");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(control).toBeFocused();
  await expect(control).toContainText("primary");
});

test("supports keyboard activation with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const button = page.getByTestId("pulse-preview").getByRole("button");
  await button.focus();
  await expect(button).toBeFocused();
  await button.press("Space");
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(button).toHaveAttribute("data-selected", "true");
  await expect(button).toHaveClass(/button--danger-soft/);
  await expect(button).not.toHaveAttribute("data-running");
  await button.press("Enter");
  await expect(button).toHaveAccessibleName("预览点赞, 128");
  await expect(button).toHaveClass(/button--ghost/);
  await expect(page.getByTestId("example-disabled").getByRole("button")).toBeDisabled();
});

test("cancels a pointer press released outside the button", async ({ page }) => {
  const button = page.getByTestId("pulse-preview").getByRole("button");
  const bounds = await button.boundingBox();
  await page.mouse.move(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2);
  await page.mouse.down();
  await expect(button).toHaveAttribute("data-pressed", "true");
  await page.mouse.move(5, 5);
  await page.mouse.up();
  await expect(button).not.toHaveAttribute("data-pressed", "true");
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await expect(button).toHaveAccessibleName("预览点赞, 128");
});

test.describe("touch input", () => {
  test.use({ hasTouch: true });

  test("activates through HeroUI onPress", async ({ page }) => {
    const button = page.getByTestId("pulse-preview").getByRole("button");
    await button.tap();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(button).toHaveAttribute("data-running", "");
    await expect(button).not.toHaveAttribute("data-running");
    await expect(button).toHaveAccessibleName("预览点赞, 129");
  });
});

for (const width of [360, 640, 768, 1440]) {
  test(`fits ${width}px without horizontal overflow`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const preview = page.getByTestId("pulse-preview");
    const button = preview.getByRole("button");
    await expect(preview).toBeInViewport();
    const sizes = page.getByRole("radiogroup", { name: "按钮尺寸", exact: true });
    const metrics = [];
    for (const [size, desktopHeight, mobileHeight, iconSize, fontSize, padding] of [
      ["sm", 32, 36, 16, 14, 12],
      ["md", 36, 40, 18, 15, 16],
      ["lg", 40, 44, 20, 16, 16],
    ] as const) {
      await sizes.getByRole("radio", { name: size, exact: true }).click();
      const height = width >= 768 ? desktopHeight : mobileHeight;
      const icon = button.locator("span[aria-hidden=true]").first();
      const count = button.locator("span[aria-hidden=true]").nth(1);
      const svg = icon.locator("svg");
      await expect(button).toHaveClass(new RegExp(`button--${size}`));
      await expect(button).toHaveCSS("height", `${height}px`);
      await expect(button).toHaveCSS("padding-left", `${padding}px`);
      await expect(button).toHaveCSS("padding-right", `${padding}px`);
      await expect(icon).toHaveCSS("width", `${iconSize}px`);
      await expect(icon).toHaveCSS("height", `${iconSize}px`);
      await expect(svg).toHaveCSS("width", `${iconSize}px`);
      await expect(svg).toHaveCSS("height", `${iconSize}px`);
      await expect(svg).toHaveCSS("margin", "0px");
      await expect(count).toHaveCSS("font-size", `${fontSize}px`);
      await expect(count).toHaveCSS("line-height", `${fontSize}px`);
      const iconBounds = await icon.boundingBox();
      const countBounds = await count.boundingBox();
      expect(
        Math.abs(iconBounds!.y + iconBounds!.height / 2 - countBounds!.y - countBounds!.height / 2)
      ).toBeLessThan(0.5);
      const before = await button.boundingBox();
      await button.press("Enter");
      await expect(button).toHaveAccessibleName("预览点赞, 129");
      await expect(svg).toHaveCSS("width", `${iconSize}px`);
      await expect(count).toHaveCSS("font-size", `${fontSize}px`);
      expect((await button.boundingBox())!.width).toBe(before!.width);
      await button.press("Enter");
      await expect(button).toHaveAccessibleName("预览点赞, 128");

      await page.getByText("显示计数", { exact: true }).click();
      await expect(button).toHaveCSS("width", `${height}px`);
      await expect(button).toHaveCSS("height", `${height}px`);
      await expect(svg).toHaveCSS("width", `${iconSize}px`);
      await expect(svg).toHaveCSS("height", `${iconSize}px`);
      const iconOnlyBounds = await button.boundingBox();
      const centeredIcon = await icon.boundingBox();
      expect(
        Math.abs(
          centeredIcon!.x + centeredIcon!.width / 2 - iconOnlyBounds!.x - iconOnlyBounds!.width / 2
        )
      ).toBeLessThan(0.5);
      expect(
        Math.abs(
          centeredIcon!.y +
            centeredIcon!.height / 2 -
            iconOnlyBounds!.y -
            iconOnlyBounds!.height / 2
        )
      ).toBeLessThan(0.5);
      await page.getByText("显示计数", { exact: true }).click();

      const comparison = page.getByTestId(`size-${size}`).getByRole("button");
      await expect(comparison.locator("svg")).toHaveCSS("width", `${iconSize}px`);
      await expect(comparison.locator("span[aria-hidden=true]").nth(1)).toHaveCSS(
        "font-size",
        `${fontSize}px`
      );
      metrics.push({ size, height, iconSize, fontSize, padding, width: before!.width });
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width
    );
    const bounds = await preview.getByRole("button").boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: testInfo.outputPath(`pulse-heart-${width}.png`),
      fullPage: true,
    });
    await testInfo.attach("button-size-metrics", {
      body: JSON.stringify(metrics, null, 2),
      contentType: "application/json",
    });
  });
}
