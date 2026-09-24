// ==========================================================
// WEBWORKS — приём заявок из формы "Расскажите о проекте"
// Тот же принцип, что и на сайте Arduino/ESP32 Firmware Studio:
// сайт делает fetch()-POST с полем "data" (JSON-строка), скрипт
// дописывает строку в таблицу и присылает письма (владельцу и,
// если получится, клиенту).
// ==========================================================

// ID своей Google Таблицы (из её ссылки:
// https://docs.google.com/spreadsheets/d/ЭТОТ_ID/edit)
const SPREADSHEET_ID = "1bF083S-JgnAWPtx_3f3_PAqDJgmBEAv5nFoEAeXHHhI";
const SHEET_NAME = "Заявки";
const OWNER_EMAIL = "s.i.pauchak@gmail.com";

// Часовой пояс для колонки "Дата заявки"
const APP_TIMEZONE = "Europe/Warsaw";

const QUOTA_WARNING_TEXT =
  "⚠ email не отправлен: превышен суточный лимит писем Gmail. " +
  "Попробуйте позже (лимит обновляется около полуночи по тихоокеанскому времени)";

const HEADER_ROW = [
  "ID заявки", "Статус", "Email клиенту", "Дата заявки", "Язык",
  "Имя", "Email", "Телефон", "WhatsApp", "Viber", "Telegram", "Описание"
];

// Столбцы (1 = A) — используются для форматирования/валидации ниже.
const COL_STATUS = 2;   // B
const COL_PHONE = 8;    // H

// Статусы заказа — выпадающий список в столбце B, чтобы отмечать,
// на каком этапе разработка, кликом по ячейке.
const STATUS_OPTIONS = [
  "🟢 Новый",
  "🟡 Проверяется",
  "🟠 Ожидает оплаты",
  "🔵 В работе",
  "🟣 Готово",
  "📦 Отправлен",
  "✔️ Завершён",
  "❌ Отменён"
];

function doGet(e) {
  return ContentService.createTextOutput("OK");
}

// Номер заявки вида WW-00001, счётчик хранится между запусками
// в свойствах скрипта (как ORDER_NUM в Arduino-проекте).
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
  }
}

// Столбец "Телефон" всегда должен быть текстом — иначе Таблицы видят
// "+48 512345678" и пытаются прочитать это как формулу (#ERROR!).
// Ставим формат "простой текст" на широкий диапазон заранее — тогда
// будущие appendRow() в этот столбец никогда не попадут под авто-
// определение формулы, независимо от того, сколько строк уже есть.
function ensurePhoneColumnIsText(sheet) {
  sheet.getRange(2, COL_PHONE, 998, 1).setNumberFormat("@");
}

// Выпадающий список статусов в столбце B — перевызываем при каждой
// заявке (как setupStatusDropdown в Arduino-проекте), чтобы список
// точно охватывал и только что добавленную строку, и был всегда
// актуален, даже если этот список значений когда-нибудь поменяется.
function setupStatusDropdown(sheet) {
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUS_OPTIONS, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, COL_STATUS, 998, 1).setDataValidation(rule);
}

function doPost(e) {
  try {

    const data = JSON.parse(e.parameter.data);

    const sheet = SpreadsheetApp
      .openById(SPREADSHEET_ID)
      .getSheetByName(SHEET_NAME);

    ensureHeaderRow(sheet);
    ensurePhoneColumnIsText(sheet);
    setupStatusDropdown(sheet);

    const orderID = nextOrderId();

    const createdLabel = Utilities.formatDate(
      new Date(),
      APP_TIMEZONE,
      "dd.MM.yyyy HH:mm"
    );

    // Gmail даёт ограниченное количество писем в сутки (у обычного
    // Google-аккаунта — 100). Если лимит исчерпан, MailApp либо
    // кинет исключение, либо (по getRemainingDailyQuota) мы заранее
    // знаем, что слать бессмысленно — в обоих случаях в таблицу
    // пишем предупреждение вместо тихой потери заявки.
    const hasQuota = MailApp.getRemainingDailyQuota() > 0;
    let clientEmailStatus = QUOTA_WARNING_TEXT;

    if (hasQuota && data.email) {
      try {
        MailApp.sendEmail({
          to: data.email,
          subject: "Спасибо за заявку — WEBWORKS",
          body:
            "Здравствуйте" + (data.name ? ", " + data.name : "") + "!\n\n" +
            "Я получил вашу заявку (" + orderID + ") и скоро свяжусь с вами.\n\n" +
            "С уважением,\nWEBWORKS"
        });
        clientEmailStatus = "✅ Отправлено";
      } catch (mailErr) {
        clientEmailStatus = QUOTA_WARNING_TEXT;
      }
    }

    if (hasQuota) {
      try {
        MailApp.sendEmail({
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
        });
      } catch (ownerMailErr) {
        // Письмо владельцу не ушло — но строка в таблице ниже всё
        // равно сохранит заявку, это резервная запись на такой случай.
      }
    }

    sheet.appendRow([
      orderID,
      STATUS_OPTIONS[0],
      clientEmailStatus,
      createdLabel,
      data.language || "",
      data.name || "",
      data.email || "",
      data.phone || "",
      data.whatsapp ? "✔" : "",
      data.viber ? "✔" : "",
      data.telegram ? "✔" : "",
      data.message || ""
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok", orderID: orderID }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {

    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);

  }
}
