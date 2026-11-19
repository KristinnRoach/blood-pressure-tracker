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
