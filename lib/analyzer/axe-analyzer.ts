import "server-only";
import { AxeBuilder } from "@axe-core/playwright";
import type { Page } from "playwright";
import type { AnalyzerViolation, Severity } from "./types";
export async function runAxe(page: Page) {
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const violations: AnalyzerViolation[] = result.violations.map((item) => ({
    id: item.id, source: "axe-core", impact: (item.impact ?? "moderate") as Severity,
    wcag: item.tags.filter((tag) => /^\d+\.\d+(\.\d+)?$/.test(tag)).map((tag) => tag.replace("wcag", "")),
    title: item.help, description: item.description, help: item.help, helpUrl: item.helpUrl,
    nodes: item.nodes.map((node) => ({ target: node.target.map(String), html: node.html, failureSummary: node.failureSummary ?? "عنصر با معیار موردنظر سازگار نیست." })),
    fixSuggestion: item.help,
  }));
  return { violations, passesCount: result.passes.length, incompleteCount: result.incomplete.length };
}
