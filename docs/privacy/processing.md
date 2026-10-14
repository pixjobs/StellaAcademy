# Record of processing

Stella Academy, https://www.stella-academy.org. Checked against the code on 14 October 2026.

**Controller:** the site owner, as an individual (there is no company): Y. Pei t/a Pixjobs, hello@pixjobs.com.
**Processors:** Google (Cloud Run, Cloud Logging, Firestore, Google Analytics), under Google's standard data processing terms; Atlassian (Jira) for the weekly list of people who offer to help test.

The site has no accounts, no sign-up, no email list and no payments of its own. Most of what it remembers stays in the
visitor's own browser.

## What is processed

| What | Whose | Where it goes | Why (lawful basis) | Kept for |
| --- | --- | --- | --- | --- |
| Request logs: IP address, browser (user agent), page address, time | Every visitor | Google Cloud Logging (Cloud Run request logs) | Running and securing the site (legitimate interests) | 30 days (Cloud Logging default) |
| Problem reports: lesson, kind of problem, the text typed, with email addresses and phone numbers removed | Anyone who uses "Report a problem" | Cloud Logging, one entry per report | Correcting the lessons (legitimate interests); see the DPIA | 30 days |
| IP address for rate limits on search and reports | Visitors who search the gallery or send a report | Server memory only; never written down | Preventing abuse (legitimate interests) | At most 10 minutes |
| Gallery searches: the words typed | Visitors who search the gallery | Passed to NASA's image library API to get results. Not sent to Analytics | Providing the search the visitor asked for | Not kept by Stella |
| Usage statistics: pages viewed, lesson events (for example "answer shown", "report sent"), device type, approximate location | Visitors who press Accept | Google Analytics 4 (loaded only after Accept) | Learning which lessons are useful (consent) | GA4 retention setting (check: action 6) |
| Offers to help test: name, email, role, subject, optional note | Adults who use the form on `/help` (it requires confirming 18 or over) | Firestore `(default)`, eur3, collection `volunteers`; copied weekly into a Jira KAN work item labelled `volunteers` by `/api/volunteer/digest` | Contacting them about testing (consent; withdrawn by emailing) | 12 months: Firestore TTL on `expireAt`; the digest deletes Jira items older than that |
| Choices kept in the browser: cookie choice, journey progress, display settings, notes | Each visitor, on their own device | The visitor's browser (localStorage). Never sent to Stella | Providing what the visitor asked for (strictly necessary under PECR) | Until the visitor clears it |

## Things loaded from other sites

- **NASA images** in the gallery and the picture of the day load from `*.nasa.gov`, so NASA receives the visitor's IP
  address, as for any image request.
- **Google Analytics** scripts load from Google (see below).
- Fonts, launch footage and all other files are served from Stella's own domain.
- **Ko-fi** is only a link. Anything given there is between the visitor and Ko-fi.

## Analytics before consent

Decided 14 October 2026: "basic" Consent Mode. The Google tag is not loaded until a visitor presses Accept, so
nothing at all goes to Google from visitors who decline or do not choose. If a visitor accepts and later withdraws
(the "Change your cookie choice" button on /privacy), consent is set to denied and the `_ga` cookies are deleted.
Google signals and all advertising storage are off. The cost is that visits from people who decline or ignore the
banner are not counted, so traffic figures are lower than the real number of visits.

## Children

The site is designed for ages 9 and up, so the Children's Code applies. What the site does now:

- No accounts, no profiling and no adverts.
- Analytics only with consent: nothing loads before Accept. Accept and Decline are on the banner's first view and
  look the same, so neither is nudged (done 14 October 2026).
- No geolocation or other device sensors, and no sharing with third parties beyond the processors above.
- The report form asks for no personal details, says so in plain words, and removes emails and phone numbers.

Before accounts or a "Stella Plus" are added (roadmap phase 3), this record and a new DPIA must be done first.
Under-13s will need a parent's consent for anything that relies on consent.
