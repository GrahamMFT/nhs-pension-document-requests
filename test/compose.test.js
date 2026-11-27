import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { composeEmail, fullTemplateText, oneLine } from "../src/compose.js";
import { addMonths, defaultEstimateDate, statutoryDeadline } from "../src/dates.js";
import { buildMailto } from "../src/mailto.js";
import { buildEml, proformaHtml, utf8ToBase64 } from "../src/proforma.js";
import { clearProfile, loadNation, loadProfile, saveNation, saveProfile } from "../src/profile.js";
import { getTemplate, templates } from "../src/templates.js";

const today = new Date(2026, 10, 27);
const profile = {
  name: "Dr Jane Smith",
  dob: "01/02/1980",
  address: "1 High Street, Leeds LS1 1AA",
  membership: "12345678",
  nino: "QQ123456C",
  previousAddresses: "",
  replyEmail: "jane.smith@nhs.net",
};

function emailFor(id, extra = {}) {
  const template = getTemplate(id);
  return composeEmail(template, extra.profile ?? profile, {
    today,
    nation: extra.nation ?? "ew",
    years: extra.years ?? template.years?.default,
    estimateDate: extra.estimateDate,
  });
}

function memory() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
  };
}

test("templates have unique ids and the fields a maintainer needs", () => {
  const ids = templates.map((template) => template.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const template of templates) {
    assert.ok(template.code && template.title && template.summary && template.detail);
    assert.ok(Array.isArray(template.notes) && template.notes.length);
    assert.match(template.subject, /\S/);
    assert.match(template.body, /Kind regards/);
  }
});

test("a complete profile fills every template with no placeholders left", () => {
  for (const template of templates) {
    const email = emailFor(template.id);
    assert.deepEqual(email.missing, [], template.id);
    assert.equal(email.body.includes("{{"), false, template.id);
    assert.equal(email.body.includes("XXX"), false, template.id);
    assert.equal(email.body.includes("[full name]"), false, template.id);
    assert.match(email.body, /Dr Jane Smith/);
    assert.match(email.body, /01\/02\/1980/);
    assert.match(email.body, /1 High Street, Leeds LS1 1AA/);
    assert.match(email.to, /@/);
    assert.match(email.mailto.href, new RegExp(`^mailto:${email.to.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\?`));
  }
});

test("NHSP01 keeps the statement year the member chooses", () => {
  const email = emailFor("NHSP01", { years: ["22/23"] });
  assert.match(email.body, /NHSP01 - \(22\/23; PDF\)/);
  assert.equal(email.body.includes("24/25"), false);
  assert.equal(email.to, "nhsbsa.pensionsmember@nhsbsa.nhs.uk");
  assert.equal(email.subject, "Document request NHSP01");
});

test("NHSP01 cannot be opened with no year selected", () => {
  const email = emailFor("NHSP01", { years: [] });
  assert.ok(email.missing.includes("years"));
});

test("NHSP02 defaults the estimate to the next 31 March", () => {
  const email = emailFor("NHSP02");
  assert.match(email.body, /31st March 2027/);
  assert.match(email.body, /NOT requesting a TRS\/ABS/);
  const custom = emailFor("NHSP02", { estimateDate: "30th June 2028" });
  assert.match(custom.body, /30th June 2028/);
});

test("NHSP03 names the statutory deadline and switches scheme administrator", () => {
  const england = emailFor("NHSP03", { today });
  assert.match(england.body, /27 November 2026/);
  assert.match(england.body, /27 February 2027/);
  assert.match(england.body, /NHSP03 \(23\/24; PDF\)/);
  assert.match(england.body, /NHSP03 \(25\/26; PDF\)/);
  assert.equal(england.body.includes("[delete any"), false);
  assert.equal(england.to, "nhsbsa.pensionsmember@nhsbsa.nhs.uk");
  assert.match(england.body, /^Dear NHS Pensions/);

  const scotland = emailFor("NHSP03", { nation: "sc" });
  assert.equal(scotland.to, "SPPA-AAEnquiries@gov.scot");
  assert.match(scotland.body, /^Dear SPPA/);
  assert.match(scotland.body, /Membership Number \(this is on your SPPA pension documents\): 12345678/);
  assert.equal(scotland.body.includes("SD Number"), false);

  const northernIreland = emailFor("NHSP03", { nation: "ni" });
  assert.equal(northernIreland.to, "AAQueries@hscni.net");
  assert.match(northernIreland.body, /^Dear HSC Pension Service/);
});

test("pension savings deadline is the later of three months and 6 October", () => {
  assert.equal(statutoryDeadline(new Date(2026, 4, 1)).toDateString(), new Date(2026, 9, 6).toDateString());
  assert.equal(statutoryDeadline(new Date(2026, 2, 1)).toDateString(), new Date(2026, 5, 1).toDateString());
  assert.equal(addMonths(new Date(2026, 0, 31), 3).toDateString(), new Date(2026, 3, 30).toDateString());
  assert.equal(defaultEstimateDate(new Date(2026, 2, 1)), "31st March 2026");
  assert.equal(defaultEstimateDate(new Date(2026, 3, 1)), "31st March 2027");
});

test("other NHS documents stay with NHS Pensions even if a scheme was chosen", () => {
  const email = emailFor("NHSP06", { nation: "sc" });
  assert.equal(email.to, "nhsbsa.pensionsmember@nhsbsa.nhs.uk");
  assert.match(email.body, /scheme pays multi year extract/);
  assert.match(email.body, /SD Number/);
});

test("HMRC extract uses the member’s name, NI number and previous addresses", () => {
  const email = emailFor("hmrc-mccloud");
  assert.equal(email.to, "psprinforequests@hmrc.gov.uk");
  assert.equal(email.subject, "PSPR submission request - Dr Jane Smith");
  assert.match(email.body, /Unique Tax Reference \(UTR\): QQ123456C/);
  assert.match(email.body, /Previous addresses for the past 5 years \(if applicable\): None/);
  assert.match(email.mailto.href, /subject=PSPR%20submission%20request/);
  assert.equal(email.missing.includes("membership"), false);

  const moved = emailFor("hmrc-mccloud", {
    profile: { ...profile, previousAddresses: "2 Low Street, York YO1 1AA\nuntil March 2024" },
  });
  assert.match(moved.body, /2 Low Street, York YO1 1AA, until March 2024/);
});

test("missing details are reported and do not invent a name", () => {
  const email = emailFor("NHSP04", {
    profile: { name: "", dob: "", address: "Leeds", membership: "" },
  });
  assert.deepEqual(email.missing, ["name", "dob", "membership"]);
  assert.match(email.body, /\[full name\]/);
  assert.match(email.body, /\[membership number\]/);
});

test("line breaks in an address become a single postal line", () => {
  assert.equal(oneLine("1 High Street\nLeeds\nLS1 1AA"), "1 High Street, Leeds, LS1 1AA");
});

test("format warnings do not block a completed request", () => {
  const email = emailFor("NHSP01", { profile: { ...profile, dob: "1980-02-01", nino: "not-a-number" } });
  assert.deepEqual(email.missing, []);
  assert.ok(email.warnings.some((warning) => warning.field === "dob"));
  assert.ok(email.warnings.some((warning) => warning.field === "nino"));
  const utr = emailFor("hmrc-mccloud", { profile: { ...profile, nino: "1234567890" } });
  assert.equal(utr.warnings.some((warning) => warning.field === "nino"), false);
});

test("mailto helper flags a draft that is too long for some email apps", () => {
  const short = buildMailto({ to: "a@b.co", subject: "Hello", body: "There" });
  assert.equal(short.overLimit, false);
  const long = buildMailto({ to: "a@b.co", subject: "Hello", body: "x".repeat(2000) });
  assert.equal(long.overLimit, true);
});

test("the copy text includes the recipient and subject", () => {
  const email = emailFor("NHSP05");
  const text = fullTemplateText(email);
  assert.match(text, /^To: nhsbsa\.pensionsmember@nhsbsa\.nhs\.uk\nSubject: Document request NHSP05/);
  assert.match(text, /NHSP05 \(XLS\)/);
  assert.match(text, /DO NOT encrypt the attachment/);
});

test("HMRC proforma and draft email are built locally and carry the attachment", () => {
  const html = proformaHtml(profile, today);
  assert.match(html, /Dr Jane Smith/);
  assert.match(html, /QQ123456C/);
  assert.match(html, /jane\.smith@nhs\.net/);
  assert.match(html, /27\/11\/2026/);
  assert.match(html, /\u2612/);
  assert.match(html, /\u2610/);
  assert.match(html, /N\/A/);
  const hostile = proformaHtml({ ...profile, name: `<script>alert("x")</script>` }, today);
  assert.equal(hostile.includes("<script>"), false);

  const email = emailFor("hmrc-mccloud");
  const eml = buildEml({
    to: email.to,
    subject: email.subject,
    body: email.body,
    attachment: { filename: "HMRC PSPR proforma.doc", type: "application/msword", content: html },
    boundary: "boundary-test",
  });
  assert.match(eml, /To: psprinforequests@hmrc\.gov\.uk/);
  assert.match(eml, /Subject: PSPR submission request - Dr Jane Smith/);
  assert.match(eml, /Content-Disposition: attachment; filename="HMRC PSPR proforma\.doc"/);
  assert.ok(eml.includes(utf8ToBase64(html).slice(0, 40)));
});

test("profile, scheme and clearing stay in the provided storage", () => {
  const store = memory();
  saveProfile(store, profile);
  assert.equal(loadProfile(store).name, "Dr Jane Smith");
  saveNation(store, "sc");
  assert.equal(loadNation(store), "sc");
  saveNation(store, "ew");
  assert.equal(loadNation(store), "ew");
  assert.equal(store.getItem("mft.docRequest.nation.v1"), null);
  clearProfile(store);
  assert.equal(loadProfile(store).name, "");
  assert.equal(store.getItem("mft.docRequest.profile.v1"), null);
});

test("the page does not call the network or embed a tracker", () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const files = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      if (name === "node_modules" || name === "test" || name === ".git") continue;
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(js|html|css)$/.test(name)) files.push(full);
    }
  };
  walk(root);
  const banned = /fetch\s*\(|XMLHttpRequest|sendBeacon|gtag\s*\(|google-analytics|fonts\.googleapis|cdn\./;
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    assert.equal(banned.test(text), false, path.relative(root, file));
  }
  const html = readFileSync(path.join(root, "index.html"), "utf8");
  assert.equal(/<script[^>]+src="https?:/.test(html), false);
});
