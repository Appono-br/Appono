"use strict";

const HEALED_LOG = [];

async function resilientLocator(page, primary, fallbacks = []) {
    try {
        const element = page.locator(primary);
        await element.waitFor({ state: "visible", timeout: 5_000 });
        return element;
    } catch {
        // primary selector failed — try fallbacks
    }

    for (const fallback of fallbacks) {
        try {
            let element;
            if (fallback.role) {
                element = page.getByRole(fallback.role, { name: fallback.name });
            } else if (fallback.label) {
                element = page.getByLabel(fallback.label);
            } else if (fallback.text) {
                element = page.getByText(fallback.text, { exact: fallback.exact ?? false });
            } else if (fallback.testId) {
                element = page.getByTestId(fallback.testId);
            } else {
                continue;
            }

            await element.waitFor({ state: "visible", timeout: 3_000 });

            HEALED_LOG.push({
                timestamp: new Date().toISOString(),
                primarySelector: primary,
                healedWith: JSON.stringify(fallback),
                suggestion: `Atualizar seletor: ${primary} → ${JSON.stringify(fallback)}`,
            });

            return element;
        } catch {
            continue;
        }
    }

    throw new Error(
        `[SELF-HEALING FAILED] Seletor primário "${primary}" e ${fallbacks.length} fallbacks falharam. ` +
        `Verifique se o componente foi removido ou reestruturado.`
    );
}

function getHealedLog() {
    return [...HEALED_LOG];
}

function clearHealedLog() {
    HEALED_LOG.length = 0;
}

function reportHealed() {
    if (!HEALED_LOG.length) return "";
    const lines = ["## [SELF-HEALED] Seletores Auto-Corrigidos", ""];
    for (const entry of HEALED_LOG) {
        lines.push(`- ⚠️ **${entry.primarySelector}** → ${entry.healedWith}`);
        lines.push(`  Sugestão: ${entry.suggestion}`);
    }
    return lines.join("\n");
}

module.exports = { resilientLocator, getHealedLog, clearHealedLog, reportHealed };
