# Privacy and data protection

Written 14 October 2026 (Jira KAN-49). Stella Academy is used by children, so it follows UK GDPR, the Privacy and
Electronic Communications Regulations (PECR) and the ICO's Age Appropriate Design Code (the Children's Code). These
documents are the owner's own working record, not legal advice. Have them checked before relying on them, for
example against the ICO's guidance for small organisations.

| File | What it is |
| --- | --- |
| `processing.md` | Record of everything the site processes, why, and for how long |
| `dpia-report-form.md` | Data protection impact assessment for "Report a problem" |
| `privacy-policy-draft.md` | The first draft of the privacy notice. The live text is `frontend/src/app/privacy/page.tsx` |

## Open actions

| # | Action | Who | Status |
| --- | --- | --- | --- |
| 1 | Choose the name and contact email the policy gives as data controller | Owner | Done 14 Oct 2026: Y. Pei t/a Pixjobs, hello@pixjobs.com |
| 2 | Keep Cloud Run request logs for `/api/report` out of Cloud Logging, so a report cannot be matched to an IP address (commands in DEPLOYMENT.md) | Owner approves; then run | Done 14 Oct 2026 |
| 3 | Store problem reports in a log bucket in Europe with 30-day retention (commands in DEPLOYMENT.md) | Owner approves; then run | Done 14 Oct 2026 |
| 4 | Decide how Google Analytics behaves before consent (see `processing.md`, "Analytics before consent") | Owner | Done 14 Oct 2026: basic Consent Mode, nothing loads before Accept |
| 5 | Publish `/privacy` and link it from the footer, the cookie banner and the report form | After 1 | Done 14 Oct 2026 (also linked from About; has a "change your cookie choice" button) |
| 6 | Check the GA4 property's data retention setting is the shortest (2 months) and Google signals is off | Owner, in GA admin | Open |
| 7 | Register with the ICO and pay the data protection fee, or record why the site is exempt (the ICO's online self-assessment decides) | Owner | Assessed 14 Oct 2026: not exempt, see below. Owner to register |
| 8 | Review these documents before accounts, an email list or any paid feature is added | Owner | When needed |
| 9 | Give Accept and Decline on the cookie banner equal weight (same style), so neither is nudged | Owner approves the look | Done 14 Oct 2026 |

## ICO data protection fee (action 7)

Assessed 14 October 2026; confirm with the ICO's own self-assessment at ico.org.uk/fee before paying.

The fee applies to every controller that processes personal data electronically unless **all** of its processing is
in the exempt list (staff administration; its own advertising and marketing; its own accounts and records;
not-for-profit bodies' own members; personal or household affairs; public registers; judicial functions; paper-only
processing). Stella Academy processes visitors' IP addresses in hosting logs, Analytics data with consent and
problem reports, to run a public website. None of the exemptions covers that, and the not-for-profit exemption is
for bodies set up on a not-for-profit basis, which Stella is not.

**Result:** tier 1 (micro organisation): £52 a year, or £47 by direct debit. The register entry is public and shows
the controller's name and an address; a sole trader can give a correspondence address rather than a home address.
Not paying can lead to a fixed penalty.
