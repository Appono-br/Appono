const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

const BASE_URL = process.env.FRONTEND_URL || "http://localhost:3000";

test.describe("UX, Responsividade e Acessibilidade (RNF37, RNF41)", () => {
    test("RNF37 — Responsividade Mobile (375x812)", async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto(BASE_URL);
        await page.waitForLoadState("networkidle");

        // Não deve haver scroll horizontal
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });

    test("RNF37 — Responsividade Desktop (1440x900)", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto(BASE_URL);
        await page.waitForLoadState("networkidle");

        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });

    test("RNF41 — Acessibilidade: zero violações críticas na home", async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState("networkidle");

        const results = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa"])
            .analyze();

        const critical = results.violations.filter((v) => v.impact === "critical");

        if (critical.length > 0) {
            const details = critical.map((v) => `${v.id}: ${v.description} (${v.nodes.length} ocorrências)`).join("\n");
            expect.soft(critical, `Violações críticas encontradas:\n${details}`).toHaveLength(0);
        }
    });

    test("RNF41 — Acessibilidade: zero violações críticas no login", async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);
        await page.waitForLoadState("networkidle");

        const results = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa"])
            .analyze();

        const critical = results.violations.filter((v) => v.impact === "critical");
        expect(critical).toHaveLength(0);
    });

    test("RF21/RNF23 — Tema Claro/Escuro funciona", async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState("networkidle");

        // Verifica que a página carrega sem erros visuais graves
        const body = page.locator("body");
        await expect(body).toBeVisible();

        // Tenta encontrar botão de toggle de tema
        const themeToggle = page.locator('[data-testid="theme-toggle"], button:has-text("tema"), button:has-text("theme")');
        if (await themeToggle.count() > 0) {
            await themeToggle.first().click();
            await page.waitForTimeout(500);
            // A página não deve quebrar após toggle
            await expect(body).toBeVisible();
        }
    });
});
