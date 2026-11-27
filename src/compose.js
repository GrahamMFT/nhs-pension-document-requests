import { defaultEstimateDate, formatLong, parseDob, statutoryDeadline } from "./dates.js";
import { buildMailto } from "./mailto.js";
import { schemeById } from "./templates.js";

const CORE_FIELDS = ["name", "dob", "address"];

const PLACEHOLDERS = {
  name: "[full name]",
  dob: "[date of birth]",
  address: "[address and postcode]",
  nino: "[NI number or UTR]",
  replyEmail: "[email address]",
};

const NINO = /^[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]$/i;
const UTR = /^\d{10}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function oneLine(value) {
  return String(value ?? "").replace(/\s*\n\s*/g, ", ").replace(/[ \t]+/g, " ").trim();
}

export function singleLine(value) {
  return String(value ?? "").replace(/[\r\n]+/g, " ").trim();
}

function filled(profile, key) {
  return singleLine(profile?.[key] ?? "");
}

function recipientFor(template, nation) {
  if (template.hmrc) return { ...template.hmrc, id: "hmrc" };
  return template.schemeChoice ? schemeById(nation) : schemeById("ew");
}

function selectedYears(template, options) {
  const wanted = options.years ?? template.years.default;
  const allowed = new Set(template.years.choices);
  return wanted.filter((year) => allowed.has(year));
}

function fill(body, tokens) {
  return body.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (!Object.prototype.hasOwnProperty.call(tokens, key)) {
      throw new Error(`Template uses unknown token {{${key}}}`);
    }
    return tokens[key];
  });
}

export function profileWarnings(profile) {
  const warnings = [];
  const dob = filled(profile, "dob");
  if (dob && !parseDob(dob)) {
    warnings.push({ field: "dob", message: "Enter the date of birth as DD/MM/YYYY." });
  }
  const nino = filled(profile, "nino").replace(/\s+/g, "").toUpperCase();
  if (nino && !NINO.test(nino) && !UTR.test(nino)) {
    warnings.push({
      field: "nino",
      message: "Check this is a National Insurance number (for example QQ123456C) or a 10-digit UTR. You can still use it if it is right.",
    });
  }
  const replyEmail = filled(profile, "replyEmail");
  if (replyEmail && !EMAIL.test(replyEmail)) {
    warnings.push({ field: "replyEmail", message: "Check the email address. You can still use it if it is right." });
  }
  return warnings;
}

export function composeEmail(template, profile = {}, options = {}) {
  const today = options.today ?? new Date();
  const scheme = recipientFor(template, options.nation);
  const missing = [];
  for (const key of CORE_FIELDS) {
    if (!filled(profile, key)) missing.push(key);
  }
  for (const key of template.requires ?? []) {
    if (!filled(profile, key)) missing.push(key);
  }

  let requestLines = "";
  if (template.years) {
    const years = selectedYears(template, options);
    if (!years.length) missing.push("years");
    requestLines = years.map((year) => template.years.format(year)).join("\n");
  }

  let estimateDate = "";
  if (template.estimate) {
    estimateDate = singleLine(options.estimateDate ?? defaultEstimateDate(today));
    if (!estimateDate) missing.push("estimateDate");
  }

  const name = filled(profile, "name");
  const membership = filled(profile, "membership");
  const membershipLine = `${scheme.idLabel}: ${membership || "[membership number]"}`;
  const previous = oneLine(profile.previousAddresses) || "None";

  const tokens = {
    greeting: scheme.greeting,
    name: name || PLACEHOLDERS.name,
    dob: filled(profile, "dob") || PLACEHOLDERS.dob,
    address: oneLine(profile.address) || PLACEHOLDERS.address,
    membershipLine,
    requestLines,
    estimateDate: estimateDate || "[estimate date]",
    reqDate: formatLong(today),
    deadline: formatLong(statutoryDeadline(today)),
    nino: filled(profile, "nino") || PLACEHOLDERS.nino,
    previous,
    replyEmail: filled(profile, "replyEmail") || PLACEHOLDERS.replyEmail,
  };

  const subject = fill(template.subject, tokens);
  const body = fill(template.body, tokens).replace(/\n{3,}/g, "\n\n").replace(/^\n+/, "").replace(/\s+$/, "") + "\n";
  const mailto = buildMailto({ to: scheme.to, subject, body });

  return {
    id: template.id,
    to: scheme.to,
    subject,
    body,
    missing,
    warnings: profileWarnings(profile),
    scheme,
    mailto,
  };
}

export function fullTemplateText(email) {
  return `To: ${email.to}\nSubject: ${email.subject}\n\n${email.body}`;
}
