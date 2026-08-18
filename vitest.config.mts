import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      "@heroui-pro/react/carousel": fileURLToPath(
        new URL("./components/rich-text/testing/heroui-pro-carousel.mock.ts", import.meta.url)
      ),
      "@heroui-pro/react/resizable": fileURLToPath(
        new URL("./components/rich-text/testing/heroui-pro-resizable.mock.ts", import.meta.url)
      ),
      "@heroui-pro/react": fileURLToPath(
        new URL("./components/rich-text/testing/heroui-pro.mock.ts", import.meta.url)
      ),
      "@heroui/react": fileURLToPath(
        new URL("./components/rich-text/testing/heroui.mock.ts", import.meta.url)
      ),
    },
  },
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "http://localhost/",
      },
    },
    include: ["components/rich-text/**/*.test.ts", "lib/features/**/*.test.ts", "features/moment/__tests__/**/*.test.ts"],
    setupFiles: ["./components/rich-text/testing/setup.ts"],
  },
});
