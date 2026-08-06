# Email Deliverability Guide

## What we fixed in the app

- Human-like test emails (no "Test" or "SMTP" in subject)
- Proper `Reply-To` header matching your address
- Multipart plain text + HTML emails
- `List-Unsubscribe` header for bulk sends
- Resume attached as `YourName_Resume.pdf` instead of generic `Resume.pdf`
- Validation that `fromEmail` matches `SMTP_USER`
- TLS 1.2+ for SMTP connections
- Deliverability score in Settings dashboard

## Gmail checklist (do this now)

1. **Mark test email as "Not spam"** in Gmail
2. **fromName** = your real full name (not "GimmeAJob")
3. **fromEmail** must match **SMTP_USER** exactly
4. Keep **dailyEmailLimit** at 20 or below
5. Send test **without** resume first, then with resume
6. Start campaigns at **5–10 emails/day**, increase slowly

## Custom domain setup (best long-term fix)

Personal `@gmail.com` will always have lower deliverability for bulk outreach.

### Recommended path

1. Buy a domain (e.g. `aditkatiyar.com`)
2. Use **Google Workspace** or **SendGrid** / **Mailgun**
3. Add DNS records:

| Record | Purpose |
|--------|---------|
| **SPF** | `v=spf1 include:_spf.google.com ~all` |
| **DKIM** | Provided by your email provider |
| **DMARC** | `v=DMARC1; p=none; rua=mailto:you@domain.com` |

4. Update `config.json`:

```json
"smtp": {
  "host": "smtp.sendgrid.net",
  "port": 587,
  "secure": false,
  "fromName": "Adit Katiyar",
  "fromEmail": "hello@aditkatiyar.com",
  "replyTo": "hello@aditkatiyar.com"
}
```

5. Update `.env`:

```env
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key
```

## Verify DNS records

- [Google Admin Toolbox](https://toolbox.googleapps.com/apps/checkmx/)
- [MXToolbox](https://mxtoolbox.com/spf.aspx)
- Send a test to [mail-tester.com](https://www.mail-tester.com) for a spam score

## Content tips

- Keep emails under 200 words
- No ALL CAPS subjects
- No "Free", "Urgent", "Act now"
- Personalize with recruiter name and company
- One PDF attachment max
- Plain, professional tone
