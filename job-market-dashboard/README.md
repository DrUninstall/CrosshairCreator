# Job Market Skills Intelligence Dashboard

A production-ready dashboard that aggregates job market data to reveal the most in-demand skills, certifications, and degree requirements.

![Dashboard Preview](docs/preview.png)

## Features

- **Top 50 In-Demand Skills** - Ranked by mention frequency across job postings
- **Top 30 Certifications** - Most requested professional certifications
- **Degree Requirements** - Distribution analysis (Bachelor's, Master's, PhD, None Required)
- **University Mentions** - Notable institutions mentioned in job requirements
- **Work Type Analysis** - Remote vs Hybrid vs On-site distribution
- **Seniority Distribution** - Junior to Executive level breakdown
- **Trend Charts** - Visualize skill demand over time
- **Advanced Filtering** - Filter by country, category, seniority, work type, date range
- **CSV Export** - Download any filtered view
- **Dark Mode** - Easy on the eyes
- **Mobile Responsive** - Works on all devices

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Python 3.11 + FastAPI |
| Frontend | Next.js 15 + React 18 + TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Scraping | SerpAPI + Playwright |
| Deployment | Docker + Docker Compose |

## Quick Start

### Prerequisites

- Docker & Docker Compose
- SerpAPI key (free tier: 100 searches/month) - [Get one here](https://serpapi.com/)

### One-Command Deploy

```bash
# Clone the repository
git clone https://github.com/yourusername/job-market-dashboard.git
cd job-market-dashboard

# Copy environment file and add your API key
cp .env.example .env
# Edit .env and add your SERPAPI_KEY

# Start all services
docker compose up -d

# Run database migrations
docker compose exec backend alembic upgrade head

# Access the dashboard
open http://localhost:3000
```

That's it! The dashboard will be available at `http://localhost:3000`.

## Local Development Setup

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers (for scraping)
playwright install chromium

# Set up environment
cp .env.example .env
# Edit .env with your settings

# Start PostgreSQL and Redis (via Docker)
docker compose up -d postgres redis

# Run migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Access the frontend at `http://localhost:3000` and API docs at `http://localhost:8000/docs`.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SERPAPI_KEY` | SerpAPI key for Google Jobs | Yes |
| `DB_USER` | PostgreSQL username | No (default: postgres) |
| `DB_PASSWORD` | PostgreSQL password | No (default: postgres) |
| `ADMIN_SECRET_KEY` | Admin API access key | Yes (for admin features) |
| `BRIGHTDATA_USERNAME` | Bright Data proxy (for LinkedIn) | No |
| `BRIGHTDATA_PASSWORD` | Bright Data proxy password | No |

See `.env.example` for all options.

## API Endpoints

### Dashboard API

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/dashboard/summary` | Get full dashboard data with filters |
| `GET /api/v1/dashboard/filters` | Get available filter options |
| `GET /api/v1/dashboard/stats` | Get quick statistics |

### Skills API

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/skills` | List all skills |
| `GET /api/v1/skills/{id}` | Get skill details + trend |
| `GET /api/v1/skills/{id}/jobs` | Get jobs mentioning skill |

### Certifications API

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/certifications` | List all certifications |
| `GET /api/v1/certifications/{id}` | Get certification details |

### Export API

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/export/skills` | Export skills to CSV |
| `GET /api/v1/export/certifications` | Export certifications to CSV |
| `GET /api/v1/export/full` | Export full dashboard to CSV |

### Admin API (requires X-Admin-Key header)

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/admin/scrape/trigger` | Trigger a scrape job |
| `GET /api/v1/admin/scrape/logs` | Get scrape history |
| `POST /api/v1/admin/cache/clear` | Clear dashboard cache |

Full API documentation available at `/docs` when running.

## Deployment

### Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/xxxxx)

1. Click the button above
2. Add your `SERPAPI_KEY` environment variable
3. Deploy!

### Render

1. Create a new Web Service
2. Connect your repository
3. Set build command: `docker compose build`
4. Set start command: `docker compose up`
5. Add environment variables
6. Deploy!

### Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Launch (follow prompts)
flyctl launch

# Set secrets
flyctl secrets set SERPAPI_KEY=your_key
flyctl secrets set ADMIN_SECRET_KEY=your_admin_key

# Deploy
flyctl deploy
```

## Scheduled Scraping

To enable automated daily scraping:

```bash
# Start with scheduler profile
docker compose --profile scheduler up -d
```

This runs:
- **Daily scrape** at 2 AM UTC (Software Engineering, Data Science, DevOps)
- **Weekly deep scrape** on Sundays at 3 AM UTC (All categories)

## Project Structure

```
job-market-dashboard/
├── backend/
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── core/             # Config, database
│   │   ├── models/           # SQLAlchemy models
│   │   ├── scrapers/         # Scraping logic
│   │   ├── services/         # Business logic
│   │   └── main.py           # FastAPI app
│   ├── alembic/              # Database migrations
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── components/       # React components
│   │   ├── lib/              # Utilities, API client
│   │   ├── types/            # TypeScript types
│   │   ├── page.tsx          # Dashboard page
│   │   ├── skill/            # Skill detail page
│   │   ├── certification/    # Cert detail page
│   │   └── admin/            # Admin page
│   └── package.json
├── docker/
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
├── docker-compose.yml
└── README.md
```

## Legal & Ethical Notes

This project implements several safeguards for ethical scraping:

1. **Rate Limiting** - Aggressive rate limits (2-5 second delays between requests)
2. **Caching** - Results are cached to minimize repeat requests
3. **API-First** - Uses SerpAPI for legal, ToS-compliant access to Google Jobs
4. **Robots.txt** - Respects robots.txt where applicable
5. **Disclaimer** - Clear disclaimer that data is for personal/research use only

**Important:** Always ensure you comply with the Terms of Service of any job board or API you access. Some sources (like LinkedIn) actively prohibit scraping.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- Open an issue for bugs or feature requests
- Star the repo if you find it useful!

---

**Disclaimer:** Data shown for personal/research use only. Not affiliated with any job board.
