import "server-only";
import axeCore from "axe-core";
import type { AxeResults } from "axe-core";
import type { Page } from "playwright";
import type { AnalyzerPass, AnalyzerViolation, Severity } from "./types";

const axeTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
// axe-core exposes a browser-ready source string. Defining `module` locally
// avoids the CommonJS reference error seen when Playwright evaluates it in a
// browser context, without relying on a node_modules path at runtime.
const axeCoreSource = `var module;${axeCore.source}`;

interface AxeBrowserApi {
  run(context: Document, options: unknown): Promise<AxeResults>;
}

function wcagTags(tags: string[]) {
  return tags
    .filter((tag) => tag.startsWith("wcag"))
    .map((tag) => {
      const match = tag.match(/^wcag(\d)(\d)(\d)$/);
      return match ? `${match[1]}.${match[2]}.${match[3]}` : tag;
    });
}

export async function runAxe(page: Page) {
  // Do not use a node_modules file path here: Turbopack rewrites it in the
  // production server bundle. Evaluate the package-provided browser source.
  await page.evaluate(axeCoreSource);
  const result = await page.evaluate(async (tags): Promise<AxeResults> => {
    const axe = (window as Window & { axe?: AxeBrowserApi }).axe;
    if (!axe)
      throw new Error("اسکریپت axe-core در صفحه بارگذاری نشد.");
    return axe.run(document, {
      runOnly: { type: "tag", values: tags },
    });
  }, axeTags);
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
    // Keep the library response intact so consumers of the API can use every
    // axe-core field, not only the fields used by this application's report.
    rawResult: result,
  };
}
