const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
    testDir: "../e2e-ui",
    fullyParallel: false,
    retries: 1,
    timeout: 60_000,
    expect: { timeout: 10_000 },
    reporter: [
        ["list"],
        ["html", { outputFolder: "../../test-results/playwright-report", open: "never" }],
    ],
    use: {
        baseURL: process.env.FRONTEND_URL || "http://localhost:3000",
        trace: "on-first-retry",
        video: "on-first-retry",
        screenshot: "only-on-failure",
    },
    projects: [
        {
            name: "chromium-desktop",
            use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
        },
        {
            name: "chromium-mobile",
            use: { ...devices["Pixel 7"], viewport: { width: 375, height: 812 } },
        },
    ],
    webServer: {
        command: "npm run dev --workspace frontend",
        port: 3000,
        timeout: 120_000,
        reuseExistingServer: true,
        cwd: "../../",
    },
});
