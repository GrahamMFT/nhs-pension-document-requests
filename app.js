import { composeEmail, fullTemplateText, oneLine } from "./src/compose.js";
import { defaultEstimateDate } from "./src/dates.js";
import {
  buildEml,
  escapeHtml,
  proformaFilename,
  proformaHtml,
} from "./src/proforma.js";
import {
  FORM_FIELDS,
  HMRC_FIELDS,
  clearProfile,
  loadNation,
  loadOpened,
  loadProfile,
  loadQueue,
  markOpened,
  saveNation,
  saveProfile,
  saveQueue,
} from "./src/profile.js";
import { getTemplate, schemeById, templates } from "./src/templates.js";

const storage = localStorage;
const session = sessionStorage;

let profile = loadProfile(storage);
let nation = loadNation(storage);
let opened = new Set(loadOpened(storage));
let queue = loadQueue(session).filter((id) => getTemplate(id));
const optionState = new Map();
let attempted = false;

const FIELD_LABEL = {
  name: "full name",
  dob: "date of birth",
  address: "address and postcode",
  membership: "SD or membership number",
  nino: "NI number or UTR",
  replyEmail: "email address for the HMRC reply",
  years: "at least one tax year",
  estimateDate: "the date the estimate should run to",
};

function currentId() {
  const raw = location.hash.replace(/^#\/?/, "").split(/[?#]/)[0];
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function currentTemplate() {
  return getTemplate(currentId());
}

function optionsFor(template) {
  if (!optionState.has(template.id)) {
    optionState.set(template.id, {
      years: [...(template.years?.default ?? [])],
      estimateDate: defaultEstimateDate(new Date()),
    });
  }
  return optionState.get(template.id);
}

function activeScheme(template) {
  if (template?.hmrc) return template.hmrc;
  if (template?.schemeChoice) return schemeById(nation);
  return schemeById("ew");
}

function formScheme(template) {
  return template?.schemeChoice ? schemeById(nation) : schemeById("ew");
}

function emailFor(template) {
  const options = optionsFor(template);
  return composeEmail(template, profile, {
    nation,
    years: template.years ? options.years : undefined,
    estimateDate: template.estimate ? options.estimateDate : undefined,
    today: new Date(),
  });
}

function fieldControl(field) {
  const value = escapeHtml(profile[field.id] ?? "");
  const common = `id="field-${field.id}" data-field="${field.id}" autocomplete="${escapeHtml(field.auto)}" placeholder="${escapeHtml(field.placeholder)}" spellcheck="false"`;
  if (field.multiline) return `<textarea ${common} rows="2">${value}</textarea>`;
  return `<input ${common} type="text" value="${value}">`;
}

function fieldHtml(field) {
  return `<div class="field${field.wide ? " span-all" : ""}" data-field-wrap="${field.id}">
    <label id="label-${field.id}" for="field-${field.id}">${escapeHtml(field.label)}</label>
    <span class="hint" id="hint-${field.id}">${field.hint ? escapeHtml(field.hint) : ""}</span>
    ${fieldControl(field)}
    <span class="warn" id="warn-${field.id}" hidden></span>
  </div>`;
}

function renderDetails() {
  const hmrcOpen = HMRC_FIELDS.some((field) => String(profile[field.id] ?? "").trim()) ? " open" : "";
  document.getElementById("details").innerHTML = `
    <form id="details-form" autocomplete="on">
      <div class="details-head">
        <h2 id="details-title">Your details</h2>
        <p id="details-status" class="status" aria-live="polite"></p>
      </div>
      <p class="lead">Enter these once. Every template on this page is completed from them. They are saved only in this browser.</p>
      <div class="form-grid">
        ${FORM_FIELDS.map(fieldHtml).join("")}
      </div>
      <details id="hmrc-fields" class="hmrc-fields"${hmrcOpen}>
        <summary>Also needed for the HMRC McCloud extract</summary>
        <div class="form-grid">
          ${HMRC_FIELDS.map(fieldHtml).join("")}
        </div>
      </details>
      <div class="details-actions">
        <button type="button" class="btn secondary" id="clear-details">Clear my details</button>
      </div>
      <p class="privacy"><strong>Your privacy.</strong> What you type is saved only in this browser, on this device. It is not sent to MediFintech and it is not stored on a server. An email is created only when you choose Open, and it is sent only if you press Send in your own email app. On a shared computer, use Clear my details before you leave.</p>
    </form>`;
}

function bindDetails() {
  document.getElementById("details-form").addEventListener("submit", (event) => event.preventDefault());
  document.querySelectorAll("[data-field]").forEach((input) => {
    input.addEventListener("input", () => {
      profile[input.dataset.field] = input.value;
      profile = saveProfile(storage, profile);
      refreshDerived();
    });
  });
  document.getElementById("clear-details").addEventListener("click", () => {
    profile = clearProfile(storage);
    attempted = false;
    document.querySelectorAll("[data-field]").forEach((input) => {
      input.value = "";
    });
    refreshDerived();
    document.getElementById("field-name")?.focus();
  });
}

function catalogueCard(template) {
  const checked = queue.includes(template.id) ? " checked" : "";
  return `<article class="tcard">
    <label class="include"><input type="checkbox" data-queue="${escapeHtml(template.id)}"${checked}> Include</label>
    <a class="tcard-link" href="#/${escapeHtml(template.id)}">
      <span class="code">${escapeHtml(template.code)}</span>
      <h3>${escapeHtml(template.title)}</h3>
      <p>${escapeHtml(template.summary)}</p>
    </a>
    <p class="card-status" data-card-status="${escapeHtml(template.id)}"></p>
  </article>`;
}

function renderCatalogue() {
  document.getElementById("view").innerHTML = `
    <h1 id="view-title" tabindex="-1">Request your NHS pension documents</h1>
    <p class="intro">Choose a document. The recipient, subject and message are filled in from your details, then opened in your email app for you to check and send.</p>
    <div class="batch" id="batch-bar" hidden>
      <p id="batch-text"></p>
      <button type="button" class="btn" id="prepare-selected">Prepare selected</button>
    </div>
    <div class="grid">
      ${templates.map(catalogueCard).join("")}
    </div>`;
  document.querySelectorAll("[data-queue]").forEach((box) => {
    box.addEventListener("change", () => {
      const id = box.dataset.queue;
      if (box.checked) {
        if (!queue.includes(id)) queue.push(id);
      } else {
        queue = queue.filter((item) => item !== id);
      }
      queue = saveQueue(session, queue);
      updateBatchBar();
    });
  });
  document.getElementById("prepare-selected").addEventListener("click", () => {
    if (queue[0]) location.hash = `#/${queue[0]}`;
  });
  updateBatchBar();
}

function updateBatchBar() {
  const bar = document.getElementById("batch-bar");
  if (!bar) return;
  const count = queue.length;
  bar.hidden = count === 0;
  const text = document.getElementById("batch-text");
  if (text) {
    text.textContent = count === 1
      ? "1 request selected. Your details are reused for each one."
      : `${count} requests selected. Your details are reused for each one.`;
  }
}

function queueNav(template) {
  const index = queue.indexOf(template.id);
  if (index < 0 || queue.length < 2) return "";
  const prev = queue[index - 1];
  const next = queue[index + 1];
  return `<p class="queue-nav">Request ${index + 1} of ${queue.length}
    ${prev ? `<a href="#/${escapeHtml(prev)}">Previous</a>` : "<span></span>"}
    ${next ? `<a href="#/${escapeHtml(next)}">Next request</a>` : "<span>Last request</span>"}
  </p>`;
}

function optionsHtml(template) {
  const state = optionsFor(template);
  const parts = [];
  if (template.schemeChoice) {
    const buttons = ["ew", "sc", "ni"].map((id) => {
      const scheme = schemeById(id);
      const checked = id === nation ? " checked" : "";
      return `<label class="seg-btn"><input type="radio" name="scheme" value="${scheme.id}"${checked}> ${escapeHtml(scheme.label)}</label>`;
    }).join("");
    parts.push(`<fieldset class="scheme"><legend>Your pension scheme</legend><div class="seg">${buttons}</div><p class="scheme-to">The email goes to <strong id="scheme-to"></strong> (<span id="scheme-who"></span>).</p></fieldset>`);
  }
  if (template.years) {
    const type = template.years.mode === "single" ? "radio" : "checkbox";
    const choices = template.years.choices.map((year) => {
      const checked = state.years.includes(year) ? " checked" : "";
      return `<label class="choice"><input type="${type}" name="year" value="${escapeHtml(year)}"${checked}> ${escapeHtml(year)}</label>`;
    }).join("");
    parts.push(`<fieldset class="years" id="template-options"><legend>${escapeHtml(template.years.legend)}</legend><div class="choices">${choices}</div></fieldset>`);
  }
  if (template.estimate) {
    parts.push(`<div class="field estimate" id="template-options"><label for="estimate-date">Estimate benefits to</label><span class="hint">Defaults to the next 31 March. Change it if you need a different date.</span><input id="estimate-date" type="text" value="${escapeHtml(state.estimateDate)}"></div>`);
  }
  return parts.join("");
}

function linksHtml(template) {
  if (!template.links?.length) return "";
  const items = template.links.map((link) => `<li><a href="${escapeHtml(link.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a></li>`).join("");
  return `<h2>Official pages</h2><ul class="links">${items}</ul>`;
}

function renderComposer(template) {
  const proforma = template.proforma ? `
    <button type="button" class="btn secondary" id="download-proforma">Download proforma</button>
    <button type="button" class="btn secondary" id="download-eml">Download draft with proforma attached</button>` : "";
  document.getElementById("view").innerHTML = `
    <p class="crumb"><a href="#/">All templates</a></p>
    ${queueNav(template)}
    <h1 id="view-title" tabindex="-1"><span class="code">${escapeHtml(template.code)}</span> ${escapeHtml(template.title)}</h1>
    <p class="intro">${escapeHtml(template.detail)}</p>
    ${optionsHtml(template)}
    <section class="letter-card" aria-labelledby="letter-title">
      <h2 id="letter-title">Email</h2>
      <dl class="meta">
        <div><dt>To</dt><dd id="prev-to"></dd></div>
        <div><dt>Subject</dt><dd id="prev-subject"></dd></div>
      </dl>
      <pre class="letter" id="prev-body"></pre>
    </section>
    <div class="actions">
      <a class="btn" id="open-mail" href="#">Open in my email app</a>
      <button type="button" class="btn secondary" id="copy-body">Copy email</button>
      <button type="button" class="btn secondary" id="copy-full">Copy with recipient and subject</button>
      ${proforma}
    </div>
    <p class="mail-note" id="mail-note" aria-live="polite"></p>
    <p class="reassure">Check the draft, then send it yourself. MediFintech does not send this email and does not receive a copy.</p>
    ${template.proforma ? `<p class="reassure">HMRC reply only after they have the completed proforma. A normal email link cannot carry the attachment, so use “Download draft with proforma attached” and open that file, or attach the downloaded proforma yourself.</p>` : ""}
    <h2>Before you send</h2>
    <ul class="notes">${template.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>
    ${linksHtml(template)}`;

  document.querySelectorAll('input[name="scheme"]').forEach((input) => {
    input.addEventListener("change", () => {
      nation = input.value;
      saveNation(storage, nation);
      refreshDerived();
    });
  });
  document.querySelectorAll('#template-options input[name="year"]').forEach((input) => {
    input.addEventListener("change", () => {
      optionsFor(template).years = [...document.querySelectorAll('#template-options input[name="year"]:checked')].map((item) => item.value);
      refreshDerived();
    });
  });
  document.getElementById("estimate-date")?.addEventListener("input", (event) => {
    optionsFor(template).estimateDate = event.target.value;
    refreshDerived();
  });
  document.getElementById("open-mail").addEventListener("click", (event) => {
    const email = emailFor(template);
    if (email.missing.length) {
      event.preventDefault();
      attempted = true;
      refreshDerived();
      revealMissing(email.missing[0]);
      return;
    }
    opened.add(template.id);
    markOpened(storage, template.id);
  });
  document.getElementById("copy-body").addEventListener("click", () => {
    copyText(emailFor(template).body, document.getElementById("copy-body"), "Copy email");
  });
  document.getElementById("copy-full").addEventListener("click", () => {
    copyText(fullTemplateText(emailFor(template)), document.getElementById("copy-full"), "Copy with recipient and subject");
  });
  document.getElementById("download-proforma")?.addEventListener("click", () => downloadProforma(template));
  document.getElementById("download-eml")?.addEventListener("click", () => downloadEml(template));
}

function proformaProfile() {
  return {
    ...profile,
    name: profile.name.trim(),
    dob: profile.dob.trim(),
    nino: profile.nino.trim(),
    replyEmail: profile.replyEmail.trim(),
    address: oneLine(profile.address),
    previousAddresses: profile.previousAddresses.trim(),
  };
}

function downloadProforma() {
  const today = new Date();
  const html = `\uFEFF${proformaHtml(proformaProfile(), today)}`;
  downloadFile(proformaFilename(profile.name), html, "application/msword");
}

function downloadEml(template) {
  const email = emailFor(template);
  if (email.missing.length) {
    attempted = true;
    refreshDerived();
    revealMissing(email.missing[0]);
    return;
  }
  const today = new Date();
  const filename = proformaFilename(profile.name);
  const eml = buildEml({
    to: email.to,
    subject: email.subject,
    body: email.body,
    attachment: {
      filename,
      type: "application/msword",
      content: `\uFEFF${proformaHtml(proformaProfile(), today)}`,
    },
  });
  const draftName = filename.replace(/\.doc$/, ".eml");
  downloadFile(draftName, eml, "message/rfc822");
  opened.add(template.id);
  markOpened(storage, template.id);
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

function revealMissing(field) {
  if (field === "years" || field === "estimateDate") {
    document.getElementById("template-options")?.querySelector("input")?.focus();
    return;
  }
  if (["nino", "replyEmail", "previousAddresses"].includes(field)) {
    const extra = document.getElementById("hmrc-fields");
    if (extra) extra.open = true;
  }
  document.getElementById(`field-${field}`)?.focus();
}

function missingPhrase(template, email) {
  const labels = email.missing.map((id) => {
    if (id === "membership") return activeScheme(template).fieldLabel?.toLowerCase() || FIELD_LABEL.membership;
    return FIELD_LABEL[id] || id;
  });
  if (labels.length === 1) return `Add your ${labels[0]} before opening the email.`;
  return `Add your ${labels.slice(0, -1).join(", ")} and ${labels.at(-1)} before opening the email.`;
}

function refreshDerived() {
  const template = currentTemplate();
  const scheme = formScheme(template);
  const membershipLabel = document.getElementById("label-membership");
  const membershipHint = document.getElementById("hint-membership");
  const membershipInput = document.getElementById("field-membership");
  if (membershipLabel && scheme.fieldLabel) {
    membershipLabel.textContent = scheme.fieldLabel;
    if (membershipHint) membershipHint.textContent = scheme.fieldHint || "";
    if (membershipInput && document.activeElement !== membershipInput) {
      membershipInput.placeholder = scheme.placeholder || "";
    }
  }

  const status = document.getElementById("details-status");
  if (status) {
    const ready = ["name", "dob", "address", "membership"].every((key) => String(profile[key] ?? "").trim());
    const any = Object.values(profile).some((value) => String(value).trim());
    status.textContent = ready
      ? "Saved in this browser."
      : any
        ? "Saved in this browser. Some details are still empty."
        : "Nothing saved yet.";
    status.classList.toggle("ok", ready);
  }

  for (const warning of [
    { field: "dob" },
    { field: "nino" },
    { field: "replyEmail" },
  ]) {
    const slot = document.getElementById(`warn-${warning.field}`);
    if (!slot) continue;
    const match = (template ? emailFor(template).warnings : []).find((item) => item.field === warning.field)
      || warningsFromProfile().find((item) => item.field === warning.field);
    slot.hidden = !match;
    slot.textContent = match ? match.message : "";
  }

  document.querySelectorAll("[data-card-status]").forEach((slot) => {
    const cardTemplate = getTemplate(slot.dataset.cardStatus);
    if (!cardTemplate) return;
    const email = emailFor(cardTemplate);
    if (email.missing.length) {
      slot.textContent = "Needs a few details";
      slot.className = "card-status";
    } else if (opened.has(cardTemplate.id)) {
      slot.textContent = "Opened on this device";
      slot.className = "card-status ok";
    } else {
      slot.textContent = "Ready";
      slot.className = "card-status ok";
    }
  });

  const to = document.getElementById("prev-to");
  if (!template || !to) return;
  const email = emailFor(template);
  to.textContent = email.to;
  document.getElementById("prev-subject").textContent = email.subject;
  document.getElementById("prev-body").textContent = email.body;
  const open = document.getElementById("open-mail");
  open.href = email.missing.length ? "#open" : email.mailto.href;
  open.setAttribute("aria-disabled", email.missing.length ? "true" : "false");
  const schemeTo = document.getElementById("scheme-to");
  if (schemeTo) {
    schemeTo.textContent = email.to;
    document.getElementById("scheme-who").textContent = email.scheme.who;
  }
  const messages = [];
  if (attempted && email.missing.length) messages.push(missingPhrase(template, email));
  if (!email.missing.length && email.mailto.overLimit) {
    messages.push(template.proforma
      ? "This message is long. If your email app cuts the draft short, download the draft with the proforma attached, or choose Copy email and paste the full text in."
      : "This message is long. If your email app cuts the draft short, choose Copy email and paste the full text in.");
  }
  document.getElementById("mail-note").textContent = messages.join(" ");
  document.querySelectorAll("[data-field-wrap]").forEach((wrap) => {
    wrap.classList.toggle("is-missing", attempted && email.missing.includes(wrap.dataset.fieldWrap));
  });
  document.getElementById("template-options")?.classList.toggle(
    "is-missing",
    attempted && (email.missing.includes("years") || email.missing.includes("estimateDate")),
  );
}

function warningsFromProfile() {
  return emailFor(templates[0]).warnings;
}

function renderView() {
  const template = currentTemplate();
  if (currentId() && !template) {
    location.hash = "#/";
    return;
  }
  if (template?.id === "hmrc-mccloud") {
    const extra = document.getElementById("hmrc-fields");
    if (extra) extra.open = true;
  }
  if (template) renderComposer(template);
  else renderCatalogue();
  refreshDerived();
  const title = document.getElementById("view-title");
  if (title && document.activeElement !== title) title.focus({ preventScroll: true });
}

window.addEventListener("hashchange", () => {
  attempted = false;
  renderView();
  window.scrollTo(0, 0);
});

renderDetails();
bindDetails();
renderView();
