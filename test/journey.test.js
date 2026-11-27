import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { ANALYTICS_SCHEMA, PERSONAL_PROPERTIES, record, sanitize } from "../src/analytics.js";
import {
  advice,
  brand,
  examples,
  guides,
  hubSections,
  objectives,
  officialResources,
  publicOffer,
  recordCheck,
  safeExternalHref,
  services,
} from "../src/content.js";
import {
  checklistLines,
  checklistText,
  completionOfferIds,
  membershipPrompt,
  missingProfileFields,
  otherGroups,
  profileNeeds,
  startingIds,
} from "../src/journey.js";
import { purgeStoredPersonalData } from "../src/profile.js";
import { getTemplate, templates } from "../src/templates.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("every template has a guide and a configurable offer", () => {
  for (const template of templates) {
    const guide = guides[template.id];
    assert.ok(guide, template.id);
    for (const key of ["plain", "what", "why", "contains", "elsewhere", "next", "serviceId"]) {
      assert.match(guide[key], /\S/, `${template.id} ${key}`);
    }
    assert.ok(publicOffer(guide.serviceId), template.id);
  }
});

test("goals recommend real documents and do not force every document", () => {
  assert.equal(objectives.length, 6);
  assert.equal(objectives[0].title, "Understand my retirement benefits");
  assert.deepEqual(startingIds(objectives[0]), ["NHSP01"]);
  assert.ok(objectives[0].documents.some((item) => item.id === "NHSP02" && item.stance === "optional"));
  assert.deepEqual(startingIds(objectives.find((item) => item.id === "tax")), ["NHSP03", "NHSP06"]);
  assert.deepEqual(startingIds(objectives.find((item) => item.id === "catalogue")), []);
  for (const objective of objectives) {
    for (const item of objective.documents) assert.ok(getTemplate(item.id), item.id);
  }
  const extra = otherGroups(objectives[0]).flatMap((group) => group.ids);
  assert.ok(extra.includes("NHSP05"));
  assert.equal(extra.includes("NHSP01"), false);
});

test("personal fields follow the documents that were chosen", () => {
  assert.deepEqual(profileNeeds(["NHSP01"]).need, ["name", "dob", "address", "membership"]);
  assert.equal(profileNeeds(["NHSP01"]).hmrc, false);
  assert.deepEqual(profileNeeds(["hmrc-mccloud"]).need, ["name", "dob", "address", "nino", "replyEmail"]);
  assert.equal(profileNeeds(["hmrc-mccloud"]).scheme, false);
  const both = profileNeeds(["NHSP01", "hmrc-mccloud"]);
  assert.ok(both.need.includes("membership"));
  assert.ok(both.need.includes("nino"));
  assert.deepEqual(missingProfileFields({ name: "A", dob: "01/02/1980", address: "Leeds" }, ["NHSP01"]), ["membership"]);
  assert.equal(membershipPrompt(["NHSP03"], "sc").fieldLabel, "Membership number");
  assert.match(membershipPrompt(["NHSP01", "NHSP03"], "sc").fieldLabel, /SD or membership/);
});

test("the checklist names documents and recipients, not the member", () => {
  const sent = new Set(["NHSP01"]);
  const lines = checklistLines(["NHSP01", "NHSP03"], sent, "sc");
  assert.equal(lines[0].status, "Marked as sent");
  assert.equal(lines[1].to, "SPPA-AAEnquiries@gov.scot");
  const text = checklistText(lines);
  assert.match(text, /NHSP01/);
  assert.match(text, /Not marked as sent/);
  assert.equal(text.includes("Jane"), false);
  assert.equal(text.includes("QQ123456C"), false);
});

test("completion offers follow the goal and stay on published services where verified", () => {
  assert.deepEqual(completionOfferIds("mccloud", ["NHSP04"]), ["rpss"]);
  assert.deepEqual(completionOfferIds("tax", ["NHSP06"]), ["scheme-pays"]);
  assert.deepEqual(completionOfferIds("retirement", ["NHSP01"]), ["pension-report", "advice"]);
  const report = publicOffer("pension-report");
  assert.equal(report.price, "£650 plus VAT");
  assert.equal(report.href, "https://www.medifintech.co.uk/services/");
  const rpss = publicOffer("rpss");
  assert.equal(rpss.price, "£1,000 including VAT");
  assert.match(rpss.href, /mccloud-remedy/);
  const check = publicOffer("record-check");
  assert.equal(check.price, "");
  assert.equal(Object.hasOwn(check, "approvalNote"), false);
  assert.equal(publicOffer("advice").href, "https://www.quilter.com/financial-advice/advice-services/companies-we-work-with/medifintech/i-want-to-speak-to-a-financial-adviser/");
  assert.equal(publicOffer("advice").cta, "Speak to a financial adviser");
  assert.equal(advice.href.includes("medifintech.co.uk/contact"), false);
});

test("offers cannot smuggle personal details into a link", () => {
  assert.equal(safeExternalHref("javascript:alert(1)"), "");
  assert.equal(safeExternalHref("https://www.medifintech.co.uk/contact/?name=Jane"), "");
  assert.match(safeExternalHref(services.rpss.href), /^https:\/\/www\.medifintech\.co\.uk\//);
  for (const offer of [recordCheck, advice, ...Object.values(services)]) {
    if (offer.href) assert.match(safeExternalHref(offer.href), /^https:\/\//, offer.id);
  }
  for (const item of brand.nav) assert.match(item.href, /^https:\/\/www\.medifintech\.co\.uk\//);
});

test("analytics keeps document ids and drops personal details", () => {
  const clean = sanitize({
    objective: "tax",
    templates: ["NHSP03"],
    name: "Dr Jane Smith",
    nino: "QQ123456C",
    address: "1 High Street",
    sent: true,
  });
  assert.equal(clean.name, undefined);
  assert.equal(clean.nino, undefined);
  assert.deepEqual(clean.templates, ["NHSP03"]);
  assert.equal(clean.sent, true);
  const event = record("referral_clicked", { referral: "record-check", placement: "landing", email: "jane@nhs.net" });
  assert.equal(event.email, undefined);
  assert.equal(event.referral, "record-check");
  assert.equal(ANALYTICS_SCHEMA.live, false);
  for (const key of PERSONAL_PROPERTIES) assert.equal(Object.hasOwn(event, key), false);
});

test("stored personal details from the first version are removed and not written back", () => {
  const memory = () => {
    const map = new Map();
    return {
      getItem: (key) => (map.has(key) ? map.get(key) : null),
      setItem: (key, value) => map.set(key, String(value)),
      removeItem: (key) => map.delete(key),
    };
  };
  const local = memory();
  const session = memory();
  local.setItem("mft.docRequest.profile.v1", '{"name":"Dr Jane Smith"}');
  local.setItem("mft.docRequest.nation.v1", "sc");
  session.setItem("mft.docRequest.queue.v1", '["NHSP01"]');
  purgeStoredPersonalData(local, session);
  assert.equal(local.getItem("mft.docRequest.profile.v1"), null);
  assert.equal(local.getItem("mft.docRequest.nation.v1"), null);
  assert.equal(session.getItem("mft.docRequest.queue.v1"), null);
  const app = readFileSync(path.join(root, "app.js"), "utf8");
  assert.equal(/setItem\(/.test(app), false);
  assert.match(app, /purgeStoredPersonalData\(localStorage, sessionStorage\)/);
  assert.equal(app.includes("approvalNote"), false);
});

test("the interface uses the logo palette rather than the website theme", () => {
  const css = readFileSync(path.join(root, "styles.css"), "utf8");
  assert.match(css, /#1f3965/i);
  assert.match(css, /#2e5495/i);
  assert.match(css, /#548732/i);
  assert.equal(/#023843|#baa94a|#0f7b3f/i.test(css), false);
  const html = readFileSync(path.join(root, "index.html"), "utf8");
  const app = readFileSync(path.join(root, "app.js"), "utf8");
  assert.match(html, /Your NHS Pension Document Hub/);
  assert.match(app, /Your NHS Pension Document Hub/);
  assert.match(app, /Find, request and understand your NHS pension documents\./);
  assert.match(html, /medifintech-logo\.png/);
  for (const item of brand.nav) assert.match(html, new RegExp(item.href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("the hub uses the six sections and only verified official links", () => {
  assert.deepEqual(hubSections.map((item) => item.title), [
    "Find my documents",
    "Request my documents",
    "Understand my documents",
    "Check my pension records",
    "Understand my pension benefits",
    "Plan my financial future",
  ]);
  assert.equal(hubSections[0].summary, "Access existing documents directly from NHS Pensions, ESR and HMRC.");
  assert.equal(hubSections[5].summary, "Request an introduction to a financial adviser.");
  assert.ok(officialResources.length >= 6);
  for (const resource of officialResources) {
    assert.match(safeExternalHref(resource.href), /^https:\/\//, resource.title);
    assert.equal(/name=|nino=|email=/i.test(resource.href), false);
  }
  for (const template of templates) {
    const example = examples[template.id];
    assert.match(example.note, /Synthetic example/);
    const text = JSON.stringify(example);
    assert.equal(/£\s?\d/.test(text), false, template.id);
  }
});
