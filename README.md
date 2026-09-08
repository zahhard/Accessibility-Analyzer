<div dir="rtl" align="right">

# تحلیلگر دسترس‌پذیری وب

یک MVP فارسی و RTL برای تحلیل اولیه دسترس‌پذیری یک URL عمومی بر پایه WCAG 2.2 AA، WAI-ARIA 1.2، Playwright و axe-core.

## قابلیت‌ها

- رندر صفحه با Chromium واقعی در viewportهای موبایل، تبلت و دسکتاپ
- تحلیل axe-core با تگ‌های WCAG 2.0/2.1/2.2
- بررسی هم‌زمان حالت‌های رنگی روشن و تاریک با `prefers-color-scheme`
- قوانین اختصاصی برای `lang`، `dir`، `title`، headingها، تصاویر، فرم‌ها، accessible name، لینک‌ها، landmarks، `iframe`، جدول‌ها، viewport و `target=_blank`
- امتیاز ۰ تا ۱۰۰ با وزن‌های critical=10، serious=6، moderate=3 و minor=1
- گزارش فارسی شامل خلاصه شدت‌ها، نمودار، جستجو، فیلتر، حالت رنگی، selector، HTML snippet، راهکار و کپی snippet
- نمایش نکات مثبت خودکار؛ امتیاز ۱۰۰ به معنی نبود خطای قابل‌شناسایی است، نه بررسی کامل همه‌ی WCAG
- screenshot از همه‌ی nodeهای خطادار؛ در صورت شکست crop عنصر، screenshot همان viewport به‌عنوان fallback ذخیره می‌شود
- اعتبارسنجی URL، بررسی redirect نهایی، rate limit حافظه‌ای، جلوگیری از دانلود و تشخیص پاسخ‌های ضدربات

## رفتار گزارش و روش تحلیل

تحلیل‌گر صفحه را با Chromium واقعی باز می‌کند و DOM نهایی پس از اجرای JavaScript را بررسی می‌کند؛ بنابراین نتیجه بر اساس چیزی است که مرورگر تحلیل‌گر دریافت و رندر کرده است، نه صرفاً HTML خام پاسخ HTTP.

برای هر viewport انتخاب‌شده، دو context مستقل Chromium ساخته می‌شود:

1. در context اول، `colorScheme: "light"` تنظیم می‌شود و سایت با `prefers-color-scheme: light` رندر می‌شود.
2. در context دوم، `colorScheme: "dark"` تنظیم می‌شود و سایت با `prefers-color-scheme: dark` رندر می‌شود.

سپس axe-core و قوانین سفارشی در هر دو context جداگانه اجرا می‌شوند. حالت رنگی هر ایراد در کارت همان ایراد و در خلاصه‌ی viewport نمایش داده می‌شود. اگر سایت فقط با کلیک روی دکمه یا مقدار `localStorage` تم را تغییر دهد، شبیه‌سازی `prefers-color-scheme` به‌تنهایی آن تعامل را فعال نمی‌کند و این محدودیت باید در ممیزی انسانی بررسی شود.

بخش «نکات مثبت» معیارهای موفق axe-core و قواعد سفارشی را نشان می‌دهد. موارد تکراری بر اساس شناسه‌ی قانون ادغام می‌شوند، اما تعداد آزمون‌های موفق خام نیز در `passesCount` گزارش نگهداری می‌شود. نکات مثبت خودکار جایگزین بررسی انسانی برای مواردی مثل معنادار بودن `alt`، تجربه‌ی شناختی، ترتیب واقعی تعاملات کیبورد و انطباق حقوقی نیستند.

برای هر violation، selector، HTML کوتاه‌شده، شرح شکست و screenshot nodeهای مشکل‌دار نمایش داده می‌شود. اگر selector به‌دلیل DOM پویا، shadow DOM یا مخفی‌بودن عنصر قابل crop نباشد، تصویر viewport همان حالت رنگی به‌عنوان fallback نشان داده می‌شود.

## تشخیص و مدیریت Cloudflare و ضدربات

پیش از تحلیل accessibility، صفحه با Chromium باز می‌شود، برای رندر client-side حدود ۱.۵ ثانیه صبر می‌کند و سپس تا ۴ ثانیه برای آرام‌شدن شبکه منتظر می‌ماند. بعد از آن، عنوان و متن قابل‌مشاهده‌ی صفحه بررسی می‌شوند.

نشانه‌هایی مانند `Just a moment`، `Checking your browser`، `Verify you are human`، `Ray ID`، `403 Forbidden` و `Access Denied` به‌عنوان صفحه‌ی چالش یا مسدودکننده شناسایی می‌شوند. پاسخ HTTP با وضعیت `401` یا `403` نیز مستقیماً متوقف می‌شود.

اگر به‌جای سایت اصلی صفحه‌ی Cloudflare، ضدربات یا خطای ۴۰۳ دریافت شود، تحلیل متوقف می‌شود و از همان صفحه screenshot یا score تولید نمی‌شود. API در این حالت خطای `ANTI_BOT_BLOCKED` برمی‌گرداند و توضیح می‌دهد که نتیجه مربوط به صفحه‌ی اصلی نیست. این برنامه Cloudflare را دور نمی‌زند؛ برای سایت‌هایی مثل Basalam باید دسترسی IP سرور تحلیل‌گر، user-agent یا سیاست ضدربات سایت بررسی شود.

## اجرا

پیش‌نیاز Node.js 20 یا جدیدتر است.

```bash
npm install
npx playwright install chromium
npm run dev
```

برای اجرای production:

```bash
npm run lint
npm run typecheck
npm run build
npm start
```

اگر روی سرور Chromium سیستم نصب است، مسیر آن را با `CHROME_PATH` در `.env.local` تنظیم کنید.

## API

`POST /api/analyze`

```json
{ "url": "https://example.com" }
```

پاسخ موفق شامل `url`، `pageTitle`، `score`، `scoreLabel`، `summary`، `violations`، `passesCount` و `incompleteCount` است.

کدهای خطا شامل `INVALID_URL`، `BLOCKED_URL`، `RATE_LIMITED`، `ANTI_BOT_BLOCKED`، `PAGE_LOAD_FAILED`، `ANALYSIS_TIMEOUT` و `ANALYSIS_FAILED` هستند. جزئیات داخلی فقط در log سرور ثبت می‌شوند.

## محدودیت‌ها و امنیت

URLهای `http` و `https` پذیرفته می‌شوند و username/password در URL مجاز نیست. rate limit فعلی برای MVP حافظه‌ای است و برای multi-instance production کافی نیست؛ در production باید Redis یا store توزیع‌شده جایگزین شود. از تحلیل سامانه‌های خصوصی یا بدون اجازه خودداری کنید.

rate limit فعلی برای MVP حافظه‌ای است و برای multi-instance production کافی نیست؛ در production باید Redis یا store توزیع‌شده جایگزین شود. از تحلیل سامانه‌های خصوصی یا بدون اجازه خودداری کنید.
