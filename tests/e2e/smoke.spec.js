import { test, expect } from '@playwright/test';

test('page loads and run button is clickable', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('#checkButton')).toBeVisible();
    await expect(page.locator('#heroTitle')).toContainText('DoH');
});
