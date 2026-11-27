import { formatShort } from "./dates.js";

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function utf8ToBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function wrap76(value) {
  return value.replace(/.{1,76}/g, "$&\r\n").replace(/\r\n$/, "");
}

export function encodeHeader(value) {
  const single = String(value ?? "").replace(/[\r\n]+/g, " ").trim();
  if (/^[\t\x20-\x7E]*$/.test(single)) return single;
  return `=?UTF-8?B?${utf8ToBase64(single)}?=`;
}

export function safeFilename(name) {
  const clean = String(name ?? "").replace(/[\\/:*?"<>|\r\n]+/g, "").trim();
  return clean || "document";
}

function row(label, value) {
  const cell = value ? escapeHtml(value).replace(/\r?\n/g, "<br>") : "&nbsp;";
  return `<tr><td style="width:45%;border:1px solid #999;padding:6pt"><b>${escapeHtml(label)}</b></td><td style="border:1px solid #999;padding:6pt">${cell}</td></tr>`;
}

/** Word-compatible proforma, built entirely in the browser. */
export function proformaHtml(profile, today = new Date()) {
  const previous = String(profile.previousAddresses ?? "").trim() || "None";
  return `<html><head><meta charset="utf-8"><title>HMRC PSPR proforma</title></head><body style="font-family:Calibri,Arial,sans-serif;font-size:11pt">` +
    `<h2 style="text-align:center">Request for information from HMRC to support submissions for Public Service Pension Adjustment</h2>` +
    `<p>\u2612 I require personal information that falls under the UK General Data Protection Regulation and Data Protection Act 2018. I need the relevant information held on my personal Self Assessment tax returns to determine my tax position in relation to the public service pensions remedy.</p>` +
    `<p>\u2610 If using an agent: I authorise HMRC to send this information directly to the nominated third party named below.</p>` +
    `<table style="border-collapse:collapse;width:100%">` +
    row("Full name", profile.name) +
    row("Date of birth", profile.dob) +
    row("National insurance number (NINO) or Unique tax reference (UTR)", profile.nino) +
    row("Tax years and information required. Please include details of any amendments to previous tax returns.", "2015/16; 2016/17; 2017/18; 2018/19; 2019/20; 2020/21; 2021/22; 2022/23. Latest version of the remedy extract (V2.1 or later) in XLS format. No amendments to previous returns unless noted here.") +
    row("PSTR", "NHS Pension Scheme 00820574RJ / 00328820RJ or related NHS pension schemes") +
    row("Current address", profile.address) +
    row("Previous addresses for the past 5 years (if applicable)", previous) +
    `</table>` +
    `<p><b>Third party details</b><br>N/A \u2014 please send the information directly to me.</p>` +
    `<p><b>Important information about communicating by email.</b></p>` +
    `<p>I have read the email protocol and I confirm:</p>` +
    `<ul><li>that I understand and accept the risks of using email</li>` +
    `<li>that I am content for financial information to be sent by email</li>` +
    `<li>that attachments can be used.</li></ul>` +
    `<table style="border-collapse:collapse;width:100%">` +
    row("Email address", profile.replyEmail) +
    row("Signature", profile.name) +
    row("Date", formatShort(today)) +
    `</table>` +
    `<p>Please send the completed form to psprinforequests@hmrc.gov.uk</p>` +
    `</body></html>`;
}

export function proformaFilename(name) {
  const clean = safeFilename(name);
  return clean === "document" ? "HMRC PSPR proforma.doc" : `HMRC PSPR proforma - ${clean}.doc`;
}

export function buildEml({ to, subject, body, attachment, boundary }) {
  const safeTo = String(to ?? "").replace(/[\r\n]+/g, "").trim();
  const subjectHeader = encodeHeader(subject);
  const text = String(body ?? "").replace(/\r?\n/g, "\r\n");
  if (!attachment) {
    return [
      `To: ${safeTo}`,
      `Subject: ${subjectHeader}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=utf-8",
      "Content-Transfer-Encoding: 8bit",
      "",
      text,
      "",
    ].join("\r\n");
  }
  const marker = boundary || `mft_${Date.now()}`;
  const filename = safeFilename(attachment.filename);
  const encoded = wrap76(utf8ToBase64(attachment.content));
  return [
    `To: ${safeTo}`,
    `Subject: ${subjectHeader}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${marker}"`,
    "",
    `--${marker}`,
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    text,
    "",
    `--${marker}`,
    `Content-Type: ${attachment.type}; name="${filename}"`,
    "Content-Transfer-Encoding: base64",
    `Content-Disposition: attachment; filename="${filename}"`,
    "",
    encoded,
    "",
    `--${marker}--`,
    "",
  ].join("\r\n");
}
