# تحلیل‌گر دسترس‌پذیری وب

یک MVP واقعی و فارسی برای ارزیابی اولیه دسترس‌پذیری صفحات عمومی وب بر پایه WCAG 2.2 سطح AA و WAI-ARIA 1.2. ابزار URL را با Chromium و Playwright رندر می‌کند، سپس یافته‌های axe-core و قوانین اختصاصی پروژه را در یک گزارش قابل فهم ادغام می‌کند.

## قابلیت‌ها

- امتیاز پیشنهادی ۰ تا ۱۰۰ و سطح کیفی
- بررسی تصاویر، عنوان، زبان و جهت، Headingها، فرم‌ها، نام accessible، ARIA، متن لینک و کنتراست
- فهرست خطاها با شدت، معیار WCAG، selector، HTML، منبع و راهکار
- UI کاملاً فارسی و RTL، حالت تاریک و responsive
- کنترل SSRF، بررسی redirect نهایی و rate limit حافظه‌ای

## معماری

فرم Client Component با React Hook Form و Yup درخواست `POST /api/analyze` را با TanStack Query ارسال می‌کند. Route Handler روی Node.js URL را با Zod و DNS بررسی کرده، صفحه را با Playwright باز می‌کند، axe-core و قوانین اختصاصی را اجرا و گزارش را تولید می‌کند. گزارش موفق در `sessionStorage` ذخیره و در `/report` بازیابی می‌شود.

## نصب و اجرا

پیش‌نیاز: Node.js 20 یا جدیدتر.

```bash
npm install
npx playwright install chromium
npm run dev
```

برای production:

```bash
npm run lint
npm run typecheck
npm run build
npm start
```

## API

`POST /api/analyze`

```json
{ "url": "https://example.com" }
```

پاسخ موفق شامل `success`, `data.url`, `pageTitle`, `score`, `scoreLabel`, `summary`, `violations`, `passesCount` و `incompleteCount` است. پاسخ خطا از کدهای `INVALID_URL`, `BLOCKED_URL`, `RATE_LIMITED`, `PAGE_LOAD_FAILED`, `ANALYSIS_FAILED` استفاده می‌کند و جزئیات داخلی را افشا نمی‌کند.

## مدل امتیازدهی

وزن‌ها: `critical=10`, `serious=6`, `moderate=3`, `minor=1`.

```text
totalPenalty = Σ(severityWeight × numberOfAffectedNodes)
score = max(0, min(100, 100 - totalPenalty))
```

۹۰ تا ۱۰۰ «عالی»، ۷۵ تا ۸۹ «قابل قبول»، ۵۰ تا ۷۴ «نیازمند بهبود» و کمتر از ۵۰ «ضعیف» است. این شاخص پیشنهادی است و جایگزین ارزیابی کامل و انسانی WCAG نیست.

## قوانین اختصاصی

نبود `lang` و `title`، جهت RTL فارسی، ساختار Heading، `alt` تصاویر، متن مبهم لینک، برچسب کنترل‌های فرم، نام دکمه، عناصر غیرمعنایی کلیک‌پذیر و `target="_blank"` بدون `noopener` بررسی می‌شوند. بررسی event listenerهای جاوااسکریپتی از DOM به‌تنهایی کامل نیست؛ بنابراین قانون تعاملی بر attributeها، role، tabindex و داده‌های قابل استخراج DOM تکیه دارد.

## امنیت و محدودیت‌ها

- فقط HTTP/HTTPS و URLهای عمومی پذیرفته می‌شوند؛ username/password، localhost، IPهای خصوصی، loopback، link-local، multicast، unspecified و reserved رد می‌شوند.
- تمام IPهای DNS بررسی می‌شوند و URL نهایی پس از redirect نیز دوباره کنترل می‌شود.
- دانلود فایل با `acceptDownloads=false` غیرفعال است و پاسخ‌های attachment رد می‌شوند.
- rate limit فعلی حافظه‌ای و مناسب development یا یک instance است. برای production و چند instance باید Redis یا سرویس مشابه استفاده شود.
- فقط یک URL عمومی در هر درخواست تحلیل می‌شود؛ login، crawler، چند URL، دیتابیس، PDF و AI در این نسخه وجود ندارند.
- تحلیل خودکار نمی‌تواند مناسب بودن معنایی alt، همه رفتارهای کیبورد، محتوای پویا یا انطباق کامل را با قطعیت ثابت کند.

## توسعه‌های آینده

Crawler لینک‌های داخلی، چند viewport، تاریخچه دائمی، خروجی PDF، احراز هویت و بررسی کیفیت معنایی alt با AI.

## ساختار

`app/api/analyze` endpoint را نگه می‌دارد؛ `lib/analyzer` منطق axe، قوانین اختصاصی و امتیازدهی؛ `lib/security` اعتبارسنجی URL و rate limit؛ `components` رابط فرم و گزارش را نگه می‌دارند.

## ملاحظات حقوقی و اخلاقی

تنها URLهای عمومی و مجاز را تحلیل کنید، نرخ درخواست و شرایط استفاده سایت مقصد را رعایت کنید و از اجرای تحلیل روی سامانه‌های خصوصی یا بدون اجازه خودداری کنید.
