// ==========================================================
// WEBWORKS — приём заявок из формы "Расскажите о проекте"
// Тот же принцип и те же приёмы, что на сайте Arduino/ESP32
// Firmware Studio: сайт делает fetch()-POST с полем "data"
// (JSON-строка) на этот скрипт. Два типа запросов:
//   - обычная заявка (name/email/phone/message/...)
//   - "маячок" визита (type: "visit") — для статистики
// ==========================================================

// ID своей Google Таблицы (из её ссылки:
// https://docs.google.com/spreadsheets/d/ЭТОТ_ID/edit)
const SPREADSHEET_ID = "1bF083S-JgnAWPtx_3f3_PAqDJgmBEAv5nFoEAeXHHhI";
const SHEET_NAME = "Заявки";
const OWNER_EMAIL = "s.i.pauchak@gmail.com";

// Часовой пояс для дат/времени в таблице и статистике
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
    // дописывает строку на лист "Visits" и выходит.
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
// заявке (как setupStatusDropdown в Arduino-проекте), чтобы список
// точно охватывал и только что добавленную строку.
function setupStatusDropdown(sheet) {
  const options = Object.keys(STATUS_LANG.ru)
    .filter(function(k){ return ["new","checking","payment","working","ready","sent","completed","cancelled"].indexOf(k) !== -1; })
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
// отдаёт сам (язык, часовой пояс, referrer, устройство).
// ==========================================================
const VISITS_SHEET_NAME = "Visits";

const VISITS_HEADERS = [
  "Дата/время", "Метка времени (raw)", "Событие", "Язык сайта",
  "Язык браузера", "Часовой пояс", "Источник (домен)",
  "Referrer (полный)", "UTM Source", "UTM Medium", "UTM Campaign",
  "Устройство", "Разрешение экрана", "Страница", "User-Agent"
];

const EVENT_LABELS = {
  pageview: "Просмотр страницы",
  language_view: "Смена языка",
  inquiry_form_opened: "Открыли форму заявки",
  inquiry_started: "Начали заполнять заявку"
};

function eventLabel(key) {
  return EVENT_LABELS[key] || key;
}

function getOrCreateVisitsSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(VISITS_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(VISITS_SHEET_NAME);
  }

  const hasHeaders =
    sheet.getLastRow() > 0 &&
    sheet.getRange(1, 1).getValue() === VISITS_HEADERS[0];

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, VISITS_HEADERS.length).setValues([VISITS_HEADERS]);
    sheet.getRange(1, 1, 1, VISITS_HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }

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
    data.userAgent || ""
  ]);
}

// Простая, но настоящая статистика — счётчики за сегодня/вчера/
// 7 дней/30 дней/всё время, плюс разбивка по устройствам и топ-5
// источников перехода. Без визуального листа "Дашборд" с
// календарной сеткой, как у Arduino-проекта — это можно добавить
// отдельно, если понадобится.
function computeStats() {

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const visitsSheet = ss.getSheetByName(VISITS_SHEET_NAME);
  const tz = APP_TIMEZONE;
  const now = new Date();

  const todayKey = Utilities.formatDate(now, tz, "yyyy-MM-dd");
  const yesterdayKey = Utilities.formatDate(new Date(now.getTime() - 86400000), tz, "yyyy-MM-dd");
  const day7 = new Date(now.getTime() - 7 * 86400000);
  const day30 = new Date(now.getTime() - 30 * 86400000);

  const counts = { today: 0, yesterday: 0, last7: 0, last30: 0, allTime: 0 };
  const byDevice = {};
  const byDomain = {};
  const byEvent = {};

  const rows = (visitsSheet && visitsSheet.getLastRow() > 1)
    ? visitsSheet.getRange(2, 1, visitsSheet.getLastRow() - 1, VISITS_HEADERS.length).getValues()
    : [];

  rows.forEach(function(r){
    const rawDate = r[1];
    const event = r[2] || "";
    const domain = r[6] || "";
    const device = r[11] || "";

    if (!(rawDate instanceof Date) || isNaN(rawDate.getTime())) return;

    const dateKey = Utilities.formatDate(rawDate, tz, "yyyy-MM-dd");

    counts.allTime++;
    if (dateKey === todayKey) counts.today++;
    if (dateKey === yesterdayKey) counts.yesterday++;
    if (rawDate >= day7) counts.last7++;
    if (rawDate >= day30) counts.last30++;

    byDevice[device] = (byDevice[device] || 0) + 1;
    byDomain[domain] = (byDomain[domain] || 0) + 1;
    byEvent[event] = (byEvent[event] || 0) + 1;
  });

  function top5(obj){
    return Object.keys(obj)
      .map(function(k){ return { key: k, count: obj[k] }; })
      .sort(function(a, b){ return b.count - a.count; })
      .slice(0, 5);
  }

  // Заявки — считаем прямо из основного листа (столбец D — дата
  // создания), отдельно ничего дублировать не нужно.
  const sheet = ss.getSheetByName(SHEET_NAME);
  const inquiryCounts = { today: 0, yesterday: 0, last7: 0, last30: 0, allTime: 0 };
  const lastRow = sheet.getLastRow();

  if (lastRow >= 2) {
    const dates = sheet.getRange(2, 4, lastRow - 1, 1).getValues();
    dates.forEach(function(r){
      const label = String(r[0] || "");
      if (!label) return;
      inquiryCounts.allTime++;
      // "Дата заявки" хранится как готовая строка dd.MM.yyyy HH:mm,
      // а не как настоящая дата — сравниваем по дате из строки.
      const parts = label.split(" ")[0].split(".");
      if (parts.length !== 3) return;
      const asDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      const dateKey = Utilities.formatDate(asDate, tz, "yyyy-MM-dd");
      if (dateKey === todayKey) inquiryCounts.today++;
      if (dateKey === yesterdayKey) inquiryCounts.yesterday++;
      if (asDate >= day7) inquiryCounts.last7++;
      if (asDate >= day30) inquiryCounts.last30++;
    });
  }

  return {
    visits: counts,
    inquiries: inquiryCounts,
    byDevice: byDevice,
    topReferrers: top5(byDomain),
    byEvent: byEvent
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
