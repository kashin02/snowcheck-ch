# snowcheck.ch

> **POC / Vibe-coding** -- A real-time ski conditions app, built end-to-end by a non-developer using [Claude Code](https://docs.anthropic.com/en/docs/claude-code).

---

## Project overview

**snowcheck.ch** aggregates real-time weather, snow depth, and avalanche danger data for the **92 ski stations in the Magic Pass network** across Switzerland. A proprietary scoring algorithm assigns a verdict (Excellent / Good / Fair / Poor) to each station by combining 7 factors: sunshine, fresh snow, snow depth, open pistes, Jour Blanc (flat light) index, wind, and estimated crowd levels.

Users enter their Swiss postal code (NPA) and get a personalized station ranking that includes driving time from home.

## Why this project exists

This POC was born from a personal challenge: **mastering every layer of modern software development** -- from frontend to backend, CI/CD, caching, API integration, and deployment -- starting from virtually zero coding experience.

**The creator's profile:**
- **ICT Manager** holding a **Swiss Federal Diploma** (Federal Diploma in IT Management)
- Strong skills in IT project management, infrastructure, and governance
- Very basic initial coding knowledge -- no prior experience in web application development

**The approach:**
- Full **vibe-coding** with **Claude Code** (Anthropic) as the sole development tool
- Iterative dialogue with AI: architecture design, code writing, debugging, testing, deployment
- Goal: demonstrate that a non-developer IT professional can ship a complete, functional application by leveraging generative AI

This project is a concrete illustration of how AI is transforming the accessibility of software development.

## Features

- **6-day weather forecasts** per station (Open-Meteo)
- **Real-time snow measurements** from SLF IMIS stations
- **Avalanche bulletin** with regional danger levels (SLF)
- **Jour Blanc Index (JBI)** -- custom visibility metric combining 6 parameters
- **Travel time calculation** from any Swiss postal code (OSRM)
- **Multi-factor scoring** (0-100) with visual verdict per station
- **Crowd estimation** based on CH/FR/DE school holidays
- **Filtering** by region and text search
- **Smart caching** (Cloudflare KV + localStorage, stale-while-revalidate)

## Tech stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite, JavaScript (ES modules) |
| **Backend** | Cloudflare Workers (serverless functions) |
| **Cache** | Cloudflare KV (1-2h TTL depending on source) |
| **Hosting** | Cloudflare Pages |
| **CI/CD** | GitHub Actions (lint, 274 tests, build, deploy) |
| **Testing** | Vitest + React Testing Library (274 unit tests) |
| **External APIs** | Open-Meteo, SLF IMIS, SLF Avalanche, OSRM |

## Architecture

```
snowcheck-ch/
├── src/
│   ├── components/       # 14 React components
│   ├── hooks/            # Custom hooks (data fetching, location)
│   ├── utils/            # Scoring, formatting
│   └── data/             # Stations, postal codes, regions, calendar
├── functions/api/        # Cloudflare Workers (11 endpoints)
├── tests/                # 274 unit tests
└── .github/workflows/    # CI/CD pipeline
```

## APIs and data sources

| Source | Usage | Access |
|--------|-------|--------|
| [Open-Meteo](https://open-meteo.com/) | Hourly and daily weather forecasts | Free, no API key |
| [SLF IMIS](https://www.slf.ch/) | Snow depth, temperature, wind (21 stations) | Public API |
| [SLF Bulletin](https://www.slf.ch/) | Regional avalanche danger (scale 1-5) | Public API |
| [OSRM](https://project-osrm.org/) | Driving time and distance | Free, no API key |

## Getting started locally

```bash
# Install dependencies
npm ci

# Start in development mode (frontend only)
npm run dev

# Start with Cloudflare Workers (full stack)
npm run dev:full

# Run tests
npm run test

# Production build
npm run build
```

## CI/CD pipeline

Every push to `main` automatically triggers:

1. **Lint** (ESLint)
2. **Test** (274 unit tests with Vitest)
3. **Build** (Vite)
4. **Deploy** (Cloudflare Pages)

Pull requests run lint + test + build without deploying.

## What this POC demonstrates

- That a **non-developer** can design and deploy a complete web application
- That **vibe-coding with Claude Code** can cover the entire software development lifecycle
- That **ICT Manager skills** (architecture, governance, methodology) are a major asset when effectively steering an AI development assistant
- That the line between "knowing how to code" and "knowing how to get code built" is rapidly fading

## Disclaimer

This project is a **proof of concept** for personal and educational use. It is not intended for large-scale production deployment. Data comes from free, public sources whose availability is not guaranteed.

---

*Entirely designed and developed with [Claude Code](https://docs.anthropic.com/en/docs/claude-code) by Anthropic.*
