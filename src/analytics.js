/**
 * Optional measurement. Nothing is sent anywhere.
 *
 * A later, approved analytics script can set:
 *   window.mftAnalytics = (event) => { ... }
 * The event contains a name and the properties listed in ANALYTICS_SCHEMA.
 * Personal details are dropped even if a caller passes them.
 */

export const PERSONAL_PROPERTIES = [
  "name",
  "dob",
  "address",
  "membership",
  "nino",
  "previousAddresses",
  "previous",
  "replyEmail",
  "email",
  "phone",
  "body",
  "subject",
];

export const ANALYTICS_SCHEMA = {
  version: 1,
  live: false,
  events: {
    visit: [],
    objective_selected: ["objective"],
    documents_confirmed: ["objective", "templates"],
    details_continued: ["objective", "templates"],
    request_prepared: ["template", "method"],
    request_copied: ["template", "method"],
    request_marked_sent: ["template", "sent"],
    referral_clicked: ["referral", "placement", "template"],
    checklist_saved: ["objective"],
  },
};

const log = [];

function cleanString(value) {
  const text = String(value).trim();
  if (!text || text.length > 80) return "";
  if (!/^[A-Za-z0-9_.,:/-]+$/.test(text)) return "";
  return text;
}

export function sanitize(props) {
  const safe = {};
  if (!props || typeof props !== "object") return safe;
  for (const [key, value] of Object.entries(props)) {
    if (PERSONAL_PROPERTIES.includes(key)) continue;
    if (typeof value === "boolean") {
      safe[key] = value;
      continue;
    }
    if (Array.isArray(value)) {
      const items = value.map(cleanString).filter(Boolean);
      if (items.length) safe[key] = items;
      continue;
    }
    if (typeof value === "string" || typeof value === "number") {
      const text = cleanString(value);
      if (text) safe[key] = text;
    }
  }
  return safe;
}

export function record(name, props) {
  if (!Object.prototype.hasOwnProperty.call(ANALYTICS_SCHEMA.events, name)) return null;
  const event = { event: name, ...sanitize(props) };
  log.push(event);
  const sink = globalThis.window?.mftAnalytics;
  if (typeof sink === "function") {
    try {
      sink(event);
    } catch {
      /* a future analytics script must not break the page */
    }
  }
  return event;
}

export function recordedEvents() {
  return log.map((event) => ({ ...event }));
}
