# Browser verification

Tests show the code does what the tests check; this shows the Toy does what the ticket asked, in a real browser. It runs before the PR is reviewed. It doesn't replace the owner trying the change on a real phone: how a gesture *feels* under a finger can't be screenshotted.

Keep every script, screenshot and comment file out of the repo: in the session's scratchpad, or the agent's output folder on a CI runner. Call that folder `<out>`.

## Steps

1. **Serve the build.** `bun run build`, then `bun run preview --port 4174 --strictPort` in the background (4173 belongs to the Playwright smoke suite). Done when `http://localhost:4174/` answers 200.
2. **Open a clean page.** Chrome DevTools MCP `new_page` with an `isolatedContext`, so the user's own browser data stays untouched.
   - No DevTools MCP (a CI runner), or DevTools says the browser profile is already in use: take the [headless route](#headless-route) for steps 3 to 5 instead. Leave a browser another session owns running.
3. **Walk the change.** The routes are `/` (Home) and `/toy/<id>`, one per Card; take the ids from Home's Card links rather than a list. Walk every route the change touches, plus each acceptance criterion of the ticket or the bug's repro steps. For a Toy, that usually means three states: just after arrival, mid-play (some Critters engaged), and after the Goal with the Completion overlay up.
   - After each navigation, wait for the **Home** button (`getByRole('button', { name: 'Home' })`) on a Toy route or the `Web Toys` heading on Home, then about 1.5 s more for arrival animations to settle, so screenshots don't catch a Critter mid-entrance.
   - Drive gestures with pointer input, which is what the Toys listen to. A tap is a click on the Critter. A Wipe, Drag or Swipe is `mouse.down()` on the Critter, `mouse.move()` in several steps, then `mouse.up()`. A Hold is `mouse.down()`, a wait, then `mouse.up()`. Read a Critter's state from its `data-*` attributes, as the Vitest tests do, rather than from pixels.
   - Never walk `/lab.html`: the critter lab isn't in the production build.
   - Sound doesn't matter here. Audio unlocks on the first tap (ADR-0003) and headless Chromium plays nothing.

   Done when every route and criterion has been walked.
4. **Look at it.** Screenshot each walked state at phone (390×844) and desktop (1280×800), and read every screenshot. Phone first: it's the primary target. Done when each one shows what the ticket describes and nothing is cut off, overlapping or missing. Whether it looks *good* is the owner's call, not this walk's.
5. **Check the console.** `list_console_messages` on each route. Done when every error and warning has been read and goes in the report. `bun run test:e2e` fails on any console error, so an error here is also a failing check.
6. **Post the screenshots.** Once the PR is open, name the files in walk order (`01-home-390.png`, `02-home-1280.png`, …), write the comment body to `<out>/comment.md` and post it with `gh pr comment <pr> --body-file <out>/comment.md`, plus one `--attach '<out>/<file>.png#<alt>'` per screenshot (gh 2.103 or later; up to 50 files). The body holds:
   - a line on the setup (production build, `vite preview` on 4174, Chromium) and the console result;
   - a table: what was done, what showed, which criterion it checks;
   - the images in a two-column table, `![<alt>](./<file>.png)`, phone and desktop of each state side by side.

   Skip this step for a change with nothing to see on screen. Done when the comment renders on the PR.
7. **Clean up.** Close the page and stop the preview server, unless the user wants it left running. Done when port 4174 is free (`lsof -i :4174` prints nothing).

## Headless route

For a runner with no DevTools MCP, such as the Implement workflow in CI. Serve the build on 4174 as in step 1, then drive steps 3 to 5 with a throwaway Playwright script in `<out>`.

```js
// node <out>/walk.mjs <repo> <out>
import { join } from "node:path";
const [repo, out] = process.argv.slice(2);
// Import by absolute path: an ES module resolves bare imports from its own folder, so
// `import "@playwright/test"` fails from <out>.
const { chromium } = await import(join(repo, "node_modules/@playwright/test/index.mjs"));

const base = "http://localhost:4174";
const widths = [[390, 844], [1280, 800]];
const browser = await chromium.launch();
const report = [];
let n = 0;

const shoot = async (page, name, width) => {
  const file = `${String(++n).padStart(2, "0")}-${name}-${width}.png`;
  await page.screenshot({ path: join(out, file) });
  return file;
};

for (const [width, height] of widths) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  const messages = [];
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") messages.push(`${m.type()}: ${m.text()}`);
  });
  page.on("pageerror", (e) => messages.push(`pageerror: ${e.message}`));

  await page.goto(base);
  await page.getByRole("heading", { level: 1, name: "Web Toys" }).waitFor();
  report.push({ path: "/", width, file: await shoot(page, "home", width) });

  // Add the Toy routes and gestures the ticket touches, e.g.:
  // await page.goto(`${base}/toy/<id>`);
  // await page.getByRole("button", { name: "Home" }).waitFor();
  // await page.waitForTimeout(1500);
  // report.push({ path: "/toy/<id>", width, file: await shoot(page, "<id>-arrival", width) });

  report.push({ width, messages });
  await context.close();
}

await browser.close();
console.log(JSON.stringify(report, null, 2));
```

Chromium must be installed (`bunx playwright install chromium`; CI does this already). Run it with the preview from step 1 up: `node <out>/walk.mjs "$PWD" <out>`. Then read every screenshot (step 4), and the printed report for console messages (step 5).

In CI the agent has no `gh`: it saves at most 10 screenshots to the `screenshots` folder of its output folder, and the workflow posts them on the PR in place of step 6. With 10, cover the ticket's states at phone width first and add desktop where room is left.

## Report

List each state walked with what you saw at each width, every console error and warning, and anything that looks wrong but is outside the ticket (name the ticket that owns it, if any). A mismatch that a retry with a proper wait clears was timing, and is reported as such.
