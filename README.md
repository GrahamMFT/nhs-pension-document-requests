# NHS pension document requests

A static page that helps NHS Pension Scheme members prepare document request emails. They choose what they are trying to do, pick the documents, enter the details those documents need, and open each completed message in their own email app.

Personal details stay in the open page. They are not saved for a later visit, and they are not sent to MediFintech, Quilter or any other server. The page has no analytics and no third-party requests.

## What a member does

1. **Choose your documents.** The page starts with “What would you like to do?”. Each goal recommends a bundle. Suggested documents are ticked. Others are left unticked, with a note on when they are worth adding. Nothing in a bundle is compulsory.
2. **Enter your details.** The form asks only for the fields the chosen documents need. A National Insurance number is shown only when HMRC’s extract is selected. The same details are reused for every request. Changing them does not clear the document selection.
3. **Prepare your requests.** Each request shows the recipient, an expandable preview, and **Open in my email app**. Copy actions cover webmail. The HMRC request explains the proforma, because a normal email link cannot carry an attachment. **I've sent this** is a separate choice. Opening a draft does not mark the email as sent.

A final screen lists what was requested, what is marked as sent, and what is still outstanding. It can be printed or downloaded as a checklist that contains document names and recipients, not the member’s details.

**Clear my details and start again** wipes the details, the selection and any older copy this browser kept from the first version of the page.

Refreshing or closing the page also clears the details. A draft, a download or text left on the clipboard can remain on the device or in the member’s email service.

## Templates

| Code | Document | Sent to |
| --- | --- | --- |
| NHSP01 | Total Reward Statement | NHS Pensions |
| NHSP02 | Manual pensions estimate | NHS Pensions |
| NHSP03 | Pension savings statement | NHS Pensions, SPPA, or HSC Pension Service |
| NHSP04 | Remedial pensions savings statement | NHS Pensions |
| NHSP05 | 05 service and pay extract | NHS Pensions |
| NHSP06 | Scheme pays extract | NHS Pensions |
| HMRC | McCloud remedy extract | HMRC Public Service Pensions Remedy team |

Recipients are the ones published on the previous Goldstone document page. Do not invent an administrator address.

## Run it locally

Node.js 20 or newer. There are no packages to install.

```bash
npm test
npm start
```

Open http://127.0.0.1:5173

Opening `index.html` from the file system will not work. The page is a set of JavaScript modules, and browsers block those on `file://` addresses.

## Change a template

Email wording and recipients live in [`src/templates.js`](src/templates.js).

- Amend the `body`, `subject`, `notes` or `summary` of an existing object.
- Remove a template by deleting its object from the `templates` array.
- Add one by copying an object and giving it a new `id`. These tokens are replaced from the member’s details:

```text
{{greeting}} {{name}} {{dob}} {{address}} {{membershipLine}}
{{requestLines}} {{estimateDate}} {{reqDate}} {{deadline}}
{{nino}} {{previous}}
```

`requires` lists anything needed beyond name, date of birth and address. Use `"membership"` for the SD or membership number. Set `schemeChoice: true` only when England and Wales, Scotland and Northern Ireland really do use different mailboxes.

Plain-English explanations live on the matching object in `guides` inside [`src/content.js`](src/content.js). Add a guide when you add a template. The tests fail if a template has no guide.

## Change the offers, bundles and wording

[`src/content.js`](src/content.js) is the only file for commercial content:

- service descriptions, prices and URLs
- the free pension record check
- the financial adviser introduction
- calls to action and the Quilter line
- which documents each goal recommends
- which offer appears at the end of a journey

Set `enabled` to `false` to hide an offer. Clear `href` to keep the explanation and hide the button. Prices are shown only when `showPrice` is true.

`approvalNote` is for MediFintech and Quilter. The page does not render it.

## Colour

The palette is taken from `assets/medifintech-logo.png`, not from the current MediFintech website theme.

| Role | Colour | Where it came from |
| --- | --- | --- |
| Fintech navy | `#1F3965` | Wordmark, “Fintech” |
| Medi blue | `#2E5495` | Wordmark, “Medi” |
| Tagline green | `#548732` | “NHS Pension Modelling” |
| Green text | `#3F6E28` | Darker shade of the tagline green so small text clears WCAG AA. The logo green on white is 4.3:1, so it is used for rules and large areas, not for small type. |

Neutrals are cool greys mixed from the navy (`#F3F6F9` page, `#FFFFFF` cards, `#D5DEE8` lines, `#3E4C60` secondary text). White on navy is 11.5:1. Medi blue on white is 7.5:1.

Headings use Frank Ruhl Libre and the interface uses Open Sans, the same families as the MediFintech site. Both are self-hosted under the SIL Open Font License (`assets/fonts/`). The page does not contact Google Fonts.

A Quilter logo is not shown. The footer states that MediFintech is part of Quilter plc and links to Quilter’s announcement. Add a logo only after brand approval.

## Deploy

Production is static. Upload these and leave the folders intact:

- `index.html`
- `app.js`
- `styles.css`
- `src/`
- `assets/`

`test/` and `scripts/` are for development only. Relative links mean the site can live at a domain root or in a folder such as `/document-requests/`.

### GitHub Pages

The repository [GrahamMFT/nhs-pension-document-requests](https://github.com/GrahamMFT/nhs-pension-document-requests) publishes `main` with GitHub Pages:

https://grahammft.github.io/nhs-pension-document-requests/

GitHub Pages does not apply the security headers below. Prefer a host that can set them when this moves to a MediFintech address.

### Recommended response headers

`scripts/serve.js` sends these for local use. Set the same headers on the production host. Add `Strict-Transport-Security` once the site is only served over HTTPS.

```text
Content-Security-Policy: default-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; script-src 'self'; connect-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
Permissions-Policy: interest-cohort=()
```

`connect-src 'none'` matches the page: it does not call an API. Outbound links use `rel="noopener noreferrer"` and `referrerpolicy="no-referrer"`, and they do not add the member’s details to the query string.

Do not put a server-side form in front of the page. Do not add a tracker.

## Measurement, when it is approved

No analytics runs. [`src/analytics.js`](src/analytics.js) keeps an in-memory event shape that a later, approved script can receive:

```js
window.mftAnalytics = (event) => { /* send event somewhere approved */ };
```

Events are `visit`, `objective_selected`, `documents_confirmed`, `details_continued`, `request_prepared`, `request_copied`, `request_marked_sent`, `referral_clicked` and `checklist_saved`. Properties are limited to an objective id, template ids, a referral id, a placement and a method. Name, address, date of birth, membership number, National Insurance number and email are discarded if they are passed in.

Choosing a goal records `objective_selected`. The other events are recorded when the member continues, opens or copies a draft, marks a request as sent, saves the checklist, or follows a service link. All of that stays in memory.

## Still to be approved

Checked against medifintech.co.uk on 27 November 2026.

| Item | Status |
| --- | --- |
| NHS Pension Support (Standard), £650 plus VAT, [services](https://www.medifintech.co.uk/services/) | Published. Used for the statement, estimate, annual allowance and scheme pays recommendations. There is no separate annual allowance or scheme pays product page. |
| McCloud Remedy Support (RPSS), £1,000 including VAT, [McCloud remedy](https://www.medifintech.co.uk/mccloud-remedy/) | Published. |
| MediFintech does not give financial advice and can introduce members to regulated advisers | Published on the services page and FAQs. |
| MediFintech is part of Quilter plc | Published on the about page. Footer link only. No Quilter logo. |
| Free pension record check | **Not published.** The button goes to the [contact page](https://www.medifintech.co.uk/contact/) until MediFintech confirms who it is for and the correct URL. The paid record review remains NHS Pension Support. |
| “Request an introduction to a financial adviser” | The wording is configurable. The button goes to the contact page. Replace the URL only after Quilter approves an introduction route. Do not describe it as a Quilter advice application until that approval exists. |

## Privacy keys removed on load

The first version stored details in this browser. This version deletes these keys and does not write them again:

- `mft.docRequest.profile.v1`
- `mft.docRequest.nation.v1`
- `mft.docRequest.opened.v1`
- `mft.docRequest.queue.v1`
