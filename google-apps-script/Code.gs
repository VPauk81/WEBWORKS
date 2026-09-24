// ==========================================================
// WEBWORKS — приём заявок из формы "Расскажите о проекте"
// Тот же принцип и те же приёмы, что на сайте Arduino/ESP32
// Firmware Studio: сайт делает fetch()-POST с полем "data"
// (JSON-строка) на этот скрипт. Два типа запросов:
//   - обычная заявка (name/email/phone/message/...)
//   - "маячок" визита (type: "visit") — для статистики/Дашборда
// ==========================================================

// ID своей Google Таблицы (из её ссылки:
// https://docs.google.com/spreadsheets/d/ЭТОТ_ID/edit)
const SPREADSHEET_ID = "1bF083S-JgnAWPtx_3f3_PAqDJgmBEAv5nFoEAeXHHhI";
const SHEET_NAME = "Заявки";
const OWNER_EMAIL = "s.i.pauchak@gmail.com";

// Часовой пояс, в котором Я читаю таблицу (это НЕ часовой пояс
// посетителей — их собственный часовой пояс хранится отдельно,
// в столбце "Часовой пояс (посетителя)" листа Visits).
const APP_TIMEZONE = "Europe/Warsaw";

// =======================
// ЗАЯВКИ — столбцы (1 = A) и заголовки
// =======================
const HEADER_ROW = [
  "ID заявки", "Статус", "Email клиенту", "Дата заявки", "Язык",
  "Имя", "Email", "Телефон", "WhatsApp", "Viber", "Telegram", "Описание"
];

const COL_STATUS = 2;       // B
const COL_CLIENT_EMAIL = 3; // C
const COL_LANG = 5;         // E
const COL_CLIENT_EMAIL_ADDR = 7; // G
const COL_DESCRIPTION = 12; // L

function doGet(e) {

  const action = e.parameter.action;

  if (action === "stats") {
    return getStats(e);
  }

  return ContentService.createTextOutput("OK");

}

function doPost(e) {
  try {

    const data = JSON.parse(e.parameter.data);

    // "Маячок" визита — отдельная, гораздо более лёгкая ветка.
    // Не трогает счётчик заявок, не шлёт письма, просто
    // дописывает строку на лист "Visits" и обновляет Дашборд.
    if (data.type === "visit") {

      logVisit(data);

      return ContentService
        .createTextOutput(JSON.stringify({ status: "ok" }))
        .setMimeType(ContentService.MimeType.JSON);

    }

    return handleInquiry(data);

  } catch (err) {

    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);

  }
}

// ==========================================================
// ЗАЯВКИ
// ==========================================================

function nextOrderId() {
  const props = PropertiesService.getScriptProperties();
  let last = Number(props.getProperty("ORDER_NUM") || 0);
  last++;
  props.setProperty("ORDER_NUM", String(last));
  return "WW-" + String(last).padStart(5, "0");
}

function ensureHeaderRow(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER_ROW);
    sheet.getRange(1, 1, 1, HEADER_ROW.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
}

// Выпадающий список статусов в столбце B — перевызываем при каждой
// заявке, чтобы список точно охватывал и только что добавленную строку.
function setupStatusDropdown(sheet) {
  const options = ["new","checking","payment","working","ready","sent","completed","cancelled"]
    .map(function(k){ return STATUS_LANG.ru[k]; });

  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(options, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, COL_STATUS, 998, 1).setDataValidation(rule);
}

// Google Таблицы принимают строку, начинающуюся с "+", "-", "=", за
// начало формулы ("Ошибка. Синтаксическая ошибка в формуле."). Ведущий
// апостроф форсирует текстовый формат и сам не отображается в ячейке —
// тот же приём, что и в Arduino-проекте (forceText).
function forceText(value) {
  const str = String(value || "").trim();
  if (!str) return "";
  return "'" + str;
}

// Длинное описание никогда не идёт в саму ячейку (иначе строка
// растягивается на весь текст) — в ячейке всегда одна и та же
// короткая пометка, а полный текст лежит в примечании (наведение
// мышью), точно как previewText()/attachFullDescriptionNotes() в
// Arduino-проекте.
function previewText(value) {
  const full = String(value || "").trim();
  if (!full) return "";
  return "📝 см. примечание";
}

function attachDescriptionNote(sheet, row, description) {
  const full = String(description || "").trim();
  sheet.getRange(row, COL_DESCRIPTION).setNote(full || null);
}

// Определяем статус по ключевому слову, а не по точному совпадению
// строки с эмодзи — надёжнее, если где-то эмодзи сохранится другими
// байтами. Сравнение без учёта регистра.
function detectStatusKey(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("нов"))                                 return "new";
  if (s.includes("провер"))                              return "checking";
  if (s.includes("оплат"))                                return "payment";
  if (s.includes("работ"))                                return "working";
  if (s.includes("готов"))                                return "ready";
  if (s.includes("отправлен") || s.includes("отправк"))   return "sent";
  if (s.includes("заверш"))                               return "completed";
  if (s.includes("отмен"))                                return "cancelled";
  return null;
}

function statusColor(status) {
  switch (detectStatusKey(status)) {
    case "new":       return "#65fa4b";
    case "checking":  return "#fff3b0";
    case "payment":   return "#f29407";
    case "working":   return "#bbdefb";
    case "ready":     return "#e1bee7";
    case "sent":      return "#c97526";
    case "completed": return "#a5d6a7";
    case "cancelled": return "#fa4b5c";
    default:          return "#ffffff";
  }
}

function colorRow(sheet, row) {
  const status = sheet.getRange(row, COL_STATUS).getValue();
  sheet.getRange(row, 1, 1, HEADER_ROW.length).setBackground(statusColor(status));
}

// Безопасная отправка письма — проверяет остаток суточной квоты
// Gmail ДО попытки отправки; если её нет, сразу пишет понятную
// причину в столбец "Email клиенту", вместо тихой потери письма.
function safeSendEmail(mailOptions, sheet, row) {

  if (MailApp.getRemainingDailyQuota() <= 0) {
    if (sheet && row) {
      sheet.getRange(row, COL_CLIENT_EMAIL).setValue(QUOTA_WARNING_TEXT);
    }
    return false;
  }

  try {
    MailApp.sendEmail(mailOptions);
    return true;
  } catch (mailErr) {
    if (sheet && row) {
      sheet.getRange(row, COL_CLIENT_EMAIL).setValue(QUOTA_WARNING_TEXT);
    }
    return false;
  }

}

const QUOTA_WARNING_TEXT =
  "⚠ email не отправлен: превышен суточный лимит писем Gmail. " +
  "Попробуйте позже (лимит обновляется около полуночи по тихоокеанскому времени)";

function handleInquiry(data) {

  const sheet = SpreadsheetApp
    .openById(SPREADSHEET_ID)
    .getSheetByName(SHEET_NAME);

  ensureHeaderRow(sheet);
  setupStatusDropdown(sheet);

  const orderID = nextOrderId();

  const createdLabel = Utilities.formatDate(new Date(), APP_TIMEZONE, "dd.MM.yyyy HH:mm");

  sheet.appendRow([
    orderID,
    STATUS_LANG.ru.new,
    "…",
    createdLabel,
    data.language || "",
    data.name || "",
    data.email || "",
    forceText(data.phone),
    data.whatsapp ? "✔" : "",
    data.viber ? "✔" : "",
    data.telegram ? "✔" : "",
    previewText(data.message)
  ]);

  const row = sheet.getLastRow();

  attachDescriptionNote(sheet, row, data.message);
  colorRow(sheet, row);

  // Письмо клиенту — "спасибо, получил заявку"
  if (data.email) {
    const sentOk = safeSendEmail({
      to: data.email,
      replyTo: OWNER_EMAIL,
      subject: "Спасибо за заявку — WEBWORKS",
      body:
        "Здравствуйте" + (data.name ? ", " + data.name : "") + "!\n\n" +
        "Я получил вашу заявку (" + orderID + ") и скоро свяжусь с вами.\n\n" +
        "С уважением,\nWEBWORKS"
    }, sheet, row);
    if (sentOk) {
      sheet.getRange(row, COL_CLIENT_EMAIL).setValue("✅ Отправлено");
    }
  } else {
    sheet.getRange(row, COL_CLIENT_EMAIL).setValue("—");
  }

  // Письмо владельцу — уведомление о новой заявке (не критично, если
  // не дойдёт: строка в таблице уже сохранена как основная запись).
  safeSendEmail({
    to: OWNER_EMAIL,
    subject: "WEBWORKS — новая заявка " + orderID + " от " + (data.name || "без имени"),
    body:
      "Заявка: " + orderID + "\n" +
      "Имя: " + (data.name || "") + "\n" +
      "Email: " + (data.email || "") + "\n" +
      "Телефон: " + (data.phone || "—") + "\n" +
      "WhatsApp: " + (data.whatsapp ? "да" : "нет") + "\n" +
      "Viber: " + (data.viber ? "да" : "нет") + "\n" +
      "Telegram: " + (data.telegram ? "да" : "нет") + "\n" +
      "Язык сайта: " + (data.language || "") + "\n\n" +
      (data.message || "")
  }, null, null);

  updateDashboard();

  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok", orderID: orderID }))
    .setMimeType(ContentService.MimeType.JSON);

}

// ==========================================================
// СМЕНА СТАТУСА — триггер onEdit (устанавливается вручную,
// см. README): перекрашивает строку и шлёт клиенту письмо о
// новом статусе на языке, на котором была заявка.
//
// ⚠ Это INSTALLABLE-триггер — просто функция onEdit(e) в файле
// сама не сработает с MailApp (у простых триггеров нет доступа
// к отправке писем). Нужно один раз вручную добавить триггер:
// Триггеры (⏰ слева) → Добавить триггер → функция
// checkStatusChanges → источник "Из таблицы" → тип "При
// редактировании" → Сохранить.
// ==========================================================
const STATUS_LANG = {

  ru: {
    new: "🟢 Новый", checking: "🟡 Проверяется", payment: "🟠 Ожидает оплаты",
    working: "🔵 В работе", ready: "🟣 Готово", sent: "📦 Отправлен",
    completed: "✔️ Завершён", cancelled: "❌ Отменён",

    hello: "Здравствуйте!",
    received: "Ваша заявка успешно получена.",
    verify: "Мы начали проверку вашей заявки.",
    paymentText: "Ваш проект готов к оплате.",
    workingText: "Мы приступили к разработке.",
    readyText: "Ваш проект выполнен.",
    sentText: "Материалы по вашему проекту отправлены.",
    completedText: "Ваш проект полностью завершён.",
    cancelledText: "К сожалению, ваша заявка была отменена.",
    order: "Номер заявки", orderWord: "Заявка", status: "Статус"
  },

  pl: {
    new: "🟢 Nowe", checking: "🟡 Weryfikacja", payment: "🟠 Oczekuje na płatność",
    working: "🔵 W realizacji", ready: "🟣 Gotowe", sent: "📦 Wysłano",
    completed: "✔️ Zakończono", cancelled: "❌ Anulowano",

    hello: "Dzień dobry!",
    received: "Twoje zgłoszenie zostało przyjęte.",
    verify: "Rozpoczęliśmy weryfikację zgłoszenia.",
    paymentText: "Twój projekt oczekuje na płatność.",
    workingText: "Rozpoczęliśmy pracę nad projektem.",
    readyText: "Twój projekt jest gotowy.",
    sentText: "Materiały zostały wysłane.",
    completedText: "Projekt został zakończony.",
    cancelledText: "Niestety zgłoszenie zostało anulowane.",
    order: "Numer zgłoszenia", orderWord: "Zgłoszenie", status: "Status"
  },

  en: {
    new: "🟢 New", checking: "🟡 Under review", payment: "🟠 Waiting for payment",
    working: "🔵 In progress", ready: "🟣 Ready", sent: "📦 Sent",
    completed: "✔️ Completed", cancelled: "❌ Cancelled",

    hello: "Hello!",
    received: "Your inquiry has been received.",
    verify: "We have started reviewing your inquiry.",
    paymentText: "Your project is waiting for payment.",
    workingText: "We have started working on your project.",
    readyText: "Your project is ready.",
    sentText: "The files for your project have been sent.",
    completedText: "Your project has been completed.",
    cancelledText: "Unfortunately your inquiry has been cancelled.",
    order: "Inquiry number", orderWord: "Inquiry", status: "Status"
  },

  de: {
    new: "🟢 Neu", checking: "🟡 Wird geprüft", payment: "🟠 Zahlung ausstehend",
    working: "🔵 In Bearbeitung", ready: "🟣 Fertig", sent: "📦 Versendet",
    completed: "✔️ Abgeschlossen", cancelled: "❌ Storniert",

    hello: "Hallo!",
    received: "Ihre Anfrage ist erfolgreich eingegangen.",
    verify: "Wir haben mit der Prüfung Ihrer Anfrage begonnen.",
    paymentText: "Ihr Projekt wartet auf die Zahlung.",
    workingText: "Wir haben mit der Entwicklung begonnen.",
    readyText: "Ihr Projekt ist fertig.",
    sentText: "Die Dateien zu Ihrem Projekt wurden versendet.",
    completedText: "Ihr Projekt ist vollständig abgeschlossen.",
    cancelledText: "Leider wurde Ihre Anfrage storniert.",
    order: "Anfragenummer", orderWord: "Anfrage", status: "Status"
  }

};

function checkStatusChanges(e) {

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
  } catch (err) {
    return; // кто-то уже обрабатывает это изменение
  }

  try {

    const sheet = e.range.getSheet();
    if (sheet.getName() !== SHEET_NAME) return;
    if (e.range.getColumn() !== COL_STATUS) return;

    const row = e.range.getRow();
    if (row < 2) return;

    colorRow(sheet, row);

    const status = sheet.getRange(row, COL_STATUS).getValue();
    const email = sheet.getRange(row, COL_CLIENT_EMAIL_ADDR).getValue();
    if (!email) return;

    const key = detectStatusKey(status);
    if (!key) return;

    const lang = sheet.getRange(row, COL_LANG).getValue() || "ru";
    const T = STATUS_LANG[lang] || STATUS_LANG.ru;
    const orderID = sheet.getRange(row, 1).getValue();

    const MESSAGES = {
      new: T.received, checking: T.verify, payment: T.paymentText,
      working: T.workingText, ready: T.readyText, sent: T.sentText,
      completed: T.completedText, cancelled: T.cancelledText
    };

    const subject = T.orderWord + " " + orderID + " — " + status;
    const body =
      T.hello + "\n\n" +
      MESSAGES[key] + "\n\n" +
      T.order + ": " + orderID + "\n" +
      T.status + ": " + status + "\n\n" +
      "WEBWORKS";

    safeSendEmail({ to: email, replyTo: OWNER_EMAIL, subject: subject, body: body }, sheet, row);

  } finally {
    lock.releaseLock();
  }

}

// ==========================================================
// СТАТИСТИКА ПОСЕЩЕНИЙ (лист "Visits")
// Лёгкие "маячки" без IP/геолокации — только то, что браузер
// отдаёт сам (язык, часовой пояс, referrer, устройство). Страна —
// это ДОГАДКА по часовому поясу самого посетителя (см. TZ_COUNTRY
// ниже), а не настоящая геолокация по IP.
// ==========================================================
const VISITS_SHEET_NAME = "Visits";

// Порядок столбцов 0-14 не менять и не переставлять — на него
// завязаны индексы в computeStats(). Новые поля добавлять только
// в конец списка (как "Страна" здесь), иначе старые уже записанные
// строки съедут относительно новых заголовков.
const VISITS_HEADERS = [
  "Дата/время (моё, Europe/Warsaw)", "Метка времени (raw)", "Событие",
  "Язык сайта", "Язык браузера", "Часовой пояс (посетителя)",
  "Источник (домен)", "Referrer (полный)", "UTM Source", "UTM Medium",
  "UTM Campaign", "Устройство", "Разрешение экрана", "Страница",
  "User-Agent", "Страна (догадка по часовому поясу)"
];

// 0-based индексы для computeStats()
const VCOL_EVENT = 2;
const VCOL_SITELANG = 3;
const VCOL_TIMEZONE = 5;
const VCOL_DOMAIN = 6;
const VCOL_DEVICE = 11;

const EVENT_LABELS = {
  pageview: "Просмотр страницы",
  language_view: "Смена языка",
  inquiry_form_opened: "Открыли форму заявки",
  inquiry_started: "Начали заполнять заявку"
};

function eventLabel(key) {
  return EVENT_LABELS[key] || key;
}

// Грубая догадка о стране ТОЛЬКО по часовому поясу браузера
// посетителя (Intl API) — без IP, без сторонних сервисов, без
// вопросов по GDPR. Покрывает Европу (основной рынок сайта) плюс
// несколько популярных зон за её пределами.
const TZ_COUNTRY = {
  "Europe/Warsaw": "Польша",
  "Europe/Berlin": "Германия",
  "Europe/Paris": "Франция",
  "Europe/London": "Великобритания",
  "Europe/Madrid": "Испания",
  "Europe/Rome": "Италия",
  "Europe/Amsterdam": "Нидерланды",
  "Europe/Brussels": "Бельгия",
  "Europe/Vienna": "Австрия",
  "Europe/Zurich": "Швейцария",
  "Europe/Prague": "Чехия",
  "Europe/Bratislava": "Словакия",
  "Europe/Lisbon": "Португалия",
  "Europe/Copenhagen": "Дания",
  "Europe/Oslo": "Норвегия",
  "Europe/Stockholm": "Швеция",
  "Europe/Helsinki": "Финляндия",
  "Europe/Dublin": "Ирландия",
  "Europe/Athens": "Греция",
  "Europe/Budapest": "Венгрия",
  "Europe/Bucharest": "Румыния",
  "Europe/Sofia": "Болгария",
  "Europe/Zagreb": "Хорватия",
  "Europe/Ljubljana": "Словения",
  "Europe/Belgrade": "Сербия",
  "Europe/Kiev": "Украина",
  "Europe/Kyiv": "Украина",
  "Europe/Moscow": "Россия",
  "Europe/Minsk": "Беларусь",
  "Europe/Vilnius": "Литва",
  "Europe/Riga": "Латвия",
  "Europe/Tallinn": "Эстония",
  "America/New_York": "США", "America/Chicago": "США",
  "America/Los_Angeles": "США", "America/Denver": "США",
  "Asia/Dubai": "ОАЭ",
  "Europe/Istanbul": "Турция", "Asia/Istanbul": "Турция"
};

function guessCountry(timezone) {
  return TZ_COUNTRY[String(timezone || "")] || "";
}

function getOrCreateVisitsSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(VISITS_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(VISITS_SHEET_NAME);
  }

  // Заголовки перезаписываются каждый раз (дёшево и безопасно) —
  // так и переименование столбца, и новые столбцы В КОНЦЕ списка
  // подхватятся сами, без ручной миграции. Существующие данные не
  // трогаем — новые столбцы только дописываются справа.
  sheet.getRange(1, 1, 1, VISITS_HEADERS.length).setValues([VISITS_HEADERS]);
  sheet.getRange(1, 1, 1, VISITS_HEADERS.length).setFontWeight("bold");
  sheet.setFrozenRows(1);

  return sheet;
}

function extractDomain(url) {
  const str = String(url || "").trim();
  if (!str) return "Прямой заход";
  try {
    const host = str.replace(/^https?:\/\//i, "").split("/")[0];
    return host || "Прямой заход";
  } catch (e) {
    return "Прямой заход";
  }
}

function logVisit(data) {
  const sheet = getOrCreateVisitsSheet();
  const now = new Date();

  sheet.appendRow([
    Utilities.formatDate(now, APP_TIMEZONE, "dd.MM.yyyy HH:mm"),
    now,
    eventLabel(data.event || "pageview"),
    data.siteLang || "",
    data.browserLang || "",
    data.timezone || "",
    extractDomain(data.referrer),
    data.referrer || "",
    data.utmSource || "",
    data.utmMedium || "",
    data.utmCampaign || "",
    data.device || "",
    data.screen || "",
    data.pageUrl || "",
    data.userAgent || "",
    guessCountry(data.timezone)
  ]);

  updateDashboard();
}

// =======================
// ПОДСЧЁТ СТАТИСТИКИ — общий источник для doGet?action=stats и
// для листа "Дашборд". Считает просмотры/события за сегодня,
// вчера, 7 и 30 дней, разбивку по языку показа сайта, устройству,
// источникам перехода, календарь за 35 дней, и заявки (из
// основного листа) — по датам и по языку.
// =======================
function emptyCounter() {
  return { today: 0, yesterday: 0, last7: 0, last30: 0, allTime: 0 };
}

function bump(counter, dateKey, rawDate, todayKey, yesterdayKey, day7, day30) {
  counter.allTime++;
  if (dateKey === todayKey) counter.today++;
  if (dateKey === yesterdayKey) counter.yesterday++;
  if (rawDate >= day7) counter.last7++;
  if (rawDate >= day30) counter.last30++;
}

function computeStats() {

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const visitsSheet = ss.getSheetByName(VISITS_SHEET_NAME);
  const tz = APP_TIMEZONE;
  const now = new Date();

  const todayKey = Utilities.formatDate(now, tz, "yyyy-MM-dd");
  const yesterdayKey = Utilities.formatDate(new Date(now.getTime() - 86400000), tz, "yyyy-MM-dd");
  const day7 = new Date(now.getTime() - 7 * 86400000);
  const day30 = new Date(now.getTime() - 30 * 86400000);
  const day35 = new Date(now.getTime() - 34 * 86400000);

  const totals = {
    pageviews: emptyCounter(),
    formOpened: emptyCounter(),
    inquiryStarted: emptyCounter()
  };
  const bySiteLang = {};
  const byDevice = {};
  const byDomain = {};
  const dailyMap = {};

  const rows = (visitsSheet && visitsSheet.getLastRow() > 1)
    ? visitsSheet.getRange(2, 1, visitsSheet.getLastRow() - 1, VISITS_HEADERS.length).getValues()
    : [];

  rows.forEach(function(r){
    const rawDate = r[1];
    const eventRaw = r[VCOL_EVENT] || "";
    const siteLang = r[VCOL_SITELANG] || "unknown";
    const domain = r[VCOL_DOMAIN] || "";
    const device = r[VCOL_DEVICE] || "unknown";

    if (!(rawDate instanceof Date) || isNaN(rawDate.getTime())) return;

    const dateKey = Utilities.formatDate(rawDate, tz, "yyyy-MM-dd");
    const isPageview = eventRaw === eventLabel("pageview");

    if (isPageview) {
      bump(totals.pageviews, dateKey, rawDate, todayKey, yesterdayKey, day7, day30);
      bySiteLang[siteLang] = (bySiteLang[siteLang] || 0) + 1;
      byDevice[device] = (byDevice[device] || 0) + 1;
      byDomain[domain] = (byDomain[domain] || 0) + 1;

      if (rawDate >= day35) {
        dailyMap[dateKey] = (dailyMap[dateKey] || 0) + 1;
      }
    }

    if (eventRaw === eventLabel("inquiry_form_opened")) {
      bump(totals.formOpened, dateKey, rawDate, todayKey, yesterdayKey, day7, day30);
    }
    if (eventRaw === eventLabel("inquiry_started")) {
      bump(totals.inquiryStarted, dateKey, rawDate, todayKey, yesterdayKey, day7, day30);
    }
  });

  // Календарь — последние 35 дней, включая дни без единого визита
  const dailySeries = [];
  for (let i = 0; i < 35; i++) {
    const d = new Date(day35.getTime() + i * 86400000);
    const key = Utilities.formatDate(d, tz, "yyyy-MM-dd");
    dailySeries.push({ date: key, count: dailyMap[key] || 0 });
  }

  const topReferrers = Object.keys(byDomain)
    .map(function(k){ return { domain: k, count: byDomain[k] }; })
    .sort(function(a, b){ return b.count - a.count; })
    .slice(0, 10);

  // Заявки — считаем прямо из основного листа (столбец D — дата
  // создания как готовая строка, столбец E — язык).
  const sheet = ss.getSheetByName(SHEET_NAME);
  const inquiriesSent = emptyCounter();
  const byInquiryLang = {};
  const lastRow = sheet.getLastRow();

  if (lastRow >= 2) {
    const data = sheet.getRange(2, 4, lastRow - 1, 2).getValues();
    data.forEach(function(r){
      const label = String(r[0] || "");
      const lang = r[1] || "unknown";
      if (!label) return;

      const parts = label.split(" ")[0].split(".");
      if (parts.length !== 3) return;
      const asDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      const dateKey = Utilities.formatDate(asDate, tz, "yyyy-MM-dd");

      bump(inquiriesSent, dateKey, asDate, todayKey, yesterdayKey, day7, day30);
      byInquiryLang[lang] = (byInquiryLang[lang] || 0) + 1;
    });
  }

  return {
    totals: {
      pageviews: totals.pageviews,
      formOpened: totals.formOpened,
      inquiryStarted: totals.inquiryStarted,
      inquiriesSent: inquiriesSent
    },
    bySiteLang: bySiteLang,
    byInquiryLang: byInquiryLang,
    byDevice: byDevice,
    topReferrers: topReferrers,
    dailySeries: dailySeries
  };

}

// Необязательная защита: задай в Свойствах скрипта (Настройки
// проекта → Свойства скрипта) STATS_KEY = какой-то секрет, и
// тогда statistика будет доступна только с ?action=stats&key=...
function getStats(e) {

  const expectedKey = PropertiesService.getScriptProperties().getProperty("STATS_KEY");

  if (expectedKey && (e.parameter.key || "") !== expectedKey) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: "unauthorized" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const stats = computeStats();
  stats.status = "ok";

  return ContentService
    .createTextOutput(JSON.stringify(stats))
    .setMimeType(ContentService.MimeType.JSON);

}

// ==========================================================
// ЖИВОЙ ДАШБОРД (лист "Дашборд")
// Полностью пересобирается при каждом визите/заявке — числа,
// таблицы, диаграммы и календарь-теплокарта всегда актуальны, без
// единого запроса извне. Можно запустить и вручную: в редакторе
// выбрать updateDashboard в списке функций сверху → ▶ Выполнить.
// ==========================================================
const DASHBOARD_SHEET_NAME = "Дашборд";

const LANGUAGE_META = {
  ru: { flag: "🇷🇺", name: "Русский" },
  pl: { flag: "🇵🇱", name: "Polski" },
  de: { flag: "🇩🇪", name: "Deutsch" },
  en: { flag: "🇬🇧", name: "English" },
  unknown: { flag: "🌐", name: "Неизвестно" }
};

function langMeta(code) {
  return LANGUAGE_META[code] || { flag: "🌐", name: code };
}

function calendarCellColor(count, maxCount) {
  if (count === 0 || maxCount <= 0) return "#eef2f7";
  const ratio = count / maxCount;
  if (ratio <= 0.25) return "#cde2fb";
  if (ratio <= 0.5) return "#86b6ef";
  if (ratio <= 0.75) return "#3987e5";
  return "#184f95";
}

function calendarTextColor(bgColor) {
  return (bgColor === "#3987e5" || bgColor === "#184f95") ? "#ffffff" : "#0b0b0b";
}

// Раскладывает последние 35 дней в календарную сетку 5 недель ×
// 7 дней (Пн—Вс), как в обычном настенном календаре.
function buildCalendarGrid(dailySeries) {

  const tz = APP_TIMEZONE;
  const dayMs = 24 * 60 * 60 * 1000;

  const map = {};
  dailySeries.forEach(function(d){ map[d.date] = d.count; });

  const lastKey = dailySeries[dailySeries.length - 1].date;
  const lastDate = new Date(lastKey + "T00:00:00");
  const lastDow = (lastDate.getDay() + 6) % 7; // 0=Пн ... 6=Вс

  const weekEnd = new Date(lastDate.getTime() + (6 - lastDow) * dayMs);
  const gridStart = new Date(weekEnd.getTime() - (5 * 7 - 1) * dayMs);

  const grid = [];

  for (let w = 0; w < 5; w++) {
    const row = [];
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(gridStart.getTime() + (w * 7 + d) * dayMs);
      const key = Utilities.formatDate(cellDate, tz, "yyyy-MM-dd");
      row.push({ date: cellDate, key: key, count: map.hasOwnProperty(key) ? map[key] : 0 });
    }
    grid.push(row);
  }

  return grid;

}

function pct(part, total) {
  if (!total) return "0%";
  return Math.round((part / total) * 100) + "%";
}

function updateDashboard() {

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(DASHBOARD_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(DASHBOARD_SHEET_NAME);
  }

  // Полная переборка: старые диаграммы и содержимое убираем, чтобы
  // не плодить дубли при повторной сборке.
  sheet.getCharts().forEach(function(chart){ sheet.removeChart(chart); });
  sheet.clear();
  sheet.clearConditionalFormatRules();

  const stats = computeStats();
  const tz = APP_TIMEZONE;

  sheet.setColumnWidths(1, 8, 130);
  sheet.setColumnWidth(1, 190);
  sheet.setColumnWidth(6, 190);

  // --- Заголовок -----------------------------------------
  sheet.getRange("A1:H1").merge();
  sheet.getRange("A1")
    .setValue("📊 Статистика сайта — WEBWORKS")
    .setFontSize(16).setFontWeight("bold").setFontColor("#0b0b0b");

  sheet.getRange("A2:H2").merge();
  sheet.getRange("A2")
    .setValue("Обновлено: " + Utilities.formatDate(new Date(), tz, "dd.MM.yyyy HH:mm"))
    .setFontColor("#898781").setFontStyle("italic");

  // --- KPI: просмотры -------------------------------------
  sheet.getRange("A4:E4").merge();
  sheet.getRange("A4").setValue("👁 ПРОСМОТРЫ")
    .setFontWeight("bold").setFontColor("#ffffff").setBackground("#2a78d6");

  const kpiLabels = ["Всего", "Сегодня", "Вчера", "За 7 дней", "За 30 дней"];
  const pv = stats.totals.pageviews;
  const kpiValues = [pv.allTime, pv.today, pv.yesterday, pv.last7, pv.last30];

  sheet.getRange(5, 1, 1, 5).setValues([kpiLabels]).setFontColor("#52514e").setFontWeight("bold");
  sheet.getRange(6, 1, 1, 5).setValues([kpiValues])
    .setFontSize(22).setFontWeight("bold").setFontColor("#0b0b0b").setNumberFormat("#,##0");
  sheet.setRowHeight(6, 34);

  // --- Воронка ---------------------------------------------
  sheet.getRange("A8:D8").merge();
  sheet.getRange("A8").setValue("🔻 ВОРОНКА (от посетителя до заявки)")
    .setFontWeight("bold").setFontColor("#ffffff").setBackground("#4a3aa7");

  const fo = stats.totals.formOpened.allTime;
  const is_ = stats.totals.inquiryStarted.allTime;
  const sent = stats.totals.inquiriesSent.allTime;

  const funnelRows = [
    ["📝 Открыли форму заявки", fo, pct(fo, pv.allTime) + " от просмотров"],
    ["✍️ Начали заполнять", is_, pct(is_, fo) + " от открывших форму"],
    ["✅ Отправили заявку", sent, pct(sent, is_) + " от начавших"]
  ];

  sheet.getRange(9, 1, 3, 3).setValues(funnelRows);
  sheet.getRange(9, 1, 3, 1).setFontWeight("bold");
  sheet.getRange(9, 2, 3, 1).setFontSize(16).setFontWeight("bold").setNumberFormat("#,##0");
  sheet.getRange(9, 3, 3, 1).setFontColor("#898781");

  // --- Заявки по языку (рядом с воронкой) -----------------------
  sheet.getRange("F8:G8").merge();
  sheet.getRange("F8").setValue("🌍 ЗАЯВКИ ПО ЯЗЫКУ")
    .setFontWeight("bold").setFontColor("#ffffff").setBackground("#e34948");

  const inquiryLangEntries = Object.keys(stats.byInquiryLang)
    .map(function(code){ return { code: code, count: stats.byInquiryLang[code] }; })
    .sort(function(a, b){ return b.count - a.count; });

  const inquiryLangRows = inquiryLangEntries.length
    ? inquiryLangEntries.map(function(x){ var m = langMeta(x.code); return [m.flag + " " + m.name, x.count]; })
    : [["Пока нет заявок", 0]];

  sheet.getRange(9, 6, inquiryLangRows.length, 2).setValues(inquiryLangRows);
  sheet.getRange(9, 7, inquiryLangRows.length, 1).setNumberFormat("#,##0").setFontWeight("bold");

  // --- Язык просмотра сайта (реальный, не по браузеру) + диаграмма
  sheet.getRange("A13:C13").merge();
  sheet.getRange("A13").setValue("🌐 ЯЗЫК ПРОСМОТРА САЙТА")
    .setFontWeight("bold").setFontColor("#ffffff").setBackground("#1baf7a");

  sheet.getRange(14, 1, 1, 2).setValues([["Язык", "Просмотров"]]).setFontWeight("bold").setFontColor("#52514e");

  const langEntries = Object.keys(stats.bySiteLang)
    .map(function(code){ return { code: code, count: stats.bySiteLang[code] }; })
    .sort(function(a, b){ return b.count - a.count; });

  const topLangs = langEntries.slice(0, 5);
  const otherLangsCount = langEntries.slice(5).reduce(function(s, x){ return s + x.count; }, 0);

  const langRows = topLangs.map(function(x){ var m = langMeta(x.code); return [m.flag + " " + m.name, x.count]; });
  while (langRows.length < 5) langRows.push(["—", 0]);
  langRows.push(["🌐 Другие", otherLangsCount]);

  sheet.getRange(15, 1, 6, 2).setValues(langRows);
  sheet.getRange(15, 2, 6, 1).setNumberFormat("#,##0");

  if (pv.allTime > 0) {
    const langChart = sheet.newChart()
      .setChartType(Charts.ChartType.PIE)
      .addRange(sheet.getRange(15, 1, 6, 2))
      .setPosition(13, 4, 0, 0)
      .setOption("title", "Язык просмотра сайта")
      .setOption("pieHole", 0.4)
      .setOption("width", 420).setOption("height", 260)
      .setOption("colors", ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#898781"])
      .build();
    sheet.insertChart(langChart);
  }

  // --- Устройство --------------------------------------------
  sheet.getRange("A28:C28").merge();
  sheet.getRange("A28").setValue("📱 УСТРОЙСТВО")
    .setFontWeight("bold").setFontColor("#ffffff").setBackground("#eda100");

  sheet.getRange(29, 1, 1, 2).setValues([["Устройство", "Просмотров"]]).setFontWeight("bold").setFontColor("#52514e");

  const mobileCount = stats.byDevice.mobile || 0;
  const desktopCount = stats.byDevice.desktop || 0;

  sheet.getRange(30, 1, 2, 2).setValues([["📱 Mobile", mobileCount], ["🖥 Desktop", desktopCount]]);
  sheet.getRange(30, 2, 2, 1).setNumberFormat("#,##0");

  if (pv.allTime > 0) {
    const deviceChart = sheet.newChart()
      .setChartType(Charts.ChartType.COLUMN)
      .addRange(sheet.getRange(30, 1, 2, 2))
      .setPosition(28, 4, 0, 0)
      .setOption("title", "Устройства посетителей")
      .setOption("width", 420).setOption("height", 220)
      .setOption("legend", "none").setOption("colors", ["#2a78d6"])
      .build();
    sheet.insertChart(deviceChart);
  }

  // --- Источники перехода --------------------------------------
  sheet.getRange("A43:C43").merge();
  sheet.getRange("A43").setValue("🔗 ИСТОЧНИКИ ПЕРЕХОДА (топ-10)")
    .setFontWeight("bold").setFontColor("#ffffff").setBackground("#e34948");

  sheet.getRange(44, 1, 1, 2).setValues([["Источник", "Просмотров"]]).setFontWeight("bold").setFontColor("#52514e");

  const refRows = stats.topReferrers.length
    ? stats.topReferrers.map(function(r){ return [r.domain, r.count]; })
    : [["Пока нет данных", 0]];
  while (refRows.length < 10) refRows.push(["", ""]);

  sheet.getRange(45, 1, 10, 2).setValues(refRows);
  sheet.getRange(45, 2, 10, 1).setNumberFormat("#,##0");

  if (stats.topReferrers.length > 0) {
    const refChart = sheet.newChart()
      .setChartType(Charts.ChartType.BAR)
      .addRange(sheet.getRange(45, 1, Math.min(10, stats.topReferrers.length), 2))
      .setPosition(43, 4, 0, 0)
      .setOption("title", "Топ источников перехода")
      .setOption("width", 420).setOption("height", 260)
      .setOption("legend", "none").setOption("colors", ["#2a78d6"])
      .build();
    sheet.insertChart(refChart);
  }

  // --- Календарь просмотров (теплокарта, 5 недель) -------------
  sheet.getRange("A60:H60").merge();
  sheet.getRange("A60").setValue("📅 КАЛЕНДАРЬ ПРОСМОТРОВ (последние 5 недель)")
    .setFontWeight("bold").setFontColor("#ffffff").setBackground("#2a78d6");

  const weekdayLabels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  sheet.getRange(61, 1, 1, 7).setValues([weekdayLabels])
    .setFontWeight("bold").setFontColor("#52514e").setHorizontalAlignment("center");

  const grid = buildCalendarGrid(stats.dailySeries);
  const maxCount = Math.max.apply(null, [0].concat(stats.dailySeries.map(function(d){ return d.count; })));

  for (let w = 0; w < grid.length; w++) {
    const row = grid[w];
    const rowIndex = 62 + w;

    for (let d = 0; d < row.length; d++) {
      const cell = sheet.getRange(rowIndex, d + 1);
      const info = row[d];
      const bg = calendarCellColor(info.count, maxCount);

      cell.setValue(Utilities.formatDate(info.date, tz, "d"))
        .setBackground(bg).setFontColor(calendarTextColor(bg))
        .setHorizontalAlignment("center").setFontWeight("bold");

      cell.setNote(Utilities.formatDate(info.date, tz, "dd.MM.yyyy") + ": " + info.count + " просм.");
    }

    sheet.setRowHeight(rowIndex, 28);
  }

  // --- Пояснение внизу -------------------------------------------
  sheet.getRange("A68:H68").merge();
  sheet.getRange("A68")
    .setValue("ℹ️ Без IP/геолокации: страна — только догадка по часовому поясу браузера посетителя, язык — по тому, что реально было показано на экране. Обновляется автоматически при каждом визите и заявке.")
    .setFontColor("#898781").setFontStyle("italic").setWrap(true);

  sheet.setFrozenRows(2);
  sheet.getRange(1, 1, 68, 8).setFontFamily("Arial");

}
