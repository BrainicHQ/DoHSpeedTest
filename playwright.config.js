import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: 'tests/e2e',
    use: {
        baseURL: 'http://127.0.0.1:4173',
    },
    webServer: {
        command: 'npx --yes serve . -p 4173',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: true
    }
});
