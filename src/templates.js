/**
 * NHS pension document request templates.
 *
 * To add a template, copy an object in `templates` and give it a new `id`.
 * To remove one, delete its object. Wording lives in `body`. These tokens are
 * replaced when the member prepares an email:
 *
 *   {{greeting}} {{name}} {{dob}} {{address}} {{membershipLine}}
 *   {{requestLines}} {{estimateDate}} {{reqDate}} {{deadline}}
 *   {{nino}} {{previous}}
 *
 * `requires` lists extra profile fields beyond name, date of birth and address.
 * Use "membership" for the SD / membership number. Set `schemeChoice` only when
 * England & Wales, Scotland and Northern Ireland have different mailboxes.
 * Nothing in this file is fetched from a server.
 */

export const TAX_YEARS = ["21/22", "22/23", "23/24", "24/25", "25/26", "26/27"];

export const SCHEMES = {
  ew: {
    id: "ew",
    label: "England & Wales",
    to: "nhsbsa.pensionsmember@nhsbsa.nhs.uk",
    greeting: "Dear NHS Pensions",
    who: "NHS Pensions",
    idLabel: "SD Number (this is on ESR payslips and documents from NHS pensions)",
    fieldLabel: "SD number",
    fieldHint: "Printed on ESR payslips and NHS Pensions letters.",
    placeholder: "e.g. 12345678",
  },
  sc: {
    id: "sc",
    label: "Scotland",
    to: "SPPA-AAEnquiries@gov.scot",
    greeting: "Dear SPPA",
    who: "Scottish Public Pensions Agency — annual allowance enquiries",
    idLabel: "Membership Number (this is on your SPPA pension documents)",
    fieldLabel: "Membership number",
    fieldHint: "On your SPPA pension statements.",
    placeholder: "e.g. on your SPPA statements",
  },
  ni: {
    id: "ni",
    label: "Northern Ireland",
    to: "AAQueries@hscni.net",
    greeting: "Dear HSC Pension Service",
    who: "HSC Pension Service — annual allowance queries",
    idLabel: "Membership Number (this is on your HSC Pension Service documents)",
    fieldLabel: "Membership number",
    fieldHint: "On your HSC Pension Service letters.",
    placeholder: "e.g. on your HSC Pension Service letters",
  },
};

const HMRC_TO = "psprinforequests@hmrc.gov.uk";
const PROTOCOL = "https://www.gov.uk/government/publications/corresponding-with-hmrc-by-email-ccfs72/corresponding-with-hmrc-by-email";

const memberLines = `Full Name: {{name}}
Date of Birth: {{dob}}
Address & postcode: {{address}}
{{membershipLine}}`;

export const templates = [
  {
    id: "NHSP01",
    code: "NHSP01",
    title: "Total Reward Statement",
    summary: "The value of your reward package, including your pension annual benefit statement and the current value of your 1995, 2008 and 2015 benefits.",
    detail: "This shows the value of your total reward package and includes your pension annual benefit statement. It shows the current value of your benefits in the 1995, 2008 and 2015 schemes, each at that scheme’s own retirement age.",
    notes: [
      "Try the official statement service first. Use this email if you cannot download the year you need.",
      "You can only be sent a Total Reward Statement for a year you, or NHS Pensions, have already opened. If nobody has viewed that year, it will not be available.",
    ],
    links: [
      { label: "England & Wales TRS", href: "https://www.totalrewardstatements.nhs.uk/MyStatement" },
      { label: "Scotland — SPPA Engage", href: "https://pensions.gov.scot/engage-pension-portal" },
      { label: "Northern Ireland — HSC Engage", href: "https://hscpensions.hscni.net/hsc-pension-scheme/engage/" },
    ],
    requires: ["membership"],
    schemeChoice: false,
    subject: "Document request NHSP01",
    years: {
      mode: "single",
      choices: ["22/23", "23/24", "24/25", "25/26"],
      default: ["24/25"],
      legend: "Statement year",
      format: (year) => `NHSP01 - (${year}; PDF)`,
    },
    body: `{{greeting}}

My details are as below. I am requesting a “total reward statement”

${memberLines}

Please provide the following documents in the formats requested below:
{{requestLines}}

Kind regards

{{name}}
`,
  },
  {
    id: "NHSP02",
    code: "NHSP02",
    title: "Manual Pensions Estimate",
    summary: "A fresh estimate of your pension, for when a Total Reward Statement or annual benefit statement is not available.",
    detail: "This shows similar information to a Total Reward Statement or annual benefit statement. Ask for it when that statement is missing or does not contain your pension figures.",
    notes: [
      "Ask for a manual estimate only when your Total Reward Statement or annual benefit statement is not available. Where it is available, it already contains the pension estimate.",
      "The NHS Pension Scheme has to provide a benefit statement every year. If you have not been given one in the previous 12 months, the information should be provided within two months. In practice a manual estimate often takes around 40 days.",
    ],
    links: [
      { label: "England & Wales TRS", href: "https://www.totalrewardstatements.nhs.uk/MyStatement" },
    ],
    requires: ["membership"],
    schemeChoice: false,
    estimate: true,
    subject: "Document request NHSP02",
    body: `{{greeting}}

My details are as below. I am requesting a “manual pensions estimate”. For the avoidance of doubt I am NOT requesting a TRS/ABS, but rather a new manual pensions estimate (NHSP02 - PDF). Please estimate my benefits to {{estimateDate}}.

${memberLines}

Please provide the following documents in the formats requested below:
NHSP02 (PDF)

Kind regards

{{name}}
`,
  },
  {
    id: "NHSP03",
    code: "NHSP03",
    title: "Pension Savings Statement",
    summary: "The growth in your pension over a tax year. Produced automatically above the annual allowance, or on demand if you are tapered or want to check your headroom.",
    detail: "Pension savings statements show the theoretical growth in your pension over each tax year. One is produced automatically when growth is above the standard annual allowance. You can also request one on demand, for example where your allowance is reduced.",
    notes: [
      "You can request the current year or a statement that has already been issued. Statements are routinely produced in the October after the tax year for members over the standard annual allowance (£60,000 in 2023/24 and 2024/25, £40,000 before that).",
      "An on-demand statement is worth requesting if you may be tapered or you want to see your remaining allowance. Regulation 14B of the Registered Pension Schemes (Provision of Information) Regulations 2006 (SI 2006/567) requires the statement within three months of the request, or by 6 October after the tax year if that is later. The deadline moves only while the scheme is still waiting for information from someone else, such as your employer.",
      "This email is addressed to NHS Pensions, SPPA or HSC Pension Service depending on the scheme you choose. The other document requests on this page go to NHS Pensions for England & Wales.",
    ],
    links: [],
    requires: ["membership"],
    schemeChoice: true,
    subject: "Document request NHSP03",
    years: {
      mode: "multiple",
      choices: TAX_YEARS,
      default: ["23/24", "24/25", "25/26"],
      legend: "Tax years to request",
      format: (year) => `NHSP03 (${year}; PDF)`,
    },
    body: `{{greeting}}

My details are as below. I am requesting a “pension savings statement” in the tax year(s) stated. Please note that if I do not exceed the general annual allowance, please regard this as a request for an “on demand” statement.

${memberLines}

Please provide the following documents in the formats requested below:
{{requestLines}}

This request is made under regulation 14B of The Registered Pension Schemes (Provision of Information) Regulations 2006 (SI 2006/567). The date of this request is {{reqDate}}. Under regulation 14B you must provide the statement(s) requested within three months of receiving this request, or by 6 October following the end of the relevant tax year if that is later — that is, by the statutory deadline of {{deadline}}. I understand this deadline is extended only where you have not yet received the information you need from a third party (for example my employer’s pensionable earnings information), in which case the statement is due within three months of your receiving it. If you are relying on that exception, please confirm this by return and tell me exactly what information is outstanding, from whom it was requested and on what date, so that I can chase it directly.

Kind regards

{{name}}
`,
  },
  {
    id: "NHSP04",
    code: "NHSP04",
    title: "Remedial Pensions Savings Statement",
    summary: "Your annual allowance position for the McCloud remedy period, including a pension savings statement for 2022/23.",
    detail: "A statement of your annual allowance position for the McCloud remedy period (2015/16 to 2021/22), together with a pension savings statement for 2022/23.",
    notes: [
      "An RPSS is for members in scope of the McCloud remedy: in the NHS or another public service pension scheme on or before 31 March 2012, with pensionable service between 1 April 2015 and 31 March 2022, and no break of five years or more. If that does not describe you, an RPSS cannot be issued.",
      "One is produced as standard if you were over the annual allowance in any remedy year or in 2022/23, or if you asked for an on-demand statement during the remedy. It can be emailed only after the calculation is finished.",
      "Later versions of the RPSS no longer show the original pension input amounts next to the revised ones, so a rise or fall in those amounts is harder to see.",
    ],
    links: [],
    requires: ["membership"],
    schemeChoice: false,
    subject: "Document request NHSP04",
    body: `{{greeting}}

My details are as below. I am requesting a “Remedial Pensions Savings Statement”.

${memberLines}

Please provide the following documents in the formats requested below:
NHSP04 (PDF)

Please note if you have not already produced my RPSS, please can you let me know by return the expected timescale and the reason for delay - for example are you waiting for data from my employer, or do you need to complete a manual calculation?

Furthermore, if you believe I am not eligible to receive an automatic RPSS, please take this as a formal ‘on demand’ request for an RPSS or, alternatively, ‘on demand’ requests for Pension Savings Statements covering the same period.

Kind regards

{{name}}
`,
  },
  {
    id: "NHSP05",
    code: "NHSP05",
    title: "05 ‘Service & Pay’ Extract",
    summary: "A spreadsheet of your pay and service history, including added years, additional pension and ERRBO. It does not show pension growth or scheme pays.",
    detail: "A spreadsheet of your pay and service, added years, additional pension and ERRBO contracts. Current extracts do not include pension growth or scheme pays loans. They are useful when you, or an adviser, need to check the record itself.",
    notes: [
      "Extracts produced from October 2014 onwards do not contain annual allowance growth or earlier scheme pays loans. Ask for those separately with the pension savings statement and the scheme pays extract.",
    ],
    links: [
      { label: "ESR payslips", href: "https://my.esr.nhs.uk/dashboard/web/esrweb" },
    ],
    requires: ["membership"],
    schemeChoice: false,
    subject: "Document request NHSP05",
    body: `{{greeting}}

My details are as below. I am requesting an “05 'Service & Pay' Extract”.

${memberLines}

Please provide the following documents in the formats requested below:
NHSP05 (XLS)

Please can you send this MICROSOFT EXCEL format document via encrypted ASKUS email so it is secure but DO NOT encrypt the attachment as well, so I am able to forward this to my advisors if needed

Kind regards

{{name}}
`,
  },
  {
    id: "NHSP06",
    code: "NHSP06",
    title: "Scheme Pays Extract",
    summary: "The scheme pays loans NHS Pensions currently has recorded against your benefits, across all years.",
    detail: "A multi-year extract of the scheme pays loans currently recorded as accepted. Use it to check which elections have been applied, and to reconcile the balances used in annual allowance planning. The loan, plus interest, reduces benefits at retirement.",
    notes: [
      "This is the current scheme record. It can differ from the election letters sent when a loan was first accepted, because loans can change afterwards.",
    ],
    links: [],
    requires: ["membership"],
    schemeChoice: false,
    subject: "Document request NHSP06",
    body: `{{greeting}}

My details are as below. I am requesting a “scheme pays multi year extract” documenting my currently accepted scheme pays loans.

For the avoidance of doubt, I am NOT requesting copies of letters confirming scheme pays elections - these may be out of date and not reflect any changes to loans made since the letter - I am requesting the official scheme document “scheme pays multi year extract” (document code NHSP06) documenting the current status of my accepted scheme pays loans, which may differ from the loans at the time of original acceptance.

${memberLines}

Please provide the following documents in the formats requested below:
NHSP06 (PDF)

Kind regards

{{name}}
`,
  },
  {
    id: "hmrc-mccloud",
    code: "HMRC",
    title: "McCloud Extract",
    summary: "HMRC’s spreadsheet of what your Self Assessment returns say for each McCloud remedy year, from 2015/16 to 2022/23.",
    detail: "A spreadsheet from HMRC of the Self Assessment figures for each year of the McCloud remedy period (2015/16 to 2022/23): taxable income, tax relief, annual allowance and scheme pays. HMRC sends it by email after you accept their email protocol. It is the information used to work through the remedy without copying eight tax returns by hand.",
    notes: [
      "Put your own name in the subject line. That is how HMRC file the request. Give either your National Insurance number or your Unique Taxpayer Reference, and list any addresses from the past five years (the email says None if you leave that box empty).",
      "HMRC will not reply until they have the completed proforma and your agreement to their email protocol. Download the proforma, or the draft email with the proforma already attached, and send it from the address where you want the spreadsheet delivered. Replies can take several weeks. Years where you did not complete Self Assessment come back blank.",
    ],
    links: [
      { label: "HMRC email protocol (CC/FS72)", href: PROTOCOL },
    ],
    requires: ["nino", "replyEmail"],
    schemeChoice: false,
    proforma: true,
    subject: "PSPR submission request - {{name}}",
    hmrc: {
      to: HMRC_TO,
      greeting: "Dear HMRC Public Service Pensions Remedy team",
      who: "HMRC Public Service Pensions Remedy team",
    },
    body: `{{greeting}}

I require personal information that falls under the UK General Data Protection Regulation and Data Protection Act 2018. I need the relevant information held on my personal Self Assessment tax returns to determine my tax position in relation to the public service pensions remedy.

Full Name: {{name}}
Date of Birth: {{dob}}
National Insurance number (NINO) or Unique Tax Reference (UTR): {{nino}}
Current address & postcode: {{address}}
Previous addresses for the past 5 years (if applicable): {{previous}}

Tax years and required information: 2015/16; 2016/17; 2017/18; 2018/19; 2019/20; 2020/21; 2021/22; 2022/23

Please provide the latest version of your remedy extract (V2.1 or later) in XLS format containing: AA charge for 14/15; Scottish taxpayer; total taxable income (plus other income); total tax relief (not including gift aid, relief at source or personal allowance); relief at source contributions; total tax relief claimed from HMRC (through Self Assessment) on pension contributions; gift aid; pension savings in overseas schemes; personal allowance; police organisation / trade union; blind person's allowance; amount saved in excess of the annual allowance; total annual allowance (as per SA302); annual allowance paid by scheme; PSTR.

PSTR: NHS Pension Scheme 00820574RJ / 00328820RJ or related NHS pension schemes.

Please send the requested data to this email address. I attach my completed HMRC proforma for this request.

I can confirm that I am a member of the NHS pension scheme above and that I have read and understood the HMRC email protocol policy (${PROTOCOL}), and:
- I confirm that I understand and accept the risks of using email
- I am content for my financial information to be sent by email
- I accept that attachments can be used

Kind regards

{{name}}
`,
  },
];

export function getTemplate(id) {
  return templates.find((template) => template.id === id) ?? null;
}

export function schemeById(id) {
  return SCHEMES[id] ?? SCHEMES.ew;
}
