import type { Page } from "playwright";
import type {
  AnalyzerNode,
  AnalyzerPass,
  AnalyzerViolation,
  Severity,
} from "./types";

export async function runCustomRules(page: Page): Promise<{
  violations: AnalyzerViolation[];
  positivePoints: AnalyzerPass[];
}> {
  const findings = await page.evaluate(() => {
    type Finding = Omit<AnalyzerViolation, "source">;
    type PositivePoint = Omit<AnalyzerPass, "source">;
    const node = (
      target: string,
      element: Element,
      failureSummary: string,
    ): AnalyzerNode => ({
      target: [target],
      html: element.outerHTML.slice(0, 1000),
      failureSummary,
    });
    const selector = (element: Element, index: number) =>
      element.id
        ? `#${CSS.escape(element.id)}`
        : `${element.tagName.toLowerCase()}${element.classList.length ? `.${CSS.escape(element.classList[0])}` : `:nth-of-type(${index + 1})`}`;
    const results: Finding[] = [];
    const positivePoints: PositivePoint[] = [];
    const add = (finding: Omit<Finding, "nodes">, nodes: AnalyzerNode[]) =>
      results.push({ ...finding, nodes });
    const html = document.documentElement;
    const basic = (
      id: string,
      impact: Severity,
      wcag: string[],
      title: string,
      description: string,
      help: string,
      fixSuggestion: string,
      helpUrl?: string,
    ) => ({
      id,
      impact,
      wcag,
      title,
      description,
      help,
      fixSuggestion,
      helpUrl,
    });
    const addPositive = (
      id: string,
      title: string,
      description: string,
      wcag: string[] = [],
      helpUrl?: string,
    ) =>
      positivePoints.push({
        id,
        wcag,
        title,
        description,
        helpUrl,
      });

    if (html.getAttribute("lang")?.trim())
      addPositive(
        "html-lang",
        "زبان صفحه مشخص شده است",
        "زبان اصلی صفحه برای فناوری‌های کمکی مشخص شده است.",
        ["3.1.1"],
        "https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html",
      );
    if (document.title.trim())
      addPositive(
        "page-title",
        "صفحه عنوان توصیفی دارد",
        "عنوان صفحه برای شناسایی موضوع آن وجود دارد.",
        ["2.4.2"],
        "https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html",
      );

    if (!html.getAttribute("lang"))
      add(
        basic(
          "missing-html-lang",
          "serious",
          ["3.1.1"],
          "زبان صفحه مشخص نشده است",
          "زبان اصلی صفحه برای فناوری کمکی مشخص نیست.",
          "ویژگی lang را روی html تنظیم کنید.",
          '<html lang="fa" dir="rtl">',
          "https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html",
        ),
        [node("html", html, "ویژگی lang در html وجود ندارد.")],
      );
    if (
      (html.getAttribute("lang") ?? "").toLowerCase().startsWith("fa") &&
      html.getAttribute("dir") !== "rtl"
    )
      add(
        basic(
          "missing-rtl-direction",
          "minor",
          [],
          "جهت راست‌به‌چپ مشخص نشده است",
          "صفحه فارسی است اما dir=rtl ندارد.",
          "جهت صفحه را روی rtl تنظیم کنید.",
          '<html lang="fa" dir="rtl">',
        ),
        [node("html", html, "صفحه فارسی است اما dir=rtl ندارد.")],
      );
    if (!document.title.trim())
      add(
        basic(
          "missing-page-title",
          "serious",
          ["2.4.2"],
          "عنوان صفحه وجود ندارد",
          "عنوان صفحه به کاربران و صفحه‌خوان‌ها در تشخیص موضوع کمک می‌کند.",
          "یک عنوان توصیفی اضافه کنید.",
          "<title>عنوان توصیفی صفحه</title>",
          "https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html",
        ),
        [node("head", document.head, "عنوان صفحه خالی یا غایب است.")],
      );
    const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")];
    if (document.querySelector("h1"))
      addPositive(
        "page-h1",
        "صفحه Heading اصلی دارد",
        "یک heading سطح اول برای ساختار محتوای صفحه پیدا شد.",
        ["1.3.1"],
      );
    if (!document.querySelector("h1"))
      add(
        basic(
          "missing-h1",
          "moderate",
          ["1.3.1"],
          "Heading اصلی وجود ندارد",
          "صفحه باید یک heading سطح اول داشته باشد.",
          "یک h1 توصیفی اضافه کنید.",
          "<h1>عنوان اصلی صفحه</h1>",
        ),
        [node("body", document.body, "هیچ h1 در صفحه پیدا نشد.")],
      );
    if (headings.filter((item) => item.tagName === "H1").length > 1)
      add(
        basic(
          "multiple-h1",
          "moderate",
          ["1.3.1"],
          "چند Heading اصلی وجود دارد",
          "وجود چند h1 ساختار صفحه را مبهم می‌کند.",
          "یک h1 اصلی نگه دارید.",
          "Headingهای اضافی را به h2 تبدیل کنید.",
        ),
        headings
          .filter((item) => item.tagName === "H1")
          .map((item, i) =>
            node(selector(item, i), item, "چند h1 در صفحه وجود دارد."),
          ),
      );
    headings.forEach((item, i) => {
      const current = Number(item.tagName.slice(1));
      const previous = i ? Number(headings[i - 1].tagName.slice(1)) : current;
      if (current > previous + 1)
        add(
          basic(
            "heading-order",
            "moderate",
            ["1.3.1"],
            "پرش در ترتیب Headingها",
            "سطح heading بدون ترتیب منطقی افزایش یافته است.",
            "سطح headingها را سلسله‌مراتبی مرتب کنید.",
            "برای نمونه h1 را مستقیماً به h3 تبدیل نکنید.",
          ),
          [
            node(
              selector(item, i),
              item,
              `ترتیب از h${previous} به h${current} پرش کرده است.`,
            ),
          ],
        );
    });
    const images = [...document.querySelectorAll("img")];
    if (images.length && images.every((item) => item.hasAttribute("alt")))
      addPositive(
        "image-alt",
        "تصاویر ویژگی متن جایگزین دارند",
        "همه تصاویر صفحه ویژگی alt دارند؛ معنادار بودن متن‌ها همچنان نیازمند بررسی انسانی است.",
        ["1.1.1"],
        "https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html",
      );
    images.forEach((item, i) => {
      if (!item.hasAttribute("alt"))
        add(
          basic(
            "image-alt",
            "critical",
            ["1.1.1"],
            "تصویر بدون متن جایگزین",
            "تصویر معنادار باید alt داشته باشد.",
            "برای تصویر alt معنادار اضافه کنید.",
            'alt="توضیح تصویر"',
          ),
          [node(selector(item, i), item, "تصویر ویژگی alt ندارد.")],
        );
      else if (!item.getAttribute("alt")?.trim())
        add(
          basic(
            "empty-image-alt",
            "minor",
            ["1.1.1"],
            "متن جایگزین تصویر خالی است",
            "ممکن است تصویر تزئینی باشد؛ تصمیم نهایی نیازمند بررسی انسانی است.",
            "تزئینی بودن تصویر را بررسی کنید.",
            'alt=""',
          ),
          [
            node(
              selector(item, i),
              item,
              "alt attribute is empty; review is required.",
            ),
          ],
        );
    });
    const vague = new Set([
      "اینجا",
      "اینجا کلیک کنید",
      "بیشتر",
      "ادامه",
      "مشاهده",
      "click here",
      "more",
      "read more",
    ]);
    document.querySelectorAll("a").forEach((item, i) => {
      const text = (item.getAttribute("aria-label") || item.textContent || "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
      if (vague.has(text))
        add(
          basic(
            "ambiguous-link-text",
            "moderate",
            ["2.4.4"],
            "متن لینک مبهم است",
            "متن لینک مقصد یا اقدام را روشن نمی‌کند.",
            "متن لینک را واضح‌تر کنید.",
            "مقصد لینک را در متن توضیح دهید.",
            "https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html",
          ),
          [node(selector(item, i), item, "متن لینک عمومی و مبهم است.")],
        );
      if (
        item.target === "_blank" &&
        !item.rel.split(/\s+/).includes("noopener")
      )
        add(
          basic(
            "blank-target-noopener",
            "minor",
            [],
            "لینک بدون noopener",
            "این هشدار امنیتی/کیفی است.",
            "rel=noopener اضافه کنید.",
            'rel="noopener noreferrer"',
          ),
          [
            node(
              selector(item, i),
              item,
              "target=_blank بدون rel=noopener است.",
            ),
          ],
        );
    });
    document.querySelectorAll("input,select,textarea").forEach((item, i) => {
      const labeled =
        item.hasAttribute("aria-label") ||
        item.hasAttribute("aria-labelledby") ||
        (!!item.id &&
          !!document.querySelector(`label[for="${CSS.escape(item.id)}"]`));
      if (!labeled)
        add(
          basic(
            "form-control-name",
            "serious",
            ["1.3.1", "4.1.2"],
            "عنصر فرم برچسب ندارد",
            "کنترل فرم accessible name ندارد.",
            "یک label یا aria-label مرتبط اضافه کنید.",
            '<label for="field">عنوان</label>',
          ),
          [node(selector(item, i), item, "کنترل فرم برچسب ندارد.")],
        );
    });
    const formControls = [...document.querySelectorAll("input,select,textarea")];
    if (
      formControls.length &&
      formControls.every(
        (item) =>
          item.hasAttribute("aria-label") ||
          item.hasAttribute("aria-labelledby") ||
          (!!item.id &&
            !!document.querySelector(`label[for="${CSS.escape(item.id)}"]`)),
      )
    )
      addPositive(
        "form-control-name",
        "کنترل‌های فرم برچسب قابل دسترس دارند",
        "برای همه کنترل‌های فرم، accessible name پیدا شد.",
        ["1.3.1", "4.1.2"],
      );
    const buttons = [...document.querySelectorAll("button,[role=button]")];
    if (
      buttons.length &&
      buttons.every((item) =>
        (
          item.getAttribute("aria-label") ||
          item.getAttribute("aria-labelledby") ||
          item.textContent ||
          ""
        ).trim(),
      )
    )
      addPositive(
        "button-name",
        "دکمه‌ها نام قابل دسترس دارند",
        "برای همه دکمه‌ها و عناصر دارای role=button نام قابل دسترس پیدا شد.",
        ["4.1.2"],
      );
    buttons.forEach((item, i) => {
      const name = (
        item.getAttribute("aria-label") ||
        item.getAttribute("aria-labelledby") ||
        item.textContent ||
        ""
      ).trim();
      if (!name)
        add(
          basic(
            "button-name",
            "critical",
            ["4.1.2"],
            "دکمه نام قابل دسترس ندارد",
            "دکمه باید accessible name داشته باشد.",
            "متن یا aria-label توصیفی اضافه کنید.",
            '<button type="button">عملیات</button>',
          ),
          [node(selector(item, i), item, "دکمه نام قابل دسترس ندارد.")],
        );
      if (
        item.matches("[role=button]") &&
        item.tagName !== "BUTTON" &&
        item.getAttribute("tabindex") !== "0"
      )
        add(
          basic(
            "non-semantic-interactive",
            "serious",
            ["2.1.1", "4.1.2"],
            "عنصر تعاملی غیرمعنایی است",
            "عنصر role=button با کیبورد قابل دسترسی نیست.",
            "از button واقعی استفاده کنید.",
            '<button type="button">عملیات</button>',
          ),
          [node(selector(item, i), item, "عنصر role=button فوکوس‌پذیر نیست.")],
        );
    });
    document
      .querySelectorAll("div[onclick],span[onclick]")
      .forEach((item, i) =>
        add(
          basic(
            "non-semantic-clickable",
            "serious",
            ["2.1.1"],
            "عنصر کلیک‌پذیر غیرمعنایی",
            "از button یا link معنایی استفاده کنید.",
            "عنصر تعاملی مناسب استفاده کنید.",
            '<button type="button">عملیات</button>',
          ),
          [node(selector(item, i), item, "عنصر div یا span کلیک‌پذیر است.")],
        ),
      );
    return { findings: results, positivePoints };
  });
  return {
    violations: findings.findings.map((finding) => ({
      ...finding,
      source: "custom" as const,
    })),
    positivePoints: findings.positivePoints.map((point) => ({
      ...point,
      source: "custom" as const,
    })),
  };
}
