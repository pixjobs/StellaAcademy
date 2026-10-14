# Privacy and data protection

Written 14 October 2026 (Jira KAN-49). Stella Academy is used by children, so it follows UK GDPR, the Privacy and
Electronic Communications Regulations (PECR) and the ICO's Age Appropriate Design Code (the Children's Code). These
documents are the owner's own working record, not legal advice. Have them checked before relying on them, for
example against the ICO's guidance for small organisations.

| File | What it is |
| --- | --- |
| `processing.md` | Record of everything the site processes, why, and for how long |
| `dpia-report-form.md` | Data protection impact assessment for "Report a problem" |
| `privacy-policy-draft.md` | Draft privacy notice for a `/privacy` page, with a version for children |

## Open actions

| # | Action | Who | Status |
| --- | --- | --- | --- |
| 1 | Choose the name and contact email the policy gives as data controller | Owner | Open; blocks publishing the policy |
| 2 | Keep Cloud Run request logs for `/api/report` out of Cloud Logging, so a report cannot be matched to an IP address (commands in DEPLOYMENT.md) | Owner approves; then run | Done 14 Oct 2026 |
| 3 | Store problem reports in a log bucket in Europe with 30-day retention (commands in DEPLOYMENT.md) | Owner approves; then run | Done 14 Oct 2026 |
| 4 | Decide how Google Analytics behaves before consent (see `processing.md`, "Analytics before consent") | Owner | Open |
| 5 | Publish `/privacy` and link it from the footer, the cookie banner and the report form | After 1 | Open |
| 6 | Check the GA4 property's data retention setting is the shortest (2 months) and Google signals is off | Owner, in GA admin | Open |
| 7 | Register with the ICO and pay the data protection fee, or record why the site is exempt (the ICO's online self-assessment decides) | Owner | Open |
| 8 | Review these documents before accounts, an email list or any paid feature is added | Owner | When needed |
| 9 | Give Accept and Decline on the cookie banner equal weight (same style), so neither is nudged | Owner approves the look | Open |
