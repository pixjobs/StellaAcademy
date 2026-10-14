# DPIA: "Report a problem"

Data protection impact assessment, 14 October 2026. Done because the form takes free text on a site used by
children, which the ICO's Children's Code expects to be assessed.

## What it does

Every lesson has a "Report a problem" form. A reader chooses a kind of problem and describes it in up to 1,000
characters. `/api/report` checks the lesson and the kind, removes email addresses and phone numbers from the text,
and writes one entry to Google Cloud Logging: lesson, kind, text and time. The owner reads reports with `gcloud`
and copies anything worth keeping into Jira as a description of the problem, without the reader's wording if it
contains anything personal. Analytics is told only that a report was sent, with the lesson and the kind.

## Is it necessary and proportionate?

- **Purpose:** to find and correct mistakes in lessons used by children. This is a clear benefit to the people
  using the site.
- **Lawful basis:** legitimate interests. Readers choose to send a report; the form does not ask for, and is not
  meant to receive, any personal data.
- **Minimisation:** no name, email, account or identifier is asked for. Emails and phone numbers are removed if
  typed. The IP address is used only for the rate limit, in memory, for at most 10 minutes.
- **Retention:** 30 days, then deleted automatically.
- **Transparency:** the form says what reports are for and when they are deleted. The privacy page (open action 5)
  will give the full details.

## Risks

| Risk | Likelihood | Severity | Mitigation | Residual |
| --- | --- | --- | --- | --- |
| A child types personal details (name, school, address) | Possible | Low to medium | Plain warning on the form; emails and phone numbers removed automatically; 30-day deletion; the owner does not copy personal details into Jira | Low |
| A report is matched to an IP address through Cloud Run's request log for the same moment | Possible if both are kept | Low | Exclude `/api/report` from request logs (open action 2) | Low once done |
| Reports stored outside the UK or EEA | Likely (the default log bucket is global) | Low | Move reports to a log bucket in Europe (open action 3); Google's data processing terms cover transfers | Low |
| Someone floods the form with abuse or personal data about others | Unlikely | Low | 5 reports per 10 minutes per address; 4,000-byte limit; reports are not published anywhere | Low |
| Report text appears in Analytics | — | — | Not possible: only lesson and kind are sent, and a browser check confirms it | None |

## Outcome

Open actions 2 and 3 were done on 14 October 2026, so the form can go live. Action 5 (the privacy page) is still to
do. Residual risk is low. Review this assessment if the form ever asks for contact details, stores reports anywhere else, or is shown to signed-in users.
