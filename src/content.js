/**
 * Commercial and journey content. Change this file to amend offers, bundles,
 * prices, destinations and marketing wording. Email wording stays in templates.js.
 *
 * `verified` means the fee, name and URL were on medifintech.co.uk on 27 November 2026.
 * `approvalNote` is internal. The page must not show it.
 * Leave `href` empty to hide a call to action without removing the explanation.
 */

export const brand = {
  name: "MediFintech",
  home: "https://www.medifintech.co.uk/",
  privacy: "https://www.medifintech.co.uk/privacy-policy/",
  terms: "https://www.medifintech.co.uk/terms-and-conditions/",
  company: "MediFintech Ltd",
  companyNumber: "11932223",
  nav: [
    { label: "Home", href: "https://www.medifintech.co.uk/" },
    { label: "Services", href: "https://www.medifintech.co.uk/services/" },
    { label: "McCloud remedy", href: "https://www.medifintech.co.uk/mccloud-remedy/" },
    { label: "FAQs", href: "https://www.medifintech.co.uk/faqs/" },
    { label: "Contact", href: "https://www.medifintech.co.uk/contact/" },
  ],
  quilter: {
    show: true,
    line: "MediFintech is part of Quilter plc.",
    href: "https://media.quilter.com/search/quilter-acquires-medifintech-to-expand-nhs-pension-expertise-and-adviser-support/",
    linkLabel: "Quilter’s announcement",
    approvalNote: "Do not add a Quilter logo until brand approval. The about page confirms MediFintech is part of Quilter plc.",
  },
};

const servicesPage = "https://www.medifintech.co.uk/services/";
const contactPage = "https://www.medifintech.co.uk/contact/";

export const services = {
  "pension-report": {
    id: "pension-report",
    enabled: true,
    verified: true,
    showPrice: true,
    name: "NHS Pension Support (Standard)",
    price: "£650 plus VAT",
    href: servicesPage,
    eyebrow: "NHS Pension Support",
    headline: "Want to know what the statement means for your retirement?",
    body: "NHS Pension Support reviews the record behind your statement and projects your benefits to a retirement date you choose. The published service covers annual allowance, scheme pays, lifetime allowance and the McCloud remedy, and can model changes such as your hours or salary sacrifice. You receive a written report and a call with an NHS pension specialist.",
    cta: "Read about NHS Pension Support",
    memberNote: "This is technical NHS pension analysis, not financial advice. The standard service includes up to five scenarios.",
    approvalNote: "",
  },
  "annual-allowance": {
    id: "annual-allowance",
    enabled: true,
    verified: true,
    showPrice: true,
    name: "NHS Pension Support (Standard)",
    price: "£650 plus VAT",
    href: servicesPage,
    eyebrow: "Annual allowance",
    headline: "A pension savings statement arrives after the tax year has ended.",
    body: "By the time the statement arrives, the year it describes is already over. NHS Pension Support includes an estimated annual allowance position for the current tax year, while there is still time to understand a charge. There is no separate annual allowance product on our public pages. This work is part of NHS Pension Support (Standard).",
    cta: "Read about NHS Pension Support",
    memberNote: "Published fee for NHS Pension Support (Standard). This is not a separate annual allowance charge, and it is not financial advice.",
    approvalNote: "Mapped to the verified standard service because no standalone annual allowance product is published.",
  },
  "scheme-pays": {
    id: "scheme-pays",
    enabled: true,
    verified: true,
    showPrice: true,
    name: "NHS Pension Support (Standard)",
    price: "£650 plus VAT",
    href: servicesPage,
    eyebrow: "Scheme pays",
    headline: "Scheme pays reduces the pension, not only the tax bill.",
    body: "The extract shows the loans on your record. NHS Pension Support looks at what those loans, and any new charge, do to the benefits you take. There is no separate scheme pays fee on our public pages. This work sits inside NHS Pension Support (Standard).",
    cta: "Read about NHS Pension Support",
    memberNote: "Published fee for NHS Pension Support (Standard). This is technical analysis, not financial advice.",
    approvalNote: "Mapped to the verified standard service because no standalone scheme pays product is published.",
  },
  rpss: {
    id: "rpss",
    enabled: true,
    verified: true,
    showPrice: true,
    name: "McCloud Remedy Support (RPSS)",
    price: "£1,000 including VAT",
    href: "https://www.medifintech.co.uk/mccloud-remedy/",
    eyebrow: "RPSS Support",
    headline: "Received your RPSS but unsure what to do next?",
    body: "Our NHS pension specialists can help you understand your revised pension tax position, identify potential errors and establish whether you may be due a tax refund. McCloud Remedy Support reviews your remediable pension savings statement for 2015/16 to 2022/23. The published service uses HMRC’s digital service for historic tax figures and explains the cost claim-back scheme.",
    cta: "Find out more about RPSS Support",
    memberNote: "MediFintech does not provide financial advice. Confirm the current fee and claim-back position on the service page before you engage us.",
    approvalNote: "",
  },
};

export const recordCheck = {
  id: "record-check",
  enabled: true,
  verified: false,
  showPrice: false,
  href: contactPage,
  eyebrow: "Pension records",
  headline: "Are your NHS pension records correct?",
  body: "Your NHS pension benefits depend on the accuracy of the information held by your pension scheme. Our NHS pension specialists can help identify potential issues with your pension records.",
  cta: "Request a free pension record check",
  memberNote: "This opens the MediFintech contact page. Nothing you type into this tool is sent with the link.",
  approvalNote: "No free pension record check page was found on medifintech.co.uk on 27 November 2026. The paid NHS Pension Support service does review records, from £650 plus VAT. Confirm who the free check is for, and replace href, before treating this as a live offer.",
};

export const advice = {
  id: "advice",
  enabled: true,
  verified: false,
  showPrice: false,
  href: contactPage,
  eyebrow: "Wider financial planning",
  headline: "Your NHS pension is only part of the picture.",
  body: "MediFintech helps you understand your NHS pension. A financial adviser can help you understand how it fits into your wider financial plans.",
  areas: [
    "Planning for retirement.",
    "Understanding your retirement income options.",
    "Bringing together your pensions, savings and investments.",
    "Establishing whether you can afford to retire.",
    "Planning for your family’s financial future.",
  ],
  cta: "Request an introduction to a financial adviser",
  memberNote: "MediFintech does not provide financial advice. This opens our contact page so you can ask for an introduction to a regulated adviser. Your pension details are not attached to the link.",
  approvalNote: "The public site says MediFintech can introduce members to regulated advisers and that MediFintech is part of Quilter plc. It does not publish a Quilter advice-referral URL. Replace href only after Quilter approval. Do not invent a referral arrangement.",
};

export const guides = {
  NHSP01: {
    plain: "Your pension statement",
    what: "A Total Reward Statement is the scheme’s summary of your reward package for one year. It includes your pension annual benefit statement.",
    why: "It is the usual place to see the pension you have built up before you think about retirement, tax, or a meeting with an adviser. Try the online statement service first. Use this email when you cannot download the year you need.",
    contains: "The current value of your 1995, 2008 and 2015 benefits, each at that section’s own retirement age, together with the wider reward information on the statement.",
    elsewhere: "England and Wales, Scotland and Northern Ireland each have an online statement service. A year can be sent only if you, or the scheme, have already opened it.",
    next: "Check that your name, date of birth, service and pay look plausible. The statement does not prove the underlying record is right, and it does not show what you would receive on every date you might choose.",
    serviceId: "pension-report",
  },
  NHSP02: {
    plain: "A fresh pension estimate",
    what: "A manual pensions estimate is a new calculation of your pension, produced when a statement is not available.",
    why: "Ask for one only if your Total Reward Statement or annual benefit statement is missing, or it does not contain pension figures. If you already have a statement, you usually do not need this as well.",
    contains: "Pension figures similar to a statement, estimated to the date you choose. That date starts as the next 31 March and you can change it.",
    elsewhere: "Look at the online statement service before asking the scheme to calculate one by hand. The scheme is expected to provide a benefit statement each year.",
    next: "Treat the figures as a picture of the pension on the record. They are not a full forecast of every future choice, and they do not replace a check of the service and pay underneath them.",
    serviceId: "pension-report",
  },
  NHSP03: {
    plain: "How much your pension grew",
    what: "A pension savings statement shows the growth in your pension over a tax year. The annual allowance rules look at that growth, not at the pension you are paid.",
    why: "The scheme produces one automatically when growth is above the standard annual allowance. Request one if it has not arrived, if your own allowance may be lower, or if you want the figures for particular years.",
    contains: "Pension input amounts for the tax years you select. You can choose more than one year. This is not a statement of the pension you will be paid.",
    elsewhere: "If you were over the standard allowance, a statement is normally issued in the October after the tax year. The email can go to NHS Pensions, SPPA or HSC Pension Service, depending on your scheme.",
    next: "Set it beside any scheme pays loans and, for the McCloud years, a remediable statement if you have one. The email quotes the statutory deadline so you do not have to.",
    serviceId: "annual-allowance",
  },
  NHSP04: {
    plain: "Your McCloud tax statement",
    what: "A remediable pension savings statement, often called an RPSS, sets out your annual allowance for the McCloud remedy period, together with 2022/23.",
    why: "Members in scope of the remedy use it to see whether the rollback changes a tax charge or a refund. If you are not in scope, the scheme cannot issue one.",
    contains: "Your annual allowance position for the remedy years and a pension savings statement for 2022/23. Later versions may not show the original and revised amounts side by side.",
    elsewhere: "The scheme produces one as standard in some cases, including where you were over the annual allowance in a remedy year or in 2022/23. This request covers the case where it has not arrived, or you need to ask for one.",
    next: "There is a time limit to tell HMRC about changes after the statement arrives. Reading it is the first step. It does not finish the tax calculation for you.",
    serviceId: "rpss",
  },
  NHSP05: {
    plain: "The service and pay on your record",
    what: "An 05 extract is a spreadsheet of the service and pay your pension scheme holds for you.",
    why: "Your pension is calculated from this record. Ask for it when you want the detail behind a statement, or you want to see whether the record itself looks right.",
    contains: "Pay and service history, added years, additional pension and ERRBO contracts. Current extracts do not include pension growth or scheme pays loans.",
    elsewhere: "Payslips in ESR show what your employer paid. They are not the same as the scheme’s service record.",
    next: "Look for missing years, unexpected breaks, or pay that does not match what you earned. The scheme sends the spreadsheet by encrypted email. The request asks them not to encrypt the file as well, so you can forward it if you want to.",
    serviceId: "record-check",
    alsoId: "pension-report",
  },
  NHSP06: {
    plain: "Scheme pays loans on your record",
    what: "A scheme pays extract lists the scheme pays loans currently held against your NHS pension.",
    why: "If the scheme paid an annual allowance charge for you, the loan and the interest on it reduce the benefits you take at retirement. This is the current list of those loans.",
    contains: "Accepted scheme pays loans across the years on the record now. The list can differ from the letter you were sent when a loan was first accepted.",
    elsewhere: "Keep the original election letters, but use this extract for the current balance.",
    next: "Check that loans you expect are there, and query any loan you do not recognise. The extract does not work out whether a new charge is due.",
    serviceId: "scheme-pays",
  },
  "hmrc-mccloud": {
    plain: "HMRC’s McCloud tax extract",
    what: "This is a spreadsheet from HMRC of the Self Assessment figures for each year from 2015/16 to 2022/23.",
    why: "The McCloud remedy can change an old tax charge or create a refund. HMRC’s spreadsheet is the information used to work that out. You do not need it unless you are taking that tax calculation further.",
    contains: "Taxable income, reliefs, annual allowance and scheme pays entries for those years. A year in which you did not complete Self Assessment comes back blank.",
    elsewhere: "Your own tax returns, and your HMRC online account, already hold your returns. This extract is the specific spreadsheet the remedy team uses.",
    next: "HMRC reply only after they have the completed proforma and your agreement to their email protocol. Send the request from the address where you want the spreadsheet delivered. A reply can take several weeks.",
    serviceId: "rpss",
  },
};

export const objectives = [
  {
    id: "retirement",
    title: "Understand my retirement benefits",
    summary: "Obtain pension statements and retirement estimates.",
    icon: "benefits",
    limitation: "A statement is enough for many members. A manual estimate is a second request, for when that statement is missing. You do not have to ask for both.",
    documents: [
      { id: "NHSP01", stance: "start", reason: "This is the usual place to see the pension you have built up in each section of the scheme." },
      { id: "NHSP02", stance: "optional", reason: "Ask for a fresh estimate only if you cannot get a statement, or the statement does not show your pension." },
    ],
    offers: ["pension-report", "advice"],
    recordCheck: false,
  },
  {
    id: "tax",
    title: "Understand my pension tax position",
    summary: "Obtain Pension Savings Statements and Scheme Pays records.",
    icon: "tax",
    limitation: "A pension savings statement is produced automatically if you are over the standard annual allowance. Ask if yours has not arrived, if your allowance may be reduced, or if you want particular years. The scheme pays extract is separate. You may already know you have no scheme pays loans.",
    documents: [
      { id: "NHSP03", stance: "start", reason: "This shows how much your pension grew in the tax years you choose." },
      { id: "NHSP06", stance: "start", reason: "This shows scheme pays loans currently on your record. Those loans reduce the pension you eventually take." },
    ],
    offers: ["annual-allowance"],
    recordCheck: false,
  },
  {
    id: "mccloud",
    title: "Understand my McCloud remedy position",
    summary: "Obtain remedial statements and HMRC records.",
    icon: "mccloud",
    limitation: "An RPSS is only for members in scope of the McCloud remedy. If that is not you, the scheme cannot issue one. The HMRC extract is a separate request to a different organisation. Many members start with the RPSS and contact HMRC only if they need the tax-return figures.",
    documents: [
      { id: "NHSP04", stance: "start", reason: "This is the scheme’s statement of your annual allowance for the remedy years." },
      { id: "hmrc-mccloud", stance: "optional", reason: "HMRC’s spreadsheet shows what your Self Assessment returns say for those years. Not every member needs it." },
    ],
    offers: ["rpss"],
    recordCheck: false,
  },
  {
    id: "records",
    title: "Check my pension records",
    summary: "Obtain detailed service and pay records.",
    icon: "records",
    limitation: "This extract does not show pension growth or scheme pays. Those are separate documents, and you only need them if tax or scheme pays is the question.",
    documents: [
      { id: "NHSP05", stance: "start", reason: "This is the spreadsheet of pay and service your pension is calculated from." },
    ],
    offers: ["record-check"],
    recordCheck: true,
  },
  {
    id: "adviser",
    title: "Prepare for a financial adviser meeting",
    summary: "Gather relevant pension documentation.",
    icon: "adviser",
    limitation: "Take what you already have. Untick anything your adviser has seen. A tax statement or a pay extract is not required for every meeting.",
    documents: [
      { id: "NHSP01", stance: "start", reason: "Gives you, and your adviser, the current value of your NHS pension." },
      { id: "NHSP03", stance: "optional", reason: "Useful if tax on pension growth is likely to come up." },
      { id: "NHSP05", stance: "optional", reason: "Lets someone check the pay and service behind the statement." },
      { id: "NHSP06", stance: "optional", reason: "Needed if scheme pays loans should be taken into account." },
    ],
    offers: ["advice", "pension-report"],
    recordCheck: false,
  },
  {
    id: "catalogue",
    title: "I know which documents I need",
    summary: "View all available document request templates.",
    icon: "catalogue",
    limitation: "Each request is optional. Prepare only the documents you actually need.",
    documents: [],
    showAll: true,
    offers: ["record-check"],
    recordCheck: true,
  },
];

export const catalogueGroups = [
  { title: "Retirement benefits", ids: ["NHSP01", "NHSP02"] },
  { title: "Pension tax", ids: ["NHSP03", "NHSP06"] },
  { title: "McCloud remedy", ids: ["NHSP04", "hmrc-mccloud"] },
  { title: "Pension records", ids: ["NHSP05"] },
];

export function objectiveById(id) {
  return objectives.find((item) => item.id === id) ?? null;
}

export function offerById(id) {
  if (id === "record-check") return recordCheck;
  if (id === "advice") return advice;
  return services[id] ?? null;
}

export function publicOffer(id) {
  const offer = offerById(id);
  if (!offer?.enabled) return null;
  return {
    id: offer.id,
    eyebrow: offer.eyebrow,
    headline: offer.headline,
    body: offer.body,
    areas: offer.areas ?? [],
    price: offer.showPrice ? offer.price : "",
    priceName: offer.showPrice ? offer.name : "",
    cta: offer.href ? offer.cta : "",
    href: offer.href || "",
    memberNote: offer.memberNote || "",
  };
}

export function safeExternalHref(href) {
  try {
    const url = new URL(href);
    if (url.protocol !== "https:") return "";
    if (url.username || url.password) return "";
    const blocked = ["name", "dob", "address", "membership", "nino", "email", "replyEmail"];
    for (const key of url.searchParams.keys()) {
      if (blocked.includes(key)) return "";
    }
    return url.href;
  } catch {
    return "";
  }
}

export function collectStrings(value, found = []) {
  if (typeof value === "string") found.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, found));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => collectStrings(item, found));
  return found;
}
