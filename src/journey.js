import { catalogueGroups, objectiveById } from "./content.js";
import { getTemplate, schemeById, templates } from "./templates.js";

export function startingIds(objective) {
  if (!objective || objective.showAll) return [];
  return objective.documents.filter((item) => item.stance === "start").map((item) => item.id);
}

export function knownIds(ids) {
  return (ids ?? []).filter((id) => getTemplate(id));
}

export function profileNeeds(ids) {
  const chosen = knownIds(ids).map((id) => getTemplate(id));
  const need = ["name", "dob", "address"];
  if (chosen.some((template) => (template.requires ?? []).includes("membership"))) need.push("membership");
  const hmrc = chosen.some((template) => (template.requires ?? []).includes("nino") || (template.requires ?? []).includes("replyEmail"));
  if (hmrc) {
    for (const key of ["nino", "replyEmail"]) {
      if (!need.includes(key)) need.push(key);
    }
  }
  return {
    need,
    hmrc,
    scheme: chosen.some((template) => template.schemeChoice),
  };
}

export function missingProfileFields(profile, ids) {
  const { need } = profileNeeds(ids);
  return need.filter((key) => !String(profile?.[key] ?? "").trim());
}

export function membershipPrompt(ids, nation) {
  const chosen = knownIds(ids).map((id) => getTemplate(id));
  const schemeDocs = chosen.filter((template) => template.schemeChoice);
  const other = chosen.filter((template) => (template.requires ?? []).includes("membership") && !template.schemeChoice);
  if (schemeDocs.length && !other.length) {
    const scheme = schemeById(nation);
    return { fieldLabel: scheme.fieldLabel, fieldHint: scheme.fieldHint, placeholder: scheme.placeholder };
  }
  if (schemeDocs.length && other.length) {
    return {
      fieldLabel: "SD or membership number",
      fieldHint: "NHS Pensions calls this an SD number. SPPA and HSC Pension Service call it a membership number.",
      placeholder: "e.g. 12345678",
    };
  }
  const england = schemeById("ew");
  return { fieldLabel: england.fieldLabel, fieldHint: england.fieldHint, placeholder: england.placeholder };
}

export function otherGroups(objective) {
  const shown = new Set((objective?.documents ?? []).map((item) => item.id));
  if (!objective || objective.showAll) return [];
  return catalogueGroups
    .map((group) => ({ title: group.title, ids: group.ids.filter((id) => !shown.has(id)) }))
    .filter((group) => group.ids.length);
}

export function completionOfferIds(objectiveId, selected) {
  const objective = objectiveById(objectiveId);
  const listed = objective?.offers ?? [];
  if (objectiveId === "tax") {
    if ((selected ?? []).includes("NHSP03")) return ["annual-allowance"];
    if ((selected ?? []).includes("NHSP06")) return ["scheme-pays"];
  }
  return listed;
}

export function recipientFor(template, nation) {
  if (template.hmrc) return { to: template.hmrc.to, who: template.hmrc.who };
  const scheme = template.schemeChoice ? schemeById(nation) : schemeById("ew");
  return { to: scheme.to, who: scheme.who };
}

export function checklistLines(ids, sent, nation) {
  return knownIds(ids).map((id) => {
    const template = getTemplate(id);
    const recipient = recipientFor(template, nation);
    return {
      id,
      code: template.code,
      title: template.title,
      to: recipient.to,
      who: recipient.who,
      status: sent?.has?.(id) ? "Marked as sent" : "Not marked as sent",
    };
  });
}

export function checklistText(lines) {
  const body = lines.map((line) => `${line.code} ${line.title}\nTo: ${line.to} (${line.who})\n${line.status}`).join("\n\n");
  return `NHS pension document requests\n\n${body}\n\nOpening a draft is not the same as sending it. Mark a request as sent only after you press Send in your email app.\n`;
}

export const templateOrder = templates.map((template) => template.id);
