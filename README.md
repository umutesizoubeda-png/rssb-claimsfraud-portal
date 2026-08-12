# RSSB Health Insurance — Claims & Fraud Detection Portal

Insurance Claims Processing and Fraud Detection System for Health Insurance
Providers in Rwanda (Rwanda Social Security Board — RSSB).

Automates the full claims lifecycle — electronic submission, eligibility
verification, medical validation, approval workflows and reimbursement — with
AI-inspired fraud detection (Random Forest scoring + Isolation Forest anomaly
detection) applied before payment.

## Tech stack
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Vercel serverless functions (`api/`)
- **Database & Auth:** Supabase (PostgreSQL)

## Getting started
```bash
npm install
cp .env.example .env   # then fill in your Supabase keys
npm run dev            # start the frontend
```
Deploy the `api/` folder + the built frontend to Vercel for the backend.

## Roles (demo)
| Role | Purpose |
|------|---------|
| Administrator | Full oversight, audit log, code export |
| Healthcare Provider | Submits & tracks claims |
| Fraud Investigator | Reviews flagged claims |
| Claims Analyst | Verifies, approves & reimburses |

## Project structure
```
api/            Serverless API routes + fraud engine
src/
  App.tsx       Root component & routing
  components/   Layout, UI primitives, dashboard widgets
  contexts/     Auth context
  lib/          Supabase client, helpers, ZIP builder
  pages/        Screens (Dashboard, Claims, Reports, …)
    dashboards/ Role-specific dashboards
```
