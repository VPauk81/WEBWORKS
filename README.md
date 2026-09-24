# WEBWORKS

Landing page / portfolio site for web development and business solutions — websites, online calculators, product configurators and order-automation tools for small and medium businesses across Europe.

Single static site, no build step, no framework — plain HTML/CSS/JS.

## Structure

```
index.html               Main page (markup only — styles and scripts are external)
css/style.css            All styles
js/script.js             Language switching, mobile nav, demo calculators, order-form demo
images/                  Site images / screenshots
google-apps-script/      Backend for the "Tell me about your project" form (see below)
```

## Features

- **4 languages** (EN / PL / DE / RU) switched client-side, no reload — see the `TRANSLATIONS` object at the top of `js/script.js`. All page text is edited there, matched to the page via `data-i18n="key"` attributes.
- **Demo project mockups** — service calculator, booking widget, product configurator, order list, and a contact form with live validation (name / email format / phone with a real country-code picker), all client-side only.
- SEO basics wired in: Open Graph, Twitter Card, JSON-LD (`ProfessionalService`), canonical URL — search `REPLACE_WITH_YOUR_DOMAIN` in `index.html` once the site has a real domain.

## Local preview

Just open `index.html` in a browser — no server or build step required.

## "Tell me about your project" form — connecting the real backend

Same approach as the Arduino/ESP32 Firmware Studio site: the page POSTs to a Google Apps Script Web App, which appends a row to a Google Sheet and emails a notification. Until this is set up, the form still works via a `mailto:` fallback.

1. Create a new Google Sheet, add a sheet/tab named `Заявки` (or change `SHEET_NAME` in the script to match).
2. In the Sheet, open **Extensions → Apps Script**, delete the placeholder code, and paste in `google-apps-script/Code.gs`.
3. Replace `SPREADSHEET_ID` in the script with the Sheet's ID (from its URL: `.../spreadsheets/d/THIS_PART/edit`).
4. **Deploy → New deployment → Web app** — Execute as **Me**, Who has access **Anyone** — Deploy, and copy the Web App URL.
5. In `js/script.js`, replace `WEBWORKS_SCRIPT_URL = "REPLACE_WITH_YOUR_APPS_SCRIPT_WEB_APP_URL"` with that URL.
6. **One extra one-time step for the status-change emails to work:** in the Apps Script editor, open **Триггеры** (the clock icon on the left) → **Добавить триггер** → function `checkStatusChanges` → event source "Из таблицы" → event type "При редактировании" → Save (and authorize again when asked). Without this trigger, the status dropdown in column B still works, but changing it won't email the client or recolor the row.

Whenever `google-apps-script/Code.gs` changes in this repo afterwards, re-paste it into the same Apps Script project and redeploy as a **new version** of the *same* deployment (Deploy → Manage deployments → ✏️ → Version: New version) — this keeps the same Web App URL, no need to touch `WEBWORKS_SCRIPT_URL` again.

### What the sheet does

- **Заявки** (main sheet) — one row per inquiry: ID, status (dropdown, see below), whether the client confirmation email sent, date, language, name, email, phone (forced to plain text so `+48...` doesn't trigger a formula error), WhatsApp/Viber/Telegram checkmarks, and description (shown as "📝 см. примечание" — hover the cell to read the full text, kept in a note instead of stretching the row).
- **Статус column** — click any cell to pick from 🟢 Новый → 🟡 Проверяется → 🟠 Ожидает оплаты → 🔵 В работе → 🟣 Готово → 📦 Отправлен → ✔️ Завершён → ❌ Отменён. The row's background color updates to match, and (once the trigger from step 6 is installed) the client automatically gets an email about the new status, written in whichever language they used the site in.
- **Visits** sheet — created automatically on first visit. Lightweight, no-IP/geolocation beacons (page language, browser language, timezone, referrer, device, screen size) for `pageview`, `language_view`, `inquiry_form_opened` and `inquiry_started` events.
- **`?action=stats`** on the Web App URL returns basic JSON stats (visits/inquiries today/yesterday/7d/30d/all-time, top referrers, device breakdown). Optionally lock it down by setting a `STATS_KEY` script property and calling `?action=stats&key=...`.

## To do before going live

- Replace `REPLACE_WITH_YOUR_DOMAIN` (canonical/OG/Twitter/JSON-LD tags) with the real domain.
- Add a real `og-image.jpg` (1200×630) for social link previews.
- Replace the GitHub contact link placeholder with a real profile URL.
- Add an Impressum / privacy policy page (required for advertising to a German audience).
- Connect the project-inquiry form's backend (see above) so submissions land in a Sheet, not just mailto:.
