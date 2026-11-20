import { expect, test, type APIRequestContext } from "@playwright/test";

test.skip(
  process.env.PLAYWRIGHT_REAL_BACKEND !== "1",
  "The real-backend journey requires the disposable Nexus Docker stack."
);

const apiOrigin = process.env.PLAYWRIGHT_API_URL ?? "http://127.0.0.1:18080";

async function login(request: APIRequestContext, username: string, password: string) {
  const response = await request.post(`${apiOrigin}/api/v1/auth/login`, {
    data: { username, password },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  return payload.data as {
    accessToken: string;
    refreshToken: string;
    username: string;
    email: string;
    roles: string[];
  };
}

test.use({ locale: "en-US", contextOptions: { reducedMotion: "reduce" } });

test("publishing a followed article reaches notifications and returns through the reading library", async ({
  page,
  request,
}) => {
  const admin = await login(request, "e2e-admin", "e2e-admin-password");
  const reader = await login(request, "e2e-reader", "reader-password");
  const categoriesResponse = await request.get(`${apiOrigin}/api/v1/public/categories`);
  expect(categoriesResponse.ok()).toBeTruthy();
  const categories = (await categoriesResponse.json()).data as { id: number; slug: string }[];
  const category = categories.find((item) => item.slug === "e2e-engineering");
  expect(category).toBeDefined();

  const suffix = Date.now().toString();
  const slug = `e2e-notification-${suffix}`;
  const title = `E2E notification article ${suffix}`;
  const content = JSON.stringify({
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "A real reading journey" }],
      },
      ...Array.from({ length: 12 }, (_, index) => ({
        type: "paragraph",
        content: [
          {
            type: "text",
            text: `Reading checkpoint ${index + 1}. This content exists to exercise return position persistence.`,
          },
        ],
      })),
    ],
  });
  const publishResponse = await request.post(`${apiOrigin}/api/v1/admin/posts`, {
    headers: { Authorization: `Bearer ${admin.accessToken}` },
    data: {
      title,
      slug,
      summary: "Real backend notification and reading loop.",
      content,
      contentType: "JSON",
      status: "PUBLISHED",
      isFeatured: false,
      categoryId: category!.id,
    },
  });
  expect(publishResponse.ok()).toBeTruthy();

  await page.addInitScript(
    (auth) => {
      localStorage.setItem("odyssey_auth", JSON.stringify(auth));
    },
    {
      accessToken: reader.accessToken,
      refreshToken: reader.refreshToken,
      username: reader.username,
      email: reader.email,
      roles: reader.roles,
      permissions: [],
      isAuthenticated: true,
    }
  );

  await page.goto("/notifications");
  const progressResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "PUT" &&
      response.url().includes(`/api/v1/user/library/posts/`) &&
      response.url().endsWith("/progress")
  );
  const row = page.getByRole("listitem").filter({ hasText: title });
  await expect(row).toBeVisible();
  await expect(row).toContainText("Category post");
  await row.getByRole("button").first().press("Enter");
  await expect(page).toHaveURL(new RegExp(`/single/${slug}$`));
  await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();

  await page.getByRole("button", { name: "More article actions", exact: true }).click();
  const readingListAdd = page.waitForResponse(
    (response) =>
      response.request().method() === "PUT" &&
      /\/api\/v1\/user\/library\/reading-list\/\d+$/.test(new URL(response.url()).pathname)
  );
  await page.getByRole("button", { name: "Save for later", exact: true }).click();
  expect((await readingListAdd).ok()).toBeTruthy();
  await expect(page.getByRole("button", { name: "Saved for later", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await page.getByRole("button", { name: "Dismiss", exact: true }).first().press("Enter");

  expect((await progressResponse).ok()).toBeTruthy();

  const readingListResponse = await request.get(
    `${apiOrigin}/api/v1/user/library/reading-list?page=0&size=20`,
    { headers: { Authorization: `Bearer ${reader.accessToken}` } }
  );
  const readingListBody = await readingListResponse.text();
  expect(readingListResponse.ok(), readingListBody).toBeTruthy();

  await page.getByRole("button", { name: "Reading library", exact: true }).click();
  await expect(page).toHaveURL(/\/library$/);
  await expect(page.getByRole("region", { name: "Read later", exact: true })).toContainText(title);
  await expect(page.getByRole("region", { name: "Continue reading", exact: true })).toContainText(
    title
  );
});
