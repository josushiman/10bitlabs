import { expect, test, type Page } from '@playwright/test';

/*
  Navigation on this site no longer reloads the document, so everything here is
  about what survives that — and about what a visitor who has asked their
  operating system for less motion gets instead.
*/

/**
 * Times every page transition the browser runs.
 *
 * Recorded from inside the page and read back afterwards: a transition is over
 * in a fifth of a second, which is not something a test can catch by sampling
 * from the outside.
 */
async function watchTransitions(page: Page) {
  await page.addInitScript(() => {
    const w = window as any;
    w.__transitions = [] as number[];
    w.__themeAtSwap = [] as string[];

    const start = document.startViewTransition?.bind(document);
    if (start) {
      document.startViewTransition = ((callback: any) => {
        const began = performance.now();
        const transition = start(callback);
        transition.finished.finally(() => w.__transitions.push(performance.now() - began));
        return transition;
      }) as typeof document.startViewTransition;
    }

    // The palette as the swap leaves it, which is the frame before the new page
    // is painted: anything wrong here is a flash the visitor would see.
    document.addEventListener('astro:after-swap', () =>
      w.__themeAtSwap.push(document.documentElement.dataset.theme ?? '')
    );
  });
}

/**
 * Leaves a mark on the window, and reports whether it is still there.
 *
 * A document swap keeps it; a reload throws the whole context away and takes it
 * with them. Counting from inside an init script would not do — those run in a
 * fresh context per document, so a counter there always reads one however many
 * documents the browser loaded.
 */
const markDocument = (page: Page) =>
  page.evaluate(() => ((window as any).__thisDocument = true));
const sameDocument = (page: Page) =>
  page.evaluate(() => (window as any).__thisDocument === true);

const transitionTimes = (page: Page) =>
  page.evaluate(() => (window as any).__transitions as number[]);

/*
  Everything the browser has been told to carry across this navigation.

  <html> is skipped: the browser names it `root` on its own, and that name is the
  whole-page cross-fade rather than anything this site asked for.
*/
const NAMED_ELEMENTS = `[...document.body.querySelectorAll('*')]
  .filter((element) => getComputedStyle(element).viewTransitionName !== 'none')
  .map((element) => ({
    name: getComputedStyle(element).viewTransitionName,
    tag: element.tagName.toLowerCase(),
    text: element.textContent?.trim() ?? ''
  }))`;

interface NamedElement {
  name: string;
  tag: string;
  text: string;
}

const sharedHeading = (page: Page) => page.evaluate(NAMED_ELEMENTS) as Promise<NamedElement[]>;

const menuButton = (page: Page) => page.getByRole('button', { name: /menu/i });
const themeToggle = (page: Page) => page.getByRole('button', { name: 'Toggle dark/light mode' });

test.describe('moving between pages', () => {
  test('animates the page across rather than tearing the document down', async ({ page }) => {
    await watchTransitions(page);
    await page.goto('/');
    await markDocument(page);

    await menuButton(page).click();
    await page.getByRole('link', { name: 'About', exact: true }).click();
    await expect(page).toHaveURL('/about/');

    // One document throughout: a second one would mean the browser reloaded,
    // which is the white flash this ticket exists to remove.
    expect(await sameDocument(page), '/about/ arrived in a new document').toBe(true);
    await expect.poll(() => transitionTimes(page)).toHaveLength(1);
  });

  test('leaves the back button working, transition and all', async ({ page }) => {
    await watchTransitions(page);
    await page.goto('/');
    await markDocument(page);
    await menuButton(page).click();
    await page.getByRole('link', { name: 'Apps', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText("Things we're building.");

    await page.goBack();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('We build useful apps');

    await page.goForward();
    await expect(page).toHaveURL('/apps/');
    expect(await sameDocument(page), 'going back reloaded the document').toBe(true);
  });

  test('makes zero third-party network requests on the way', async ({ page, baseURL }) => {
    const origin = new URL(baseURL!).origin;
    const foreign: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.startsWith('data:') || url.startsWith(origin)) return;
      foreign.push(url);
    });

    await page.goto('/');
    for (const label of ['Apps', 'About', 'Contact']) {
      await menuButton(page).click();
      await page.getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL(`/${label.toLowerCase()}/`);
    }
    await page.waitForLoadState('networkidle');

    expect(foreign).toEqual([]);
  });

  test('asks for nothing the content policy refuses', async ({ page }) => {
    /*
      The router would otherwise prefetch every link it can see, and a
      `<link rel="prefetch">` is measured against `default-src`, which this site
      sets to `'none'`. Nothing here would break visibly — the fetches would
      simply be refused — so only the console says whether prefetch is still off.
    */
    const violations: string[] = [];
    page.on('console', (message) => {
      if (message.text().includes('Content Security Policy')) violations.push(message.text());
    });

    await page.goto('/');
    for (const label of ['Apps', 'About']) {
      await menuButton(page).click();
      await page.getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL(`/${label.toLowerCase()}/`);
    }
    await page.waitForLoadState('networkidle');

    expect(violations).toEqual([]);
  });
});

test.describe('an App card and its detail page', () => {
  const APP = '_fixture-detailed-app';

  test('are named as one element for the length of the navigation', async ({ page }) => {
    await watchTransitions(page);
    await page.goto('/apps/');

    // Nothing is named until a navigation needs it: the name may only be on one
    // element at a time, and a page full of cards has many candidates.
    expect(await sharedHeading(page)).toEqual([]);

    await page.locator(`[data-card][href="/apps/${APP}/"]`).click();
    await expect(page).toHaveURL(`/apps/${APP}/`);

    const arriving = await sharedHeading(page);
    expect(arriving).toHaveLength(1);
    expect(arriving[0].tag).toBe('h1');
    expect(arriving[0].name).not.toBe('none');
  });

  test('carries the name on the card the visitor actually clicked', async ({ page }) => {
    await page.goto('/apps/');

    // Read the outgoing page while it is still standing: `astro:before-swap`
    // fires before the document is replaced.
    const leaving = page.evaluate(
      `new Promise((settle) =>
        document.addEventListener('astro:before-swap', () => settle(${NAMED_ELEMENTS}), {
          once: true
        })
      )`
    ) as Promise<NamedElement[]>;

    await page.locator(`[data-card][href="/apps/${APP}/"]`).click();

    const named = await leaving;
    expect(named).toHaveLength(1);
    expect(named[0].text).toBe('Fixture Detailed App');

    // The same name on both sides is the whole mechanism: that is what makes the
    // browser animate the one into the other rather than fading them separately.
    const arriving = await sharedHeading(page);
    expect(arriving[0].name).toBe(named[0].name);
  });

  test('leave nothing named once the visitor moves on elsewhere', async ({ page }) => {
    await page.goto(`/apps/${APP}/`);
    await menuButton(page).click();
    await page.getByRole('link', { name: 'About', exact: true }).click();
    await expect(page).toHaveURL('/about/');

    expect(await sharedHeading(page)).toEqual([]);
  });
});

test.describe('the controls after a navigation', () => {
  test('the theme toggle still switches the palette', async ({ page }) => {
    await page.goto('/');
    await menuButton(page).click();
    await page.getByRole('link', { name: 'About', exact: true }).click();
    await expect(page).toHaveURL('/about/');

    const before = await page.locator('html').getAttribute('data-theme');
    await themeToggle(page).click();
    await expect(page.locator('html')).toHaveAttribute(
      'data-theme',
      before === 'light' ? 'dark' : 'light'
    );
  });

  test('the toggle still reports which palette is in play', async ({ page }) => {
    await page.goto('/');
    await themeToggle(page).click();
    const chosen = await page.locator('html').getAttribute('data-theme');

    await menuButton(page).click();
    await page.getByRole('link', { name: 'Contact', exact: true }).click();
    await expect(page).toHaveURL('/contact/');

    await expect(themeToggle(page)).toHaveAttribute(
      'aria-pressed',
      String(chosen === 'light')
    );
  });

  test('the menu still opens, traps the keyboard and closes on Escape', async ({ page }) => {
    await page.goto('/');
    await menuButton(page).click();
    await page.getByRole('link', { name: 'Apps', exact: true }).click();
    await expect(page).toHaveURL('/apps/');

    const button = menuButton(page);
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');

    const insideMenu = () =>
      page.evaluate(() => !!document.activeElement?.closest('[data-menu]'));
    for (let press = 0; press < 8; press += 1) {
      await page.keyboard.press('Tab');
      expect(await insideMenu(), `focus escaped after ${press + 1} tabs`).toBe(true);
    }

    await page.keyboard.press('Escape');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toBeFocused();
  });
});

test.describe('the palette across a navigation', () => {
  test.use({ colorScheme: 'dark' });

  test('survives without a frame of the wrong one', async ({ page }) => {
    await watchTransitions(page);
    await page.goto('/');
    await themeToggle(page).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await menuButton(page).click();
    await page.getByRole('link', { name: 'About', exact: true }).click();
    await expect(page).toHaveURL('/about/');

    // Recorded as the swap finished, which is before the new page was painted.
    expect(await page.evaluate(() => (window as any).__themeAtSwap)).toEqual(['light']);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
});

test.describe('a visitor who has asked for less motion', () => {
  // This Playwright's `reducedMotion` lives on the context rather than at the
  // top level, unlike `colorScheme`.
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('gets a solid cursor rather than one that blinks forever', async ({ page }) => {
    await page.goto('/');

    // Both of them: the hero's prompt and the closing contact band's mail line.
    const cursors = page.locator('.cursor');
    await expect(cursors).toHaveCount(2);

    for (const cursor of await cursors.all()) {
      const style = await cursor.evaluate((element) => {
        const computed = getComputedStyle(element);
        return { animationName: computed.animationName, opacity: computed.opacity };
      });
      expect(style.animationName, 'a cursor is still blinking').toBe('none');
      expect(style.opacity).toBe('1');
    }
  });

  test('gets instant cuts between pages rather than a cross-fade', async ({ page }) => {
    await watchTransitions(page);
    await page.goto('/');
    await menuButton(page).click();
    await page.getByRole('link', { name: 'About', exact: true }).click();
    await expect(page).toHaveURL('/about/');

    await expect.poll(() => transitionTimes(page)).toHaveLength(1);
    const [elapsed] = await transitionTimes(page);
    expect(elapsed, 'the page transition still ran an animation').toBeLessThan(100);
  });

  test('gets cards that do not lift or ease under the pointer', async ({ page }) => {
    await page.goto('/apps/');
    const card = page.locator('[data-card].linked').first();

    expect(await card.evaluate((element) => getComputedStyle(element).transitionDuration)).toBe(
      '0s'
    );
    await card.hover();
    expect(await card.evaluate((element) => getComputedStyle(element).transform)).toBe('none');
  });
});

test('a visitor who has asked for nothing still gets the cross-fade', async ({ page }) => {
  await watchTransitions(page);
  await page.goto('/');
  await menuButton(page).click();
  await page.getByRole('link', { name: 'About', exact: true }).click();
  await expect(page).toHaveURL('/about/');

  await expect.poll(() => transitionTimes(page)).toHaveLength(1);
  const [elapsed] = await transitionTimes(page);
  expect(elapsed, 'the page transition was instant for everyone').toBeGreaterThan(100);
});

test('the terminal cursor blinks for everyone who has not asked for less', async ({ page }) => {
  await page.goto('/');
  const style = await page.locator('.cursor').first().evaluate((element) => {
    const computed = getComputedStyle(element);
    return {
      name: computed.animationName,
      duration: computed.animationDuration,
      timing: computed.animationTimingFunction,
      count: computed.animationIterationCount
    };
  });

  // The design's own square wave: 1s, step-end, forever. `step-end` is the same
  // function as `steps(1)`, which is how the browser reports it back.
  expect(style).toEqual({
    name: 'blink',
    duration: '1s',
    timing: 'steps(1)',
    count: 'infinite'
  });
});
