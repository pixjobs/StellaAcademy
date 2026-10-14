# Record of processing

Stella Academy, https://www.stella-academy.org. Checked against the code on 14 October 2026.

**Controller:** the site owner, as an individual (there is no company): Y. Pei t/a Pixjobs, hello@pixjobs.com.
**Processors:** Google (Cloud Run, Cloud Logging, Google Analytics), under Google's standard data processing terms.

The site has no accounts, no sign-up, no email list and no payments of its own. Most of what it remembers stays in the
visitor's own browser.

## What is processed

| What | Whose | Where it goes | Why (lawful basis) | Kept for |
| --- | --- | --- | --- | --- |
| Request logs: IP address, browser (user agent), page address, time | Every visitor | Google Cloud Logging (Cloud Run request logs) | Running and securing the site (legitimate interests) | 30 days (Cloud Logging default) |
| Problem reports: lesson, kind of problem, the text typed, with email addresses and phone numbers removed | Anyone who uses "Report a problem" | Cloud Logging, one entry per report | Correcting the lessons (legitimate interests); see the DPIA | 30 days |
| IP address for rate limits on search and reports | Visitors who search the gallery or send a report | Server memory only; never written down | Preventing abuse (legitimate interests) | At most 10 minutes |
| Gallery searches: the words typed | Visitors who search the gallery | Passed to NASA's image library API to get results. Not sent to Analytics | Providing the search the visitor asked for | Not kept by Stella |
| Usage statistics: pages viewed, lesson events (for example "answer shown", "report sent"), device type, approximate location | Visitors | Google Analytics 4 | Learning which lessons are useful (consent for cookies) | GA4 retention setting (check: action 6) |
| Choices kept in the browser: cookie choice, journey progress, display settings, notes | Each visitor, on their own device | The visitor's browser (localStorage). Never sent to Stella | Providing what the visitor asked for (strictly necessary under PECR) | Until the visitor clears it |

## Things loaded from other sites

- **NASA images** in the gallery and the picture of the day load from `*.nasa.gov`, so NASA receives the visitor's IP
  address, as for any image request.
- **Google Analytics** scripts load from Google (see below).
- Fonts, launch footage and all other files are served from Stella's own domain.
- **Ko-fi** is only a link. Anything given there is between the visitor and Ko-fi.

## Analytics before consent

The site uses Google's Consent Mode with analytics storage **denied** until a visitor presses Accept, so no
analytics cookies are set without consent. However, the Google tag still loads before a choice is made, and while
consent is denied it sends Google cookieless pings (page and event, with no identifier). This is Google's "advanced"
Consent Mode.

That is common and Google presents it as compliant, but it does send data about visitors who declined, including
children, to Google. The more cautious option is "basic" Consent Mode: do not load the Google tag at all until a
visitor accepts. The cost is that visits from people who decline or ignore the banner are not counted, so traffic
figures will be lower. Decision for the owner (action 4).

## Children

The site is designed for ages 9 and up, so the Children's Code applies. What the site does now:

- No accounts, no profiling and no adverts.
- Analytics cookies only with consent. Accept and Decline are both on the banner's first view, but Accept is the
  brighter button; the Children's Code asks for no nudging, so the two should be made equal (README, action 9).
- No geolocation or other device sensors, and no sharing with third parties beyond the processors above.
- The report form asks for no personal details, says so in plain words, and removes emails and phone numbers.

Before accounts or a "Stella Plus" are added (roadmap phase 3), this record and a new DPIA must be done first.
Under-13s will need a parent's consent for anything that relies on consent.
