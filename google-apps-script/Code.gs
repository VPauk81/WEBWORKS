// ==========================================================
// WEBWORKS — приём заявок из формы "Расскажите о проекте"
// Тот же принцип, что и на сайте Arduino/ESP32 Firmware Studio:
// сайт делает fetch()-POST с полем "data" (JSON-строка), скрипт
// дописывает строку в таблицу и присылает письмо на почту.
// ==========================================================

// Замени на ID своей Google Таблицы (из её ссылки:
// https://docs.google.com/spreadsheets/d/ЭТОТ_ID/edit)
const SPREADSHEET_ID = "REPLACE_WITH_YOUR_SPREADSHEET_ID";
const SHEET_NAME = "Заявки";
const OWNER_EMAIL = "s.i.pauchak@gmail.com";

function doGet(e) {
  return ContentService.createTextOutput("OK");
}

function doPost(e) {
  try {
    const data = JSON.parse(e.parameter.data);

    const sheet = SpreadsheetApp
      .openById(SPREADSHEET_ID)
      .getSheetByName(SHEET_NAME);

    sheet.appendRow([
      new Date(),
      data.name || "",
      data.email || "",
      data.message || "",
      data.language || ""
    ]);

    MailApp.sendEmail({
      to: OWNER_EMAIL,
      subject: "WEBWORKS — новая заявка от " + (data.name || "без имени"),
      body:
        "Имя: " + (data.name || "") + "\n" +
        "Email: " + (data.email || "") + "\n" +
        "Язык сайта: " + (data.language || "") + "\n\n" +
        (data.message || "")
    });

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
