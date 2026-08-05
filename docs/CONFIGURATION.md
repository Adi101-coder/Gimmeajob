# Configuration Guide

## Overview

GimmeAJob loads all application data from predefined local folders. No file uploads are required through the dashboard.

## Required Files

| File | Location | Description |
|------|----------|-------------|
| Recruiter database | `data/hr_database.xlsx` | Excel file with recruiter contacts |
| Email template | `templates/email_template.txt` | Plain text email template |
| Resume | `resumes/Resume.pdf` | PDF resume attached to every email |
| Settings | `config/config.json` | Application configuration |

## Excel Format

Required columns (case-sensitive):

- `Name` — Recruiter's full name
- `Company` — Company name
- `Position` — Recruiter's job title
- `Email` — Valid email address

The parser automatically:
- Skips rows with missing fields
- Rejects invalid email formats
- Detects and skips duplicate emails
- Generates a validation report accessible via the API

## Email Template Variables

| Variable | Replaced With |
|----------|---------------|
| `{{HR_NAME}}` | Recruiter name from Excel |
| `{{COMPANY_NAME}}` | Company from Excel |
| `{{POSITION}}` | Recruiter position from Excel |
| `{{JOB_ROLE}}` | Role you enter in the dashboard |
| `{{TODAY}}` | Current date (formatted) |

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
SMTP_USER=your.email@gmail.com
SMTP_PASSWORD=your_app_password
OPENAI_API_KEY=sk-your-key
```

For Gmail, create an [App Password](https://support.google.com/accounts/answer/185833).

## Campaign Workflow

1. Place your files in the correct folders
2. Start the backend, worker, and frontend
3. Open the dashboard at http://localhost:3000
4. Enter the position you're applying for
5. Choose **Send Now** or **Schedule**
6. Click **Start Campaign**
7. Monitor progress, logs, and preview the next email

## Scheduler Behavior

- Emails are distributed across configured working hours
- Random delays between sends prevent burst patterns
- Daily limit resets at midnight
- Excess emails roll over to the next working day
- Paused campaigns can be resumed without duplicate sends
- Campaign progress persists across restarts
