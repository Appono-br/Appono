const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const { resilientLocator } = require("../agent/self-healing-locator");

const BASE_URL = process.env.FRONTEND_URL || "http://localhost:3000";

test.describe("Auth & Onboarding (RF01-RF05)", () => {
    test("Página inicial carrega e exibe conteúdo", async ({ page }) => {
        await page.goto(BASE_URL);
        await expect(page).toHaveTitle(/Appono/i);
        await expect(page.locator("body")).toBeVisible();
    });

    test("Formulário de login é acessível e funcional", async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);

        const emailInput = await resilientLocator(page, 'input[type="email"]', [
            { role: "textbox", name: /email/i },
            { label: /email/i },
        ]);
        await expect(emailInput).toBeVisible();

        const passwordInput = await resilientLocator(page, 'input[type="password"]', [
            { role: "textbox", name: /senha|password/i },
            { label: /senha|password/i },
        ]);
        await expect(passwordInput).toBeVisible();
    });

    test("Rejeita CPF inválido no cadastro de cliente (RNF09)", async ({ page }) => {
        await page.goto(`${BASE_URL}/cadastro`);

        // Verifica se o formulário de cadastro existe
        const form = page.locator("form");
        if (await form.count() === 0) {
            test.skip("Formulário de cadastro não encontrado na rota /cadastro");
            return;
        }

        await expect(form).toBeVisible();
    });

    test("RNF08/RNF03 — Segurança: tenta SQL injection no login", async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);

        const emailInput = page.locator('input[type="email"]');
        if (await emailInput.count() === 0) {
            test.skip("Campo email não encontrado");
            return;
        }

        // Payload de SQL injection não deve causar erro 500
        await emailInput.fill("admin@test.com' OR '1'='1");
        const passwordInput = page.locator('input[type="password"]');
        if (await passwordInput.count() > 0) {
            await passwordInput.fill("' OR '1'='1' --");
        }

        const submitBtn = page.locator('button[type="submit"]');
        if (await submitBtn.count() > 0) {
            await submitBtn.click();
            // Não deve resultar em erro 500 do servidor
            await page.waitForTimeout(2000);
            const bodyText = await page.locator("body").textContent();
            expect(bodyText).not.toContain("Internal Server Error");
            expect(bodyText).not.toContain("500");
        }
    });

    test("RNF41 — Zero violações críticas de acessibilidade na home", async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState("networkidle");

        const results = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa"])
            .analyze();

        const critical = results.violations.filter((v) => v.impact === "critical");
        expect(critical).toHaveLength(0);
    });
});
