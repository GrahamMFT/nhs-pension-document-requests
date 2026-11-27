# NHS pension document requests

A static page that helps NHS Pension Scheme members prepare a document request email. The member enters their details once, picks a template, and opens the completed message in their own email app.

Personal details are saved in the browser only. The page does not post them anywhere, and it has no analytics.

## What a member does

1. Enter name, date of birth, SD or membership number, and address. The HMRC McCloud extract also asks for a National Insurance number or UTR, a reply email, and any recent previous addresses.
2. Choose a document. Tick **Include** on several cards, then **Prepare selected**, to work through more than one request with the same details.
3. Check the recipient, subject and message. Change the tax years, the estimate date, or — for a pension savings statement — England & Wales, Scotland or Northern Ireland.
4. Choose **Open in my email app**, review the draft, and send it. Nothing is sent until the member presses Send.

**Clear my details** removes the saved copy. Use it on a shared computer.

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

The HMRC request needs a completed proforma. **Download draft with proforma attached** saves an `.eml` file with the message and the proforma. Open that file in the email app. A normal email link cannot carry an attachment.

## Run it locally

Node.js 20 or newer. There are no packages to install.

```bash
npm test
npm start
```

Open http://127.0.0.1:5173

Opening `index.html` directly from the file system will not work. The page is a set of JavaScript modules, and browsers block those on `file://` addresses.

## Change a template

All wording and recipients live in [`src/templates.js`](src/templates.js).

- Amend the `body`, `subject`, `notes` or `summary` of an existing object.
- Remove a template by deleting its object from the `templates` array.
- Add one by copying an object and giving it a new `id`. These tokens are replaced from the member’s details:

```text
{{greeting}} {{name}} {{dob}} {{address}} {{membershipLine}}
{{requestLines}} {{estimateDate}} {{reqDate}} {{deadline}}
{{nino}} {{previous}}
```

`requires` lists anything needed beyond name, date of birth and address. Use `"membership"` for the SD or membership number. Set `schemeChoice: true` only when England & Wales, Scotland and Northern Ireland really do use different mailboxes. Do not invent an address.

A minimal extra template looks like this:

```javascript
{
  id: "NHSP07",
  code: "NHSP07",
  title: "Short name",
  summary: "One sentence on the catalogue card.",
  detail: "The longer explanation on the template page.",
  notes: ["What the member should know before sending."],
  links: [],
  requires: ["membership"],
  schemeChoice: false,
  subject: "Document request NHSP07",
  body: `{{greeting}}

My details are as below.

Full Name: {{name}}
Date of Birth: {{dob}}
Address & postcode: {{address}}
{{membershipLine}}

Please provide NHSP07 (PDF).

Kind regards

{{name}}
`,
}
```

Run `npm test` after an edit. The tests check that every template still fills in, and that the page does not gain a network call.

## Deploy

The published site is static. Production does not run Node. Upload these and leave the folders intact:

- `index.html`
- `app.js`
- `styles.css`
- `src/`
- `assets/`

`test/` and `scripts/` are for development only.

Relative links mean the site can live at the root of a domain or in a folder such as `/document-requests/`.

### GitHub Pages

1. Open the repository **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Choose branch `main` and folder `/ (root)`, then save.

The site is published at `https://<owner>.github.io/nhs-pension-document-requests/`. The first publish can take a minute.

### Anywhere else

Copy the files above onto any static host (the existing MediFintech site, Azure Static Web Apps, Netlify, an S3 bucket). Do not put a server-side form in front of the page. Do not add analytics that would receive the details.

There is no build step.

## Privacy

- Details are stored under the localStorage key `mft.docRequest.profile.v1`.
- The chosen pension scheme and a note of which templates were opened on this device use separate keys. They are not sent anywhere.
- Template ids in the page address (`#/NHSP01`) are not personal, and the hash is not sent to the web server.
- Choosing **Open in my email app** hands the draft to the device’s email program. The message leaves the device only when the member sends it, and then only to the address shown.
