import { record } from "./src/analytics.js";
import { composeEmail, fullTemplateText, oneLine, profileWarnings } from "./src/compose.js";
import {
  advice,
  brand,
  catalogueGroups,
  guides,
  objectiveById,
  objectives,
  publicOffer,
  recordCheck,
  safeExternalHref,
} from "./src/content.js";
import { defaultEstimateDate } from "./src/dates.js";
import { icon } from "./src/icons.js";
import {
  checklistLines,
  checklistText,
  completionOfferIds,
  membershipPrompt,
  missingProfileFields,
  otherGroups,
  profileNeeds,
  recipientFor,
  startingIds,
} from "./src/journey.js";
import { buildEml, escapeHtml, proformaFilename, proformaHtml } from "./src/proforma.js";
import { EMPTY_PROFILE, FORM_FIELDS, HMRC_FIELDS, purgeStoredPersonalData } from "./src/profile.js";
import { getTemplate, schemeById, templates } from "./src/templates.js";

const view = document.getElementById("view");

const state = {
  objective: null,
  selected: [],
  profile: { ...EMPTY_PROFILE },
  nation: "ew",
  options: {},
  sent: new Set(),
  opened: new Set(),
  attempted: false,
};

const fieldCopy = {
  name: "full name",
  dob: "date of birth",
  address: "address and postcode",
  membership: "SD or membership number",
  nino: "NI number or UTR",
  replyEmail: "email address for the HMRC reply",
  years: "at least one tax year",
  estimateDate: "the date the estimate should run to",
};

function optionsFor(id) {
  if (!state.options[id]) {
    const template = getTemplate(id);
    state.options[id] = {
      years: [...(template?.years?.default ?? [])],
      estimateDate: defaultEstimateDate(new Date()),
    };
  }
  return state.options[id];
}

function emailFor(template) {
  const options = optionsFor(template.id);
  return composeEmail(template, state.profile, {
    nation: state.nation,
    years: template.years ? options.years : undefined,
    estimateDate: template.estimate ? options.estimateDate : undefined,
    today: new Date(),
  });
}

function parseRoute() {
  const raw = location.hash.replace(/^#\/?/, "");
  const [head, tail] = raw.split("/").map((part) => {
    try {
      return decodeURIComponent(part);
    } catch {
      return part;
    }
  });
  if (!head) return { name: "home" };
  if (head === "choose") return { name: "choose", objective: tail || "" };
  if (head === "details") return { name: "details" };
  if (head === "prepare") return { name: "prepare", focus: tail || "" };
  if (head === "done") return { name: "done" };
  if (getTemplate(head)) return { name: "template", id: head };
  return { name: "home" };
}

function resolve() {
  const route = parseRoute();
  if (route.name === "template") {
    if (!state.selected.includes(route.id)) state.selected.push(route.id);
    if (!state.objective) state.objective = "catalogue";
    location.replace(`#/prepare/${route.id}`);
    return null;
  }
  if (route.name === "choose") {
    const objective = objectiveById(route.objective);
    if (!objective) {
      location.replace("#/");
      return null;
    }
    if (state.objective !== objective.id) {
      state.objective = objective.id;
      state.selected = startingIds(objective);
      state.attempted = false;
      record("objective_selected", { objective: objective.id });
    }
    return route;
  }
  if (["details", "prepare", "done"].includes(route.name) && !state.selected.length) {
    location.replace(state.objective ? `#/choose/${state.objective}` : "#/");
    return null;
  }
  return route;
}

function stepper(current) {
  const choose = state.objective ? `#/choose/${state.objective}` : "#/";
  const steps = [
    ["choose", "Choose your documents", choose],
    ["details", "Enter your details", "#/details"],
    ["prepare", "Prepare your requests", "#/prepare"],
  ];
  const items = steps.map(([id, label, href], index) => {
    const currentAttr = id === current ? ' aria-current="step"' : "";
    const done = current === "done" ? " is-done" : "";
    return `<li class="${id === current ? "is-current" : ""}${done}"><a href="${href}"${currentAttr}><span>${index + 1}</span> ${label}</a></li>`;
  }).join("");
  return `<nav class="steps" aria-label="Progress"><ol>${items}</ol></nav>`;
}

function restartControl() {
  return `<button type="button" class="text-btn" data-action="restart">Clear my details and start again</button>`;
}

function offerHtml(id, placement, options = {}) {
  const offer = publicOffer(id);
  if (!offer) return "";
  const href = safeExternalHref(offer.href);
  const areas = offer.areas.length
    ? `<ul class="offer-list">${offer.areas.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : "";
  const price = offer.price
    ? `<p class="price"><span>${escapeHtml(offer.priceName)}</span> ${escapeHtml(offer.price)}</p>`
    : "";
  const cta = href && offer.cta
    ? `<a class="btn ${options.variant === "primary" ? "" : "secondary"}" href="${href}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer" data-referral="${escapeHtml(offer.id)}" data-placement="${escapeHtml(placement)}" data-template="${escapeHtml(options.template || "")}">${escapeHtml(offer.cta)}</a>`
    : "";
  const note = offer.memberNote ? `<p class="offer-note">${escapeHtml(offer.memberNote)}</p>` : "";
  const heading = options.level === 3 ? "h3" : "h2";
  return `<aside class="offer${options.variant === "quiet" ? " offer-quiet" : ""}">
    <p class="eyebrow">${escapeHtml(offer.eyebrow)}</p>
    <${heading}>${escapeHtml(offer.headline)}</${heading}>
    <p>${escapeHtml(offer.body)}</p>
    ${areas}
    ${price}
    ${cta}
    ${note}
  </aside>`;
}

function guideHtml(template) {
  const guide = guides[template.id];
  if (!guide) return "";
  const helpOffer = publicOffer(guide.serviceId);
  const also = guide.alsoId ? publicOffer(guide.alsoId) : null;
  const alsoHref = also ? safeExternalHref(also.href) : "";
  const alsoLine = also && alsoHref
    ? ` ${escapeHtml(also.name || also.priceName)} is the published review of an NHS pension record${also.price ? ` (${escapeHtml(also.price)})` : ""}. <a href="${alsoHref}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer" data-referral="${escapeHtml(also.id)}" data-placement="guide" data-template="${escapeHtml(template.id)}">${escapeHtml(also.cta || "Read more")}</a>.`
    : "";
  const help = helpOffer
    ? `${escapeHtml(helpOffer.body)}${alsoLine}`
    : "MediFintech provides technical NHS pension analysis. It does not provide financial advice.";
  const rows = [
    ["What is this document?", escapeHtml(guide.what)],
    ["Why might I need it?", escapeHtml(guide.why)],
    ["What information does it contain?", escapeHtml(guide.contains)],
    ["Where else might I already have access to it?", `${escapeHtml(guide.elsewhere)} ${linksHtml(template)}`],
    ["What should I do when I receive it?", escapeHtml(guide.next)],
    ["How can MediFintech help?", help],
  ];
  const body = rows.map(([title, html]) => `<h3>${escapeHtml(title)}</h3><p>${html}</p>`).join("");
  return `<details class="guide"><summary>About this document</summary>${body}</details>`;
}

function linksHtml(template) {
  if (!template.links?.length) return "";
  const items = template.links.map((link) => {
    const href = safeExternalHref(link.href);
    if (!href) return "";
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">${escapeHtml(link.label)}</a>`;
  }).filter(Boolean);
  if (!items.length) return "";
  return `<span class="official">Official pages: ${items.join(" · ")}</span>`;
}

function fieldHtml(field, prompt) {
  const value = escapeHtml(state.profile[field.id] ?? "");
  const label = field.id === "membership" && prompt ? prompt.fieldLabel : field.label;
  const hint = field.id === "membership" && prompt ? prompt.fieldHint : field.hint;
  const placeholder = field.id === "membership" && prompt ? prompt.placeholder : field.placeholder;
  const common = `id="field-${field.id}" data-field="${field.id}" autocomplete="${escapeHtml(field.auto)}" placeholder="${escapeHtml(placeholder)}" spellcheck="false"`;
  const control = field.multiline
    ? `<textarea ${common} rows="3">${value}</textarea>`
    : `<input ${common} type="text" value="${value}">`;
  return `<div class="field${field.wide ? " span-all" : ""}" data-field-wrap="${field.id}">
    <label id="label-${field.id}" for="field-${field.id}">${escapeHtml(label)}</label>
    <span class="hint" id="hint-${field.id}">${hint ? escapeHtml(hint) : ""}</span>
    ${control}
    <span class="warn" id="warn-${field.id}" hidden></span>
  </div>`;
}

function schemeControl(name) {
  const buttons = ["ew", "sc", "ni"].map((id) => {
    const scheme = schemeById(id);
    const checked = id === state.nation ? " checked" : "";
    return `<label class="seg"><input type="radio" name="${name}" value="${scheme.id}"${checked}><span>${escapeHtml(scheme.label)}</span></label>`;
  }).join("");
  return `<fieldset class="scheme"><legend>Pension scheme for the savings statement</legend><div class="seg-row">${buttons}</div><p class="hint">England and Wales writes to NHS Pensions. Scotland writes to SPPA. Northern Ireland writes to HSC Pension Service. Your other requests still go to NHS Pensions.</p></fieldset>`;
}

function homePage() {
  const cards = objectives.map((objective) => `<a class="goal" href="#/choose/${objective.id}">
      <span class="goal-icon">${icon(objective.icon)}</span>
      <span class="goal-title">${escapeHtml(objective.title)}</span>
      <span class="goal-text">${escapeHtml(objective.summary)}</span>
    </a>`).join("");
  return `<section class="hero">
      <p class="eyebrow">Free document requests</p>
      <h1>Your NHS pension. Made simpler.</h1>
      <p class="lede">Request the documents you need from NHS Pensions and HMRC using our free document request tool.</p>
      <ul class="promises">
        <li>Completely free to use.</li>
        <li>No registration required.</li>
        <li>Personal details are not submitted to MediFintech.</li>
        <li>Developed by NHS pension specialists.</li>
      </ul>
      <p class="privacy-line">What you type stays in this open page. It is not saved for your next visit, and it is not sent to MediFintech, Quilter or anyone else.</p>
    </section>
    <section class="panel" aria-labelledby="goal-title">
      <h2 id="goal-title">What would you like to do?</h2>
      <div class="goals">${cards}</div>
    </section>
    ${offerHtml(recordCheck.id, "landing", { variant: "primary" })}`;
}

function documentCard(id, meta) {
  const template = getTemplate(id);
  const guide = guides[id];
  const checked = state.selected.includes(id) ? " checked" : "";
  const stance = meta?.stance === "start"
    ? "Suggested starting point"
    : meta?.stance === "optional"
      ? "Only if you need it"
      : "Document";
  const reason = meta?.reason || template.summary;
  return `<article class="doc">
    <label class="doc-check">
      <input type="checkbox" data-doc="${escapeHtml(id)}"${checked}>
      <span>
        <span class="kicker">${escapeHtml(stance)} · ${escapeHtml(template.code)} ${escapeHtml(template.title)}</span>
        <span class="doc-title">${escapeHtml(guide?.plain || template.title)}</span>
        <span class="doc-reason">${escapeHtml(reason)}</span>
      </span>
    </label>
  </article>`;
}

function choosePage(objectiveId) {
  const objective = objectiveById(objectiveId);
  const recommended = objective.showAll ? [] : objective.documents;
  const groups = objective.showAll
    ? catalogueGroups
    : otherGroups(objective);
  const recommendedHtml = recommended.map((item) => documentCard(item.id, item)).join("");
  const extra = groups.map((group) => `<section class="doc-group"><h3>${escapeHtml(group.title)}</h3>${group.ids.map((id) => documentCard(id)).join("")}</section>`).join("");
  const count = state.selected.length;
  return `${stepper("choose")}
    <header class="page-head">
      <h1>${escapeHtml(objective.title)}</h1>
      <p class="lede">${escapeHtml(objective.summary)}</p>
      <p class="limitation">${escapeHtml(objective.limitation)}</p>
    </header>
    ${objective.showAll ? "" : `<div class="docs">${recommendedHtml}</div>`}
    ${extra ? `<details class="more-docs" ${objective.showAll ? "open" : ""}><summary>${objective.showAll ? "All documents" : "Add a document from another category"}</summary>${extra}</details>` : ""}
    <div class="bar">
      <p id="choose-count">${count === 1 ? "1 document selected." : `${count} documents selected.`}</p>
      <button type="button" class="btn" data-action="confirm-documents" ${count ? "" : "disabled"}>Continue</button>
    </div>
    <p class="inline-actions"><a href="#/">Choose a different goal</a> · ${restartControl()}</p>`;
}

function detailsPage() {
  const needs = profileNeeds(state.selected);
  const prompt = membershipPrompt(state.selected, state.nation);
  const main = FORM_FIELDS.filter((field) => needs.need.includes(field.id)).map((field) => fieldHtml(field, prompt)).join("");
  const extra = needs.hmrc ? HMRC_FIELDS.map((field) => fieldHtml(field, prompt)).join("") : "";
  const scheme = needs.scheme ? schemeControl("scheme") : "";
  const whyHmrc = needs.hmrc
    ? `<p class="limitation">HMRC will not release the McCloud extract without a National Insurance number or UTR, and they reply to the email address you give. Leave previous addresses blank if you have not moved.</p>`
    : "";
  return `${stepper("details")}
    <header class="page-head">
      <h1>Enter your details</h1>
      <p class="lede">These details are used only to complete the ${state.selected.length === 1 ? "request" : "requests"} you chose. Fields you do not need are not shown.</p>
    </header>
    <form id="details-form" class="details" autocomplete="on" novalidate>
      <div id="form-errors" class="form-errors" role="alert" hidden></div>
      <div class="form-grid">${main}</div>
      ${scheme}
      ${whyHmrc}
      ${extra ? `<div class="form-grid">${extra}</div>` : ""}
      <div class="bar">
        <a class="btn secondary" href="#/choose/${escapeHtml(state.objective)}">Back to documents</a>
        <button type="submit" class="btn">Continue</button>
      </div>
      <p class="privacy-line">Your details stay in this page while it is open. Refreshing or closing the page clears them. They are not saved in this browser and they are not submitted to MediFintech. An email, a downloaded file or text you copy can remain on your device or in your email service.</p>
      <p class="inline-actions">${restartControl()}</p>
    </form>`;
}

function optionFields(template) {
  const options = optionsFor(template.id);
  const parts = [];
  if (template.schemeChoice) parts.push(schemeControl("scheme"));
  if (template.years) {
    const type = template.years.mode === "single" ? "radio" : "checkbox";
    const choices = template.years.choices.map((year) => {
      const checked = options.years.includes(year) ? " checked" : "";
      return `<label class="choice"><input type="${type}" name="year-${escapeHtml(template.id)}" value="${escapeHtml(year)}"${checked}> ${escapeHtml(year)}</label>`;
    }).join("");
    parts.push(`<fieldset class="years" data-years="${escapeHtml(template.id)}"><legend>${escapeHtml(template.years.legend)}</legend><div class="choices">${choices}</div></fieldset>`);
  }
  if (template.estimate) {
    parts.push(`<div class="field estimate"><label for="estimate-${escapeHtml(template.id)}">Estimate benefits to</label><span class="hint">The next 31 March is filled in. Change it if you need another date.</span><input id="estimate-${escapeHtml(template.id)}" data-estimate="${escapeHtml(template.id)}" type="text" value="${escapeHtml(options.estimateDate)}"></div>`);
  }
  return parts.join("");
}

function requestCard(id) {
  const template = getTemplate(id);
  const guide = guides[id];
  const recipient = recipientFor(template, state.nation);
  const proforma = template.proforma ? `<div class="attach">
      <h3>The HMRC attachment</h3>
      <p>A normal email link cannot carry a file. Download the proforma and attach it yourself, or download a draft email that already has the proforma attached and open that file in your email app.</p>
      <div class="actions">
        <button type="button" class="btn secondary" data-action="download-proforma" data-template="${escapeHtml(id)}">Download proforma</button>
        <button type="button" class="btn secondary" data-action="download-eml" data-template="${escapeHtml(id)}">Download draft with proforma attached</button>
      </div>
    </div>` : "";
  const adviceNote = (id === "NHSP01" || id === "NHSP02") && (state.objective === "retirement" || state.objective === "adviser")
    ? offerHtml(advice.id, "prepare", { template: id, variant: "quiet", level: 3 })
    : "";
  return `<article class="request" id="card-${escapeHtml(id)}" data-card="${escapeHtml(id)}">
    <p class="kicker">${escapeHtml(template.code)} ${escapeHtml(template.title)}</p>
    <h2>${escapeHtml(guide?.plain || template.title)}</h2>
    <p class="recipient">To <strong data-to>${escapeHtml(recipient.to)}</strong></p>
    <p class="hint" data-who>${escapeHtml(recipient.who)}</p>
    <p class="sent-line"><span data-sent-label="${escapeHtml(id)}">Not marked as sent</span></p>
    <p class="opened-line" data-opened-label="${escapeHtml(id)}" hidden>A draft was opened. That does not mean the email has been sent.</p>
    ${optionFields(template)}
    <details class="preview">
      <summary>Preview the email</summary>
      <p class="subject-line">Subject <strong data-subject></strong></p>
      <pre class="letter" data-body></pre>
    </details>
    <div class="actions">
      <a class="btn" data-action="open-mail" data-template="${escapeHtml(id)}" href="#details-needed">Open in my email app</a>
      <button type="button" class="btn secondary" data-action="copy-full" data-template="${escapeHtml(id)}">Copy with recipient and subject</button>
      <button type="button" class="btn secondary" data-action="copy-body" data-template="${escapeHtml(id)}">Copy email text</button>
    </div>
    <p class="mail-note" data-mail-note></p>
    <p class="hint">If the button opens the wrong mailbox, or you use webmail, copy the recipient, subject and message. In Gmail, Outlook on the web or another site, start a new message and paste them in. Nothing is sent until you press Send.</p>
    ${proforma}
    <div class="actions">
      <button type="button" class="btn secondary" data-action="mark-sent" data-template="${escapeHtml(id)}" aria-pressed="false">I've sent this</button>
    </div>
    ${guideHtml(template)}
    ${offerHtml(guides[id]?.serviceId, "prepare", { template: id, level: 3 })}
    ${adviceNote}
  </article>`;
}

function preparePage(focus) {
  const sent = state.selected.filter((id) => state.sent.has(id)).length;
  const jumps = state.selected.map((id) => {
    const template = getTemplate(id);
    const guide = guides[id];
    return `<li><a href="#card-${escapeHtml(id)}">${escapeHtml(guide?.plain || template.title)}</a> <span data-sent-label="${escapeHtml(id)}">Not marked as sent</span></li>`;
  }).join("");
  return `${stepper("prepare")}
    <header class="page-head">
      <h1>Prepare your requests</h1>
      <p class="lede" id="sent-progress" aria-live="polite">${sent} of ${state.selected.length} marked as sent.</p>
      <p class="hint">Open each draft, check it, and send it yourself. Mark a request as sent only after you have pressed Send. MediFintech does not send these emails and does not receive a copy.</p>
    </header>
    <ol class="jump-list">${jumps}</ol>
    <p class="inline-actions"><a href="#/details">Amend your details</a> · <a href="#/choose/${escapeHtml(state.objective)}">Change documents</a> · ${restartControl()}</p>
    ${state.selected.map(requestCard).join("")}
    <div class="bar">
      <a class="btn" href="#/done">Continue to what happens next</a>
    </div>
    <span class="route-focus" data-focus="${escapeHtml(focus || "")}" hidden></span>`;
}

function donePage() {
  const lines = checklistLines(state.selected, state.sent, state.nation);
  const items = lines.map((line) => `<li><span class="kicker">${escapeHtml(line.code)}</span> <strong>${escapeHtml(line.title)}</strong><span class="hint">${escapeHtml(line.status)} · ${escapeHtml(line.to)}</span></li>`).join("");
  const outstanding = lines.filter((line) => line.status !== "Marked as sent");
  const offers = completionOfferIds(state.objective, state.selected).map((id, index) => offerHtml(id, "done", { variant: index === 0 ? "primary" : "quiet" })).join("");
  return `${stepper("done")}
    <header class="page-head">
      <h1>Your requests</h1>
      <p class="lede">${outstanding.length ? `${outstanding.length} still to mark as sent.` : "Every selected request is marked as sent."} Opening a draft is not the same as sending it.</p>
    </header>
    <section id="checklist" class="panel" aria-labelledby="check-title">
      <h2 id="check-title">Documents in this visit</h2>
      <ul class="check-list">${items}</ul>
      <div class="actions no-print">
        <button type="button" class="btn" data-action="print-checklist">Print checklist</button>
        <button type="button" class="btn secondary" data-action="download-checklist">Download checklist</button>
        <a class="btn secondary" href="#/choose/${escapeHtml(state.objective)}">Request further documents</a>
      </div>
    </section>
    <section class="panel" aria-labelledby="after-title">
      <h2 id="after-title">What happens when your documents arrive?</h2>
      <p>Receiving the documents is only the first step. A statement or extract shows what the scheme, or HMRC, currently holds. It does not check that the record is right, complete a tax calculation, or show how the pension fits the rest of your finances.</p>
      <p>You may want help understanding the information, checking its accuracy, or deciding what it means. That help is separate from this free tool, and you do not have to ask for it in order to send your requests.</p>
    </section>
    ${offers}
    <p class="inline-actions no-print"><a href="#/prepare">Back to your requests</a> · <a href="#/">Start from the goals</a> · ${restartControl()}</p>`;
}

function markup(route) {
  if (route.name === "home") return homePage();
  if (route.name === "choose") return choosePage(route.objective);
  if (route.name === "details") return detailsPage();
  if (route.name === "prepare") return preparePage(route.focus);
  if (route.name === "done") return donePage();
  return homePage();
}

function paintCard(id) {
  const card = document.querySelector(`[data-card="${id}"]`);
  const template = getTemplate(id);
  if (!card || !template) return;
  const email = emailFor(template);
  const to = card.querySelector("[data-to]");
  const who = card.querySelector("[data-who]");
  const subject = card.querySelector("[data-subject]");
  const body = card.querySelector("[data-body]");
  if (to) to.textContent = email.to;
  if (who) who.textContent = email.scheme?.who || recipientFor(template, state.nation).who;
  if (subject) subject.textContent = email.subject;
  if (body) body.textContent = email.body;
  const open = card.querySelector('[data-action="open-mail"]');
  if (open) {
    if (email.missing.length) {
      open.href = "#details-needed";
      open.setAttribute("aria-disabled", "true");
    } else {
      open.href = email.mailto.href;
      open.setAttribute("aria-disabled", "false");
    }
  }
  const note = card.querySelector("[data-mail-note]");
  if (note) {
    const messages = [];
    if (state.attempted && email.missing.length) messages.push(missingPhrase(email, "opening the email"));
    if (!email.missing.length && email.mailto.overLimit) {
      messages.push(template.proforma
        ? "This message is long. If your email app cuts it short, download the draft with the proforma attached, or copy the email text and paste it in."
        : "This message is long. If your email app cuts it short, copy the email text and paste the full message in.");
    }
    note.textContent = messages.join(" ");
  }
  card.querySelector("[data-years]")?.classList.toggle("is-missing", state.attempted && email.missing.includes("years"));
  card.querySelector(".estimate")?.classList.toggle("is-missing", state.attempted && email.missing.includes("estimateDate"));
}

function missingPhrase(email, action) {
  const labels = email.missing.map((id) => fieldCopy[id] || id);
  const list = labels.length === 1 ? labels[0] : `${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}`;
  return `Add your ${list} before ${action}.`;
}

function paintProgress() {
  const total = state.selected.length;
  const sent = state.selected.filter((id) => state.sent.has(id)).length;
  const progress = document.getElementById("sent-progress");
  if (progress) progress.textContent = `${sent} of ${total} marked as sent.`;
  for (const id of state.selected) {
    const label = state.sent.has(id) ? "Marked as sent" : "Not marked as sent";
    document.querySelectorAll(`[data-sent-label="${id}"]`).forEach((slot) => {
      slot.textContent = label;
    });
    const button = document.querySelector(`[data-action="mark-sent"][data-template="${id}"]`);
    if (button) {
      button.textContent = state.sent.has(id) ? "Mark as not sent" : "I've sent this";
      button.setAttribute("aria-pressed", state.sent.has(id) ? "true" : "false");
    }
    const opened = document.querySelector(`[data-opened-label="${id}"]`);
    if (opened) opened.hidden = !state.opened.has(id);
  }
}

function paintDetails() {
  const prompt = membershipPrompt(state.selected, state.nation);
  const label = document.getElementById("label-membership");
  if (label) label.textContent = prompt.fieldLabel;
  const hint = document.getElementById("hint-membership");
  if (hint) hint.textContent = prompt.fieldHint || "";
  const input = document.getElementById("field-membership");
  if (input && document.activeElement !== input) input.placeholder = prompt.placeholder || "";
  const warnings = profileWarnings(state.profile);
  for (const field of ["dob", "nino", "replyEmail"]) {
    const slot = document.getElementById(`warn-${field}`);
    if (!slot) continue;
    const match = warnings.find((item) => item.field === field);
    slot.hidden = !match;
    slot.textContent = match ? match.message : "";
  }
  const missing = state.attempted ? missingProfileFields(state.profile, state.selected) : [];
  document.querySelectorAll("[data-field-wrap]").forEach((wrap) => {
    wrap.classList.toggle("is-missing", missing.includes(wrap.dataset.fieldWrap));
  });
  const errors = document.getElementById("form-errors");
  if (errors) {
    if (missing.length) {
      errors.hidden = false;
      errors.textContent = missingPhrase({ missing }, "continuing");
    } else {
      errors.hidden = true;
      errors.textContent = "";
    }
  }
}

function refreshDynamic() {
  paintDetails();
  for (const id of state.selected) paintCard(id);
  paintProgress();
  const count = document.getElementById("choose-count");
  if (count) {
    const n = state.selected.length;
    count.textContent = n === 1 ? "1 document selected." : `${n} documents selected.`;
  }
  const confirm = document.querySelector('[data-action="confirm-documents"]');
  if (confirm) confirm.disabled = state.selected.length === 0;
}

function render() {
  const route = resolve();
  if (!route) return;
  view.innerHTML = markup(route);
  refreshDynamic();
  const heading = view.querySelector("h1");
  if (heading) {
    document.title = `${heading.textContent} · MediFintech`;
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  }
  const focus = view.querySelector(".route-focus")?.dataset.focus;
  if (focus) document.getElementById(`card-${focus}`)?.scrollIntoView({ block: "start" });
}

function toggleDocument(id, checked) {
  if (!getTemplate(id)) return;
  if (checked) {
    if (!state.selected.includes(id)) state.selected.push(id);
  } else {
    state.selected = state.selected.filter((item) => item !== id);
  }
  refreshDynamic();
}

function continueDetails() {
  const missing = missingProfileFields(state.profile, state.selected);
  if (missing.length) {
    state.attempted = true;
    refreshDynamic();
    document.getElementById(`field-${missing[0]}`)?.focus();
    return;
  }
  state.attempted = false;
  record("details_continued", { objective: state.objective || "", templates: state.selected });
  location.hash = "#/prepare";
}

function resetAll() {
  purgeStoredPersonalData(localStorage, sessionStorage);
  state.objective = null;
  state.selected = [];
  state.profile = { ...EMPTY_PROFILE };
  state.nation = "ew";
  state.options = {};
  state.sent = new Set();
  state.opened = new Set();
  state.attempted = false;
  if (!location.hash || location.hash === "#" || location.hash === "#/") render();
  else location.hash = "#/";
}

function revealMissing(template, email) {
  const field = email.missing[0];
  if (!field || field === "years" || field === "estimateDate") {
    document.querySelector(`[data-card="${template.id}"] [data-years] input, [data-card="${template.id}"] [data-estimate]`)?.focus();
    return;
  }
  location.hash = "#/details";
}

async function copyText(text, button, label) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
  button.textContent = "Copied";
  setTimeout(() => {
    button.textContent = label;
  }, 2000);
}

function proformaProfile() {
  return {
    ...state.profile,
    name: state.profile.name.trim(),
    dob: state.profile.dob.trim(),
    nino: state.profile.nino.trim(),
    replyEmail: state.profile.replyEmail.trim(),
    address: oneLine(state.profile.address),
    previousAddresses: state.profile.previousAddresses.trim(),
  };
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function downloadProforma() {
  const html = `\uFEFF${proformaHtml(proformaProfile(), new Date())}`;
  downloadFile(proformaFilename(state.profile.name), html, "application/msword");
  record("request_copied", { template: "hmrc-mccloud", method: "proforma" });
}

function downloadEml(template) {
  const email = emailFor(template);
  if (email.missing.length) {
    state.attempted = true;
    refreshDynamic();
    revealMissing(template, email);
    return;
  }
  const filename = proformaFilename(state.profile.name);
  const eml = buildEml({
    to: email.to,
    subject: email.subject,
    body: email.body,
    attachment: {
      filename,
      type: "application/msword",
      content: `\uFEFF${proformaHtml(proformaProfile(), new Date())}`,
    },
  });
  downloadFile(filename.replace(/\.doc$/, ".eml"), eml, "message/rfc822");
  state.opened.add(template.id);
  record("request_prepared", { template: template.id, method: "eml" });
  paintProgress();
}

function onClick(event) {
  const referral = event.target.closest("[data-referral]");
  if (referral && view.contains(referral)) {
    record("referral_clicked", {
      referral: referral.dataset.referral,
      placement: referral.dataset.placement || "",
      template: referral.dataset.template || "",
    });
  }
  const button = event.target.closest("[data-action]");
  if (!button || !view.contains(button)) return;
  const action = button.dataset.action;
  const template = button.dataset.template ? getTemplate(button.dataset.template) : null;
  if (action === "restart") {
    resetAll();
    return;
  }
  if (action === "confirm-documents") {
    if (!state.selected.length) return;
    record("documents_confirmed", { objective: state.objective || "", templates: [...state.selected] });
    location.hash = "#/details";
    return;
  }
  if (action === "open-mail" && template) {
    const email = emailFor(template);
    if (email.missing.length) {
      event.preventDefault();
      state.attempted = true;
      refreshDynamic();
      revealMissing(template, email);
      return;
    }
    state.opened.add(template.id);
    record("request_prepared", { template: template.id, method: "mailto" });
    paintProgress();
    return;
  }
  if (action === "copy-body" && template) {
    const email = emailFor(template);
    record("request_copied", { template: template.id, method: "body" });
    copyText(email.body, button, "Copy email text");
    return;
  }
  if (action === "copy-full" && template) {
    const email = emailFor(template);
    record("request_copied", { template: template.id, method: "full" });
    copyText(fullTemplateText(email), button, "Copy with recipient and subject");
    return;
  }
  if (action === "download-proforma") {
    downloadProforma();
    return;
  }
  if (action === "download-eml" && template) {
    downloadEml(template);
    return;
  }
  if (action === "mark-sent" && template) {
    if (state.sent.has(template.id)) state.sent.delete(template.id);
    else state.sent.add(template.id);
    record("request_marked_sent", { template: template.id, sent: state.sent.has(template.id) });
    paintProgress();
    return;
  }
  if (action === "print-checklist") {
    window.print();
    return;
  }
  if (action === "download-checklist") {
    const lines = checklistLines(state.selected, state.sent, state.nation);
    downloadFile("nhs-pension-document-requests.txt", checklistText(lines), "text/plain");
    record("checklist_saved", { objective: state.objective || "" });
  }
}

function onChange(event) {
  const doc = event.target.dataset.doc;
  if (doc) {
    toggleDocument(doc, event.target.checked);
    return;
  }
  if (event.target.name === "scheme") {
    state.nation = event.target.value;
    refreshDynamic();
    return;
  }
  const years = event.target.closest("[data-years]");
  if (years) {
    const id = years.dataset.years;
    const template = getTemplate(id);
    const checked = [...years.querySelectorAll("input:checked")].map((input) => input.value);
    optionsFor(id).years = template?.years?.mode === "single" ? checked.slice(0, 1) : checked;
    refreshDynamic();
  }
}

function onInput(event) {
  const field = event.target.dataset.field;
  if (field) {
    state.profile[field] = event.target.value;
    refreshDynamic();
    return;
  }
  const estimate = event.target.dataset.estimate;
  if (estimate) {
    optionsFor(estimate).estimateDate = event.target.value;
    refreshDynamic();
  }
}

view.addEventListener("click", onClick);
view.addEventListener("change", onChange);
view.addEventListener("input", onInput);
view.addEventListener("submit", (event) => {
  if (event.target.id !== "details-form") return;
  event.preventDefault();
  continueDetails();
});

window.addEventListener("hashchange", () => {
  state.attempted = false;
  render();
  window.scrollTo(0, 0);
});

purgeStoredPersonalData(localStorage, sessionStorage);
record("visit", {});
render();

document.querySelector(".site-nav")?.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!link) return;
  record("referral_clicked", { referral: "site-nav", placement: "header" });
});
