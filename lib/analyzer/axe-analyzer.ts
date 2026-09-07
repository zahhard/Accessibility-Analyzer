import "server-only";
import { AxeBuilder } from "@axe-core/playwright";
import type { Page } from "playwright";
import type { AnalyzerPass, AnalyzerViolation, Severity } from "./types";

function wcagTags(tags: string[]) {
  return tags
    .filter((tag) => tag.startsWith("wcag"))
    .map((tag) => {
      const match = tag.match(/^wcag(\d)(\d)(\d)$/);
      return match ? `${match[1]}.${match[2]}.${match[3]}` : tag;
    });
}

export async function runAxe(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const violations: AnalyzerViolation[] = result.violations.map((item) => ({
    id: item.id,
    source: "axe-core",
    impact: (item.impact ?? "moderate") as Severity,
    wcag: wcagTags(item.tags),
    title: item.help,
    description: item.description,
    help: item.help,
    helpUrl: item.helpUrl,
    nodes: item.nodes.map((node) => ({
      target: node.target.map(String),
      html: node.html,
      failureSummary:
        node.failureSummary ?? "عنصر با معیار موردنظر سازگار نیست.",
    })),
    fixSuggestion: item.help,
  }));
  const positivePoints: AnalyzerPass[] = result.passes.map((item) => ({
    id: item.id,
    source: "axe-core",
    wcag: wcagTags(item.tags),
    title: item.help,
    description: item.description,
    helpUrl: item.helpUrl,
  }));
  return {
    violations,
    positivePoints,
    passesCount: result.passes.length,
    incompleteCount: result.incomplete.length,
  };
}
