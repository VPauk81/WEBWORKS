// ==========================================================
// WEBWORKS — приём заявок из формы "Расскажите о проекте"
// Тот же принцип, что и на сайте Arduino/ESP32 Firmware Studio:
// сайт делает fetch()-POST с полем "data" (JSON-строка), скрипт
// дописывает строку в таблицу и присылает письма (владельцу и,
// если получится, клиенту).
// ==========================================================

// ID своей Google Таблицы (из её ссылки:
// https://docs.google.com/spreadsheets/d/ЭТОТ_ID/edit)
const SPREADSHEET_ID = "REPLACE_WITH_YOUR_SPREADSHEET_ID";
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

function doPost(e) {
  try {

    const data = JSON.parse(e.parameter.data);

    const sheet = SpreadsheetApp
      .openById(SPREADSHEET_ID)
      .getSheetByName(SHEET_NAME);

    ensureHeaderRow(sheet);

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
      "🟢 Новая",
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
