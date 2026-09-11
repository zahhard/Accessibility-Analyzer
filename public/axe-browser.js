(async () => {
  const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
  const loadAxe = () =>
    new Promise((resolve, reject) => {
      if (window.axe) return resolve(window.axe);
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js";
      script.onload = () => resolve(window.axe);
      script.onerror = reject;
      document.head.appendChild(script);
    });

  const axe = await loadAxe();
  const result = await axe.run(document, { runOnly: { type: "tag", values: tags } });
  const output = {
    url: location.href,
    title: document.title,
    analyzedAt: new Date().toISOString(),
    source: "axe-core-browser",
    ...result,
  };
  const blob = new Blob([JSON.stringify(output, null, 2)], {
    type: "application/json",
  });
  const download = document.createElement("a");
  download.href = URL.createObjectURL(blob);
  download.download = `axe-report-${location.hostname || "page"}.json`;
  download.textContent = "دانلود JSON خام axe-core";
  download.style.cssText = "display:block;margin-top:10px;color:#93c5fd";

  const panel = document.createElement("aside");
  panel.dir = "rtl";
  panel.style.cssText = [
    "position:fixed",
    "z-index:2147483647",
    "left:16px",
    "bottom:16px",
    "width:320px",
    "max-height:70vh",
    "overflow:auto",
    "padding:16px",
    "border-radius:12px",
    "background:#0f172a",
    "color:#e2e8f0",
    "font:14px/1.7 sans-serif",
    "box-shadow:0 10px 30px #0008",
  ].join(";");
  panel.innerHTML = `<strong>گزارش axe-core مرورگر</strong><br>خطاها: ${output.violations.length}<br>موفق: ${output.passes.length}<br>نیازمند بررسی: ${output.incomplete.length}`;
  panel.appendChild(download);
  const close = document.createElement("button");
  close.textContent = "بستن";
  close.style.cssText = "margin-top:10px;padding:4px 8px;cursor:pointer";
  close.onclick = () => panel.remove();
  panel.appendChild(close);
  document.body.appendChild(panel);
})().catch((error) => {
  alert(`اجرای axe-core انجام نشد: ${error.message || error}`);
});
