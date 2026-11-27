export const PROFILE_KEY = "mft.docRequest.profile.v1";
export const NATION_KEY = "mft.docRequest.nation.v1";
export const OPENED_KEY = "mft.docRequest.opened.v1";
export const QUEUE_KEY = "mft.docRequest.queue.v1";

export const EMPTY_PROFILE = {
  name: "",
  dob: "",
  address: "",
  membership: "",
  nino: "",
  previousAddresses: "",
  replyEmail: "",
};

export const FORM_FIELDS = [
  {
    id: "name",
    label: "Full name",
    hint: "This is also the sign-off on each email.",
    placeholder: "e.g. Dr Jane Smith",
    auto: "name",
  },
  {
    id: "dob",
    label: "Date of birth",
    hint: "Day, month, then year.",
    placeholder: "DD/MM/YYYY",
    auto: "off",
  },
  {
    id: "membership",
    label: "SD number",
    hint: "Printed on ESR payslips and NHS Pensions letters.",
    placeholder: "e.g. 12345678",
    auto: "off",
    membership: true,
  },
  {
    id: "address",
    label: "Address and postcode",
    hint: "One line is enough. Line breaks are joined with commas in the email.",
    placeholder: "e.g. 1 High Street, Leeds LS1 1AA",
    auto: "street-address",
    wide: true,
    multiline: true,
  },
];

export const HMRC_FIELDS = [
  {
    id: "nino",
    label: "NI number or UTR",
    hint: "Either one is enough. HMRC will not release the extract without it.",
    placeholder: "e.g. QQ123456C or 1234567890",
    auto: "off",
  },
  {
    id: "replyEmail",
    label: "Email address for the reply",
    hint: "Send the request from this address. HMRC replies to it.",
    placeholder: "e.g. jane.smith@nhs.net",
    auto: "email",
  },
  {
    id: "previousAddresses",
    label: "Previous addresses, past 5 years",
    hint: "Leave this blank if you have not moved. The email will say None.",
    placeholder: "Or list them, with the dates you lived there",
    auto: "off",
    wide: true,
    multiline: true,
  },
];

function readJson(storage, key, fallback) {
  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function loadProfile(storage) {
  const parsed = readJson(storage, PROFILE_KEY, {});
  const profile = { ...EMPTY_PROFILE };
  if (!parsed || typeof parsed !== "object") return profile;
  for (const key of Object.keys(EMPTY_PROFILE)) {
    if (typeof parsed[key] === "string") profile[key] = parsed[key];
  }
  return profile;
}

export function saveProfile(storage, profile) {
  const clean = { ...EMPTY_PROFILE };
  for (const key of Object.keys(EMPTY_PROFILE)) clean[key] = String(profile?.[key] ?? "");
  const any = Object.values(clean).some((value) => value.trim());
  if (any) storage.setItem(PROFILE_KEY, JSON.stringify(clean));
  else storage.removeItem(PROFILE_KEY);
  return clean;
}

export function clearProfile(storage) {
  storage.removeItem(PROFILE_KEY);
  return { ...EMPTY_PROFILE };
}

export function loadNation(storage) {
  const value = storage.getItem(NATION_KEY);
  return value === "sc" || value === "ni" ? value : "ew";
}

export function saveNation(storage, nation) {
  if (nation === "sc" || nation === "ni") storage.setItem(NATION_KEY, nation);
  else storage.removeItem(NATION_KEY);
}

export function loadOpened(storage) {
  const parsed = readJson(storage, OPENED_KEY, []);
  return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
}

export function markOpened(storage, id) {
  const ids = new Set(loadOpened(storage));
  ids.add(id);
  const all = [...ids];
  storage.setItem(OPENED_KEY, JSON.stringify(all));
  return all;
}

export function loadQueue(storage) {
  const parsed = readJson(storage, QUEUE_KEY, []);
  return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
}

export function saveQueue(storage, ids) {
  const clean = [...new Set(ids.filter((id) => typeof id === "string"))];
  if (clean.length) storage.setItem(QUEUE_KEY, JSON.stringify(clean));
  else storage.removeItem(QUEUE_KEY);
  return clean;
}
