import { expect, test, type Page } from '@playwright/test';

// Smoke test of the production build: Home and every Toy load at desktop and phone width
// with no console errors or uncaught exceptions. The Toy routes come from Home's own Cards,
// so a new Toy is covered as soon as it's registered.

const widths = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'phone', width: 390, height: 844 },
];

const collectErrors = (page: Page) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()} @ ${msg.location().url}`);
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
};

const toyPaths = async (page: Page) => {
  await page.goto('/');
  const links = page.locator('a[href^="/toy/"]');
  await expect(links.first()).toBeVisible();
  return links.evaluateAll((as) => as.map((a) => a.getAttribute('href') as string));
};

for (const { name, width, height } of widths) {
  test(`Home loads at ${name} width with a Card per Toy and no errors`, async ({ page }) => {
    const errors = collectErrors(page);
    await page.setViewportSize({ width, height });
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: 'Web Toys' })).toBeVisible();
    expect((await toyPaths(page)).length).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });

  test(`every Toy loads at ${name} width with a Home control and no errors`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const paths = await toyPaths(page);

    for (const path of paths) {
      const errors = collectErrors(page);
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(200);
      await expect(page.getByRole('button', { name: 'Home' }), path).toBeVisible();
      // Let arrival animations and their timers run, so errors they throw are caught.
      await page.waitForTimeout(1500);
      expect(errors, path).toEqual([]);
      page.removeAllListeners('console');
      page.removeAllListeners('pageerror');
    }
  });
}
