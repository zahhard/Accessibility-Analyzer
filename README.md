# تحلیلگر دسترس‌پذیری وب

یک MVP فارسی و RTL برای تحلیل اولیه دسترس‌پذیری یک URL عمومی بر پایه WCAG 2.2 AA، WAI-ARIA 1.2، Playwright و axe-core.

## قابلیت‌ها

- رندر صفحه با Chromium واقعی و viewport برابر 1440×900
- تحلیل axe-core با تگ‌های WCAG 2.0/2.1/2.2
- قوانین اختصاصی برای `lang`، `dir`، `title`، headingها، تصاویر، فرم‌ها، accessible name، لینک‌های مبهم و `target=_blank`
- امتیاز ۰ تا ۱۰۰ با وزن‌های critical=10، serious=6، moderate=3 و minor=1
- گزارش فارسی شامل خلاصه شدت‌ها، نمودار، جستجو، فیلتر، selector، HTML snippet، راهکار و کپی snippet
- اعتبارسنجی URL، DNS lookup، جلوگیری از SSRF، بررسی redirect نهایی، rate limit حافظه‌ای و جلوگیری از دانلود

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

کدهای خطا شامل `INVALID_URL`، `BLOCKED_URL`، `RATE_LIMITED`، `PAGE_LOAD_FAILED`، `ANALYSIS_TIMEOUT` و `ANALYSIS_FAILED` هستند. جزئیات داخلی فقط در log سرور ثبت می‌شوند.

## محدودیت‌ها و امنیت

فقط URLهای عمومی HTTP/HTTPS مجازند. localhost، IPهای خصوصی، loopback، link-local، multicast، unspecified، username/password و مقصدهای DNS خصوصی رد می‌شوند. تحلیل خودکار نمی‌تواند قضاوت انسانی درباره معنای alt، تجربه شناختی، همه رفتارهای keyboard یا انطباق نهایی را جایگزین کند.

rate limit فعلی برای MVP حافظه‌ای است و برای multi-instance production کافی نیست؛ در production باید Redis یا store توزیع‌شده جایگزین شود. از تحلیل سامانه‌های خصوصی یا بدون اجازه خودداری کنید.
