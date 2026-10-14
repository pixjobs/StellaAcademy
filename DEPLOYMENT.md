# Deployment

The site is a single Cloud Run service, built and deployed by Cloud Build.

| | |
| --- | --- |
| Google Cloud project | `stella-academy` |
| Cloud Run service | `stella-web` |
| Region | `europe-west1` |
| Domain | https://www.stella-academy.org |
| Container image | `europe-west1-docker.pkg.dev/stella-academy/stella/stella-web:latest` |

There is no worker service, task queue, database or sign-in in the current build.

## Deploy

Run from `frontend/`, signed in to an account with access to the project:

```bash
gcloud builds submit --config cloudbuild.web.yaml --project=stella-academy .
```

Always pass `--project`: the build uses whichever project it is given, not the one named in this file.

The build (`cloudbuild.web.yaml`) does three things:

1. Builds the image from `Dockerfile.web` (Next.js standalone output).
2. Pushes it to Artifact Registry.
3. Deploys it to Cloud Run, open to the public, with 1 CPU, 512 MiB, concurrency 40 and at most 10 instances.

It takes about ten minutes. New revisions take all traffic as soon as they are ready.

## Check a deploy

```bash
gcloud run services describe stella-web --project=stella-academy --region=europe-west1 \
  --format='value(status.latestReadyRevisionName,status.traffic[0].percent)'
curl -s https://www.stella-academy.org/api/health
```

## Read problem reports

The "Report a problem" form on each lesson writes one log line per report to Cloud Logging (`/api/report`), routed
to the `stella-reports` bucket in europe-west1 (see "Privacy set-up for reports" below). Nothing else stores them.
List the last 30 days with the command at the end of that section.

Logs are kept for 30 days, so copy anything worth keeping into Jira (project KAN), without any personal details a
reader may have typed.

### Privacy set-up for reports (applied 14 October 2026)

`docs/privacy/dpia-report-form.md` asks for these two changes to logging. They were applied on 14 October 2026; they
are kept here so they can be re-created:

```bash
# 1. Keep Cloud Run's request log (IP address, browser) for /api/report out of Cloud Logging,
#    so a report cannot be matched to the address that sent it.
gcloud logging sinks update _Default --project=stella-academy \
  --add-exclusion=name=no-report-requests,filter='logName="projects/stella-academy/logs/run.googleapis.com%2Frequests" AND httpRequest.requestUrl:"/api/report"'

# 2. Keep reports in a bucket in Europe for 30 days, and out of the global _Default bucket.
gcloud logging buckets create stella-reports --project=stella-academy --location=europe-west1 --retention-days=30
gcloud logging sinks create stella-reports \
  logging.googleapis.com/projects/stella-academy/locations/europe-west1/buckets/stella-reports \
  --project=stella-academy --log-filter='jsonPayload.type="lesson_report"'
gcloud logging sinks update _Default --project=stella-academy \
  --add-exclusion=name=no-lesson-reports,filter='jsonPayload.type="lesson_report"'
```

After step 2, read reports from the new bucket:

```bash
gcloud logging read 'jsonPayload.type="lesson_report"' --project=stella-academy --freshness=30d \
  --bucket=stella-reports --location=europe-west1 --view=_AllLogs \
  --format='table(timestamp, jsonPayload.lesson, jsonPayload.kind, jsonPayload.text)'
```

## Roll back

```bash
gcloud run revisions list --service=stella-web --project=stella-academy --region=europe-west1
gcloud run services update-traffic stella-web --project=stella-academy --region=europe-west1 \
  --to-revisions=<revision-name>=100
```

To go back to following the newest revision afterwards, use `--to-latest`.

## Settings

| Name | When it is read | Purpose |
| --- | --- | --- |
| `NASA_API_KEY` | Runtime | Key for NASA's Astronomy Picture of the Day. Optional: without it the site uses NASA's shared `DEMO_KEY`, which is heavily rate limited. |
| `APOD_REVALIDATE_SEC` | Runtime | How long the picture of the day is cached. Optional, defaults to one day. |
| `NEXT_PUBLIC_GA_ID` | Build | Google Analytics measurement ID. Optional, has a default in `src/lib/site.ts`. |
| `NEXT_PUBLIC_SUPPORT_URL` | Build | Address the "Support Stella" button opens. Optional, defaults to the Ko-fi page in `src/lib/site.ts`. |
| `JIRA_API_TOKEN` | Runtime (Secret Manager) | Atlassian API token for hello@pixjobs.com, used by the weekly "Help test Stella" digest. Tokens expire (a year at most): when the digest starts failing, make a new one at id.atlassian.com and add it with `gcloud secrets versions add JIRA_API_TOKEN --data-file=- --project=stella-academy`. |
| `VOLUNTEER_DIGEST_KEY` | Runtime (Secret Manager) | Shared key Cloud Scheduler sends to `/api/volunteer/digest`. |

`NEXT_PUBLIC_` values are compiled into the pages, so they must be present when the image is built, not just when it
runs.

Production currently runs without `NASA_API_KEY`. A secret of that name exists in Secret Manager; to use it, add this
line to the deploy step in `cloudbuild.web.yaml` and give the service's runtime account the Secret Accessor role on it:

```yaml
      - --set-secrets=NASA_API_KEY=NASA_API_KEY:latest
```

Never put a key in the repository. Locally, keys go in `frontend/.env.local`, which git ignores.

## Security headers

`next.config.ts` sends a Content Security Policy, HSTS and the usual companion headers with every response. If you add
a script, picture or API from a new host, add that host to the policy there or the browser will block it.

## Troubleshooting

- **The build fails at `npm run build`.** Run `npm run build` in `frontend/` to see the same error locally.
- **The container does not start.** The server must listen on `$PORT` (Cloud Run sets it to 8080). `Dockerfile.web`
  already does this; check the revision's logs with
  `gcloud run services logs read stella-web --project=stella-academy --region=europe-west1`.
- **A picture or script is missing on the live site only.** Look in the browser console for a Content Security Policy
  message, then see "Security headers" above.

## Help test Stella sign-ups (added 14 October 2026)

The form on `/help` stores sign-ups in Firestore (collection `volunteers`, eur3). A TTL policy on `expireAt` deletes
each one 12 months after it arrives. Every Monday at 09:00 (London) the Cloud Scheduler job `volunteer-digest` calls
`/api/volunteer/digest`, which lists new sign-ups in a Jira KAN work item labelled `volunteers` and deletes digest
items older than 12 months. Run it by hand with:

```bash
gcloud scheduler jobs run volunteer-digest --location=europe-west1 --project=stella-academy
```
