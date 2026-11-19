import { expect, test } from '@playwright/test';

test('saves a reading offline and keeps it after reloading', async ({
  page,
  context,
}) => {
  await page.goto('./');
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

  // Reload under service worker control so it can cache the production bundle.
  await page.reload();
  await page.waitForFunction(async () => {
    const entry = document.querySelector<HTMLScriptElement>(
      'script[type="module"][src]',
    );
    return Boolean(entry && (await caches.match(entry.src)));
  });

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('body')).toHaveClass(/\boffline\b/);

  await page.getByRole('button', { name: "Add Today's Reading" }).click();
  const form = page.getByRole('dialog', { name: 'Add reading' });
  await form.getByLabel('Systolic').fill('124');
  await form.getByLabel('Diastolic').fill('78');
  await form.getByLabel('Pulse').fill('64');
  await form.getByRole('button', { name: 'OK', exact: true }).click();
  await page.getByRole('button', { name: 'Close reading details' }).click();

  const entries = page.locator('#history-list .entry');
  await expect(entries).toHaveText([/124\/78 mmHg, 64 bpm/]);

  await page.reload();
  await expect(entries).toHaveText([/124\/78 mmHg, 64 bpm/]);
});

test('restores a reading from a version 1 JSON backup', async ({ page }) => {
  const backup = {
    version: '1.0',
    format: 'json',
    exportDate: '2025-05-02T09:00:00.000Z',
    metadata: { appVersion: '1.0.0', userId: null, readingCount: 1 },
    readings: [
      {
        systolic: 121,
        diastolic: 77,
        pulse: 66,
        timestamp: '2025-05-01T09:00:00.000Z',
      },
    ],
  };

  await page.goto('./');
  await expect(page.getByText('No readings yet')).toBeVisible();
  await page.getByRole('button', { name: 'Open Settings' }).click();
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: /Import Data/ }).click(),
  ]);
  await chooser.setFiles({
    name: 'synthetic-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });

  const entries = page.locator('#history-list .entry');
  await expect(entries).toHaveText([/121\/77 mmHg, 66 bpm/]);
  await page.getByRole('button', { name: 'Close modal', exact: true }).click();

  await page.reload();
  await expect(entries).toHaveText([/121\/77 mmHg, 66 bpm/]);
});

test.describe('reading dates west of UTC', () => {
  test.use({ timezoneId: 'America/Los_Angeles' });

  test('uses the local day, validates measurements, and returns focus to the saved day', async ({
    page,
  }) => {
    await page.clock.setFixedTime(new Date('2026-11-19T04:00:00Z'));
    await page.goto('./');
    const form = page.getByRole('dialog', { name: 'Add reading' });
    const date = form.getByLabel('Reading date');

    await page.getByRole('button', { name: "Add Today's Reading" }).click();
    await expect(date).toHaveValue('2026-11-18');
    await form.getByRole('button', { name: 'Cancel' }).click();

    const day = page.locator('button[data-date="2026-11-17"]');
    await day.press('Enter');
    await expect(date).toHaveValue('2026-11-17');
    await form.getByLabel('Systolic').fill('124');
    await form.getByLabel('Diastolic').fill('78');
    const submit = form.getByRole('button', { name: 'OK', exact: true });
    const pulse = form.getByLabel('Pulse');
    await submit.click();
    await expect(pulse).toBeFocused();
    await expect(page.getByText('No readings yet')).toBeVisible();

    await pulse.fill('64');
    await submit.click();
    await page.getByRole('button', { name: 'Close reading details' }).click();
    await expect(day).toHaveAccessibleName('November 17, 2026, 1 saved reading');
    await expect(day).toBeFocused();
  });
});

test('keeps the legacy reading form open on a drag onto the backdrop', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      value: undefined,
    });
  });
  await page.goto('./');
  await page.getByRole('button', { name: "Add Today's Reading" }).click();
  const form = page.getByRole('dialog', { name: 'Add reading' });
  const systolic = form.getByLabel('Systolic');
  await systolic.fill('124');
  await systolic.hover();
  await page.mouse.down();
  await page.mouse.move(2, 2);
  await page.mouse.up();
  await expect(systolic).toHaveValue('124');
  await page.mouse.click(2, 2);
  await expect(form).toBeHidden();
});

test('blocks dismissal while a reading write is pending', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByText('No readings yet')).toBeVisible();

  // Keep a separate IndexedDB write transaction open until dismissal is tested.
  await page.evaluate(
    () => new Promise<void>((resolve, reject) => {
      const open = indexedDB.open('BloodPressureDB');
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const db = open.result;
        const transaction = db.transaction('readings', 'readwrite');
        const store = transaction.objectStore('readings');
        let holding = true;
        window.addEventListener(
          'release-test-write-lock',
          () => { holding = false; },
          { once: true },
        );
        transaction.oncomplete = () => db.close();
        transaction.onerror = () => reject(transaction.error);

        const hold = () => {
          store.get(-1).onsuccess = () => {
            resolve();
            if (holding) hold();
          };
        };
        hold();
      };
    }),
  );

  await page.getByRole('button', { name: "Add Today's Reading" }).click();
  const form = page.getByRole('dialog', { name: 'Add reading' });
  await form.getByLabel('Systolic').fill('124');
  await form.getByLabel('Diastolic').fill('78');
  await form.getByLabel('Pulse').fill('64');
  await form.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(form.getByRole('button', { name: 'Saving…' })).toBeDisabled();

  await page.keyboard.press('Escape');
  await page.mouse.click(2, 2);
  try {
    await form.getByRole('button', { name: 'Close add reading' }).click({ force: true });
    await form.getByRole('button', { name: 'Cancel' }).click({ force: true });
    await expect(form.getByLabel('Pulse')).toHaveValue('64');
  } finally {
    await page.evaluate(() =>
      window.dispatchEvent(new Event('release-test-write-lock')),
    );
  }
  await expect(form).toBeHidden();
  await expect(page.getByRole('dialog', { name: 'Reading details' })).toBeVisible();
});
