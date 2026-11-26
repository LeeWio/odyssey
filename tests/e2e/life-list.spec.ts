import { expect, test } from "@playwright/test";

const catalogRequests = /\/api\/v1\/public\/life-list\?/;

test.use({ locale: "en-US" });

test("keeps empty and populated categories matched to the selected filter @smoke", async ({
  page,
}) => {
  const travel = Promise.withResolvers<void>();
  await page.route(catalogRequests, async (route) => {
    if (new URL(route.request().url()).searchParams.get("category") === "travel") {
      await travel.promise;
    }
    await route.continue();
  });

  await page.goto("/life-list");
  const garden = page.getByRole("link", { name: /Plant a garden/ });
  const pottery = page.getByRole("link", { name: /Learn pottery/ });
  const empty = page.getByText("Nothing matches these filters.");

  try {
    await expect(garden).toBeVisible();
    await expect(pottery).toBeVisible();
    await page.getByRole("button", { name: "Daily life", exact: true }).click();
    await expect(garden).toBeVisible();
    await expect(pottery).toHaveCount(0);
    await page.getByRole("button", { name: "Travel", exact: true }).click();
    await expect(page.locator('[aria-busy="true"]')).toBeVisible();
    await expect(garden).toHaveCount(0);
    await expect(empty).toHaveCount(0);

    travel.resolve();
    await expect(empty).toBeVisible();
    await page.getByRole("button", { name: "All", exact: true }).click();
    await expect(garden).toBeVisible();
    await expect(pottery).toBeVisible();

    await page.getByRole("button", { name: "Travel", exact: true }).click();
    await expect(empty).toBeVisible();
    await page.getByRole("button", { name: "Daily life", exact: true }).click();
    await expect(garden).toBeVisible();
    await expect(empty).toHaveCount(0);
  } finally {
    travel.resolve();
  }
});

test("retries a failed status filter and ignores a late response after clearing it @smoke", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  const inProgress = Promise.withResolvers<void>();
  let failedCompleted = false;
  await page.route(catalogRequests, async (route) => {
    const status = new URL(route.request().url()).searchParams.get("status");
    if (status === "completed" && !failedCompleted) {
      failedCompleted = true;
      await route.fulfill({ status: 503, json: { code: 503, message: "Unavailable", data: null } });
      return;
    }
    if (status === "in_progress") await inProgress.promise;
    await route.continue();
  });

  await page.goto("/life-list");
  const garden = page.getByRole("link", { name: /Plant a garden/ });
  const pottery = page.getByRole("link", { name: /Learn pottery/ });
  const anyStatus = page.getByRole("button", { name: "Any status", exact: true });
  const error = page.getByText("The list could not be loaded.");

  try {
    await page.getByRole("button", { name: "Planned", exact: true }).click();
    await expect(garden).toBeVisible();
    await expect(pottery).toHaveCount(0);
    const completed = page.getByRole("button", { name: "Completed", exact: true });
    await completed.click();
    await expect(error).toBeVisible();
    await expect(garden).toHaveCount(0);
    await expect(completed).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("button", { name: "Try again", exact: true }).click();
    await expect(pottery).toBeVisible();
    await expect(error).toHaveCount(0);

    await page.getByRole("button", { name: "In progress", exact: true }).click();
    await expect(page.locator('[aria-busy="true"]')).toBeVisible();
    await expect(pottery).toHaveCount(0);
    await anyStatus.click();
    await expect(garden).toBeVisible();
    const lateResponse = page.waitForResponse((response) =>
      response.url().includes("status=in_progress")
    );
    inProgress.resolve();
    await lateResponse;
    await expect(anyStatus).toHaveAttribute("aria-pressed", "true");
    await expect(garden).toBeVisible();
    await expect(pottery).toBeVisible();
    await expect(page.getByText("Nothing matches these filters.")).toHaveCount(0);
  } finally {
    inProgress.resolve();
  }
});
