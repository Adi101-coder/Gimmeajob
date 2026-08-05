# GimmeAJob - Personal Job Application Assistant

A production-ready web application that automates personalized job application emails to recruiters while keeping you in full control of campaigns and personalization.

## Features

- **Automatic file loading** — Reads recruiter data, email templates, and resume from predefined folders (no uploads)
- **Excel validation** — Validates contacts, detects duplicates and invalid emails, generates import reports
- **AI personalization** — Uses OpenAI to personalize each email while staying faithful to your template
- **Smart scheduling** — Distributes emails naturally across working hours with configurable daily limits
- **Campaign control** — Start, pause, resume, or stop campaigns at any time
- **Resume attachment** — Automatically attaches your latest resume to every email
- **Searchable logs** — Full history of sent, failed, and retried emails
- **Docker deployment** — Production-ready Docker Compose setup

## Project Structure

```
project/
├── backend/          # Express API + BullMQ worker
├── frontend/         # Next.js dashboard
├── config/           # config.json settings
├── data/             # hr_database.xlsx
├── templates/        # email_template.txt
├── resumes/          # Resume.pdf
├── logs/             # Application logs
├── docker/           # Dockerfiles
├── docs/             # Documentation
├── docker-compose.yml
├── .env.example
└── README.md
```

## Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- OpenAI API key
- SMTP credentials (Gmail App Password recommended)

## Quick Start (Local Development)

### 1. Clone and configure

```bash
cp .env.example .env
# Edit .env with your SMTP and OpenAI credentials
```

### 2. Prepare local files

Place your files in the predefined folders:

| File | Path |
|------|------|
| Recruiter database | `data/hr_database.xlsx` |
| Email template | `templates/email_template.txt` |
| Resume | `resumes/Resume.pdf` |
| Settings | `config/config.json` |

Generate sample data for testing:

```bash
node scripts/generate-sample-data.mjs
```

### 3. Excel format

Required columns: `Name`, `Company`, `Position`, `Email`

### 4. Email template variables

- `{{HR_NAME}}` — Recruiter name
- `{{COMPANY_NAME}}` — Company name
- `{{POSITION}}` — Recruiter's position
- `{{JOB_ROLE}}` — Role you're applying for
- `{{TODAY}}` — Current date

### 5. Start infrastructure

```bash
# Start PostgreSQL and Redis (or use your own instances)
docker run -d --name gimmeajob-postgres -e POSTGRES_USER=gimmeajob -e POSTGRES_PASSWORD=gimmeajob_secret -e POSTGRES_DB=gimmeajob -p 5432:5432 postgres:16-alpine
docker run -d --name gimmeajob-redis -p 6379:6379 redis:7-alpine
```

### 6. Install and run

```bash
# Backend
cd backend
npm install
npx prisma migrate deploy
npm run dev          # API server on :4000

# Worker (separate terminal)
cd backend
npm run worker       # Email queue processor

# Frontend (separate terminal)
cd frontend
npm install
npm run dev          # Dashboard on :3000
```

Open [http://localhost:3000](http://localhost:3000)

## Docker Deployment (Production)

### 1. Configure environment

```bash
cp .env.example .env
# Set SMTP_USER, SMTP_PASSWORD, OPENAI_API_KEY
```

### 2. Add your files

Ensure `data/hr_database.xlsx`, `templates/email_template.txt`, and `resumes/Resume.pdf` exist.

### 3. Start all services

```bash
docker compose up -d --build
```

Services:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Health check**: http://localhost:4000/api/health

### 4. View logs

```bash
docker compose logs -f backend worker
```

## Configuration

Edit `config/config.json`:

```json
{
  "dailyEmailLimit": 20,
  "workingHours": { "start": "09:00", "end": "17:00", "timezone": "America/New_York" },
  "smtp": { "host": "smtp.gmail.com", "port": 587, "secure": false, "fromName": "Your Name", "fromEmail": "your.email@gmail.com" },
  "llm": { "model": "gpt-4o-mini", "temperature": 0.7, "maxTokens": 1024 },
  "retry": { "count": 3, "delayMs": 5000 },
  "randomDelay": { "minSeconds": 30, "maxSeconds": 120 },
  "emailSubject": "Application for {{JOB_ROLE}} Position at {{COMPANY_NAME}}"
}
```

Environment variables override sensitive values:

| Variable | Description |
|----------|-------------|
| `SMTP_USER` | SMTP username |
| `SMTP_PASSWORD` | SMTP password / app password |
| `OPENAI_API_KEY` | OpenAI API key |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/dashboard` | Dashboard stats |
| GET | `/api/config` | Get configuration |
| PUT | `/api/config` | Update configuration |
| GET | `/api/import-report` | Excel import validation report |
| POST | `/api/campaigns` | Create/start campaign |
| GET | `/api/campaigns/:id` | Campaign progress |
| POST | `/api/campaigns/:id/pause` | Pause campaign |
| POST | `/api/campaigns/:id/resume` | Resume campaign |
| POST | `/api/campaigns/:id/stop` | Stop campaign |
| GET | `/api/preview` | Preview next email |
| GET | `/api/logs` | Searchable email logs |

## Testing

```bash
cd backend
npm test
```

Tests cover:
- Template rendering and variable substitution
- Excel parsing, validation, and duplicate detection
- Scheduler time distribution
- SMTP failure classification

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│  PostgreSQL │
│  (Next.js)  │     │  (Express)  │     │             │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────▼──────┐     ┌─────────────┐
                    │    Redis    │────▶│   Worker    │
                    │  (BullMQ)   │     │  (Emails)   │
                    └─────────────┘     └──────┬──────┘
                                               │
                                    ┌──────────┼──────────┐
                                    ▼          ▼          ▼
                                  SMTP      OpenAI     Resume
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Excel file not found" | Place `hr_database.xlsx` in `data/` |
| "Resume not found" | Place `Resume.pdf` in `resumes/` |
| SMTP auth failed | Use an app-specific password for Gmail |
| LLM errors | Check `OPENAI_API_KEY`; emails fall back to template |
| Campaign not sending | Ensure the worker process is running |
| Daily limit reached | Emails auto-reschedule to next working day |

## License

MIT
