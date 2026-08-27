import { expect, test, type Locator, type Page } from '@playwright/test';
import { cardFor, expectLegibleAtEitherEnd } from './support';

/*
  The home page as a whole: the hero (ticket 02) followed by the four sections
  this ticket adds. The measurements are the ones `docs/design/10 Bit Labs.dc.html`
  records, read back off the rendered page rather than asserted as a claim that it
  "matches the design".

  Every type scale here is a `clamp()` sitting at its ceiling at Playwright's
  1280px viewport, so each one resolves to the maximum the design names.
*/

const styleOf = (locator: Locator, keys: string[]) =>
  locator.first().evaluate(
    (element, properties) => {
      const style = getComputedStyle(element);
      return Object.fromEntries(
        properties.map((property) => [property, style[property as never] as string])
      );
    },
    keys
  );

/*
  What a colour token resolves to where it is used. The palette is stored as
  unresolved `light-dark()` pairs, so reading the custom property gives the
  declaration rather than the colour in play; a probe makes the browser resolve
  it for the palette actually showing.
*/
const resolvedColour = (locator: Locator, token: string) =>
  locator.first().evaluate((element, name) => {
    const probe = document.createElement('div');
    probe.style.color = `var(${name})`;
    element.append(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    return resolved;
  }, token);

const accentColour = (page: Page) => resolvedColour(page.locator('body'), '--accent');

/**
 * What `<n>ch` resolves to on this element — a computed `max-width` is reported
 * in pixels, so the design's `ch` measures are checked against the same unit
 * measured in the element's own font rather than a pixel count copied down.
 */
const chWidth = (locator: Locator, ch: number) =>
  locator.first().evaluate((element, count) => {
    const probe = document.createElement('div');
    probe.style.font = getComputedStyle(element).font;
    probe.style.width = `${count}ch`;
    element.append(probe);
    const width = parseFloat(getComputedStyle(probe).width);
    probe.remove();
    return width;
  }, ch);

/** The names of the App cards inside one section, in the order they render. */
const cardNamesIn = (scope: Locator) => scope.getByRole('listitem').getByRole('heading').allTextContents();

test.describe('the home page', () => {
  test('runs hero, featured Apps, what we do, about and contact in that order', async ({
    page
  }) => {
    await page.goto('/');

    // The labels that open each section, minus the contact section which has none.
    expect(await page.locator('main [data-section-label]').allInnerTexts()).toEqual([
      '// uk software studio',
      '// featured apps',
      '// what we do',
      '// about'
    ]);

    const sections = page.locator('main > section');
    await expect(sections).toHaveCount(5);
    await expect(sections.nth(0)).toContainText('We build useful apps for interesting problems.');
    await expect(sections.nth(4)).toContainText('$ mail hello@10bitlabs.co.uk');
  });

  test('opens the hero with the design dim label, not the accent one', async ({ page }) => {
    await page.goto('/');

    const hero = page.locator('main > section').first().locator('[data-section-label]');
    const [colour, dim, accent] = await Promise.all([
      hero.evaluate((element) => getComputedStyle(element).color),
      resolvedColour(hero, '--textDim'),
      accentColour(page)
    ]);

    expect(colour).toBe(dim);
    expect(colour).not.toBe(accent);
  });

  test('renders the featured Apps from the same content as the catalogue', async ({ page }) => {
    await page.goto('/apps/');
    const catalogue = await cardNamesIn(page.getByRole('main'));

    await page.goto('/');
    const featured = await cardNamesIn(page.locator('[data-featured-apps]'));

    // One content model, one running order — not a hand-kept second list.
    expect(featured).toEqual(catalogue);
    expect(featured.length).toBeGreaterThan(0);
  });

  test('states each featured App exactly as the catalogue does', async ({ page }) => {
    const readCards = async (route: string) => {
      await page.goto(route);
      return page.locator('[data-card]').evaluateAll((cards) =>
        cards.map((card) => ({
          name: card.querySelector('h2, h3')!.textContent,
          description: card.querySelector('[data-description]')!.textContent,
          platform: card.querySelector('[data-platform]')!.textContent,
          badge: card.querySelector('[data-badge]')!.textContent
        }))
      );
    };

    expect(await readCards('/')).toEqual(await readCards('/apps/'));
  });

  test('leaves in-development cards unlinked and tagged, as the catalogue does', async ({
    page
  }) => {
    await page.goto('/');

    for (const name of ['Plan The Day', 'Sıra', 'Fiilo', 'Pick My Lift']) {
      const card = cardFor(page, name);
      await expect(card.getByText('In development')).toBeVisible();
      await expect(card.getByRole('link')).toHaveCount(0);
    }
  });

  test('nests the featured card names under the section heading', async ({ page }) => {
    await page.goto('/');

    // One h1 on the page — the hero's. The featured cards sit under an h2, so
    // they are h3s here and h2s in the catalogue, where the h1 is the page title.
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(
      page.locator('[data-featured-apps]').getByRole('heading', { level: 3 }).first()
    ).toBeVisible();
  });

  test('routes from the featured section to the full catalogue', async ({ page }) => {
    await page.goto('/');

    const link = page.locator('[data-featured-apps]').getByRole('link', { name: /apps →/ });
    await expect(link).toHaveAttribute('href', '/apps/');
    await link.click();
    await expect(page).toHaveURL('/apps/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText("Things we're building.");
  });

  test('routes from the about teaser to the about page', async ({ page }) => {
    await page.goto('/');

    const link = page.getByRole('link', { name: './more-about-us →' });
    await expect(link).toHaveAttribute('href', '/about/');
    await link.click();
    await expect(page).toHaveURL('/about/');
  });

  test('says the studio publishes its own apps rather than working for hire', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-about-teaser]')).toContainText('rather than working for hire');
  });

  test('offers a working email link in the contact section', async ({ page }) => {
    await page.goto('/');

    const mail = page.locator('[data-contact]').getByRole('link');
    await expect(mail).toHaveAttribute('href', 'mailto:hello@10bitlabs.co.uk');
    await expect(mail).toContainText('hello@10bitlabs.co.uk');
  });

  test('claims nothing has shipped', async ({ page }) => {
    await page.goto('/');
    const copy = (await page.locator('main').innerText()).toLowerCase();

    for (const claim of [
      "we've built",
      'we have built',
      "we've shipped",
      'we shipped',
      'have shipped',
      'out now',
      'available now'
    ]) {
      expect(copy, `the home page still claims "${claim}"`).not.toContain(claim);
    }
  });

  test('is legible on a small phone and on a desktop', async ({ page }) => {
    await expectLegibleAtEitherEnd(page, '/');
  });
});

test.describe('the home sections are cut to the design measurements', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
  });

  test('sits every section in an 1100px column padded 0 28px 100px', async ({ page }) => {
    for (const section of ['[data-featured-apps]', '[data-what-we-do]', '[data-about-teaser]']) {
      expect(await styleOf(page.locator(section), ['maxWidth', 'padding']), section).toEqual({
        maxWidth: '1100px',
        padding: '0px 28px 100px'
      });
    }
  });

  test('opens the featured section with a 13px accent label and a 2rem heading', async ({
    page
  }) => {
    const section = page.locator('[data-featured-apps]');

    const label = await styleOf(section.locator('[data-section-label]'), [
      'fontSize',
      'fontFamily',
      'color'
    ]);
    expect(label.fontSize).toBe('13px');
    expect(label.fontFamily).toContain('JetBrains Mono');
    expect(label.color).toBe(await accentColour(page));

    const heading = await styleOf(section.getByRole('heading', { level: 2 }), [
      'fontSize',
      'fontFamily',
      'fontWeight',
      'marginBottom'
    ]);
    expect(heading.fontSize).toBe('32px'); // clamp(1.5rem, 3vw, 2rem)
    expect(heading.fontFamily).toContain('Space Grotesk');
    expect(heading.fontWeight).toBe('600');
    expect(heading.marginBottom).toBe('40px');
  });

  test('lays the featured grid on a 260px track, not the catalogue 280px', async ({ page }) => {
    const grid = await page.locator('[data-featured-apps] [data-app-grid]').evaluate((element) => {
      const style = getComputedStyle(element);
      return { gap: style.gap, columns: style.gridTemplateColumns.split(' ').length };
    });

    // 1100px of column less 28px either side, at minmax(260px, 1fr).
    expect(grid).toEqual({ gap: '24px', columns: 3 });
  });

  for (const [name, section] of [
    ['what we do', '[data-what-we-do]'],
    ['the about teaser', '[data-about-teaser]']
  ]) {
    test(`splits ${name} into a 1/3 flex row gapped 48px`, async ({ page }) => {
      const row = await styleOf(page.locator(section), ['display', 'flexWrap', 'gap']);
      expect(row).toEqual({ display: 'flex', flexWrap: 'wrap', gap: '48px' });

      expect(await styleOf(page.locator(`${section} [data-section-label]`), ['flex'])).toEqual({
        flex: '1 1 160px'
      });
      expect(await styleOf(page.locator(`${section} [data-split-body]`), ['flex'])).toEqual({
        flex: '3 1 420px'
      });

      const intro = await styleOf(page.locator(`${section} p`), [
        'fontSize',
        'lineHeight',
        'maxWidth'
      ]);
      expect(intro.fontSize).toBe('18px');
      expect(intro.lineHeight).toBe('28.8px'); // 18 × 1.6
      // Sub-pixel: the two measures round independently, so they agree to a tenth.
      expect(parseFloat(intro.maxWidth)).toBeCloseTo(
        await chWidth(page.locator(`${section} p`), 56),
        1
      );
    });
  }

  test('numbers the three steps and sets each one from the card vocabulary', async ({ page }) => {
    const steps = page.locator('[data-step]');
    await expect(steps).toHaveCount(3);

    expect(
      await styleOf(page.locator('[data-what-we-do] [data-steps]'), ['display', 'gap'])
    ).toEqual({ display: 'flex', gap: '32px' });

    const numbers = await steps.locator('[data-step-number]').allInnerTexts();
    expect(numbers).toEqual(['01', '02', '03']);

    expect(await styleOf(steps, ['flex'])).toEqual({ flex: '1 1 140px' });

    const number = await styleOf(steps.locator('[data-step-number]'), [
      'fontSize',
      'fontFamily',
      'color'
    ]);
    expect(number.fontSize).toBe('13px');
    expect(number.fontFamily).toContain('JetBrains Mono');
    expect(number.color).toBe(await accentColour(page));

    const heading = await styleOf(steps.getByRole('heading'), ['fontWeight', 'fontFamily']);
    expect(heading.fontWeight).toBe('600');
    expect(heading.fontFamily).toContain('Space Grotesk');

    const body = await styleOf(steps.locator('p'), ['fontSize', 'lineHeight']);
    expect(body.fontSize).toBe('14px');
    expect(body.lineHeight).toBe('21px'); // 14 × 1.5
  });

  test('sets the about teaser route in 14px accent mono', async ({ page }) => {
    const link = await styleOf(page.getByRole('link', { name: './more-about-us →' }), [
      'fontSize',
      'fontFamily',
      'color'
    ]);
    expect(link.fontSize).toBe('14px');
    expect(link.fontFamily).toContain('JetBrains Mono');
    expect(link.color).toBe(await accentColour(page));
  });

  test('closes on a full-bleed centred contact band', async ({ page }) => {
    const band = await styleOf(page.locator('[data-contact]'), [
      'padding',
      'textAlign',
      'borderTopWidth',
      'borderTopStyle'
    ]);
    expect(band).toEqual({
      padding: '90px 28px',
      textAlign: 'center',
      borderTopWidth: '1px',
      borderTopStyle: 'solid'
    });

    const heading = await styleOf(page.locator('[data-contact]').getByRole('heading', { level: 2 }), [
      'fontSize',
      'fontFamily',
      'fontWeight',
      'maxWidth'
    ]);
    expect(heading.fontSize).toBe('38.4px'); // clamp(1.6rem, 3.4vw, 2.4rem)
    expect(heading.fontFamily).toContain('Space Grotesk');
    expect(heading.fontWeight).toBe('600');
    expect(parseFloat(heading.maxWidth)).toBeCloseTo(
      await chWidth(page.locator('[data-contact]').getByRole('heading', { level: 2 }), 20),
      1
    );

    const mail = await styleOf(page.locator('[data-contact]').getByRole('link'), [
      'fontSize',
      'fontFamily',
      'color'
    ]);
    expect(mail.fontSize).toBe('18px');
    expect(mail.fontFamily).toContain('JetBrains Mono');
    expect(mail.color).toBe(await accentColour(page));
  });

  test('carries the second blinking cursor on the site, and only for those who allow motion', async ({
    page
  }) => {
    const cursors = page.locator('main .cursor');
    await expect(cursors).toHaveCount(2);

    const animated = await styleOf(page.locator('[data-contact] .cursor'), ['animationName']);
    expect(animated.animationName).toBe('blink');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    const still = await styleOf(page.locator('[data-contact] .cursor'), ['animationName']);
    expect(still.animationName).toBe('none');
  });
});
