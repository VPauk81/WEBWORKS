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

// Имя отправителя, которое видит клиент в почте, вместо голого
// адреса s.i.pauchak@gmail.com — сам адрес не меняется (письма всё
// равно уходят с аккаунта Gmail, авторизованного на отправку).
const SENDER_NAME = "WebWorks";

// Часовой пояс, в котором Я читаю таблицу (это НЕ часовой пояс
// посетителей — их собственный часовой пояс хранится отдельно,
// в столбце "Часовой пояс (посетителя)" листа Visits).
const APP_TIMEZONE = "Europe/Warsaw";

// =======================
// ЗАЯВКИ — столбцы (1 = A) и заголовки
// =======================
const HEADER_ROW = [
  "ID заявки", "Статус", "Email клиенту", "Дата заявки", "Язык",
  "Имя", "Email", "Телефон", "WhatsApp", "Viber", "Telegram", "Описание",
  "Ссылка для клиента (прогресс/демо)"
];

const COL_STATUS = 2;       // B
const COL_CLIENT_EMAIL = 3; // C
const COL_LANG = 5;         // E
const COL_CLIENT_EMAIL_ADDR = 7; // G
const COL_DESCRIPTION = 12; // L
const COL_PROGRESS_LINK = 13; // M — заполняю сам, вручную, только когда хочу
                               // дать клиенту ссылку посмотреть его сайт

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

      if (!isTestVisit(data.pageUrl, data.userAgent)) logVisit(data);

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
  // Lock so two inquiries arriving at the same moment can't both read the
  // same counter and get the same ID. Held only for this tiny read+write.
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const props = PropertiesService.getScriptProperties();
    let last = Number(props.getProperty("ORDER_NUM") || 0);
    last++;
    props.setProperty("ORDER_NUM", String(last));
    return "WW-" + String(last).padStart(5, "0");
  } finally {
    lock.releaseLock();
  }
}

function ensureHeaderRow(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER_ROW);
    sheet.getRange(1, 1, 1, HEADER_ROW.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
    return;
  }

  // Таблица уже существует (со старыми заявками) — дописываем в конец
  // только недостающие заголовки (например, новую колонку со ссылкой
  // для клиента), не трогая уже имеющиеся столбцы и данные.
  const lastCol = sheet.getLastColumn();
  if (lastCol < HEADER_ROW.length) {
    const missing = HEADER_ROW.slice(lastCol);
    sheet.getRange(1, lastCol + 1, 1, missing.length).setValues([missing]);
    sheet.getRange(1, lastCol + 1, 1, missing.length).setFontWeight("bold");
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

const QUOTA_WARNING_TEXT =
  "⚠ email не отправлен: превышен суточный лимит писем Gmail. " +
  "Попробуйте позже (лимит обновляется около полуночи по тихоокеанскому времени)";

function formatNowLabel() {
  return Utilities.formatDate(new Date(), APP_TIMEZONE, "dd.MM.yyyy HH:mm");
}

// Безопасная отправка письма — проверяет остаток суточной квоты
// Gmail ДО попытки отправки. Когда переданы sheet/row, столбец
// "Email клиенту" всегда получает метку времени ЭТОЙ попытки:
//   успех:  "20.09.2026 17:38 ✅"
//   неудача: "20.09.2026 17:38 ⚠ email не отправлен: ... (письмо клиенту)"
// — context поясняет, какое именно письмо это было (например,
// "письмо клиенту" при создании заявки или "письмо клиенту
// (статус)" при смене статуса).
function safeSendEmail(mailOptions, sheet, row, context) {

  const label = formatNowLabel();
  const suffix = context ? " (" + context + ")" : "";

  if (MailApp.getRemainingDailyQuota() <= 0) {
    if (sheet && row) {
      sheet.getRange(row, COL_CLIENT_EMAIL).setValue(label + " " + QUOTA_WARNING_TEXT + suffix);
    }
    return false;
  }

  const mailOptionsWithName = Object.assign({ name: SENDER_NAME }, mailOptions);

  try {
    MailApp.sendEmail(mailOptionsWithName);
    if (sheet && row) {
      sheet.getRange(row, COL_CLIENT_EMAIL).setValue(label + " ✅");
    }
    return true;
  } catch (mailErr) {
    if (sheet && row) {
      sheet.getRange(row, COL_CLIENT_EMAIL).setValue(label + " " + QUOTA_WARNING_TEXT + suffix);
    }
    return false;
  }

}

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
    previewText(data.message),
    "" // Ссылка для клиента — пустая, заполняю сам вручную при желании
  ]);

  const row = sheet.getLastRow();

  attachDescriptionNote(sheet, row, data.message);
  colorRow(sheet, row);

  // Письмо клиенту — "спасибо, получил заявку". safeSendEmail сама
  // пишет в столбец C метку времени + ✅ или причину ошибки.
  if (data.email) {
    safeSendEmail({
      to: data.email,
      replyTo: OWNER_EMAIL,
      subject: "Спасибо за заявку — WEBWORKS",
      body:
        "Здравствуйте" + (data.name ? ", " + data.name : "") + "!\n\n" +
        "Я получил вашу заявку (" + orderID + ") и скоро свяжусь с вами.\n\n" +
        "С уважением,\nWEBWORKS"
    }, sheet, row, "письмо клиенту");
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
    order: "Номер заявки", orderWord: "Заявка", status: "Статус",
    progressLink: "Посмотреть текущий прогресс по вашему сайту:"
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
    order: "Numer zgłoszenia", orderWord: "Zgłoszenie", status: "Status",
    progressLink: "Zobacz aktualny postęp Twojej strony:"
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
    order: "Inquiry number", orderWord: "Inquiry", status: "Status",
    progressLink: "See the current progress on your website:"
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
    order: "Anfragenummer", orderWord: "Anfrage", status: "Status",
    progressLink: "Aktuellen Fortschritt Ihrer Website ansehen:"
  }

};

function checkStatusChanges(e) {

  // Галочки очистки статистики (Visits / Дашборд) обрабатываем тем же
  // установленным триггером — отдельный не нужен
  if (handleControlEdit_(e)) return;

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
  } catch (err) {
    return; // кто-то уже обрабатывает это изменение
  }

  try {

    const sheet = e.range.getSheet();
    if (sheet.getName() !== SHEET_NAME) return;

    const editedCol = e.range.getColumn();
    const isStatusEdit = editedCol === COL_STATUS;
    const isLinkEdit = editedCol === COL_PROGRESS_LINK;
    if (!isStatusEdit && !isLinkEdit) return;

    const row = e.range.getRow();
    if (row < 2) return;

    if (isStatusEdit) {
      colorRow(sheet, row);
    }

    const status = sheet.getRange(row, COL_STATUS).getValue();
    const email = sheet.getRange(row, COL_CLIENT_EMAIL_ADDR).getValue();
    if (!email) return;

    const key = detectStatusKey(status);
    if (!key) return;

    // Ссылку на прогресс/демо добавляю сам, вручную, только для тех
    // заявок и на тех статусах, где хочу её показать клиенту — если
    // ячейка пустая, письмо уходит как обычно, без единой ссылки.
    const progressLink = String(sheet.getRange(row, COL_PROGRESS_LINK).getValue() || "").trim();
    const progressStatuses = {
      checking: true, payment: true, working: true,
      ready: true, sent: true, completed: true
    };

    // Правку самой ссылки обрабатываем, только если она реально что-то
    // меняет в письме (иначе смысла слать письмо нет — статус тот же).
    if (isLinkEdit && !(progressLink && progressStatuses[key])) return;

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
      (progressLink && progressStatuses[key] ? T.progressLink + " " + progressLink + "\n\n" : "") +
      T.order + ": " + orderID + "\n" +
      T.status + ": " + status + "\n\n" +
      "WEBWORKS";

    safeSendEmail({ to: email, replyTo: OWNER_EMAIL, subject: subject, body: body }, sheet, row, "письмо клиенту, статус");

  } finally {
    lock.releaseLock();
  }

}

// ==========================================================
// СТАТИСТИКА ПОСЕЩЕНИЙ (лист "Visits")
// Лёгкие "маячки" без IP/геолокации — только то, что браузер
// отдаёт сам (язык, часовой пояс, referrer, устройство). Страна —
// это ДОГАДКА по часовому поясу самого посетителя (см. TZ_BY_COUNTRY
// ниже), а не настоящая геолокация по IP.
// ==========================================================
const VISITS_SHEET_NAME = "Visits";

// Один посетитель = одна строка. Она создаётся при первом действии
// и ОБНОВЛЯЕТСЯ по мере следующих: "Событие" всегда показывает ПОСЛЕДНЕЕ
// действие, "Путь посетителя" — всю цепочку. Порядок столбцов не менять:
// на него завязаны индексы VCOL ниже. Новые поля — только в конец.
const VISITS_HEADERS = [
  "Дата/время (моё, Europe/Warsaw)", "Метка времени (raw)", "Событие",
  "Язык сайта", "Язык браузера", "Часовой пояс (посетителя)",
  "Источник (домен)", "Referrer (полный)", "UTM Source", "UTM Medium",
  "UTM Campaign", "Устройство", "Разрешение экрана", "Страница",
  "User-Agent", "Страна (догадка по часовому поясу)",
  "Время у посетителя", "ID визита", "Путь посетителя", "Языки",
  "Последнее действие"
];

// Номера столбцов (0-based) листа "Visits"
const VCOL = {
  time: 0, raw: 1, event: 2, siteLang: 3, browserLang: 4, timezone: 5,
  domain: 6, device: 11, page: 13, ua: 14, country: 15,
  localTime: 16, id: 17, path: 18, langs: 19, last: 20
};

// Настоящий посетитель = страница открыта с живого адреса сайта и не
// автоматическим браузером. Локальные копии (file://, Live Server на
// 127.0.0.1) и тесты/Lighthouse раздували статистику — такие визиты
// не записываются и не учитываются (сами строки в листе не удаляются).
const SITE_ORIGIN = "https://vpauk81.github.io/";
function isTestVisit(pageUrl, userAgent) {
  const url = String(pageUrl || "");
  if (url && url.indexOf(SITE_ORIGIN) !== 0) return true;
  return /Headless|Lighthouse|PageSpeed/i.test(String(userAgent || ""));
}

// Роботы (превью ссылок в мессенджерах, поисковики, проверялки сайта)
// не должны попадать в статистику посетителей
const BOT_USER_AGENT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp\/|headless|lighthouse|pingdom|uptime|monitor|curl\/|wget|python|httpclient|okhttp|go-http/i;
function isBotUserAgent_(ua) {
  const s = String(ua || "");
  return !s || BOT_USER_AGENT.test(s);
}

function cut_(value, max) {
  const s = String(value || "");
  return s.length > max ? s.slice(0, max) : s;
}

// Столбец "Событие" — человекочитаемое название. Статистика сравнивает
// по техническим ключам и переводит обратно через eventKeyFromLabel()
const EVENT_LABELS = {
  pageview: "Просмотр страницы",
  language_view: "Смена языка",
  // Нажали «Написать мне», форма открылась, но заявка ещё не отправлена
  inquiry_form_opened: "Пишут свои данные",
  inquiry_started: "Начали заполнять заявку",
  inquiry_sent: "Отправили заявку"
};

function eventLabel(key) {
  return EVENT_LABELS[key] || key;
}

// Подпись -> технический ключ. Если подпись неизвестна (старые строки
// могут хранить ключ как есть) — возвращаем её же
function eventKeyFromLabel(label) {
  const found = Object.keys(EVENT_LABELS).find(function(key){ return EVENT_LABELS[key] === label; });
  return found || LEGACY_EVENT_LABELS[label] || label;
}

// Прежние названия событий — в уже записанных строках, цепочках и
// сводке они остаются, поэтому по-прежнему узнаются при подсчёте
const LEGACY_EVENT_LABELS = {
  "Открыли форму заявки": "inquiry_form_opened"
};

// В "Пути посетителя" есть шаг этого события (по новому или старому названию)?
function pathHasEvent_(path, key) {
  if (path.indexOf(EVENT_LABELS[key]) !== -1) return true;
  return Object.keys(LEGACY_EVENT_LABELS).some(function(old){
    return LEGACY_EVENT_LABELS[old] === key && path.indexOf(old) !== -1;
  });
}

// =======================
// СТРАНА ПОСЕТИТЕЛЯ — без IP и сторонних сервисов (GDPR): по часовому
// поясу браузера, а если он общий/неизвестен ("UTC") — по региону и
// языку браузера. Страна определяется в 3 шага, от точного к грубому, и
// НИКОГДА не остаётся пустой — для любого языка сайта:
//   1) часовой пояс браузера — самое точное. Таблица ниже — ПОЛНЫЙ
//      официальный список часовых поясов IANA (tzdata, zone.tab): 418
//      зон + 131 старое название, которое браузеры ещё отдают
//      (Asia/Calcutta, Europe/Kiev, …) = 549 названий, 247 стран;
//   2) регион/язык самого браузера ("de-AT" → Австрия, "cs" → Чехия) —
//      помечается "(по браузеру)";
//   3) язык, на котором смотрели сайт — помечается "(по языку)".
// ISO-код страны -> часовые пояса IANA через пробел
// =======================
const TZ_BY_COUNTRY = {
  AD: "Europe/Andorra",
  AE: "Asia/Dubai",
  AF: "Asia/Kabul",
  AG: "America/Antigua",
  AI: "America/Anguilla",
  AL: "Europe/Tirane",
  AM: "Asia/Yerevan",
  AO: "Africa/Luanda",
  AQ: "Antarctica/Casey Antarctica/Davis Antarctica/DumontDUrville Antarctica/Mawson Antarctica/McMurdo Antarctica/Palmer Antarctica/Rothera Antarctica/Syowa Antarctica/Troll Antarctica/Vostok",
  AR: "America/Argentina/Buenos_Aires America/Argentina/Catamarca America/Argentina/ComodRivadavia America/Argentina/Cordoba America/Argentina/Jujuy America/Argentina/La_Rioja America/Argentina/Mendoza America/Argentina/Rio_Gallegos America/Argentina/Salta America/Argentina/San_Juan America/Argentina/San_Luis America/Argentina/Tucuman America/Argentina/Ushuaia America/Buenos_Aires America/Catamarca America/Cordoba America/Jujuy America/Mendoza America/Rosario",
  AS: "Pacific/Pago_Pago Pacific/Samoa US/Samoa",
  AT: "Europe/Vienna",
  AU: "Antarctica/Macquarie Australia/ACT Australia/Adelaide Australia/Brisbane Australia/Broken_Hill Australia/Canberra Australia/Currie Australia/Darwin Australia/Eucla Australia/Hobart Australia/LHI Australia/Lindeman Australia/Lord_Howe Australia/Melbourne Australia/NSW Australia/North Australia/Perth Australia/Queensland Australia/South Australia/Sydney Australia/Tasmania Australia/Victoria Australia/West Australia/Yancowinna",
  AW: "America/Aruba",
  AX: "Europe/Mariehamn",
  AZ: "Asia/Baku",
  BA: "Europe/Sarajevo",
  BB: "America/Barbados",
  BD: "Asia/Dacca Asia/Dhaka",
  BE: "CET Europe/Brussels MET",
  BF: "Africa/Ouagadougou",
  BG: "Europe/Sofia",
  BH: "Asia/Bahrain",
  BI: "Africa/Bujumbura",
  BJ: "Africa/Porto-Novo",
  BL: "America/St_Barthelemy",
  BM: "Atlantic/Bermuda",
  BN: "Asia/Brunei",
  BO: "America/La_Paz",
  BQ: "America/Kralendijk",
  BR: "America/Araguaina America/Bahia America/Belem America/Boa_Vista America/Campo_Grande America/Cuiaba America/Eirunepe America/Fortaleza America/Maceio America/Manaus America/Noronha America/Porto_Acre America/Porto_Velho America/Recife America/Rio_Branco America/Santarem America/Sao_Paulo Brazil/Acre Brazil/DeNoronha Brazil/East Brazil/West",
  BS: "America/Nassau",
  BT: "Asia/Thimbu Asia/Thimphu",
  BW: "Africa/Gaborone",
  BY: "Europe/Minsk",
  BZ: "America/Belize",
  CA: "America/Atikokan America/Blanc-Sablon America/Cambridge_Bay America/Creston America/Dawson America/Dawson_Creek America/Edmonton America/Fort_Nelson America/Glace_Bay America/Goose_Bay America/Halifax America/Inuvik America/Iqaluit America/Moncton America/Montreal America/Nipigon America/Pangnirtung America/Rainy_River America/Rankin_Inlet America/Regina America/Resolute America/St_Johns America/Swift_Current America/Thunder_Bay America/Toronto America/Vancouver America/Whitehorse America/Winnipeg America/Yellowknife Canada/Atlantic Canada/Central Canada/Eastern Canada/Mountain Canada/Newfoundland Canada/Pacific Canada/Saskatchewan Canada/Yukon",
  CC: "Indian/Cocos",
  CD: "Africa/Kinshasa Africa/Lubumbashi",
  CF: "Africa/Bangui",
  CG: "Africa/Brazzaville",
  CH: "Europe/Zurich",
  CI: "Africa/Abidjan Africa/Timbuktu Iceland",
  CK: "Pacific/Rarotonga",
  CL: "America/Coyhaique America/Punta_Arenas America/Santiago Chile/Continental Chile/EasterIsland Pacific/Easter",
  CM: "Africa/Douala",
  CN: "Asia/Chongqing Asia/Chungking Asia/Harbin Asia/Kashgar Asia/Shanghai Asia/Urumqi PRC",
  CO: "America/Bogota",
  CR: "America/Costa_Rica",
  CU: "America/Havana Cuba",
  CV: "Atlantic/Cape_Verde",
  CW: "America/Curacao",
  CX: "Indian/Christmas",
  CY: "Asia/Famagusta Asia/Nicosia Europe/Nicosia",
  CZ: "Europe/Prague",
  DE: "Atlantic/Jan_Mayen Europe/Berlin Europe/Busingen",
  DJ: "Africa/Djibouti",
  DK: "Europe/Copenhagen",
  DM: "America/Dominica",
  DO: "America/Santo_Domingo",
  DZ: "Africa/Algiers",
  EC: "America/Guayaquil Pacific/Galapagos",
  EE: "Europe/Tallinn",
  EG: "Africa/Cairo Egypt",
  EH: "Africa/El_Aaiun",
  ER: "Africa/Asmara",
  ES: "Africa/Ceuta Atlantic/Canary Europe/Madrid",
  ET: "Africa/Addis_Ababa",
  FI: "Europe/Helsinki",
  FJ: "Pacific/Fiji",
  FK: "Atlantic/Stanley",
  FM: "Pacific/Chuuk Pacific/Kosrae Pacific/Pohnpei",
  FO: "Atlantic/Faeroe Atlantic/Faroe",
  FR: "Europe/Paris",
  GA: "Africa/Libreville",
  GB: "Europe/Belfast Europe/London GB GB-Eire",
  GD: "America/Grenada",
  GE: "Asia/Tbilisi",
  GF: "America/Cayenne",
  GG: "Europe/Guernsey",
  GH: "Africa/Accra",
  GI: "Europe/Gibraltar",
  GL: "America/Danmarkshavn America/Godthab America/Nuuk America/Scoresbysund America/Thule",
  GM: "Africa/Banjul",
  GN: "Africa/Conakry",
  GP: "America/Guadeloupe",
  GQ: "Africa/Malabo",
  GR: "EET Europe/Athens",
  GS: "Atlantic/South_Georgia",
  GT: "America/Guatemala",
  GU: "Pacific/Guam",
  GW: "Africa/Bissau",
  GY: "America/Guyana",
  HK: "Asia/Hong_Kong Hongkong",
  HN: "America/Tegucigalpa",
  HR: "Europe/Zagreb",
  HT: "America/Port-au-Prince",
  HU: "Europe/Budapest",
  ID: "Asia/Jakarta Asia/Jayapura Asia/Makassar Asia/Pontianak Asia/Ujung_Pandang",
  IE: "Eire Europe/Dublin",
  IL: "Asia/Jerusalem Asia/Tel_Aviv Israel",
  IM: "Europe/Isle_of_Man",
  IN: "Asia/Calcutta Asia/Kolkata",
  IO: "Indian/Chagos",
  IQ: "Asia/Baghdad",
  IR: "Asia/Tehran Iran",
  IS: "Atlantic/Reykjavik",
  IT: "Europe/Rome",
  JE: "Europe/Jersey",
  JM: "America/Jamaica Jamaica",
  JO: "Asia/Amman",
  JP: "Asia/Tokyo Japan",
  KE: "Africa/Asmera Africa/Nairobi",
  KG: "Asia/Bishkek",
  KH: "Asia/Phnom_Penh",
  KI: "Pacific/Enderbury Pacific/Kanton Pacific/Kiritimati Pacific/Tarawa",
  KM: "Indian/Comoro",
  KN: "America/St_Kitts",
  KP: "Asia/Pyongyang",
  KR: "Asia/Seoul ROK",
  KW: "Asia/Kuwait",
  KY: "America/Cayman",
  KZ: "Asia/Almaty Asia/Aqtau Asia/Aqtobe Asia/Atyrau Asia/Oral Asia/Qostanay Asia/Qyzylorda",
  LA: "Asia/Vientiane",
  LB: "Asia/Beirut",
  LC: "America/St_Lucia",
  LI: "Europe/Vaduz",
  LK: "Asia/Colombo",
  LR: "Africa/Monrovia",
  LS: "Africa/Maseru",
  LT: "Europe/Vilnius",
  LU: "Europe/Luxembourg",
  LV: "Europe/Riga",
  LY: "Africa/Tripoli Libya",
  MA: "Africa/Casablanca",
  MC: "Europe/Monaco",
  MD: "Europe/Chisinau Europe/Tiraspol",
  ME: "Europe/Podgorica",
  MF: "America/Marigot",
  MG: "Indian/Antananarivo",
  MH: "Kwajalein Pacific/Kwajalein Pacific/Majuro",
  MK: "Europe/Skopje",
  ML: "Africa/Bamako",
  MM: "Asia/Rangoon Asia/Yangon",
  MN: "Asia/Choibalsan Asia/Hovd Asia/Ulaanbaatar Asia/Ulan_Bator",
  MO: "Asia/Macao Asia/Macau",
  MP: "Pacific/Saipan",
  MQ: "America/Martinique",
  MR: "Africa/Nouakchott",
  MS: "America/Montserrat",
  MT: "Europe/Malta",
  MU: "Indian/Mauritius",
  MV: "Indian/Maldives",
  MW: "Africa/Blantyre",
  MX: "America/Bahia_Banderas America/Cancun America/Chihuahua America/Ciudad_Juarez America/Ensenada America/Hermosillo America/Matamoros America/Mazatlan America/Merida America/Mexico_City America/Monterrey America/Ojinaga America/Santa_Isabel America/Tijuana Mexico/BajaNorte Mexico/BajaSur Mexico/General",
  MY: "Asia/Kuala_Lumpur Asia/Kuching",
  MZ: "Africa/Maputo",
  NA: "Africa/Windhoek",
  NC: "Pacific/Noumea",
  NE: "Africa/Niamey",
  NF: "Pacific/Norfolk",
  NG: "Africa/Lagos",
  NI: "America/Managua",
  NL: "Europe/Amsterdam",
  NO: "Europe/Oslo",
  NP: "Asia/Kathmandu Asia/Katmandu",
  NR: "Pacific/Nauru",
  NU: "Pacific/Niue",
  NZ: "Antarctica/South_Pole NZ NZ-CHAT Pacific/Auckland Pacific/Chatham",
  OM: "Asia/Muscat",
  PA: "America/Coral_Harbour America/Panama EST",
  PE: "America/Lima",
  PF: "Pacific/Gambier Pacific/Marquesas Pacific/Tahiti",
  PG: "Pacific/Bougainville Pacific/Port_Moresby Pacific/Truk Pacific/Yap",
  PH: "Asia/Manila",
  PK: "Asia/Karachi",
  PL: "Europe/Warsaw Poland",
  PM: "America/Miquelon",
  PN: "Pacific/Pitcairn",
  PR: "America/Puerto_Rico America/Virgin",
  PS: "Asia/Gaza Asia/Hebron",
  PT: "Atlantic/Azores Atlantic/Madeira Europe/Lisbon Portugal WET",
  PW: "Pacific/Palau",
  PY: "America/Asuncion",
  QA: "Asia/Qatar",
  RE: "Indian/Reunion",
  RO: "Europe/Bucharest",
  RS: "Europe/Belgrade",
  RU: "Asia/Anadyr Asia/Barnaul Asia/Chita Asia/Irkutsk Asia/Kamchatka Asia/Khandyga Asia/Krasnoyarsk Asia/Magadan Asia/Novokuznetsk Asia/Novosibirsk Asia/Omsk Asia/Sakhalin Asia/Srednekolymsk Asia/Tomsk Asia/Ust-Nera Asia/Vladivostok Asia/Yakutsk Asia/Yekaterinburg Europe/Astrakhan Europe/Kaliningrad Europe/Kirov Europe/Moscow Europe/Samara Europe/Saratov Europe/Ulyanovsk Europe/Volgograd W-SU",
  RW: "Africa/Kigali",
  SA: "Asia/Riyadh",
  SB: "Pacific/Guadalcanal Pacific/Ponape",
  SC: "Indian/Mahe",
  SD: "Africa/Khartoum",
  SE: "Europe/Stockholm",
  SG: "Asia/Singapore Singapore",
  SH: "Atlantic/St_Helena",
  SI: "Europe/Ljubljana",
  SJ: "Arctic/Longyearbyen",
  SK: "Europe/Bratislava",
  SL: "Africa/Freetown",
  SM: "Europe/San_Marino",
  SN: "Africa/Dakar",
  SO: "Africa/Mogadishu",
  SR: "America/Paramaribo",
  SS: "Africa/Juba",
  ST: "Africa/Sao_Tome",
  SV: "America/El_Salvador",
  SX: "America/Lower_Princes",
  SY: "Asia/Damascus",
  SZ: "Africa/Mbabane",
  TC: "America/Grand_Turk",
  TD: "Africa/Ndjamena",
  TF: "Indian/Kerguelen",
  TG: "Africa/Lome",
  TH: "Asia/Bangkok",
  TJ: "Asia/Dushanbe",
  TK: "Pacific/Fakaofo",
  TL: "Asia/Dili",
  TM: "Asia/Ashgabat Asia/Ashkhabad",
  TN: "Africa/Tunis",
  TO: "Pacific/Tongatapu",
  TR: "Asia/Istanbul Europe/Istanbul Turkey",
  TT: "America/Port_of_Spain",
  TV: "Pacific/Funafuti",
  TW: "Asia/Taipei ROC",
  TZ: "Africa/Dar_es_Salaam",
  UA: "Europe/Kiev Europe/Kyiv Europe/Simferopol Europe/Uzhgorod Europe/Zaporozhye",
  UG: "Africa/Kampala",
  UM: "Pacific/Midway Pacific/Wake",
  US: "America/Adak America/Anchorage America/Atka America/Boise America/Chicago America/Denver America/Detroit America/Fort_Wayne America/Indiana/Indianapolis America/Indiana/Knox America/Indiana/Marengo America/Indiana/Petersburg America/Indiana/Tell_City America/Indiana/Vevay America/Indiana/Vincennes America/Indiana/Winamac America/Indianapolis America/Juneau America/Kentucky/Louisville America/Kentucky/Monticello America/Knox_IN America/Los_Angeles America/Louisville America/Menominee America/Metlakatla America/New_York America/Nome America/North_Dakota/Beulah America/North_Dakota/Center America/North_Dakota/New_Salem America/Phoenix America/Shiprock America/Sitka America/Yakutat HST MST Navajo Pacific/Honolulu Pacific/Johnston US/Alaska US/Aleutian US/Arizona US/Central US/East-Indiana US/Eastern US/Hawaii US/Indiana-Starke US/Michigan US/Mountain US/Pacific",
  UY: "America/Montevideo",
  UZ: "Asia/Samarkand Asia/Tashkent",
  VA: "Europe/Vatican",
  VC: "America/St_Vincent",
  VE: "America/Caracas",
  VG: "America/Tortola",
  VI: "America/St_Thomas",
  VN: "Asia/Ho_Chi_Minh Asia/Saigon",
  VU: "Pacific/Efate",
  WF: "Pacific/Wallis",
  WS: "Pacific/Apia",
  YE: "Asia/Aden",
  YT: "Indian/Mayotte",
  ZA: "Africa/Johannesburg",
  ZM: "Africa/Lusaka",
  ZW: "Africa/Harare",
};

const COUNTRY_NAMES_RU = {
  AD: "Андорра", AE: "ОАЭ", AF: "Афганистан", AG: "Антигуа и Барбуда",
  AI: "Ангилья", AL: "Албания", AM: "Армения", AO: "Ангола",
  AQ: "Антарктида", AR: "Аргентина", AS: "Американское Самоа", AT: "Австрия",
  AU: "Австралия", AW: "Аруба", AX: "Аландские о-ва", AZ: "Азербайджан",
  BA: "Босния и Герцеговина", BB: "Барбадос", BD: "Бангладеш", BE: "Бельгия",
  BF: "Буркина-Фасо", BG: "Болгария", BH: "Бахрейн", BI: "Бурунди",
  BJ: "Бенин", BL: "Сен-Бартелеми", BM: "Бермудские о-ва", BN: "Бруней",
  BO: "Боливия", BQ: "Бонэйр, Синт-Эстатиус и Саба", BR: "Бразилия", BS: "Багамы",
  BT: "Бутан", BV: "о-в Буве", BW: "Ботсвана", BY: "Беларусь",
  BZ: "Белиз", CA: "Канада", CC: "Кокосовые о-ва", CD: "Конго - Киншаса",
  CF: "Центрально-Африканская Республика", CG: "Конго - Браззавиль", CH: "Швейцария", CI: "Кот-д’Ивуар",
  CK: "о-ва Кука", CL: "Чили", CM: "Камерун", CN: "Китай",
  CO: "Колумбия", CR: "Коста-Рика", CU: "Куба", CV: "Кабо-Верде",
  CW: "Кюрасао", CX: "о-в Рождества", CY: "Кипр", CZ: "Чехия",
  DE: "Германия", DJ: "Джибути", DK: "Дания", DM: "Доминика",
  DO: "Доминиканская Республика", DZ: "Алжир", EC: "Эквадор", EE: "Эстония",
  EG: "Египет", EH: "Западная Сахара", ER: "Эритрея", ES: "Испания",
  ET: "Эфиопия", FI: "Финляндия", FJ: "Фиджи", FK: "Фолклендские о-ва",
  FM: "Федеративные Штаты Микронезии", FO: "Фарерские о-ва", FR: "Франция", GA: "Габон",
  GB: "Великобритания", GD: "Гренада", GE: "Грузия", GF: "Французская Гвиана",
  GG: "Гернси", GH: "Гана", GI: "Гибралтар", GL: "Гренландия",
  GM: "Гамбия", GN: "Гвинея", GP: "Гваделупа", GQ: "Экваториальная Гвинея",
  GR: "Греция", GS: "Южная Георгия и Южные Сандвичевы о-ва", GT: "Гватемала", GU: "Гуам",
  GW: "Гвинея-Бисау", GY: "Гайана", HK: "Гонконг", HM: "о-ва Херд и Макдональд",
  HN: "Гондурас", HR: "Хорватия", HT: "Гаити", HU: "Венгрия",
  ID: "Индонезия", IE: "Ирландия", IL: "Израиль", IM: "О-в Мэн",
  IN: "Индия", IO: "Британская территория в Индийском океане", IQ: "Ирак", IR: "Иран",
  IS: "Исландия", IT: "Италия", JE: "Джерси", JM: "Ямайка",
  JO: "Иордания", JP: "Япония", KE: "Кения", KG: "Киргизия",
  KH: "Камбоджа", KI: "Кирибати", KM: "Коморы", KN: "Сент-Китс и Невис",
  KP: "Северная Корея", KR: "Южная Корея", KW: "Кувейт", KY: "о-ва Кайман",
  KZ: "Казахстан", LA: "Лаос", LB: "Ливан", LC: "Сент-Люсия",
  LI: "Лихтенштейн", LK: "Шри-Ланка", LR: "Либерия", LS: "Лесото",
  LT: "Литва", LU: "Люксембург", LV: "Латвия", LY: "Ливия",
  MA: "Марокко", MC: "Монако", MD: "Молдова", ME: "Черногория",
  MF: "Сен-Мартен", MG: "Мадагаскар", MH: "Маршалловы о-ва", MK: "Северная Македония",
  ML: "Мали", MM: "Мьянма", MN: "Монголия", MO: "Макао",
  MP: "Северные Марианские о-ва", MQ: "Мартиника", MR: "Мавритания", MS: "Монтсеррат",
  MT: "Мальта", MU: "Маврикий", MV: "Мальдивы", MW: "Малави",
  MX: "Мексика", MY: "Малайзия", MZ: "Мозамбик", NA: "Намибия",
  NC: "Новая Каледония", NE: "Нигер", NF: "о-в Норфолк", NG: "Нигерия",
  NI: "Никарагуа", NL: "Нидерланды", NO: "Норвегия", NP: "Непал",
  NR: "Науру", NU: "Ниуэ", NZ: "Новая Зеландия", OM: "Оман",
  PA: "Панама", PE: "Перу", PF: "Французская Полинезия", PG: "Папуа — Новая Гвинея",
  PH: "Филиппины", PK: "Пакистан", PL: "Польша", PM: "Сен-Пьер и Микелон",
  PN: "о-ва Питкэрн", PR: "Пуэрто-Рико", PS: "Палестина", PT: "Португалия",
  PW: "Палау", PY: "Парагвай", QA: "Катар", RE: "Реюньон",
  RO: "Румыния", RS: "Сербия", RU: "Россия", RW: "Руанда",
  SA: "Саудовская Аравия", SB: "Соломоновы о-ва", SC: "Сейшельские о-ва", SD: "Судан",
  SE: "Швеция", SG: "Сингапур", SH: "о-в Св. Елены", SI: "Словения",
  SJ: "Шпицберген и Ян-Майен", SK: "Словакия", SL: "Сьерра-Леоне", SM: "Сан-Марино",
  SN: "Сенегал", SO: "Сомали", SR: "Суринам", SS: "Южный Судан",
  ST: "Сан-Томе и Принсипи", SV: "Сальвадор", SX: "Синт-Мартен", SY: "Сирия",
  SZ: "Эсватини", TC: "Тёркс и Кайкос", TD: "Чад", TF: "Французские Южные территории",
  TG: "Того", TH: "Таиланд", TJ: "Таджикистан", TK: "Токелау",
  TL: "Восточный Тимор", TM: "Туркменистан", TN: "Тунис", TO: "Тонга",
  TR: "Турция", TT: "Тринидад и Тобаго", TV: "Тувалу", TW: "Тайвань",
  TZ: "Танзания", UA: "Украина", UG: "Уганда", UM: "Внешние малые о-ва (США)",
  US: "США", UY: "Уругвай", UZ: "Узбекистан", VA: "Ватикан",
  VC: "Сент-Винсент и Гренадины", VE: "Венесуэла", VG: "Виргинские о-ва (Великобритания)", VI: "Виргинские о-ва (США)",
  VN: "Вьетнам", VU: "Вануату", WF: "Уоллис и Футуна", WS: "Самоа",
  YE: "Йемен", YT: "Майотта", ZA: "ЮАР", ZM: "Замбия",
  ZW: "Зимбабве",
  XK: "Косово"
};

// Язык браузера без региона -> страна (грубо, только когда нет региона)
const BROWSER_LANG_COUNTRY = {
  pl: "PL", fr: "FR", it: "IT", es: "ES", nl: "NL", cs: "CZ", sk: "SK",
  uk: "UA", be: "BY", lt: "LT", lv: "LV", et: "EE", hu: "HU", ro: "RO",
  bg: "BG", hr: "HR", sl: "SI", sr: "RS", el: "GR", pt: "PT", da: "DK",
  sv: "SE", fi: "FI", nb: "NO", no: "NO", tr: "TR", ka: "GE", hy: "AM"
};

const LANG_COUNTRY_FALLBACK = {
  pl: "Польша (по языку)",
  de: "Германия/Австрия/Швейцария (по языку)",
  ru: "Россия/СНГ (по языку)",
  en: "Англоязычный регион (по языку)"
};

// Название зоны (и старой, и новой) -> ISO-код страны; "" если зона не
// привязана к стране (UTC, Etc/GMT+1, …)
let TZ_LOOKUP_ = null;
function tzCountryIso_(timezone) {
  const name = String(timezone || "").trim();
  if (!name) return "";

  if (!TZ_LOOKUP_) {
    TZ_LOOKUP_ = {};
    Object.keys(TZ_BY_COUNTRY).forEach(function(iso){
      TZ_BY_COUNTRY[iso].split(" ").forEach(function(zone){ TZ_LOOKUP_[zone] = iso; });
    });
  }

  return TZ_LOOKUP_[name] || "";
}

function guessCountry(timezone, browserLang, siteLang) {
  const iso = tzCountryIso_(timezone);
  if (iso) return COUNTRY_NAMES_RU[iso] || iso;

  const lang = String(browserLang || "");
  let region = (lang.match(/[-_]([A-Za-z]{2})(?:[-_]|$)/) || [])[1];
  region = region ? region.toUpperCase() : "";
  if (region === "UK") region = "GB";
  if (region && COUNTRY_NAMES_RU[region]) return COUNTRY_NAMES_RU[region] + " (по браузеру)";

  const byLang = BROWSER_LANG_COUNTRY[lang.split(/[-_]/)[0].toLowerCase()];
  if (byLang) return COUNTRY_NAMES_RU[byLang] + " (по браузеру)";

  return LANG_COUNTRY_FALLBACK[String(siteLang || "")] || "Не определено";
}

// Убирает пометку "(по браузеру)"/"(по языку)" — чтобы на Дашборде
// "Польша" и "Польша (по браузеру)" считались одной страной.
function countryKey(label) {
  return String(label || "Не определено").replace(/\s*\(по [^)]*\)\s*$/, "") || "Не определено";
}

// Один раз заново определяет "Страну" у строк Visits, где она пустая
// или была слабой догадкой ("по языку", "Не определено") — теперь, с
// полной таблицей часовых поясов, многие из них определятся точно.
// Точные ответы не трогаем.
function backfillVisitCountries(sheet) {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty("VISITS_COUNTRY_BACKFILL_V3") === "done") return;

  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const rows = sheet.getRange(2, 1, lastRow - 1, VISITS_HEADERS.length).getValues();
    const countries = rows.map(function(r){
      const current = String(r[VCOL.country] || "").trim();
      if (current && !/\(по |Не определено/.test(current)) return [current];
      return [guessCountry(r[VCOL.timezone], r[VCOL.browserLang], r[VCOL.siteLang])];
    });
    sheet.getRange(2, VCOL.country + 1, countries.length, 1).setValues(countries);
  }

  props.setProperty("VISITS_COUNTRY_BACKFILL_V3", "done");
}

// Время визита у самого посетителя (по его часовому поясу)
function visitorLocalTime(date, timezone) {
  try {
    return Utilities.formatDate(date, String(timezone || "").trim(), "dd.MM.yyyy HH:mm");
  } catch (e) {
    return "";
  }
}

// "de-DE" / "de_DE" -> "de"; пустое -> "unknown"
function normalizeLangCode(value) {
  const s = String(value || "").toLowerCase().trim();
  if (!s) return "unknown";
  return s.split("-")[0].split("_")[0];
}

function getOrCreateVisitsSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(VISITS_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(VISITS_SHEET_NAME);
  }

  // Заголовки обновляются, только если что-то изменилось (так лишний раз
  // не пишем в Таблицу на каждое событие); новые столбцы — в конец,
  // существующие данные не трогаем.
  const hasAny = sheet.getLastRow() > 0;
  const current = hasAny
    ? sheet.getRange(1, 1, 1, VISITS_HEADERS.length).getValues()[0]
    : [];
  const changed = VISITS_HEADERS.some(function(title, i){ return String(current[i] || "") !== title; });

  if (changed) {
    sheet.getRange(1, 1, 1, VISITS_HEADERS.length).setValues([VISITS_HEADERS]).setFontWeight("bold");
    sheet.setFrozenRows(1);

    // Столбец "Страна" выделен цветом, чтобы его было сразу видно
    sheet.getRange(1, VCOL.country + 1).setBackground("#1baf7a").setFontColor("#ffffff");
    sheet.setColumnWidth(1, 190);
    sheet.setColumnWidth(VCOL.event + 1, 190);
    sheet.setColumnWidth(VCOL.timezone + 1, 170);
    sheet.setColumnWidth(VCOL.country + 1, 200);
    sheet.setColumnWidth(VCOL.path + 1, 420);
    sheet.setColumnWidth(VCOL.langs + 1, 100);
    sheet.setColumnWidth(VCOL.last + 1, 150);
  }

  backfillVisitCountries(sheet);
  ensureVisitsControls_(sheet);

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

// =======================
// ЗАПИСЬ ВИЗИТА — как на сайте Arduino/ESP32:
//  1. Роботы не записываются.
//  2. Один посетитель = одна строка. ID визита создаёт сайт (случайный,
//     живёт, пока открыта вкладка). Первое событие создаёт строку, все
//     следующие ОБНОВЛЯЮТ её:
//       "Событие"            — последнее действие ("Смена языка", …)
//       "Путь посетителя"    — вся цепочка: Просмотр страницы → … → …
//       "Языки"              — языки сайта, которые он видел (en, ru, …)
//       "Язык сайта"         — текущий язык
//       "Последнее действие" — время последнего события
//  3. Длинные поля (User-Agent, referrer, страница) обрезаются.
//  4. Когда подробных строк больше VISITS_MAX_ROWS, старые (старше
//     VISITS_KEEP_DAYS дней) сами сворачиваются в сводный лист
//     "VisitsArchive" — цифры в статистике не меняются.
//  5. Дашборд пересобирается не на каждое событие, а не чаще раза в
//     DASHBOARD_REFRESH_SECONDS.
// =======================
const VISITS_KEEP_DAYS = 45;
const VISITS_MAX_ROWS = 1500;
const DASHBOARD_REFRESH_SECONDS = 120;

function logVisit(data) {

  if (isBotUserAgent_(data.userAgent)) return;

  const lock = LockService.getScriptLock();
  let locked = false;

  try {
    lock.waitLock(10000);
    locked = true;
  } catch (e) {
    // не дождались — всё равно записываем
  }

  try {

    const sheet = getOrCreateVisitsSheet();
    const now = new Date();
    const label = eventLabel(data.event || "pageview");
    const visitId = String(data.visitId || "").trim();
    const lang = String(data.siteLang || "").trim();
    const nowText = Utilities.formatDate(now, APP_TIMEZONE, "dd.MM.yyyy HH:mm");

    let row = 0;

    if (visitId) {
      const last = sheet.getLastRow();
      if (last > 1) {
        const found = sheet.getRange(2, VCOL.id + 1, last - 1, 1)
          .createTextFinder(visitId).matchEntireCell(true).findNext();
        if (found) row = found.getRow();
      }
    }

    if (row) {

      // ---- тот же посетитель: обновляем строку ----
      const cur = sheet.getRange(row, VCOL.event + 1, 1, VCOL.last - VCOL.event + 1).getValues()[0];
      const steps = String(cur[VCOL.path - VCOL.event] || "").split(" → ").filter(Boolean);
      if (steps[steps.length - 1] !== label) steps.push(label);

      const langs = String(cur[VCOL.langs - VCOL.event] || "").split(",")
        .map(function(s){ return s.trim(); }).filter(Boolean);
      if (lang && langs.indexOf(lang) === -1) langs.push(lang);

      sheet.getRange(row, VCOL.event + 1).setValue(label);
      if (lang) sheet.getRange(row, VCOL.siteLang + 1).setValue(lang);
      sheet.getRange(row, VCOL.path + 1, 1, 3).setValues([[steps.join(" → "), langs.join(", "), nowText]]);

    } else {

      // ---- новый посетитель: новая строка ----
      sheet.appendRow([
        nowText,
        now,                                   // сырая дата — для статистики
        label,
        lang,
        data.browserLang || "",
        data.timezone || "",
        extractDomain(data.referrer),
        cut_(data.referrer, 200),
        cut_(data.utmSource, 60),
        cut_(data.utmMedium, 60),
        cut_(data.utmCampaign, 60),
        data.device || "",
        data.screen || "",
        cut_(data.pageUrl, 120),
        cut_(data.userAgent, 140),
        guessCountry(data.timezone, data.browserLang, data.siteLang),
        visitorLocalTime(now, data.timezone),
        visitId,
        label,
        lang,
        nowText
      ]);

      const lastRow = sheet.getLastRow();
      sheet.getRange(lastRow, 1, 1, VISITS_HEADERS.length).setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
      sheet.setRowHeight(lastRow, 21);

      // Лист разросся — сворачиваем старые визиты в сводку
      if (lastRow - 1 > VISITS_MAX_ROWS) {
        archiveVisitsOlderThan_(new Date(now.getTime() - VISITS_KEEP_DAYS * 24 * 60 * 60 * 1000));
      }
    }

    SpreadsheetApp.flush();

  } finally {
    if (locked) lock.releaseLock();
  }

  refreshDashboardThrottled_();
}

// Что "значит" строка листа Visits для статистики. Старая строка (без
// ID визита) — одно событие. Новая (одна строка на посетителя) —
// просмотр страницы на первом языке, смена языка на каждом следующем
// и по одному событию воронки из "Пути посетителя"
function visitRowEvents_(row) {

  const label = String(row[VCOL.event] || "");
  const id = String(row[VCOL.id] || "").trim();

  if (!id) {
    return [{ event: eventKeyFromLabel(label || "pageview"), siteLang: row[VCOL.siteLang] }];
  }

  const path = String(row[VCOL.path] || "");
  const langs = String(row[VCOL.langs] || "").split(",")
    .map(function(s){ return s.trim(); }).filter(Boolean);
  const out = [{ event: "pageview", siteLang: langs[0] || row[VCOL.siteLang] }];

  langs.slice(1).forEach(function(l){ out.push({ event: "language_view", siteLang: l }); });

  if (pathHasEvent_(path, "inquiry_form_opened")) {
    out.push({ event: "inquiry_form_opened", siteLang: row[VCOL.siteLang] });
  }
  if (pathHasEvent_(path, "inquiry_started")) {
    out.push({ event: "inquiry_started", siteLang: row[VCOL.siteLang] });
  }

  return out;
}

// Дашборд пересобирается не на каждое событие (это тяжело), а не чаще
// раза в DASHBOARD_REFRESH_SECONDS
function refreshDashboardThrottled_() {
  try {
    const cache = CacheService.getScriptCache();
    if (cache.get("dashboard:fresh")) return;
    cache.put("dashboard:fresh", "1", DASHBOARD_REFRESH_SECONDS);
  } catch (e) {
    // кэша нет — просто обновляем
  }
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

// "Дата заявки" (столбец D). Скрипт пишет туда строку "27.09.2026 16:05",
// но Google Таблицы сами превращают такую строку в настоящую дату —
// поэтому getValues() возвращает объект Date, а не текст. Раньше код
// ожидал только текст, не находил в "Sun Sep 27 2026 …" точек и молча
// пропускал ВСЕ заявки (на Дашборде: "Пока нет заявок", 0 отправленных).
// Принимаем оба варианта.
function parseInquiryDate(raw) {
  if (Object.prototype.toString.call(raw) === "[object Date]") return isNaN(raw.getTime()) ? null : raw;
  const m = String(raw || "").trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4] || 0), Number(m[5] || 0));
  return isNaN(d.getTime()) ? null : d;
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

  const totalsByEvent = {
    pageview: emptyCounter(),
    inquiry_form_opened: emptyCounter(),
    inquiry_started: emptyCounter()
  };
  const bySiteLang = {};
  const byDevice = {};
  const byDomain = {};
  const byCountry = {};
  const dailyMap = {};

  // Для свёрнутых визитов известен только день, поэтому окна 7 / 30
  // дней сравниваем по дате
  const day7Key = Utilities.formatDate(day7, tz, "yyyy-MM-dd");
  const day30Key = Utilities.formatDate(day30, tz, "yyyy-MM-dd");

  function bumpW(counter, dateKey, rawDate, weight, byDay) {
    counter.allTime += weight;
    if (dateKey === todayKey) counter.today += weight;
    if (dateKey === yesterdayKey) counter.yesterday += weight;
    if (byDay ? dateKey >= day7Key : rawDate >= day7) counter.last7 += weight;
    if (byDay ? dateKey >= day30Key : rawDate >= day30) counter.last30 += weight;
  }

  // weight — сколько визитов представляет запись (1 для строки листа
  // "Visits", число из колонки "Количество" для сводки "VisitsArchive")
  function addVisit(eventName, dateKey, rawDate, siteLang, device, domain, country, weight, byDay) {

    if (!totalsByEvent[eventName]) totalsByEvent[eventName] = emptyCounter();
    bumpW(totalsByEvent[eventName], dateKey, rawDate, weight, byDay);

    // Язык, который реально был на экране: и при заходе, и при каждой
    // смене языка (сайт всегда открывается на английском)
    if (eventName === "pageview" || eventName === "language_view") {
      const sl = siteLang || "en";
      bySiteLang[sl] = (bySiteLang[sl] || 0) + weight;
    }

    // Устройство / источник / страна / дни — только по заходу на сайт,
    // иначе один визит задвоился бы через события воронки
    if (eventName === "pageview") {
      const dev = device || "unknown";
      byDevice[dev] = (byDevice[dev] || 0) + weight;
      const dom = domain || "Прямой заход";
      byDomain[dom] = (byDomain[dom] || 0) + weight;
      byCountry[country] = (byCountry[country] || 0) + weight;
      dailyMap[dateKey] = (dailyMap[dateKey] || 0) + weight;
    }
  }

  const rows = (visitsSheet && visitsSheet.getLastRow() > 1)
    ? visitsSheet.getRange(2, 1, visitsSheet.getLastRow() - 1, VISITS_HEADERS.length).getValues()
    : [];

  rows.forEach(function(r){
    const rawDate = r[VCOL.raw];
    if (Object.prototype.toString.call(rawDate) !== "[object Date]" || isNaN(rawDate.getTime())) return;
    if (isTestVisit(r[VCOL.page], r[VCOL.ua])) return;

    const country = countryKey(r[VCOL.country] ||
      guessCountry(r[VCOL.timezone], r[VCOL.browserLang], r[VCOL.siteLang]));
    const dateKey = Utilities.formatDate(rawDate, tz, "yyyy-MM-dd");

    // Одна строка = один посетитель: из неё получаем просмотр, смены
    // языка и шаги воронки (см. visitRowEvents_)
    visitRowEvents_(r).forEach(function(ev){
      addVisit(ev.event, dateKey, rawDate, ev.siteLang, r[VCOL.device], r[VCOL.domain], country, 1, false);
    });
  });

  // Свёрнутые (старые) визиты из листа "VisitsArchive"
  readVisitsArchive_().forEach(function(a){
    addVisit(a.event, a.date, a.rawDate, a.siteLang, a.device, a.domain, countryKey(a.country), a.count, true);
  });

  const totals = {
    pageviews: totalsByEvent.pageview,
    formOpened: totalsByEvent.inquiry_form_opened,
    inquiryStarted: totalsByEvent.inquiry_started
  };

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

  const topCountries = Object.keys(byCountry)
    .map(function(k){ return { country: k, count: byCountry[k] }; })
    .sort(function(a, b){ return b.count - a.count; })
    .slice(0, 10);

  // Заявки — считаем прямо из основного листа (столбец D — дата
  // создания, столбец E — язык).
  const sheet = ss.getSheetByName(SHEET_NAME);
  const inquiriesSent = emptyCounter();
  const byInquiryLang = {};
  const lastRow = sheet.getLastRow();

  if (lastRow >= 2) {
    const data = sheet.getRange(2, 4, lastRow - 1, 2).getValues();
    data.forEach(function(r){
      const asDate = parseInquiryDate(r[0]);
      if (!asDate) return;
      const lang = String(r[1] || "").trim().toLowerCase() || "unknown";
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
    topCountries: topCountries,
    dailySeries: dailySeries
  };

}

// =======================
// СВОДНЫЙ ЛИСТ "VisitsArchive" — сжатая таблица прошлых визитов: одна
// строка на сочетание день + событие + языки + устройство + источник +
// страна и число таких визитов. Статистика читает и подробный лист
// "Visits", и этот, поэтому после очистки/сворачивания цифры остаются.
// =======================
const VISITS_ARCHIVE_SHEET_NAME = "VisitsArchive";
const VISITS_ARCHIVE_HEADERS = [
  "Дата", "Событие", "Язык сайта", "Язык браузера",
  "Устройство", "Источник (домен)", "Страна", "Количество"
];

function getOrCreateVisitsArchiveSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(VISITS_ARCHIVE_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(VISITS_ARCHIVE_SHEET_NAME);
    sheet.getRange(1, 1, 1, VISITS_ARCHIVE_HEADERS.length)
      .setValues([VISITS_ARCHIVE_HEADERS]).setFontWeight("bold");
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, VISITS_ARCHIVE_HEADERS.length, 130);
    // текстом — чтобы даты/языки не превращались в другие типы
    sheet.getRange(1, 1, sheet.getMaxRows(), 7).setNumberFormat("@");
  }

  return sheet;
}

// Строки сводки как объекты (для computeStats)
function readVisitsArchive_() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(VISITS_ARCHIVE_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return [];

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, VISITS_ARCHIVE_HEADERS.length).getValues();
  const out = [];

  rows.forEach(function(r){
    const count = Number(r[7]) || 0;
    if (!count) return;

    const date = Object.prototype.toString.call(r[0]) === "[object Date]"
      ? Utilities.formatDate(r[0], APP_TIMEZONE, "yyyy-MM-dd")
      : String(r[0] || "").trim();

    const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return;

    out.push({
      date: date,
      rawDate: new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0),
      event: eventKeyFromLabel(String(r[1] || "pageview")),
      siteLang: String(r[2] || ""),
      browserLang: String(r[3] || ""),
      device: String(r[4] || ""),
      domain: String(r[5] || ""),
      country: String(r[6] || ""),
      count: count
    });
  });

  return out;
}

// Если удалить все строки до самого низа листа, Таблицы ругаются
// ("нельзя удалить все не закреплённые строки") — оставляем запасную
function ensureSpareRow_(sheet) {
  if (sheet.getMaxRows() <= sheet.getLastRow()) {
    sheet.insertRowsAfter(sheet.getMaxRows(), 1);
  }
}

// Сворачивает в сводку все подробные визиты раньше cutoff и удаляет их
// из листа "Visits". Тестовые визиты (с localhost и т.п.) в сводку не
// попадают — они просто удаляются. Возвращает, сколько строк убрано.
function archiveVisitsOlderThan_(cutoff) {

  const sheet = getOrCreateVisitsSheet();
  const last = sheet.getLastRow();
  if (last < 2) return 0;

  const tz = APP_TIMEZONE;
  const rows = sheet.getRange(2, 1, last - 1, VISITS_HEADERS.length).getValues();

  const agg = {};        // ключ -> строка сводки
  const oldRows = [];    // номера строк листа (1-based), подлежащие удалению

  rows.forEach(function(r, i){

    const raw = r[VCOL.raw];
    if (Object.prototype.toString.call(raw) !== "[object Date]" || isNaN(raw.getTime()) || raw >= cutoff) return;

    oldRows.push(i + 2);
    if (isTestVisit(r[VCOL.page], r[VCOL.ua])) return;

    const country = countryKey(r[VCOL.country] ||
      guessCountry(r[VCOL.timezone], r[VCOL.browserLang], r[VCOL.siteLang]));

    visitRowEvents_(r).forEach(function(ev){
      const rec = [
        Utilities.formatDate(raw, tz, "yyyy-MM-dd"),
        eventLabel(ev.event),
        String(ev.siteLang || ""),
        normalizeLangCode(r[VCOL.browserLang]),
        String(r[VCOL.device] || ""),
        String(r[VCOL.domain] || "") || "Прямой заход",
        country
      ];
      const key = rec.join("\u0001");
      if (!agg[key]) agg[key] = rec.concat([0]);
      agg[key][7]++;
    });
  });

  if (!oldRows.length) return 0;

  // Добавляем к уже имеющейся сводке
  const arch = getOrCreateVisitsArchiveSheet_();

  if (arch.getLastRow() > 1) {
    arch.getRange(2, 1, arch.getLastRow() - 1, VISITS_ARCHIVE_HEADERS.length).getValues().forEach(function(r){
      const date = Object.prototype.toString.call(r[0]) === "[object Date]"
        ? Utilities.formatDate(r[0], tz, "yyyy-MM-dd") : String(r[0] || "").trim();
      const rec = [date, String(r[1] || ""), String(r[2] || ""), String(r[3] || ""),
        String(r[4] || ""), String(r[5] || ""), String(r[6] || "")];
      const key = rec.join("\u0001");
      if (!agg[key]) agg[key] = rec.concat([0]);
      agg[key][7] += Number(r[7]) || 0;
    });
  }

  const out = Object.keys(agg).map(function(k){ return agg[k]; })
    .sort(function(a, b){ return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0; });

  if (out.length) {
    arch.getRange(2, 1, Math.max(arch.getMaxRows() - 1, 1), VISITS_ARCHIVE_HEADERS.length).clearContent();

    if (arch.getMaxRows() < out.length + 1) {
      arch.insertRowsAfter(arch.getMaxRows(), out.length + 1 - arch.getMaxRows());
    }

    arch.getRange(2, 1, out.length, 7).setNumberFormat("@");
    arch.getRange(2, 1, out.length, VISITS_ARCHIVE_HEADERS.length).setValues(out);
  }

  ensureSpareRow_(sheet);

  // Удаляем убранные строки снизу вверх сплошными блоками
  let end = oldRows.length - 1;
  while (end >= 0) {
    let start = end;
    while (start > 0 && oldRows[start - 1] === oldRows[start] - 1) start--;
    sheet.deleteRows(oldRows[start], end - start + 1);
    end = start - 1;
  }

  return oldRows.length;
}

// Ручная команда (Выполнить в редакторе): свернуть визиты старше
// VISITS_KEEP_DAYS дней — подробности последних дней остаются
function archiveOldVisits() {
  const moved = archiveVisitsOlderThan_(new Date(Date.now() - VISITS_KEEP_DAYS * 24 * 60 * 60 * 1000));
  updateDashboard();
  Logger.log("Свёрнуто в сводку визитов: " + moved);
}

// =======================
// ГАЛОЧКИ ОЧИСТКИ — в листах "Visits" (W1, Y1) и "Дашборд" (A3, F3).
// Работают и в приложении Google Таблицы на телефоне. После выполнения
// галочка снимается сама, результат пишется рядом (Visits!AA1 и строка
// "Обновлено" на Дашборде).
//   🧹 Очистить лист  — старые визиты сворачиваются в "VisitsArchive",
//                        лист Visits пустой, статистика СОХРАНЯЕТСЯ
//   🗑 Удалить ВСЁ     — стираются Visits и сводка, статистика с НУЛЯ
// (заявки в листе "Заявки" не затрагиваются)
// Срабатывают через уже установленный триггер checkStatusChanges
// ("При редактировании") — отдельный триггер не нужен.
// =======================
const VISITS_CTRL = { keep: 23, all: 25, note: 27 };   // W, Y, AA
const DASH_CTRL = { row: 3, keep: 1, all: 6 };         // A3, F3
const CLEAR_NOTE_PROP = "VISITS_LAST_ACTION";

function ensureVisitsControls_(sheet) {

  if (sheet.getMaxColumns() < 28) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), 28 - sheet.getMaxColumns());
  }

  if (String(sheet.getRange(1, VISITS_CTRL.keep, 1, 3).getValues()[0].join("")).trim() !== "") return;

  sheet.getRange(1, VISITS_CTRL.keep).insertCheckboxes().setValue(false).setHorizontalAlignment("center");
  sheet.getRange(1, VISITS_CTRL.keep + 1).setValue("🧹 Очистить лист (статистика сохранится)").setFontWeight("bold");

  sheet.getRange(1, VISITS_CTRL.all).insertCheckboxes().setValue(false).setHorizontalAlignment("center");
  sheet.getRange(1, VISITS_CTRL.all + 1).setValue("🗑 Удалить ВСЁ (статистика с нуля)")
    .setFontWeight("bold").setFontColor("#c0392b");

  sheet.setColumnWidth(VISITS_CTRL.keep, 60);
  sheet.setColumnWidth(VISITS_CTRL.keep + 1, 290);
  sheet.setColumnWidth(VISITS_CTRL.all, 60);
  sheet.setColumnWidth(VISITS_CTRL.all + 1, 260);
  sheet.setColumnWidth(VISITS_CTRL.note, 380);
}

// Свернуть всё из Visits в сводку, лист Visits — пустой
function clearVisitsKeepStats_() {
  const moved = archiveVisitsOlderThan_(new Date(Date.now() + 24 * 60 * 60 * 1000));
  updateDashboard();
  return "Visits очищен (визитов убрано: " + moved + "), статистика сохранена";
}

// Удалить и Visits, и сводку
function clearVisitsAll_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const visits = getOrCreateVisitsSheet();
  const last = visits.getLastRow();

  if (last > 1) {
    ensureSpareRow_(visits);
    visits.deleteRows(2, last - 1);
  }

  const arch = ss.getSheetByName(VISITS_ARCHIVE_SHEET_NAME);
  if (arch && arch.getLastRow() > 1) {
    arch.getRange(2, 1, arch.getLastRow() - 1, VISITS_ARCHIVE_HEADERS.length).clearContent();
  }

  updateDashboard();
  return "удалено всё: Visits (" + Math.max(last - 1, 0) + " строк) и сводка — статистика с нуля";
}

// Вызывается из checkStatusChanges(e). Возвращает true, если правка была
// нажатием на галочку очистки (тогда статусы заявок проверять не нужно)
function handleControlEdit_(e) {

  if (!e || !e.range) return false;

  const sheet = e.range.getSheet();
  const name = sheet.getName();
  const col = e.range.getColumn();
  const row = e.range.getRow();

  let action = "";

  if (name === VISITS_SHEET_NAME && row === 1) {
    if (col === VISITS_CTRL.keep) action = "keep";
    if (col === VISITS_CTRL.all) action = "all";
  } else if (name === DASHBOARD_SHEET_NAME && row === DASH_CTRL.row) {
    if (col === DASH_CTRL.keep) action = "keep";
    if (col === DASH_CTRL.all) action = "all";
  }

  if (!action) return false;
  if (e.range.getNumRows() !== 1 || e.range.getNumColumns() !== 1) return true;
  if (e.range.getValue() !== true) return true;     // галочку сняли — ничего не делаем

  const lock = LockService.getScriptLock();
  let message = "";

  try {
    lock.waitLock(20000);
    message = action === "keep" ? clearVisitsKeepStats_() : clearVisitsAll_();
  } catch (err) {
    message = "ошибка: " + err;
  } finally {
    try { lock.releaseLock(); } catch (x) { /* замок не был взят */ }
  }

  const stamp = Utilities.formatDate(new Date(), APP_TIMEZONE, "dd.MM.yyyy HH:mm") + " — " + message;
  PropertiesService.getScriptProperties().setProperty(CLEAR_NOTE_PROP, stamp);

  const visits = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(VISITS_SHEET_NAME);
  if (visits) {
    visits.getRange(1, VISITS_CTRL.note).setValue(stamp);
    visits.getRange(1, VISITS_CTRL.keep).setValue(false);   // галочки снимаются сами
    visits.getRange(1, VISITS_CTRL.all).setValue(false);
  }

  // Дашборд мог быть пересобран выше — снимаем галочки и на нём
  const dash = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(DASHBOARD_SHEET_NAME);
  if (dash) {
    dash.getRange(DASH_CTRL.row, DASH_CTRL.keep).setValue(false);
    dash.getRange(DASH_CTRL.row, DASH_CTRL.all).setValue(false);
    dash.getRange("A2").setValue(dashboardUpdatedText_());
  }

  return true;
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

// Строка "Обновлено" на Дашборде + что делали галочками в последний раз
function dashboardUpdatedText_() {
  let text = "Обновлено: " + Utilities.formatDate(new Date(), APP_TIMEZONE, "dd.MM.yyyy HH:mm");
  const note = PropertiesService.getScriptProperties().getProperty(CLEAR_NOTE_PROP);
  if (note) text += "   ·   Последняя очистка: " + note;
  return text;
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
    .setValue(dashboardUpdatedText_())
    .setFontColor("#898781").setFontStyle("italic");

  // --- Очистка статистики одной галочкой (как на листе Visits) ---------
  // Подписи длиннее ячейки — переливаются на соседние пустые ячейки.
  sheet.getRange(DASH_CTRL.row, DASH_CTRL.keep).insertCheckboxes().setValue(false).setHorizontalAlignment("center");
  sheet.getRange(DASH_CTRL.row, DASH_CTRL.keep + 1)
    .setValue("🧹 Очистить лист Visits (статистика сохранится)").setFontWeight("bold");
  sheet.getRange(DASH_CTRL.row, DASH_CTRL.all).insertCheckboxes().setValue(false).setHorizontalAlignment("center");
  sheet.getRange(DASH_CTRL.row, DASH_CTRL.all + 1)
    .setValue("🗑 Удалить ВСЁ (статистика с нуля)").setFontWeight("bold").setFontColor("#c0392b");

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
    ["📝 Пишут свои данные", fo, pct(fo, pv.allTime) + " от просмотров (нажали «Написать мне»)"],
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

  // --- Страны посетителей -----------------------------------------
  sheet.getRange("A68:C68").merge();
  sheet.getRange("A68").setValue("🌍 СТРАНЫ ПОСЕТИТЕЛЕЙ (топ-10)")
    .setFontWeight("bold").setFontColor("#ffffff").setBackground("#1baf7a");

  sheet.getRange(69, 1, 1, 2).setValues([["Страна", "Просмотров"]]).setFontWeight("bold").setFontColor("#52514e");

  const countryRows = stats.topCountries.length
    ? stats.topCountries.map(function(c){ return [c.country, c.count]; })
    : [["Пока нет данных", 0]];
  while (countryRows.length < 10) countryRows.push(["", ""]);

  sheet.getRange(70, 1, 10, 2).setValues(countryRows);
  sheet.getRange(70, 2, 10, 1).setNumberFormat("#,##0");

  if (stats.topCountries.length > 0) {
    const countryChart = sheet.newChart()
      .setChartType(Charts.ChartType.BAR)
      .addRange(sheet.getRange(70, 1, Math.min(10, stats.topCountries.length), 2))
      .setPosition(68, 4, 0, 0)
      .setOption("title", "Страны посетителей")
      .setOption("width", 420).setOption("height", 260)
      .setOption("legend", "none").setOption("colors", ["#1baf7a"])
      .build();
    sheet.insertChart(countryChart);
  }

  // --- Пояснение внизу -------------------------------------------
  sheet.getRange("A83:H83").merge();
  sheet.getRange("A83")
    .setValue("ℹ️ Без IP/геолокации: страна — догадка по часовому поясу браузера, а если он не распознан — по языку браузера или сайта. Один визит = один посетитель (пока открыта вкладка), язык — какие языки он реально видел. Обновляется автоматически (не чаще раза в пару минут) и при каждой заявке.")
    .setFontColor("#898781").setFontStyle("italic").setWrap(true);

  sheet.setFrozenRows(2);
  sheet.getRange(1, 1, 83, 8).setFontFamily("Arial");

}
