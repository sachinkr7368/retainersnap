import { test as base, expect } from "@playwright/test";

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      const hide = () => {
        for (const node of document.querySelectorAll("nextjs-portal")) node.remove();
      };
      new MutationObserver(hide).observe(document.documentElement, { childList: true, subtree: true });
      hide();
    });
    await use(page);
  },
});

export { expect };
